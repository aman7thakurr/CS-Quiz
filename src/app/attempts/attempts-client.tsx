"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Minus,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Calendar,
  Filter,
} from "lucide-react";
import { formatScore, formatPercent, formatTime } from "@/lib/utils";

interface FormattedAttempt {
  id: string;
  mode: "CBT" | "PRACTICE";
  status: "IN_PROGRESS" | "SUBMITTED";
  questionCount: number;
  configQuestionCount: number;
  durationSec: number;
  score: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  skippedCount: number | null;
  accuracy: number | null;
  timeTakenSec: number | null;
  startedAt: string;
  submittedAt: string | null;
}

interface AttemptsClientProps {
  attempts: FormattedAttempt[];
  stats: {
    total: number;
    cbtCount: number;
    practiceCount: number;
    avgCbtScore: number;
    avgAccuracy: number;
  };
}

export function AttemptsClient({ attempts, stats }: AttemptsClientProps) {
  const [modeFilter, setModeFilter] = useState<"ALL" | "CBT" | "PRACTICE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUBMITTED" | "IN_PROGRESS">("ALL");

  const filtered = attempts.filter((a) => {
    if (modeFilter !== "ALL" && a.mode !== modeFilter) return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Attempts
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {stats.cbtCount} CBT • {stats.practiceCount} Practice
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Avg CBT Score
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.cbtCount > 0 ? formatScore(stats.avgCbtScore) : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Out of 100</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Avg Accuracy
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.total > 0 ? formatPercent(stats.avgAccuracy) : "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Submitted tests</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Exam Target
          </p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">75.00+</p>
          <p className="text-xs text-slate-400 mt-0.5">Safe qualifying range</p>
        </div>
      </div>

      {/* Filter controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(["ALL", "CBT", "PRACTICE"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                modeFilter === m
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m === "ALL" ? "All Modes" : m === "CBT" ? "CBT Mock" : "Practice"}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {(["ALL", "SUBMITTED", "IN_PROGRESS"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "ALL" ? "All Statuses" : s === "SUBMITTED" ? "Submitted" : "In Progress"}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">
          Showing {filtered.length} of {attempts.length} attempts
        </span>
      </div>

      {/* Attempts list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700">No attempts found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {attempts.length === 0
              ? "You haven't attempted any mock tests or practice sessions yet. Start one now to track your score!"
              : "No attempts match the selected filters."}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link
              href="/mock"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <GraduationCap className="w-4 h-4" /> Start CBT Mock
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Start Practice
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((attempt) => {
            const isCbt = attempt.mode === "CBT";
            const isSubmitted = attempt.status === "SUBMITTED";
            const dateStr = new Date(attempt.startedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={attempt.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          isCbt
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isCbt ? (
                          <GraduationCap className="w-3.5 h-3.5" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        {isCbt ? "CBT Mock Test" : "Practice Mode"}
                      </span>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isSubmitted
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isSubmitted ? "Submitted" : "In Progress"}
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span>
                        <strong>{attempt.questionCount}</strong> Questions
                      </span>
                      {attempt.durationSec > 0 && (
                        <span>
                          Time limit: <strong>{Math.round(attempt.durationSec / 60)}m</strong>
                        </span>
                      )}
                      {attempt.timeTakenSec !== null && attempt.timeTakenSec > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Time taken: <strong>{formatTime(attempt.timeTakenSec)}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Result breakdown & Action button */}
                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    {isSubmitted ? (
                      <div className="flex items-center gap-4">
                        {/* Score for CBT */}
                        {isCbt && (
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Score</p>
                            <p
                              className={`text-lg font-bold ${
                                (attempt.score ?? 0) >= 60
                                  ? "text-green-600"
                                  : (attempt.score ?? 0) >= 40
                                  ? "text-blue-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {formatScore(attempt.score ?? 0)}
                              <span className="text-xs text-slate-400 font-normal">
                                /{attempt.configQuestionCount}
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Breakdown pills */}
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3" />
                            {attempt.correctCount ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                            <XCircle className="w-3 h-3" />
                            {attempt.wrongCount ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                            <Minus className="w-3 h-3" />
                            {attempt.skippedCount ?? 0}
                          </span>
                        </div>

                        {/* Accuracy */}
                        <div className="text-right min-w-[60px]">
                          <p className="text-xs text-slate-400">Accuracy</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {formatPercent(attempt.accuracy ?? 0)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                        In Progress
                      </span>
                    )}

                    {/* Action link */}
                    {isSubmitted ? (
                      <Link
                        href={`/mock/${attempt.id}/result`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg transition-all"
                      >
                        Review
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href={isCbt ? `/mock/${attempt.id}` : `/practice/${attempt.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all"
                      >
                        Resume
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
