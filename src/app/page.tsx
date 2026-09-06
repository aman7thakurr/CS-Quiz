import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  GraduationCap,
  BookOpen,
  Database,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  ChevronRight,
  Upload,
  ClipboardList,
} from "lucide-react";
import { formatScore, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const [
    totalActiveQuestions,
    totalDraftQuestions,
    totalAttempts,
    subjects,
    recentAttempts,
    subjectQuestionCounts,
  ] = await Promise.all([
    prisma.question.count({ where: { status: "ACTIVE" } }),
    prisma.question.count({ where: { status: "DRAFT" } }),
    prisma.attempt.count({ where: { status: "SUBMITTED" } }),
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: { select: { questions: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.attempt.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.question.groupBy({
      by: ["subjectId"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
  ]);

  // Calculate averages from submitted attempts
  let avgScore = 0;
  let avgAccuracy = 0;
  if (recentAttempts.length > 0) {
    const submittedWithScores = recentAttempts.filter(
      (a) => a.score !== null
    );
    if (submittedWithScores.length > 0) {
      avgScore =
        submittedWithScores.reduce((sum, a) => sum + (a.score ?? 0), 0) /
        submittedWithScores.length;
      avgAccuracy =
        submittedWithScores.reduce(
          (sum, a) => sum + (a.accuracy ?? 0),
          0
        ) / submittedWithScores.length;
    }
  }

  return {
    totalActiveQuestions,
    totalDraftQuestions,
    totalAttempts,
    avgScore,
    avgAccuracy,
    subjects,
    recentAttempts,
    subjectQuestionCounts,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Punjab Government Group B — Computer Programmer CBT Trainer
        </p>
      </div>

      {/* Big CTA */}
      <Link
        href="/mock"
        className="block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Start CBT Mock Test</h2>
              <p className="text-blue-100 mt-1">
                100 Questions • 120 Minutes • +1 / −0.25 / 0 Marking
              </p>
            </div>
          </div>
          <ChevronRight className="w-8 h-8 text-blue-200 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Database className="w-5 h-5" />}
          label="Active Questions"
          value={stats.totalActiveQuestions.toString()}
          subtext={
            stats.totalDraftQuestions > 0
              ? `${stats.totalDraftQuestions} drafts`
              : undefined
          }
          color="blue"
        />
        <StatsCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Attempts Taken"
          value={stats.totalAttempts.toString()}
          color="green"
        />
        <StatsCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Score"
          value={
            stats.totalAttempts > 0
              ? formatScore(stats.avgScore)
              : "—"
          }
          subtext={stats.totalAttempts > 0 ? "/ 100" : "No attempts yet"}
          color="purple"
        />
        <StatsCard
          icon={<Target className="w-5 h-5" />}
          label="Avg Accuracy"
          value={
            stats.totalAttempts > 0
              ? formatPercent(stats.avgAccuracy)
              : "—"
          }
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          href="/practice"
          icon={<BookOpen className="w-5 h-5" />}
          label="Practice Mode"
        />
        <QuickAction
          href="/bank"
          icon={<Database className="w-5 h-5" />}
          label="Question Bank"
        />
        <QuickAction
          href="/generate"
          icon={<Sparkles className="w-5 h-5" />}
          label="AI Generate"
        />
        <QuickAction
          href="/import"
          icon={<Upload className="w-5 h-5" />}
          label="Import Questions"
        />
      </div>

      {/* Two Column: Subject Mastery + Recent Attempts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise mastery */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">
              Subject-wise Question Bank
            </h3>
          </div>
          {stats.subjects.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No subjects yet. Run <code>npm run seed</code> to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.subjects.map((subject) => {
                const count = subject._count.questions;
                const maxCount = Math.max(
                  ...stats.subjects.map((s) => s._count.questions),
                  1
                );
                const percent = (count / maxCount) * 100;
                return (
                  <div key={subject.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 truncate pr-2">
                        {subject.name}
                      </span>
                      <span className="text-slate-500 font-medium shrink-0">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent attempts */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">Recent Attempts</h3>
            </div>
            {stats.totalAttempts > 0 && (
              <Link
                href="/attempts"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            )}
          </div>
          {stats.recentAttempts.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                No attempts yet. Start a mock test to see your results here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentAttempts.map((attempt) => {
                const config = attempt.config as Record<string, unknown>;
                return (
                  <Link
                    key={attempt.id}
                    href={`/mock/${attempt.id}/result`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-[var(--color-border)]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            attempt.mode === "CBT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {attempt.mode}
                        </span>
                        <span className="text-sm text-slate-600">
                          {(config.questionCount as number) ?? "?"} Qs
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(attempt.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {attempt.score !== null
                          ? formatScore(attempt.score)
                          : "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {attempt.accuracy !== null
                          ? `${formatPercent(attempt.accuracy)} accuracy`
                          : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
      {subtext && (
        <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl border border-[var(--color-border)] p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="text-slate-600">{icon}</div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </Link>
  );
}
