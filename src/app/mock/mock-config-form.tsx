"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMockAttempt } from "@/actions/mock";
import { Play, Clock, Hash, Shuffle } from "lucide-react";

interface MockConfigFormProps {
  subjects: { id: string; name: string; questionCount: number }[];
  maxQuestions: number;
}

export function MockConfigForm({ subjects, maxQuestions }: MockConfigFormProps) {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(
    Math.min(100, maxQuestions)
  );
  const [durationMinutes, setDurationMinutes] = useState(100);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [shuffle, setShuffle] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleDifficulty = (d: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleStart = async () => {
    if (maxQuestions === 0) {
      setError("No active questions. Add questions first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await createMockAttempt({
        questionCount,
        durationMinutes,
        subjectFilter: selectedSubjects,
        difficultyFilter: selectedDifficulties as ("EASY" | "MEDIUM" | "HARD")[],
        shuffle,
      });

      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("attemptId" in result && result.attemptId) {
        router.push(`/mock/${result.attemptId}`);
      }
    } catch {
      setError("Failed to create mock test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm space-y-6">
      <h2 className="font-bold text-lg">Configure Your Test</h2>

      {/* Question Count */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Number of Questions
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={Math.min(200, maxQuestions)}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min={1}
            max={Math.min(200, maxQuestions)}
            value={questionCount}
            onChange={(e) =>
              setQuestionCount(
                Math.max(1, Math.min(parseInt(e.target.value) || 1, maxQuestions))
              )
            }
            className="w-20 px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm text-center"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration (minutes)
        </label>
        <div className="flex flex-wrap gap-2">
          {[30, 60, 90, 100, 120].map((m) => (
            <button
              key={m}
              onClick={() => setDurationMinutes(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                durationMinutes === m
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Subject Filter */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Subjects (optional — leave empty for all)
        </label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleSubject(s.id)}
              disabled={s.questionCount === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedSubjects.includes(s.id)
                  ? "bg-blue-600 text-white"
                  : s.questionCount === 0
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.name.length > 25 ? s.name.substring(0, 25) + "…" : s.name}{" "}
              ({s.questionCount})
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Difficulty (optional — leave empty for all)
        </label>
        <div className="flex gap-2">
          {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
            <button
              key={d}
              onClick={() => toggleDifficulty(d)}
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

      {/* Shuffle Toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={shuffle}
          onChange={(e) => setShuffle(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <Shuffle className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-700">
          Shuffle questions and options
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={loading || maxQuestions === 0}
        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        <Play className="w-6 h-6" />
        {loading ? "Preparing test..." : "Start Mock Test"}
      </button>
    </div>
  );
}
