"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { startMockSchema, type StartMockData } from "@/lib/schemas";
import { seededShuffle } from "@/lib/utils";
import { gradeAttempt, calculateScore } from "@/lib/scoring";
import { revalidatePath } from "next/cache";

/**
 * Create a new CBT mock test attempt
 */
export async function createMockAttempt(data: StartMockData) {
  const validated = startMockSchema.parse(data);

  // Build where clause for questions
  const where: Record<string, unknown> = { status: "ACTIVE" as const };
  if (validated.subjectFilter.length > 0) {
    where.subjectId = { in: validated.subjectFilter };
  }
  if (validated.difficultyFilter.length > 0) {
    where.difficulty = { in: validated.difficultyFilter };
  }

  // Fetch matching questions
  const questions = await prisma.question.findMany({
    where,
    select: { id: true, options: true },
  });

  if (questions.length === 0) {
    return { error: "No active questions found matching your filters. Add or activate questions first." };
  }

  if (questions.length < validated.questionCount) {
    // Allow with fewer questions, but warn
  }

  const seed = validated.shuffle
    ? Math.floor(Math.random() * 2147483647)
    : 0;

  // Select and shuffle questions
  let selectedQuestions = questions;
  if (validated.shuffle) {
    selectedQuestions = seededShuffle(questions, seed);
  }
  selectedQuestions = selectedQuestions.slice(0, validated.questionCount);
  const questionIds = selectedQuestions.map((q) => q.id);

  // Shuffle options per question (record mapping)
  const optionShuffleMap: Record<string, number[]> = {};
  if (validated.shuffle) {
    for (let qi = 0; qi < selectedQuestions.length; qi++) {
      const q = selectedQuestions[qi];
      const originalIndices = [0, 1, 2, 3];
      const shuffled = seededShuffle(originalIndices, seed + qi + 1);
      optionShuffleMap[q.id] = shuffled;
    }
  }

  const durationSec = validated.durationMinutes * 60;

  const attempt = await prisma.attempt.create({
    data: {
      mode: "CBT",
      config: {
        questionCount: selectedQuestions.length,
        durationSec,
        perQuestionMark: 1,
        negativeMarkPerWrong: 0.25,
        subjectFilter: validated.subjectFilter,
        difficultyFilter: validated.difficultyFilter,
        shuffleSeed: seed,
      },
      questionIds,
      optionShuffleMap: validated.shuffle ? optionShuffleMap : Prisma.JsonNull,
      answerMap: {},
      markedForReview: [],
      status: "IN_PROGRESS",
    },
  });

  return { attemptId: attempt.id };
}

/**
 * Save answer for a single question during an attempt
 */
export async function saveAnswer(
  attemptId: string,
  questionId: string,
  chosenIndex: number | null
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { answerMap: true, status: true },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return { error: "Attempt not found or already submitted" };
  }

  const answerMap = (attempt.answerMap as Record<string, number | null>) ?? {};

  if (chosenIndex === null) {
    delete answerMap[questionId];
  } else {
    answerMap[questionId] = chosenIndex;
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { answerMap },
  });

  return { success: true };
}

/**
 * Toggle mark-for-review on a question
 */
export async function toggleMarkForReview(
  attemptId: string,
  questionId: string
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { markedForReview: true, status: true },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return { error: "Attempt not found or already submitted" };
  }

  const marked = (attempt.markedForReview as string[]) ?? [];
  const index = marked.indexOf(questionId);
  if (index >= 0) {
    marked.splice(index, 1);
  } else {
    marked.push(questionId);
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { markedForReview: marked },
  });

  return { success: true, isMarked: index < 0 };
}

/**
 * Submit a mock test — server-side grading
 */
export async function submitMockAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return { error: "Attempt not found" };
  }

  if (attempt.status === "SUBMITTED") {
    return { error: "Already submitted" };
  }

  const questionIds = attempt.questionIds as string[];
  const answerMap = (attempt.answerMap as Record<string, number>) ?? {};
  const optionShuffleMap =
    (attempt.optionShuffleMap as Record<string, number[]>) ?? null;

  // Fetch correct answers from DB — never trust client
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctIndex: true },
  });

  const correctAnswers: Record<string, number> = {};
  for (const q of questions) {
    correctAnswers[q.id] = q.correctIndex;
  }

  // Grade the attempt
  const scoringInput = gradeAttempt(
    answerMap,
    correctAnswers,
    optionShuffleMap,
    questionIds
  );

  const config = attempt.config as Record<string, number>;
  const result = calculateScore(scoringInput, {
    perQuestionMark: config.perQuestionMark ?? 1,
    negativeMarkPerWrong: config.negativeMarkPerWrong ?? 0.25,
  });

  const timeTakenSec = Math.floor(
    (Date.now() - attempt.startedAt.getTime()) / 1000
  );

  // Update attempt with results
  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      timeTakenSec,
      score: result.score,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      skippedCount: result.skippedCount,
      accuracy: result.accuracy,
    },
  });

  // Update question stats
  for (const qId of questionIds) {
    const chosenIndex = answerMap[qId];
    const isAttempted = chosenIndex !== undefined && chosenIndex !== null;

    if (isAttempted) {
      let actualChosenOriginalIndex = chosenIndex;
      if (optionShuffleMap && optionShuffleMap[qId]) {
        actualChosenOriginalIndex = optionShuffleMap[qId][chosenIndex];
      }

      const isCorrect = actualChosenOriginalIndex === correctAnswers[qId];
      await prisma.question.update({
        where: { id: qId },
        data: {
          timesUsed: { increment: 1 },
          ...(isCorrect ? { timesCorrect: { increment: 1 } } : {}),
        },
      });
    } else {
      await prisma.question.update({
        where: { id: qId },
        data: { timesUsed: { increment: 1 } },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/attempts");

  return { success: true, result };
}

/**
 * Create a practice session attempt
 */
export async function createPracticeAttempt(data: {
  questionCount: number;
  subjectFilter: string[];
  topicFilter: string[];
  difficultyFilter: string[];
  weakOnly: boolean;
}) {
  const where: Record<string, unknown> = { status: "ACTIVE" as const };

  if (data.subjectFilter.length > 0) {
    where.subjectId = { in: data.subjectFilter };
  }
  if (data.topicFilter.length > 0) {
    where.topicId = { in: data.topicFilter };
  }
  if (data.difficultyFilter.length > 0) {
    where.difficulty = { in: data.difficultyFilter };
  }

  // For weak questions: questions where timesUsed > 0 and accuracy < 50%
  if (data.weakOnly) {
    where.timesUsed = { gt: 0 };
  }

  let questions = await prisma.question.findMany({
    where,
    select: { id: true, timesUsed: true, timesCorrect: true },
  });

  if (data.weakOnly) {
    questions = questions.filter((q) => {
      if (q.timesUsed === 0) return false;
      return q.timesCorrect / q.timesUsed < 0.5;
    });
  }

  if (questions.length === 0) {
    return { error: data.weakOnly
      ? "No weak questions found. Practice more to identify weak areas."
      : "No active questions found matching your filters." };
  }

  // Shuffle and limit
  const seed = Math.floor(Math.random() * 2147483647);
  const shuffled = seededShuffle(questions, seed);
  const selected = shuffled.slice(0, data.questionCount);
  const questionIds = selected.map((q) => q.id);

  const attempt = await prisma.attempt.create({
    data: {
      mode: "PRACTICE",
      config: {
        questionCount: selected.length,
        durationSec: 0, // no timer for practice
        perQuestionMark: 1,
        negativeMarkPerWrong: 0,
        subjectFilter: data.subjectFilter,
        topicFilter: data.topicFilter,
        difficultyFilter: data.difficultyFilter,
        weakOnly: data.weakOnly,
        shuffleSeed: seed,
      },
      questionIds,
      answerMap: {},
      markedForReview: [],
      status: "IN_PROGRESS",
    },
  });

  return { attemptId: attempt.id };
}

/**
 * Submit a practice attempt (just record stats, no negative marking)
 */
export async function submitPracticeAttempt(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.status === "SUBMITTED") {
    return { error: "Attempt not found or already submitted" };
  }

  const questionIds = attempt.questionIds as string[];
  const answerMap = (attempt.answerMap as Record<string, number>) ?? {};

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, correctIndex: true },
  });

  const correctAnswers: Record<string, number> = {};
  for (const q of questions) {
    correctAnswers[q.id] = q.correctIndex;
  }

  const scoringInput = gradeAttempt(answerMap, correctAnswers, null, questionIds);
  const result = calculateScore(scoringInput, {
    perQuestionMark: 1,
    negativeMarkPerWrong: 0,
  });

  const timeTakenSec = Math.floor(
    (Date.now() - attempt.startedAt.getTime()) / 1000
  );

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      timeTakenSec,
      score: result.score,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      skippedCount: result.skippedCount,
      accuracy: result.accuracy,
    },
  });

  // Update per-question stats
  for (const qId of questionIds) {
    const chosenIndex = answerMap[qId];
    if (chosenIndex !== undefined && chosenIndex !== null) {
      const isCorrect = chosenIndex === correctAnswers[qId];
      await prisma.question.update({
        where: { id: qId },
        data: {
          timesUsed: { increment: 1 },
          ...(isCorrect ? { timesCorrect: { increment: 1 } } : {}),
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/attempts");

  return { success: true, result };
}
