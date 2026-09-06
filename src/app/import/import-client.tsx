"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Database,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  validateImportFile,
  executeImport,
} from "@/actions/import";
import {
  SAMPLE_CSV_TEMPLATE,
  SAMPLE_JSON_TEMPLATE,
  type ImportValidationResult,
} from "@/lib/import";

interface ImportClientProps {
  validSubjects: string[];
}

export function ImportClient({ validSubjects }: ImportClientProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [generalError, setGeneralError] = useState("");
  const [filterView, setFilterView] = useState<"ALL" | "VALID" | "ERRORS" | "DUPLICATES">("ALL");
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number; status: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download template helpers
  const handleDownloadCsv = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cbt_questions_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([SAMPLE_JSON_TEMPLATE], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cbt_questions_template.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setGeneralError("");
      setImportSuccess(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setGeneralError("");
      setImportSuccess(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setValidating(true);
    setGeneralError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await validateImportFile(formData);

      if (!res.success || !res.data) {
        setGeneralError(res.error || "Validation failed.");
      } else {
        setValidationResult(res.data);
      }
    } catch {
      setGeneralError("An unexpected error occurred during validation.");
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async (targetStatus: "ACTIVE" | "DRAFT") => {
    if (!validationResult || validationResult.validCount === 0) return;
    setImporting(true);
    setGeneralError("");

    try {
      const res = await executeImport(validationResult.rows, targetStatus);
      if (!res.success || res.importedCount === undefined) {
        setGeneralError(res.error || "Import failed.");
      } else {
        setImportSuccess({
          count: res.importedCount,
          status: targetStatus === "ACTIVE" ? "Active (ready for mock tests)" : "Draft (review in Question Bank)",
        });
        setValidationResult(null);
        setSelectedFile(null);
      }
    } catch {
      setGeneralError("An error occurred while importing rows.");
    } finally {
      setImporting(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setValidationResult(null);
    setGeneralError("");
    setImportSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Filter rows
  const displayedRows = (validationResult?.rows || []).filter((r) => {
    if (filterView === "VALID") return r.isValid;
    if (filterView === "ERRORS") return !r.isValid;
    if (filterView === "DUPLICATES") return r.isDuplicate;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Templates Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Need the Standard Template?</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Download our ready-to-fill sample files with required column formats matching {validSubjects.length} active syllabus subjects (subject, topic, question, options A-D, correct_letter, explanation, difficulty, tags).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Download CSV
          </button>
          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileCode className="w-4 h-4 text-amber-600" />
            Download JSON
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fadeIn">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-green-900">Import Successful!</h3>
          <p className="text-sm text-green-700 mt-1">
            Successfully imported <strong>{importSuccess.count}</strong> questions as <strong>{importSuccess.status}</strong>.
          </p>
          <div className="flex gap-3 justify-center mt-5">
            <Link
              href="/bank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Database className="w-4 h-4" /> Go to Question Bank
            </Link>
            <button
              onClick={resetAll}
              className="px-4 py-2 bg-white border border-green-300 text-green-800 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 text-sm animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold">Import Error</p>
            <p className="text-xs mt-0.5 text-red-600">{generalError}</p>
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      {!validationResult && !importSuccess && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
            />
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation
                </p>
                <p className="text-xs text-blue-600 font-medium mt-2">
                  Click or drag another file to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base font-semibold text-slate-800">
                  Drop your CSV, Excel (.xlsx), or JSON file here
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Supports comma-delimited CSVs, Excel spreadsheets, or standard JSON question dumps.
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                  Browse files
                </span>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetAll}
                disabled={validating}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleValidate}
                disabled={validating}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Rows...
                  </>
                ) : (
                  <>Validate & Preview</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validation Result & Preview Section */}
      {validationResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Rows</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{validationResult.totalRows}</p>
              <p className="text-xs text-slate-400 mt-0.5">In uploaded file</p>
            </div>

            <div className="bg-white rounded-xl border border-green-200 bg-green-50/40 p-4 shadow-sm">
              <p className="text-xs font-medium text-green-700 uppercase">Valid Rows</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{validationResult.validCount}</p>
              <p className="text-xs text-green-600 mt-0.5">Ready to import</p>
            </div>

            <div className="bg-white rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-sm">
              <p className="text-xs font-medium text-red-700 uppercase">Errors</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{validationResult.errorCount}</p>
              <p className="text-xs text-red-600 mt-0.5">Will be skipped</p>
            </div>

            <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
              <p className="text-xs font-medium text-amber-700 uppercase">Potential Duplicates</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{validationResult.duplicateCount}</p>
              <p className="text-xs text-amber-600 mt-0.5">Matches existing bank</p>
            </div>
          </div>

          {/* Table Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Filter View:</span>
              <button
                onClick={() => setFilterView("ALL")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterView === "ALL"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Rows ({validationResult.rows.length})
              </button>
              <button
                onClick={() => setFilterView("VALID")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterView === "VALID"
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                Valid ({validationResult.validCount})
              </button>
              <button
                onClick={() => setFilterView("ERRORS")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterView === "ERRORS"
                    ? "bg-red-700 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Errors ({validationResult.errorCount})
              </button>
              <button
                onClick={() => setFilterView("DUPLICATES")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  filterView === "DUPLICATES"
                    ? "bg-amber-700 text-white"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                Duplicates ({validationResult.duplicateCount})
              </button>
            </div>

            {/* Import Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetAll}
                disabled={importing}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Upload Different File
              </button>

              <button
                onClick={() => handleExecuteImport("DRAFT")}
                disabled={importing || validationResult.validCount === 0}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Save {validationResult.validCount} as Drafts
              </button>

              <button
                onClick={() => handleExecuteImport("ACTIVE")}
                disabled={importing || validationResult.validCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Import {validationResult.validCount} as Active</>
                )}
              </button>
            </div>
          </div>

          {/* Rows Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3 font-semibold text-slate-600 w-12 text-center">#</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 w-24">Status</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 w-44">Subject / Topic</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 min-w-[280px]">Question Preview</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 w-28">Options</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 w-20 text-center">Correct</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 w-20">Diff.</th>
                    <th className="py-3 px-4 font-semibold text-slate-600 min-w-[180px]">Notes / Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No rows match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !row.isValid ? "bg-red-50/30" : row.isDuplicate ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">
                          {row.rowNumber}
                        </td>
                        <td className="py-3 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900 truncate max-w-[170px]">
                            {row.subjectName}
                          </p>
                          {row.topicName && (
                            <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                              {row.topicName}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800 line-clamp-2">{row.questionText}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <span className="font-mono text-[11px]">
                            4 options
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            {["A", "B", "C", "D"][row.correctIndex]}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              row.difficulty === "EASY"
                                ? "bg-green-100 text-green-700"
                                : row.difficulty === "HARD"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {row.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {row.error ? (
                            <p className="text-red-600 font-medium text-[11px]">{row.error}</p>
                          ) : row.isDuplicate ? (
                            <div className="text-amber-700 text-[11px]">
                              <span className="font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Possible Duplicate
                              </span>
                              <span className="text-slate-500 text-[10px] truncate block max-w-[200px]">
                                {row.duplicateQuestionSnippet}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
