import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatScore, formatPercent, formatTime } from "@/lib/utils";
import {
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  Minus,
  Clock,
  ArrowLeft,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { ResultFilters } from "./result-filters";

export const dynamic = "force-dynamic";

interface ResultPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.status !== "SUBMITTED") {
    notFound();
  }

  const questionIds = attempt.questionIds as string[];
  const answerMap = (attempt.answerMap as Record<string, number>) ?? {};
  const optionShuffleMap =
    (attempt.optionShuffleMap as Record<string, number[]>) ?? null;
  const markedForReview = (attempt.markedForReview as string[]) ?? [];
  const config = attempt.config as Record<string, unknown>;

  // Fetch all questions with subjects
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: {
      subject: { select: { id: true, name: true } },
      topic: { select: { name: true } },
    },
  });

  // Maintain order
  const orderedQuestions = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as typeof questions;

  // Build review data
  const reviewData = orderedQuestions.map((q, idx) => {
    const originalOptions = q.options as string[];
    const chosenIndex = answerMap[q.id];
    const isAttempted = chosenIndex !== undefined && chosenIndex !== null;

    let displayOptions = originalOptions;
    let correctDisplayIndex = q.correctIndex;
    const userDisplayIndex = chosenIndex;

    if (optionShuffleMap && optionShuffleMap[q.id]) {
      const shuffle = optionShuffleMap[q.id];
      displayOptions = shuffle.map((origIdx) => originalOptions[origIdx]);
      // Find where the correct original index ended up
      correctDisplayIndex = shuffle.indexOf(q.correctIndex);
      // User chose in shuffled display order — that's already the display index
    }

    let actualChosenOriginalIndex: number | undefined;
    if (isAttempted && optionShuffleMap && optionShuffleMap[q.id]) {
      actualChosenOriginalIndex = optionShuffleMap[q.id][chosenIndex];
    } else if (isAttempted) {
      actualChosenOriginalIndex = chosenIndex;
    }

    const isCorrect =
      isAttempted && actualChosenOriginalIndex === q.correctIndex;
    const isWrong = isAttempted && !isCorrect;

    return {
      number: idx + 1,
      id: q.id,
      text: q.text,
      options: displayOptions,
      correctDisplayIndex,
      userDisplayIndex: isAttempted ? userDisplayIndex : null,
      explanation: q.explanation,
      subjectName: q.subject.name,
      subjectId: q.subject.id,
      topicName: q.topic?.name ?? null,
      isCorrect,
      isWrong,
      isSkipped: !isAttempted,
      isMarked: markedForReview.includes(q.id),
    };
  });

  // Subject-wise performance
  const subjectPerformance: Record<
    string,
    { name: string; correct: number; wrong: number; skipped: number; total: number }
  > = {};

  for (const q of reviewData) {
    if (!subjectPerformance[q.subjectId]) {
      subjectPerformance[q.subjectId] = {
        name: q.subjectName,
        correct: 0,
        wrong: 0,
        skipped: 0,
        total: 0,
      };
    }
    subjectPerformance[q.subjectId].total++;
    if (q.isCorrect) subjectPerformance[q.subjectId].correct++;
    else if (q.isWrong) subjectPerformance[q.subjectId].wrong++;
    else subjectPerformance[q.subjectId].skipped++;
  }

  const score = attempt.score ?? 0;
  const maxScore = (config.questionCount as number) * (config.perQuestionMark as number ?? 1);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back link */}
      <Link
        href="/attempts"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to History
      </Link>

      {/* Score Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <p className="text-blue-200 text-sm font-medium">Your Score</p>
              <p className="text-5xl font-black">
                {formatScore(score)}
              </p>
              <p className="text-blue-200 text-lg">/ {maxScore}</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            <ScoreStat
              icon={<CheckCircle className="w-5 h-5" />}
              label="Correct"
              value={attempt.correctCount?.toString() ?? "0"}
              color="text-green-300"
            />
            <ScoreStat
              icon={<XCircle className="w-5 h-5" />}
              label="Wrong"
              value={attempt.wrongCount?.toString() ?? "0"}
              color="text-red-300"
            />
            <ScoreStat
              icon={<Minus className="w-5 h-5" />}
              label="Skipped"
              value={attempt.skippedCount?.toString() ?? "0"}
              color="text-slate-300"
            />
            <ScoreStat
              icon={<Target className="w-5 h-5" />}
              label="Accuracy"
              value={
                attempt.accuracy !== null
                  ? formatPercent(attempt.accuracy)
                  : "—"
              }
              color="text-yellow-300"
            />
          </div>
        </div>

        {/* Scoring formula */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-sm font-mono text-blue-200">
            {attempt.correctCount} × +1 − {attempt.wrongCount} × 0.25 ={" "}
            {formatScore(score)} / {maxScore}
          </p>
          {attempt.timeTakenSec && (
            <p className="text-xs text-blue-300 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Time taken: {formatTime(attempt.timeTakenSec)}
            </p>
          )}
        </div>
      </div>

      {/* Subject-wise Performance */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">Subject-wise Performance</h3>
        </div>
        <div className="space-y-3">
          {Object.values(subjectPerformance).map((sp) => {
            const accuracy =
              sp.correct + sp.wrong > 0
                ? (sp.correct / (sp.correct + sp.wrong)) * 100
                : 0;
            return (
              <div key={sp.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 truncate pr-4">
                    {sp.name}
                  </span>
                  <span className="text-slate-500 shrink-0">
                    {sp.correct}/{sp.total} ({accuracy.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(sp.correct / sp.total) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-red-400"
                    style={{
                      width: `${(sp.wrong / sp.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retry button */}
      <div className="flex gap-3">
        <Link
          href="/mock"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Take Another Test
        </Link>
      </div>

      {/* Question Review */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          📝 Question Review
        </h3>
        <ResultFilters reviewData={reviewData} />
      </div>
    </div>
  );
}

function ScoreStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`${color} flex justify-center mb-1`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-blue-200">{label}</p>
    </div>
  );
}
