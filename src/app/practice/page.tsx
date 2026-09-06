import { prisma } from "@/lib/db";
import { PracticeConfigForm } from "./practice-config-form";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      topics: { orderBy: { name: "asc" } },
      _count: { select: { questions: { where: { status: "ACTIVE" } } } },
    },
  });

  // Count weak questions
  const allQuestions = await prisma.question.findMany({
    where: { status: "ACTIVE", timesUsed: { gt: 0 } },
    select: { timesUsed: true, timesCorrect: true },
  });
  const weakCount = allQuestions.filter(
    (q) => q.timesCorrect / q.timesUsed < 0.5
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practice Mode</h1>
        <p className="text-slate-500 mt-1">
          Instant feedback after each question — learn from mistakes
        </p>
      </div>

      <PracticeConfigForm
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          questionCount: s._count.questions,
          topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
        }))}
        weakQuestionCount={weakCount}
      />
    </div>
  );
}
