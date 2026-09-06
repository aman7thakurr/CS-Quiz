"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { CheckCircle, XCircle, Minus, Flag } from "lucide-react";

interface ReviewQuestion {
  number: number;
  id: string;
  text: string;
  options: string[];
  correctDisplayIndex: number;
  userDisplayIndex: number | null;
  explanation: string;
  subjectName: string;
  topicName: string | null;
  isCorrect: boolean;
  isWrong: boolean;
  isSkipped: boolean;
  isMarked: boolean;
}

export function ResultFilters({
  reviewData,
}: {
  reviewData: ReviewQuestion[];
}) {
  const [filter, setFilter] = useState<"all" | "wrong" | "marked" | "skipped">(
    "all"
  );

  const filtered = reviewData.filter((q) => {
    switch (filter) {
      case "wrong":
        return q.isWrong;
      case "marked":
        return q.isMarked;
      case "skipped":
        return q.isSkipped;
      default:
        return true;
    }
  });

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(
          [
            { key: "all", label: "All", count: reviewData.length },
            {
              key: "wrong",
              label: "Wrong",
              count: reviewData.filter((q) => q.isWrong).length,
            },
            {
              key: "marked",
              label: "Marked",
              count: reviewData.filter((q) => q.isMarked).length,
            },
            {
              key: "skipped",
              label: "Skipped",
              count: reviewData.filter((q) => q.isSkipped).length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filtered.map((q) => (
          <div
            key={q.id}
            className={`bg-white rounded-xl border-2 p-5 shadow-sm ${
              q.isCorrect
                ? "border-green-200"
                : q.isWrong
                  ? "border-red-200"
                  : "border-slate-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">
                Q.{q.number}
              </span>
              {q.isCorrect && (
                <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <CheckCircle className="w-4 h-4" /> Correct
                </span>
              )}
              {q.isWrong && (
                <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                  <XCircle className="w-4 h-4" /> Wrong
                </span>
              )}
              {q.isSkipped && (
                <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <Minus className="w-4 h-4" /> Skipped
                </span>
              )}
              {q.isMarked && (
                <span className="flex items-center gap-1 text-purple-600 text-xs font-medium">
                  <Flag className="w-4 h-4" /> Marked
                </span>
              )}
              <span className="text-xs text-slate-400 ml-auto">
                {q.subjectName}
              </span>
            </div>

            {/* Question text */}
            <div className="mb-3">
              <MarkdownRenderer content={q.text} />
            </div>

            {/* Options */}
            <div className="space-y-2 mb-3">
              {q.options.map((opt, i) => {
                const isCorrectOption = i === q.correctDisplayIndex;
                const isUserChoice = i === q.userDisplayIndex;

                let optionStyle = "border-slate-200 bg-white";
                if (isCorrectOption) {
                  optionStyle = "border-green-400 bg-green-50";
                } else if (isUserChoice && !isCorrectOption) {
                  optionStyle = "border-red-400 bg-red-50";
                }

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${optionStyle}`}
                  >
                    <span className="text-sm font-medium text-slate-500 w-6">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="flex-1 text-sm">
                      <MarkdownRenderer content={opt} />
                    </span>
                    {isCorrectOption && (
                      <span className="text-xs text-green-600 font-medium shrink-0">
                        ✓ Correct
                      </span>
                    )}
                    {isUserChoice && !isCorrectOption && (
                      <span className="text-xs text-red-600 font-medium shrink-0">
                        ✗ Your answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {q.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-600 mb-1">
                  💡 Explanation
                </p>
                <div className="text-sm text-blue-900">
                  <MarkdownRenderer content={q.explanation} />
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-8">
            No questions match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
