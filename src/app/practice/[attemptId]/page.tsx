import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PracticeInterface } from "./practice-interface";

export const dynamic = "force-dynamic";

interface PracticeAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function PracticeAttemptPage({
  params,
}: PracticeAttemptPageProps) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) notFound();
  if (attempt.status === "SUBMITTED") redirect(`/practice/${attemptId}/result`);

  const questionIds = attempt.questionIds as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      text: true,
      options: true,
      correctIndex: true,
      explanation: true,
      subject: { select: { name: true } },
      difficulty: true,
    },
  });

  const orderedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as typeof questions;

  const questionsForUI = orderedQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    subjectName: q.subject.name,
    difficulty: q.difficulty,
  }));

  const answerMap = (attempt.answerMap as Record<string, number>) ?? {};

  return (
    <PracticeInterface
      attemptId={attemptId}
      questions={questionsForUI}
      initialAnswerMap={answerMap}
    />
  );
}
