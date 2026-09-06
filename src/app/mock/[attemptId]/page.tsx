import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ExamInterface } from "./exam-interface";

export const dynamic = "force-dynamic";

interface MockAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function MockAttemptPage({
  params,
}: MockAttemptPageProps) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    notFound();
  }

  // If already submitted, redirect to result
  if (attempt.status === "SUBMITTED") {
    const { redirect } = await import("next/navigation");
    redirect(`/mock/${attemptId}/result`);
  }

  const questionIds = attempt.questionIds as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      text: true,
      options: true,
      subject: { select: { name: true } },
    },
  });

  // Maintain the order from questionIds
  const orderedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as typeof questions;

  const config = attempt.config as Record<string, unknown>;
  const optionShuffleMap =
    (attempt.optionShuffleMap as Record<string, number[]>) ?? null;
  const answerMap =
    (attempt.answerMap as Record<string, number>) ?? {};
  const markedForReview = (attempt.markedForReview as string[]) ?? [];

  // Apply option shuffle so user sees shuffled options
  const questionsForUI = orderedQuestions.map((q) => {
    const originalOptions = q.options as string[];
    let displayOptions = originalOptions;

    if (optionShuffleMap && optionShuffleMap[q.id]) {
      const shuffle = optionShuffleMap[q.id];
      displayOptions = shuffle.map((origIdx) => originalOptions[origIdx]);
    }

    return {
      id: q.id,
      text: q.text,
      options: displayOptions,
      subjectName: q.subject.name,
    };
  });

  return (
    <ExamInterface
      attemptId={attemptId}
      questions={questionsForUI}
      initialAnswerMap={answerMap}
      initialMarkedForReview={markedForReview}
      durationSec={(config.durationSec as number) ?? 7200}
      startedAt={attempt.startedAt.toISOString()}
    />
  );
}
