import { prisma } from "@/lib/db";
import { AttemptsClient } from "./attempts-client";

export const dynamic = "force-dynamic";

export default async function AttemptsPage() {
  type AttemptItem = Awaited<ReturnType<typeof prisma.attempt.findMany>>[number];

  let attempts: AttemptItem[] = [];
  let dbError: string | null = null;

  try {
    attempts = await prisma.attempt.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  // Calculate summary stats
  const submitted = attempts.filter((a) => a.status === "SUBMITTED");
  const cbtAttempts = submitted.filter((a) => a.mode === "CBT");
  const practiceAttempts = submitted.filter((a) => a.mode === "PRACTICE");

  const avgCbtScore =
    cbtAttempts.length > 0
      ? cbtAttempts.reduce((acc, a) => acc + (a.score ?? 0), 0) /
        cbtAttempts.length
      : 0;

  const avgAccuracy =
    submitted.length > 0
      ? submitted.reduce((acc, a) => acc + (a.accuracy ?? 0), 0) /
        submitted.length
      : 0;

  const formattedAttempts = attempts.map((a) => {
    const config = (a.config as Record<string, unknown>) ?? {};
    const questionIds = (a.questionIds as string[]) ?? [];
    return {
      id: a.id,
      mode: a.mode,
      status: a.status,
      questionCount: questionIds.length,
      configQuestionCount: (config.questionCount as number) ?? questionIds.length,
      durationSec: (config.durationSec as number) ?? 0,
      score: a.score,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      skippedCount: a.skippedCount,
      accuracy: a.accuracy,
      timeTakenSec: a.timeTakenSec,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attempt History</h1>
        <p className="text-slate-500 mt-1">
          Review past CBT mocks and practice sessions, analyze scores, and track improvement
        </p>
      </div>

      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900">
          <p className="font-bold">⚠️ Database Initialization Notice</p>
          <p className="mt-0.5 text-amber-700">Database tables are being initialized ({dbError}).</p>
        </div>
      )}

      <AttemptsClient
        attempts={formattedAttempts}
        stats={{
          total: attempts.length,
          cbtCount: cbtAttempts.length,
          practiceCount: practiceAttempts.length,
          avgCbtScore,
          avgAccuracy,
        }}
      />
    </div>
  );
}
