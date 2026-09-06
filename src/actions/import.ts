"use server";

import { prisma } from "@/lib/db";
import {
  parseRawImport,
  validateImportRows,
  type ParsedQuestionRow,
  type ImportValidationResult,
} from "@/lib/import";
import { revalidatePath } from "next/cache";

/**
 * Server action: Validate an uploaded CSV/Excel/JSON file and return preview
 */
export async function validateImportFile(
  formData: FormData
): Promise<{ success: boolean; data?: ImportValidationResult; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file was uploaded." };
    }

    const filename = file.name.toLowerCase();
    let fileType: "csv" | "json" | "xlsx" | "xls";
    if (filename.endsWith(".csv")) fileType = "csv";
    else if (filename.endsWith(".json")) fileType = "json";
    else if (filename.endsWith(".xlsx")) fileType = "xlsx";
    else if (filename.endsWith(".xls")) fileType = "xls";
    else {
      return {
        success: false,
        error: "Unsupported file format. Please upload a .csv, .xlsx, .xls, or .json file.",
      };
    }

    const buffer = await file.arrayBuffer();
    const rawRows = parseRawImport(buffer, fileType);

    if (rawRows.length === 0) {
      return { success: false, error: "The uploaded file contains no rows." };
    }

    // Fetch existing subjects and questions for lookup and duplicate check
    const [subjects, existingQuestions] = await Promise.all([
      prisma.subject.findMany({
        where: { isActive: true },
        select: { name: true },
      }),
      prisma.question.findMany({
        select: { text: true },
      }),
    ]);

    const validSubjectNames = subjects.map((s) => s.name);
    const result = validateImportRows(rawRows, existingQuestions, validSubjectNames);

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process import file.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Commit validated rows into the database
 */
export async function executeImport(
  rows: ParsedQuestionRow[],
  targetStatus: "ACTIVE" | "DRAFT" = "ACTIVE"
): Promise<{ success: boolean; importedCount?: number; error?: string }> {
  try {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      return { success: false, error: "No valid rows to import." };
    }

    // Fetch all subjects with their topics
    const subjects = await prisma.subject.findMany({
      include: { topics: true },
    });

    const subjectMap = new Map<string, typeof subjects[0]>();
    for (const s of subjects) {
      subjectMap.set(s.name.toLowerCase(), s);
    }

    let importedCount = 0;

    for (const row of validRows) {
      const subject = subjectMap.get(row.subjectName.toLowerCase());
      if (!subject) continue;

      let topicId: string | null = null;
      if (row.topicName && row.topicName.trim().length > 0) {
        const cleanTopicName = row.topicName.trim();
        const existingTopic = subject.topics.find(
          (t) => t.name.toLowerCase() === cleanTopicName.toLowerCase()
        );

        if (existingTopic) {
          topicId = existingTopic.id;
        } else {
          // Create topic if it doesn't exist
          try {
            const newTopic = await prisma.topic.create({
              data: {
                name: cleanTopicName,
                subjectId: subject.id,
              },
            });
            subject.topics.push(newTopic);
            topicId = newTopic.id;
          } catch {
            // In case of concurrency/race condition, find it
            const fallbackTopic = await prisma.topic.findFirst({
              where: { subjectId: subject.id, name: cleanTopicName },
            });
            topicId = fallbackTopic?.id ?? null;
          }
        }
      }

      await prisma.question.create({
        data: {
          text: row.questionText,
          options: row.options,
          correctIndex: row.correctIndex,
          explanation: row.explanation,
          subjectId: subject.id,
          topicId,
          difficulty: row.difficulty,
          status: targetStatus === "ACTIVE" ? "ACTIVE" : "DRAFT",
          source: row.source || "Import",
          tags: row.tags,
        },
      });

      importedCount++;
    }

    revalidatePath("/bank");
    revalidatePath("/");
    revalidatePath("/mock");
    revalidatePath("/practice");

    return { success: true, importedCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to import questions.";
    return { success: false, error: message };
  }
}
