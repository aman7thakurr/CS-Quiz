"use server";

import { prisma } from "@/lib/db";
import { extractPdfText, chunkText } from "@/lib/pdf";
import { generateQuestionsWithAi } from "@/lib/ai";
import { textSimilarity } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export interface ReviewQuestionItem {
  tempId: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  subjectId: string;
  topicId?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  source: string;
  isDuplicate?: boolean;
  duplicateSnippet?: string;
}

/**
 * Server action: Extract text from uploaded PDF and save SourceDocument
 */
export async function uploadAndExtractPdf(formData: FormData): Promise<{
  success: boolean;
  doc?: {
    id: string;
    filename: string;
    numPages: number;
    charCount: number;
    textPreview: string;
    isScannedLikely: boolean;
    warning?: string;
  };
  error?: string;
}> {
  try {
    const file = formData.get("pdf") as File | null;
    if (!file) {
      return { success: false, error: "No PDF file provided." };
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return { success: false, error: "Please upload a valid .pdf file." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extraction = await extractPdfText(buffer);

    if (extraction.charCount < 30) {
      return {
        success: false,
        error:
          "Could not extract meaningful text from this PDF. It may be scanned or empty. Please upload a text-based PDF.",
      };
    }

    // Save SourceDocument in database
    const doc = await prisma.sourceDocument.create({
      data: {
        filename: file.name,
        sizeBytes: file.size,
        parsedTextLength: extraction.charCount,
        parsedText: extraction.text,
      },
    });

    const textPreview = extraction.text.slice(0, 500) + (extraction.text.length > 500 ? "..." : "");

    return {
      success: true,
      doc: {
        id: doc.id,
        filename: doc.filename,
        numPages: extraction.numPages,
        charCount: extraction.charCount,
        textPreview,
        isScannedLikely: extraction.isScannedLikely,
        warning: extraction.warning,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process PDF.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Generate MCQs from SourceDocument using AI
 */
export async function generateQuestionsFromDoc(params: {
  sourceDocId: string;
  subjectId: string;
  topicId?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  questionCount: number;
  sourceLabel: string;
}): Promise<{
  success: boolean;
  questions?: ReviewQuestionItem[];
  tokensUsed?: number;
  error?: string;
}> {
  try {
    const doc = await prisma.sourceDocument.findUnique({
      where: { id: params.sourceDocId },
    });

    if (!doc) {
      return { success: false, error: "Source document not found." };
    }

    const subject = await prisma.subject.findUnique({
      where: { id: params.subjectId },
    });

    if (!subject) {
      return { success: false, error: "Subject not found." };
    }

    let topicName: string | undefined;
    if (params.topicId) {
      const topic = await prisma.topic.findUnique({
        where: { id: params.topicId },
      });
      topicName = topic?.name;
    }

    // Get sliding window chunks
    const chunks = chunkText(doc.parsedText, 4000, 300);
    // Use first chunk or aggregate chunks as needed
    const textChunk = chunks[0] || doc.parsedText.slice(0, 4000);

    // Call AI
    const aiResult = await generateQuestionsWithAi({
      textChunk,
      questionCount: params.questionCount,
      subjectName: subject.name,
      topicName,
      difficulty: params.difficulty,
    });

    // Check near duplicates against existing database questions
    const existingQuestions = await prisma.question.findMany({
      select: { text: true },
    });

    const reviewItems: ReviewQuestionItem[] = aiResult.questions.map((q, idx) => {
      let isDuplicate = false;
      let duplicateSnippet: string | undefined;

      for (const eq of existingQuestions) {
        if (textSimilarity(q.question, eq.text) > 0.82) {
          isDuplicate = true;
          duplicateSnippet = eq.text.slice(0, 60) + "...";
          break;
        }
      }

      // Assign difficulty (if MIXED, cycle through)
      let resolvedDiff: "EASY" | "MEDIUM" | "HARD" = "MEDIUM";
      if (params.difficulty === "MIXED") {
        resolvedDiff = idx % 3 === 0 ? "EASY" : idx % 3 === 1 ? "MEDIUM" : "HARD";
      } else {
        resolvedDiff = params.difficulty;
      }

      return {
        tempId: `gen-${Date.now()}-${idx}`,
        question: q.question,
        options: q.options as [string, string, string, string],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        subjectId: params.subjectId,
        topicId: params.topicId || null,
        difficulty: resolvedDiff,
        source: params.sourceLabel || doc.filename,
        isDuplicate,
        duplicateSnippet,
      };
    });

    // Log in GenerationLog
    await prisma.generationLog.create({
      data: {
        sourceDocumentId: doc.id,
        promptMetadata: {
          subject: subject.name,
          topic: topicName,
          difficulty: params.difficulty,
          requestedCount: params.questionCount,
          model: aiResult.modelUsed,
        },
        tokensUsed: aiResult.tokensUsed,
        status: "SUCCESS",
      },
    });

    return {
      success: true,
      questions: reviewItems,
      tokensUsed: aiResult.tokensUsed,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI Question Generation failed.";

    // Log failure
    try {
      await prisma.generationLog.create({
        data: {
          sourceDocumentId: params.sourceDocId,
          status: "FAILED",
          errorMessage: message,
        },
      });
    } catch {
      // ignore log error
    }

    return { success: false, error: message };
  }
}

/**
 * Server action: Save reviewed questions into the database (Active or Draft)
 */
export async function commitReviewedQuestions(
  questions: ReviewQuestionItem[],
  targetStatus: "ACTIVE" | "DRAFT"
): Promise<{ success: boolean; savedCount?: number; error?: string }> {
  try {
    if (questions.length === 0) {
      return { success: false, error: "No questions to save." };
    }

    let savedCount = 0;
    for (const q of questions) {
      await prisma.question.create({
        data: {
          text: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          subjectId: q.subjectId,
          topicId: q.topicId || null,
          difficulty: q.difficulty,
          status: targetStatus,
          source: q.source,
          tags: ["ai-generated"],
        },
      });
      savedCount++;
    }

    revalidatePath("/bank");
    revalidatePath("/");
    revalidatePath("/mock");
    revalidatePath("/practice");

    return { success: true, savedCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save questions.";
    return { success: false, error: message };
  }
}
