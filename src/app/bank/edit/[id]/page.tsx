import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSubjectsWithTopics } from "@/actions/questions";
import { QuestionEditor } from "@/components/question-editor";

export const dynamic = "force-dynamic";

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({
  params,
}: EditQuestionPageProps) {
  const { id } = await params;

  const [question, subjects] = await Promise.all([
    prisma.question.findUnique({ where: { id } }),
    getSubjectsWithTopics(),
  ]);

  if (!question) {
    notFound();
  }

  return (
    <QuestionEditor
      subjects={subjects}
      initialData={{
        id: question.id,
        text: question.text,
        options: question.options as string[],
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        subjectId: question.subjectId,
        topicId: question.topicId,
        difficulty: question.difficulty,
        status: question.status,
        source: question.source,
        tags: question.tags,
      }}
    />
  );
}
