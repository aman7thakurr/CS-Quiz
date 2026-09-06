import { prisma } from "@/lib/db";
import { MockConfigForm } from "./mock-config-form";

export const dynamic = "force-dynamic";

export default async function MockConfigPage() {
  type SubjectItem = Awaited<ReturnType<typeof prisma.subject.findMany<{
    include: {
      _count: { select: { questions: { where: { status: "ACTIVE" } } } };
    };
  }>>>[number];

  let subjects: SubjectItem[] = [];
  let activeQuestionCount = 0;
  let dbError: string | null = null;

  try {
    const [s, count] = await Promise.all([
      prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          _count: { select: { questions: { where: { status: "ACTIVE" } } } },
        },
      }),
      prisma.question.count({ where: { status: "ACTIVE" } }),
    ]);
    subjects = s;
    activeQuestionCount = count;
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : "Database not ready";
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900">
          <p className="font-bold">⚠️ Database Initialization Notice</p>
          <p className="mt-0.5 text-amber-700">Database tables are being initialized ({dbError}).</p>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">CBT Mock Test</h1>
        <p className="text-slate-500 mt-1">
          Simulate the real Computer Science CBT exam
        </p>
      </div>

      {/* Exam Rules Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h2 className="font-bold text-lg text-blue-900 mb-4">
          📋 Exam Rules & Marking Scheme
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-blue-800">
              <strong>Format:</strong> 100 MCQs × 1 mark = 100 marks
            </p>
            <p className="text-blue-800">
              <strong>Duration:</strong> 120 minutes (2 hours)
            </p>
            <p className="text-blue-800">
              <strong>Options:</strong> 4 per question, single correct
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-green-700">
              ✅ <strong>Correct answer:</strong> +1 mark
            </p>
            <p className="text-red-700">
              ❌ <strong>Wrong answer:</strong> −0.25 mark
            </p>
            <p className="text-slate-600">
              ⬜ <strong>Unattempted:</strong> 0 marks (no penalty)
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-blue-600 font-mono">
            Score = (Correct × +1) − (Wrong × 0.25)
          </p>
        </div>
      </div>

      {/* Available Questions Info */}
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Active questions available:{" "}
            <strong className="text-slate-900">{activeQuestionCount}</strong>
          </p>
          {activeQuestionCount < 100 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Less than 100 questions available. Add more for a full-length
              mock test.
            </p>
          )}
        </div>
      </div>

      {/* Config Form */}
      <MockConfigForm
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          questionCount: s._count.questions,
        }))}
        maxQuestions={activeQuestionCount}
      />
    </div>
  );
}
