"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit3,
  Check,
  Loader2,
  Database,
  ShieldAlert,
  Info,
} from "lucide-react";
import {
  uploadAndExtractPdf,
  generateQuestionsFromDoc,
  commitReviewedQuestions,
  type ReviewQuestionItem,
} from "@/actions/generate";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface SubjectItem {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface GenerateWizardProps {
  subjects: SubjectItem[];
}

export function GenerateWizard({ subjects }: GenerateWizardProps) {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  // Stage 1: Upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedDoc, setExtractedDoc] = useState<{
    id: string;
    filename: string;
    numPages: number;
    charCount: number;
    textPreview: string;
    isScannedLikely: boolean;
    warning?: string;
  } | null>(null);

  // Stage 2: Config state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ""
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "MIXED">("MEDIUM");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [sourceLabel, setSourceLabel] = useState<string>("");

  // Stage 3: Review state
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<ReviewQuestionItem[]>([]);
  const [selectedTempIds, setSelectedTempIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState<{ count: number; status: string } | null>(null);

  // Errors
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Topics for selected subject
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const availableTopics = currentSubject?.topics || [];

  // ──────────────── Stage 1 Handlers ────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setErrorMsg("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPdfFile(file);
      setErrorMsg("");
    }
  };

  const handleUploadAndExtract = async () => {
    if (!pdfFile) return;
    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      const res = await uploadAndExtractPdf(formData);

      if (!res.success || !res.doc) {
        setErrorMsg(res.error || "Failed to extract PDF text.");
      } else {
        setExtractedDoc(res.doc);
        setSourceLabel(`PYQ / Notes – ${res.doc.filename}`);
        setCurrentStage(2);
      }
    } catch {
      setErrorMsg("An error occurred during PDF extraction.");
    } finally {
      setUploading(false);
    }
  };

  // ──────────────── Stage 2 Handlers ────────────────
  const handleStartGeneration = async () => {
    if (!extractedDoc || !selectedSubjectId) return;
    setGenerating(true);
    setErrorMsg("");

    try {
      const res = await generateQuestionsFromDoc({
        sourceDocId: extractedDoc.id,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        difficulty,
        questionCount,
        sourceLabel: sourceLabel.trim() || extractedDoc.filename,
      });

      if (!res.success || !res.questions) {
        setErrorMsg(res.error || "Generation failed.");
      } else {
        setQuestions(res.questions);
        setSelectedTempIds(new Set(res.questions.map((q) => q.tempId)));
        setCurrentStage(3);
      }
    } catch {
      setErrorMsg("Failed to generate questions. Please ensure your OpenAI API Key is valid.");
    } finally {
      setGenerating(false);
    }
  };

  // ──────────────── Stage 3 Handlers ────────────────
  const toggleSelect = (tempId: string) => {
    setSelectedTempIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTempIds(new Set(questions.map((q) => q.tempId)));
  };

  const deselectAll = () => {
    setSelectedTempIds(new Set());
  };

  const deleteQuestion = (tempId: string) => {
    setQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
    setSelectedTempIds((prev) => {
      const next = new Set(prev);
      next.delete(tempId);
      return next;
    });
  };

  const updateQuestionField = (
    tempId: string,
    field: keyof ReviewQuestionItem,
    val: unknown
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === tempId ? { ...q, [field]: val } : q))
    );
  };

  const updateOptionText = (tempId: string, optionIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.tempId !== tempId) return q;
        const newOpts = [...q.options] as [string, string, string, string];
        newOpts[optionIndex] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleSaveQuestions = async (targetStatus: "ACTIVE" | "DRAFT") => {
    const toSave = questions.filter((q) => selectedTempIds.has(q.tempId));
    if (toSave.length === 0) {
      setErrorMsg("No questions selected to save.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const res = await commitReviewedQuestions(toSave, targetStatus);
      if (!res.success || res.savedCount === undefined) {
        setErrorMsg(res.error || "Failed to save questions.");
      } else {
        setSuccessSaved({
          count: res.savedCount,
          status: targetStatus === "ACTIVE" ? "Active (usable in tests)" : "Draft (review in bank)",
        });
      }
    } catch {
      setErrorMsg("Error committing questions to database.");
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setCurrentStage(1);
    setPdfFile(null);
    setExtractedDoc(null);
    setQuestions([]);
    setSelectedTempIds(new Set());
    setErrorMsg("");
    setSuccessSaved(null);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Progress Steps */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStage === 1
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : currentStage > 1
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStage > 1 ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <span className={`text-xs font-semibold ${currentStage === 1 ? "text-blue-600" : "text-slate-600"}`}>
              Upload PDF
            </span>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${currentStage > 1 ? "bg-green-500" : "bg-slate-200"}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStage === 2
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : currentStage > 2
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {currentStage > 2 ? <Check className="w-4 h-4" /> : "2"}
            </div>
            <span className={`text-xs font-semibold ${currentStage === 2 ? "text-blue-600" : "text-slate-600"}`}>
              Configure
            </span>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${currentStage > 2 ? "bg-green-500" : "bg-slate-200"}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStage === 3
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              3
            </div>
            <span className={`text-xs font-semibold ${currentStage === 3 ? "text-blue-600" : "text-slate-600"}`}>
              Review Batch
            </span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 text-sm animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs mt-0.5 text-red-600">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ──────────────── STAGE 1: UPLOAD ──────────────── */}
      {currentStage === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              pdfFile
                ? "border-blue-400 bg-blue-50/40"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>

            {pdfFile ? (
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-900">{pdfFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Ready for text extraction
                </p>
                <p className="text-xs text-blue-600 font-medium mt-2">
                  Click or drag another file to change
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-800">
                  Select or drop a Computer Science PDF document
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Upload previous year question papers, textbook chapters, or subject revision notes (e.g. DBMS, Operating Systems, C/C++, Networking).
                </p>
                <span className="inline-block mt-2 px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                  Browse PDF
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Note on Text vs Scanned PDFs:</strong> Text is extracted server-side. Text-based PDFs work best. Scanned or photo-based PDFs without embedded selectable text are not supported by standard extraction.
            </p>
          </div>

          {pdfFile && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPdfFile(null)}
                disabled={uploading}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg"
              >
                Clear
              </button>
              <button
                onClick={handleUploadAndExtract}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting Text...
                  </>
                ) : (
                  <>
                    Extract & Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── STAGE 2: CONFIGURE ──────────────── */}
      {currentStage === 2 && extractedDoc && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          {/* File summary badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{extractedDoc.filename}</p>
                <p className="text-xs text-slate-500">
                  {extractedDoc.numPages} Pages • {extractedDoc.charCount.toLocaleString()} Characters extracted
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStage(1)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Choose different PDF
            </button>
          </div>

          {/* Scanned PDF warning if applicable */}
          {extractedDoc.warning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>{extractedDoc.warning}</p>
            </div>
          )}

          {/* Text preview snippet */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Extracted Text Preview
            </label>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs max-h-32 overflow-y-auto leading-relaxed border border-slate-700">
              {extractedDoc.textPreview}
            </div>
          </div>

          {/* Form controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Subject *
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedTopicId("");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Topic (Optional)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- All Topics / General --</option>
                {availableTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Mix */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "EASY" | "MEDIUM" | "HARD" | "MIXED")
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MIXED">Mixed (Balanced mix of Easy, Medium, Hard)</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Number of questions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Number of MCQs to Generate
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      questionCount === num
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Label */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Source Tag / Citation
              </label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="e.g. PYQ 2023 - Computer Programmer, Chapter 4 Notes"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Saved with each question so you can track where it came from in the bank.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStage(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Upload
            </button>

            <button
              onClick={handleStartGeneration}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Grounded MCQs...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate {questionCount} MCQs with AI
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── STAGE 3: REVIEW BATCH ──────────────── */}
      {currentStage === 3 && (
        <div className="space-y-6">
          {/* Success screen after commit */}
          {successSaved ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center animate-fadeIn">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-green-900">Questions Saved Successfully!</h2>
              <p className="text-sm text-green-700 mt-1">
                Saved <strong>{successSaved.count}</strong> questions as <strong>{successSaved.status}</strong>.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Link
                  href="/bank"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <Database className="w-4 h-4" /> View Question Bank
                </Link>
                <Link
                  href="/mock"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Start Mock Test
                </Link>
                <button
                  onClick={resetAll}
                  className="px-4 py-2 bg-white border border-green-300 text-green-800 text-sm font-medium rounded-lg hover:bg-green-50"
                >
                  Generate More
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* AI Verification Banner */}
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-sm animate-fadeIn">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">AI-Generated Content — Verification Required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Please inspect every question and correct answer below before activating. You can edit text, change the correct answer radio, or delete unwanted questions.
                  </p>
                </div>
              </div>

              {/* Batch toolbar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedTempIds.size} of {questions.length} selected
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-slate-500 hover:underline font-medium"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentStage(2)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1"
                  >
                    ← Reconfigure
                  </button>

                  <button
                    onClick={() => handleSaveQuestions("DRAFT")}
                    disabled={saving || selectedTempIds.size === 0}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Save Selected ({selectedTempIds.size}) as Draft
                  </button>

                  <button
                    onClick={() => handleSaveQuestions("ACTIVE")}
                    disabled={saving || selectedTempIds.size === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Accept Selected ({selectedTempIds.size}) as Active
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isSelected = selectedTempIds.has(q.tempId);
                  const isEditing = editingId === q.tempId;

                  return (
                    <div
                      key={q.tempId}
                      className={`bg-white rounded-xl border p-5 transition-all shadow-sm ${
                        isSelected ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200"
                      } ${q.isDuplicate ? "bg-amber-50/20" : ""}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(q.tempId)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-bold text-sm text-slate-800">
                            Q{idx + 1}
                          </span>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              q.difficulty === "EASY"
                                ? "bg-green-100 text-green-700"
                                : q.difficulty === "HARD"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {q.difficulty}
                          </span>

                          {q.isDuplicate && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Near Duplicate of existing question
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingId(isEditing ? null : q.tempId)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded"
                            title={isEditing ? "Done editing" : "Edit question"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteQuestion(q.tempId)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded"
                            title="Delete question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      {isEditing ? (
                        <div className="space-y-3 mb-4">
                          <label className="block text-xs font-semibold text-slate-600">
                            Question Markdown
                          </label>
                          <textarea
                            value={q.question}
                            onChange={(e) =>
                              updateQuestionField(q.tempId, "question", e.target.value)
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="mb-4">
                          <MarkdownRenderer content={q.question} />
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctIndex === optIdx;

                          return (
                            <div
                              key={optIdx}
                              onClick={() => {
                                if (isEditing) return;
                                updateQuestionField(q.tempId, "correctIndex", optIdx);
                              }}
                              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                                isCorrect
                                  ? "border-green-500 bg-green-50/70 text-green-900 font-medium shadow-xs"
                                  : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-800"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.tempId}`}
                                checked={isCorrect}
                                onChange={() =>
                                  updateQuestionField(q.tempId, "correctIndex", optIdx)
                                }
                                className="mt-0.5 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                              <span className="font-mono font-bold text-slate-500">
                                {["A", "B", "C", "D"][optIdx]}.
                              </span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) =>
                                    updateOptionText(q.tempId, optIdx, e.target.value)
                                  }
                                  className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                                />
                              ) : (
                                <span className="flex-1 font-mono">{opt}</span>
                              )}
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-green-700 bg-green-200/70 px-1.5 py-0.5 rounded">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-600">
                            Explanation
                          </label>
                          <textarea
                            value={q.explanation}
                            onChange={(e) =>
                              updateQuestionField(q.tempId, "explanation", e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Explanation: </span>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
