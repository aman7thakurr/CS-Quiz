"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit, Trash2, CheckCircle, Archive } from "lucide-react";
import {
  bulkUpdateQuestionStatus,
  bulkDeleteQuestions,
} from "@/actions/questions";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface QuestionRow {
  id: string;
  text: string;
  options: unknown;
  correctIndex: number;
  difficulty: string;
  status: string;
  source: string;
  tags: string[];
  timesUsed: number;
  timesCorrect: number;
  subject: { name: string; slug: string };
  topic: { name: string } | null;
}

export function QuestionBankTable({
  questions,
}: {
  questions: QuestionRow[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === questions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(questions.map((q) => q.id)));
    }
  };

  const handleBulkAction = async (
    action: "ACTIVE" | "ARCHIVED" | "DRAFT" | "DELETE"
  ) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);

    const confirmMsg =
      action === "DELETE"
        ? `Delete ${ids.length} question(s)? This cannot be undone.`
        : `${action === "ACTIVE" ? "Activate" : action === "ARCHIVED" ? "Archive" : "Set as draft"} ${ids.length} question(s)?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      if (action === "DELETE") {
        await bulkDeleteQuestions(ids);
      } else {
        await bulkUpdateQuestionStatus(ids, action);
      }
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d: string) => {
    switch (d) {
      case "EASY":
        return "bg-green-100 text-green-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "HARD":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "DRAFT":
        return "bg-orange-100 text-orange-700";
      case "ARCHIVED":
        return "bg-slate-100 text-slate-500";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border-b border-blue-200">
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
          <button
            onClick={() => handleBulkAction("ACTIVE")}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-3 h-3" /> Activate
          </button>
          <button
            onClick={() => handleBulkAction("ARCHIVED")}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-slate-600 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            <Archive className="w-3 h-3" /> Archive
          </button>
          <button
            onClick={() => handleBulkAction("DELETE")}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-slate-50">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={
                    selected.size === questions.length && questions.length > 0
                  }
                  onChange={selectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Question
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 hidden lg:table-cell">
                Subject
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 hidden md:table-cell">
                Difficulty
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 hidden lg:table-cell">
                Stats
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const accuracy =
                q.timesUsed > 0
                  ? Math.round((q.timesCorrect / q.timesUsed) * 100)
                  : null;
              return (
                <tr
                  key={q.id}
                  className="border-b border-[var(--color-border)] hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <div className="line-clamp-2 text-slate-700">
                      <MarkdownRenderer
                        content={q.text.substring(0, 150) + (q.text.length > 150 ? "..." : "")}
                      />
                    </div>
                    {q.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {q.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-600">
                      {q.subject.name}
                    </span>
                    {q.topic && (
                      <span className="block text-xs text-slate-400">
                        {q.topic.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColor(q.difficulty)}`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(q.status)}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {q.timesUsed > 0 ? (
                      <span className="text-xs text-slate-500">
                        {accuracy}% ({q.timesCorrect}/{q.timesUsed})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/bank/edit/${q.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
