"use server";

import { prisma } from "@/lib/db";
import { questionFormSchema, type QuestionFormData } from "@/lib/schemas";
import { normalizeText, textSimilarity } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Create a new question
 */
export async function createQuestion(data: QuestionFormData) {
  const validated = questionFormSchema.parse(data);

  // Check for near-duplicates
  const existingQuestions = await prisma.question.findMany({
    where: { subjectId: validated.subjectId },
    select: { id: true, text: true },
    take: 500,
  });

  const normalizedNew = normalizeText(validated.text);
  const duplicates = existingQuestions.filter(
    (q) => textSimilarity(normalizedNew, normalizeText(q.text)) > 0.8
  );

  const question = await prisma.question.create({
    data: {
      text: validated.text,
      options: validated.options,
      correctIndex: validated.correctIndex,
      explanation: validated.explanation,
      subjectId: validated.subjectId,
      topicId: validated.topicId ?? null,
      difficulty: validated.difficulty,
      status: validated.status,
      source: validated.source,
      tags: validated.tags,
    },
  });

  revalidatePath("/bank");
  revalidatePath("/");

  return {
    success: true,
    questionId: question.id,
    duplicateWarning:
      duplicates.length > 0
        ? `Found ${duplicates.length} similar question(s) in the bank.`
        : undefined,
  };
}

/**
 * Update an existing question
 */
export async function updateQuestion(id: string, data: QuestionFormData) {
  const validated = questionFormSchema.parse(data);

  await prisma.question.update({
    where: { id },
    data: {
      text: validated.text,
      options: validated.options,
      correctIndex: validated.correctIndex,
      explanation: validated.explanation,
      subjectId: validated.subjectId,
      topicId: validated.topicId ?? null,
      difficulty: validated.difficulty,
      status: validated.status,
      source: validated.source,
      tags: validated.tags,
    },
  });

  revalidatePath("/bank");
  revalidatePath("/");

  return { success: true };
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } });
  revalidatePath("/bank");
  revalidatePath("/");
  return { success: true };
}

/**
 * Bulk update question status
 */
export async function bulkUpdateQuestionStatus(
  ids: string[],
  status: "ACTIVE" | "ARCHIVED" | "DRAFT"
) {
  await prisma.question.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  revalidatePath("/bank");
  revalidatePath("/");
  return { success: true };
}

/**
 * Bulk delete questions
 */
export async function bulkDeleteQuestions(ids: string[]) {
  await prisma.question.deleteMany({
    where: { id: { in: ids } },
  });

  revalidatePath("/bank");
  revalidatePath("/");
  return { success: true };
}

/**
 * Get subjects and topics for form dropdowns
 */
export async function getSubjectsWithTopics() {
  return prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      topics: { orderBy: { name: "asc" } },
    },
  });
}
