"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, toggleMarkForReview, submitMockAttempt } from "@/actions/mock";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { formatTime } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  subjectName: string;
}

interface ExamInterfaceProps {
  attemptId: string;
  questions: Question[];
  initialAnswerMap: Record<string, number>;
  initialMarkedForReview: string[];
  durationSec: number;
  startedAt: string;
}

export function ExamInterface({
  attemptId,
  questions,
  initialAnswerMap,
  initialMarkedForReview,
  durationSec,
  startedAt,
}: ExamInterfaceProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMap, setAnswerMap] = useState<Record<string, number>>(
    initialAnswerMap
  );
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(
    new Set(initialMarkedForReview)
  );
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    return Math.max(0, durationSec - elapsed);
  });
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const selectOption = useCallback(
    async (index: number) => {
      const qId = questions[currentIndex].id;
      setAnswerMap((prev) => ({ ...prev, [qId]: index }));
      // Save to server
      await saveAnswer(attemptId, qId, index);
    },
    [attemptId, currentIndex, questions]
  );

  const clearResponse = useCallback(async () => {
    const qId = questions[currentIndex].id;
    setAnswerMap((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    await saveAnswer(attemptId, qId, null);
  }, [attemptId, currentIndex, questions]);

  const handleMarkForReview = useCallback(async () => {
    const qId = questions[currentIndex].id;
    const result = await toggleMarkForReview(attemptId, qId);
    if (result.success) {
      setMarkedForReview((prev) => {
        const next = new Set(prev);
        if (result.isMarked) {
          next.add(qId);
        } else {
          next.delete(qId);
        }
        return next;
      });
    }
  }, [attemptId, currentIndex, questions]);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setVisited((prev) => new Set(prev).add(nextIdx));
    }
  }, [currentIndex, totalQuestions]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToQuestion = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setVisited((prev) => new Set(prev).add(index));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    try {
      const result = await submitMockAttempt(attemptId);
      if (result.success) {
        router.push(`/mock/${attemptId}/result`);
      }
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, router]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit
          if (!submittedRef.current) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleSubmit]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitDialog) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "1":
        case "2":
        case "3":
        case "4":
          e.preventDefault();
          selectOption(parseInt(e.key) - 1);
          break;
        case "n":
        case "N":
          e.preventDefault();
          goNext();
          break;
        case "p":
        case "P":
          e.preventDefault();
          goPrev();
          break;
        case "m":
        case "M":
          e.preventDefault();
          handleMarkForReview();
          break;
        case "s":
        case "S":
          if (e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          setShowSubmitDialog(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectOption, goNext, goPrev, handleMarkForReview, showSubmitDialog]);

  // Stats for submit dialog
  const answeredCount = Object.keys(answerMap).length;
  const unansweredCount = totalQuestions - answeredCount;
  const markedCount = markedForReview.size;

  const getQuestionStatus = (index: number) => {
    const qId = questions[index].id;
    const isAnswered = qId in answerMap;
    const isMarked = markedForReview.has(qId);
    const isVisited = visited.has(index);

    if (isAnswered && isMarked) return "answered-marked";
    if (isAnswered) return "answered";
    if (isMarked) return "marked-review";
    if (isVisited) return "not-visited";
    return "not-visited";
  };

  const isTimeLow = timeLeft <= 300; // 5 minutes warning

  return (
    <div className="fixed inset-0 bg-[#f1f5f9] z-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
            CBT Mock Test
          </div>
          <span className="text-sm text-slate-500 hidden sm:inline">
            Q {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
            isTimeLow
              ? "bg-red-100 text-red-700 timer-warning"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <button
          onClick={() => setShowSubmitDialog(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Submit</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                  Q.{currentIndex + 1}
                </span>
                <span className="text-xs text-slate-400">
                  {currentQuestion.subjectName}
                </span>
              </div>
              {markedForReview.has(currentQuestion.id) && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  Marked for Review
                </span>
              )}
            </div>

            {/* Question text */}
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 mb-6 shadow-sm">
              <MarkdownRenderer content={currentQuestion.text} />
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, i) => {
                const isSelected = answerMap[currentQuestion.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectOption(i)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1 text-sm">
                      <MarkdownRenderer content={option} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={clearResponse}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Response
              </button>
              <button
                onClick={async () => {
                  await handleMarkForReview();
                  goNext();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Mark for Review & Next
              </button>
              <div className="flex-1" />
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex === totalQuestions - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-30 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-6 text-xs text-slate-400 text-center space-x-4">
              <span>1–4: Select option</span>
              <span>N/P: Next/Prev</span>
              <span>M: Mark review</span>
              <span>S: Submit</span>
            </div>
          </div>
        </div>

        {/* Right sidebar — Question Palette */}
        <div className="w-64 bg-white border-l border-[var(--color-border)] p-4 overflow-y-auto hidden md:block">
          <h3 className="font-semibold text-sm text-slate-700 mb-3">
            Question Palette
          </h3>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <span className="text-slate-500">Not visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-slate-500">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-slate-500">Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-slate-500">Ans + Review</span>
            </div>
          </div>

          {/* Palette grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => goToQuestion(i)}
                className={`palette-btn ${getQuestionStatus(i)} ${
                  i === currentIndex ? "current" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Answered</span>
              <span className="font-medium">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Unanswered</span>
              <span className="font-medium">{unansweredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Marked</span>
              <span className="font-medium">{markedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="font-bold text-lg">Submit Test?</h3>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">✅ Answered</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">⬜ Unanswered</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-purple-600">🔖 Marked for review</span>
                <span className="font-bold">{markedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-sm text-orange-600 mb-4">
                ⚠️ You have {unansweredCount} unanswered question
                {unansweredCount !== 1 ? "s" : ""}. Unanswered questions
                score 0 marks (no penalty).
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
