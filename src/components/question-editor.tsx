"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { createQuestion, updateQuestion } from "@/actions/questions";
import type { QuestionFormData } from "@/lib/schemas";
import { Eye, Save, ArrowLeft, AlertTriangle } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface QuestionEditorProps {
  subjects: Subject[];
  initialData?: {
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    subjectId: string;
    topicId: string | null;
    difficulty: string;
    status: string;
    source: string;
    tags: string[];
  };
}

export function QuestionEditor({ subjects, initialData }: QuestionEditorProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [text, setText] = useState(initialData?.text ?? "");
  const [options, setOptions] = useState<string[]>(
    initialData?.options ?? ["", "", "", ""]
  );
  const [correctIndex, setCorrectIndex] = useState(
    initialData?.correctIndex ?? 0
  );
  const [explanation, setExplanation] = useState(
    initialData?.explanation ?? ""
  );
  const [subjectId, setSubjectId] = useState(initialData?.subjectId ?? "");
  const [topicId, setTopicId] = useState(initialData?.topicId ?? "");
  const [difficulty, setDifficulty] = useState(
    initialData?.difficulty ?? "MEDIUM"
  );
  const [status, setStatus] = useState(initialData?.status ?? "DRAFT");
  const [source, setSource] = useState(initialData?.source ?? "");
  const [tagsInput, setTagsInput] = useState(
    initialData?.tags?.join(", ") ?? ""
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const topics = selectedSubject?.topics ?? [];

  const updateOption = useCallback(
    (index: number, value: string) => {
      setOptions((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    []
  );

  const handleSave = async () => {
    setError("");
    setWarning("");
    setSaving(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const data: QuestionFormData = {
        text,
        options,
        correctIndex,
        explanation,
        subjectId,
        topicId: topicId || null,
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
        status: status as "DRAFT" | "ACTIVE" | "ARCHIVED",
        source,
        tags,
      };

      if (isEditing && initialData) {
        const result = await updateQuestion(initialData.id, data);
        if (result.success) {
          router.push("/bank");
        }
      } else {
        const result = await createQuestion(data);
        if (result.success) {
          if (result.duplicateWarning) {
            setWarning(result.duplicateWarning);
          }
          router.push("/bank");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save question"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Question" : "New Question"}
          </h1>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      {/* Error / Warning */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {warning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {warning}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-5">
          {/* Subject & Topic */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTopicId("");
                }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Topic
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
                disabled={!subjectId}
              >
                <option value="">No topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Question Text * (Markdown supported)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Enter question text. Use ```c for code blocks..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 font-mono resize-y"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Options * (select the correct one)
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    className="option-radio"
                  />
                  <span className="text-sm font-medium text-slate-500 w-6">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-blue-500 ${
                      correctIndex === i
                        ? "border-green-400 bg-green-50"
                        : "border-[var(--color-border)]"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Explanation (Markdown)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder="Why is this the correct answer?"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 resize-y"
            />
          </div>

          {/* Source & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Source
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder='e.g. "PYQ – PSSSB 2023"'
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="pointers, code-output"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !subjectId || !text || options.some((o) => !o)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving
              ? "Saving..."
              : isEditing
                ? "Update Question"
                : "Create Question"}
          </button>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-6 shadow-sm h-fit sticky top-4">
            <h3 className="font-semibold text-sm text-slate-500 mb-4 uppercase tracking-wider">
              Preview
            </h3>
            <div className="space-y-4">
              <MarkdownRenderer content={text || "*No question text yet*"} />
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      correctIndex === i
                        ? "border-green-400 bg-green-50"
                        : "border-slate-200"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-500">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="text-sm">
                      {opt || (
                        <span className="text-slate-400 italic">empty</span>
                      )}
                    </span>
                    {correctIndex === i && (
                      <span className="ml-auto text-xs text-green-600 font-medium">
                        ✓ Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-600 mb-1">
                    Explanation
                  </p>
                  <MarkdownRenderer content={explanation} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
