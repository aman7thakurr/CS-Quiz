"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, submitPracticeAttempt } from "@/actions/mock";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  ChevronRight,
  CheckCircle,
  XCircle,
  Lightbulb,
  Trophy,
} from "lucide-react";

interface PracticeQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subjectName: string;
  difficulty: string;
}

interface PracticeInterfaceProps {
  attemptId: string;
  questions: PracticeQuestion[];
  initialAnswerMap: Record<string, number>;
}

export function PracticeInterface({
  attemptId,
  questions,
  initialAnswerMap,
}: PracticeInterfaceProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(
    Object.keys(initialAnswerMap).length
  );
  const [answerMap, setAnswerMap] = useState<Record<string, number>>(
    initialAnswerMap
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion =
    currentIndex < questions.length ? questions[currentIndex] : null;
  const progress = ((currentIndex) / questions.length) * 100;

  const isAlreadyAnswered = currentQuestion
    ? currentQuestion.id in answerMap
    : false;

  const selectAndSubmit = useCallback(
    async (index: number) => {
      if (!currentQuestion || showFeedback || isAlreadyAnswered) return;

      setSelectedOption(index);
      setShowFeedback(true);
      setAnswerMap((prev) => ({ ...prev, [currentQuestion.id]: index }));
      await saveAnswer(attemptId, currentQuestion.id, index);
    },
    [attemptId, currentQuestion, showFeedback, isAlreadyAnswered]
  );

  const goNext = useCallback(async () => {
    if (currentIndex >= questions.length - 1) {
      // Finished all questions
      setFinished(true);
      setSubmitting(true);
      await submitPracticeAttempt(attemptId);
      setSubmitting(false);
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setShowFeedback(false);
    setSelectedOption(null);
  }, [attemptId, currentIndex, questions.length]);

  // Calculate stats
  const correctCount = Object.entries(answerMap).filter(
    ([qId, idx]) => {
      const q = questions.find((x) => x.id === qId);
      return q && q.correctIndex === idx;
    }
  ).length;

  if (finished) {
    const totalAnswered = Object.keys(answerMap).length;
    const accuracy = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;

    return (
      <div className="max-w-2xl mx-auto text-center py-12 animate-fadeIn">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Practice Complete!</h2>
        <p className="text-slate-500 mb-8">
          {submitting ? "Saving results..." : "Here's how you did"}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-green-600">{correctCount}</p>
            <p className="text-sm text-green-600">Correct</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-red-600">
              {totalAnswered - correctCount}
            </p>
            <p className="text-sm text-red-600">Wrong</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-3xl font-bold text-blue-600">
              {accuracy.toFixed(0)}%
            </p>
            <p className="text-sm text-blue-600">Accuracy</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => router.push(`/mock/${attemptId}/result`)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
            Review All Answers
          </button>
          <button
            onClick={() => router.push("/practice")}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isCorrect =
    showFeedback && selectedOption === currentQuestion.correctIndex;
  const isWrong =
    showFeedback && selectedOption !== currentQuestion.correctIndex;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {correctCount} correct so far
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-400">
            {currentQuestion.subjectName}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              currentQuestion.difficulty === "EASY"
                ? "bg-green-100 text-green-700"
                : currentQuestion.difficulty === "MEDIUM"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {currentQuestion.difficulty}
          </span>
        </div>
        <MarkdownRenderer content={currentQuestion.text} />
      </div>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((option, i) => {
          const isThisCorrect = i === currentQuestion.correctIndex;
          const isThisSelected = selectedOption === i;

          let optionStyle =
            "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 cursor-pointer";

          if (showFeedback) {
            if (isThisCorrect) {
              optionStyle = "border-green-500 bg-green-50";
            } else if (isThisSelected && !isThisCorrect) {
              optionStyle = "border-red-500 bg-red-50";
            } else {
              optionStyle = "border-slate-200 bg-white opacity-60";
            }
          }

          return (
            <button
              key={i}
              onClick={() => selectAndSubmit(i)}
              disabled={showFeedback}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${optionStyle}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  showFeedback && isThisCorrect
                    ? "bg-green-600 text-white"
                    : showFeedback && isThisSelected
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {showFeedback && isThisCorrect ? (
                  <CheckCircle className="w-5 h-5" />
                ) : showFeedback && isThisSelected ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </div>
              <span className="flex-1 text-sm">
                <MarkdownRenderer content={option} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="animate-fadeIn space-y-4">
          {/* Correct/Wrong banner */}
          {isCorrect && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              <p className="font-medium text-green-800">Correct! 🎉</p>
            </div>
          )}
          {isWrong && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              <p className="font-medium text-red-800">
                Incorrect. The correct answer is{" "}
                <strong>
                  {String.fromCharCode(65 + currentQuestion.correctIndex)}
                </strong>
                .
              </p>
            </div>
          )}

          {/* Explanation */}
          {currentQuestion.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">
                  Explanation
                </p>
              </div>
              <div className="text-sm text-blue-900">
                <MarkdownRenderer content={currentQuestion.explanation} />
              </div>
            </div>
          )}

          {/* Next button */}
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {currentIndex >= questions.length - 1 ? "Finish" : "Next Question"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
