"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPracticeAttempt } from "@/actions/mock";
import { AlertTriangle, Play } from "lucide-react";

interface PracticeConfigFormProps {
  subjects: {
    id: string;
    name: string;
    questionCount: number;
    topics: { id: string; name: string }[];
  }[];
  weakQuestionCount: number;
}

export function PracticeConfigForm({
  subjects,
  weakQuestionCount,
}: PracticeConfigFormProps) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(20);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [weakOnly, setWeakOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableTopics = subjects
    .filter(
      (s) =>
        selectedSubjects.length === 0 || selectedSubjects.includes(s.id)
    )
    .flatMap((s) => s.topics);

  const handleStart = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await createPracticeAttempt({
        questionCount,
        subjectFilter: selectedSubjects,
        topicFilter: selectedTopics,
        difficultyFilter: selectedDifficulties,
        weakOnly,
      });

      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("attemptId" in result) {
        router.push(`/practice/${result.attemptId}`);
      }
    } catch {
      setError("Failed to start practice session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm space-y-6">
      {/* Weak questions toggle */}
      {weakQuestionCount > 0 && (
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            weakOnly
              ? "border-orange-400 bg-orange-50"
              : "border-slate-200 hover:border-orange-300"
          }`}
          onClick={() => setWeakOnly(!weakOnly)}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`w-5 h-5 ${weakOnly ? "text-orange-600" : "text-slate-400"}`}
            />
            <div>
              <p className="font-medium text-sm">
                Weak Questions Only ({weakQuestionCount} available)
              </p>
              <p className="text-xs text-slate-500">
                Focus on questions you&apos;ve previously answered incorrectly
              </p>
            </div>
            <input
              type="checkbox"
              checked={weakOnly}
              onChange={() => {}}
              className="ml-auto w-4 h-4"
            />
          </div>
        </div>
      )}

      {/* Question Count */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Number of Questions
        </label>
        <div className="flex gap-2">
          {[10, 20, 30, 50].map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                questionCount === n
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Subjects (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setSelectedSubjects((prev) =>
                  prev.includes(s.id)
                    ? prev.filter((x) => x !== s.id)
                    : [...prev, s.id]
                )
              }
              disabled={s.questionCount === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSubjects.includes(s.id)
                  ? "bg-blue-600 text-white"
                  : s.questionCount === 0
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.name.length > 30 ? s.name.substring(0, 30) + "…" : s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Filter */}
      {availableTopics.length > 0 && selectedSubjects.length > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Topics (optional)
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {availableTopics.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setSelectedTopics((prev) =>
                    prev.includes(t.id)
                      ? prev.filter((x) => x !== t.id)
                      : [...prev, t.id]
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedTopics.includes(t.id)
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty Filter */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Difficulty (optional)
        </label>
        <div className="flex gap-2">
          {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
            <button
              key={d}
              onClick={() =>
                setSelectedDifficulties((prev) =>
                  prev.includes(d)
                    ? prev.filter((x) => x !== d)
                    : [...prev, d]
                )
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDifficulties.includes(d)
                  ? d === "EASY"
                    ? "bg-green-600 text-white"
                    : d === "MEDIUM"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 shadow-lg"
      >
        <Play className="w-6 h-6" />
        {loading ? "Starting..." : "Start Practice"}
      </button>
    </div>
  );
}
