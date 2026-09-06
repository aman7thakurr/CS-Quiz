import { prisma } from "@/lib/db";
import { PracticeConfigForm } from "./practice-config-form";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  type SubjectItem = Awaited<ReturnType<typeof prisma.subject.findMany<{
    include: {
      topics: { orderBy: { name: "asc" } };
      _count: { select: { questions: { where: { status: "ACTIVE" } } } };
    };
  }>>>[number];

  let subjects: SubjectItem[] = [];
  let weakCount = 0;
  let dbError: string | null = null;

  try {
    const s = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        topics: { orderBy: { name: "asc" } },
        _count: { select: { questions: { where: { status: "ACTIVE" } } } },
      },
    });
    subjects = s;

    // Count weak questions
    const allQuestions = await prisma.question.findMany({
      where: { status: "ACTIVE", timesUsed: { gt: 0 } },
      select: { timesUsed: true, timesCorrect: true },
    });
    weakCount = allQuestions.filter(
      (q) => q.timesCorrect / q.timesUsed < 0.5
    ).length;
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900">
          <p className="font-bold">⚠️ Database Initialization Notice</p>
          <p className="mt-0.5 text-amber-700">Database tables are being initialized ({dbError}).</p>
        </div>
      )}
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
