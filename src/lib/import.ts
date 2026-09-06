import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeText, textSimilarity } from "./utils";

export interface RawImportRow {
  subject?: string;
  topic?: string;
  question?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_letter?: string;
  explanation?: string;
  difficulty?: string;
  source?: string;
  tags?: string;
  // JSON format alternative keys
  options?: string[];
  correctIndex?: number;
}

export interface ParsedQuestionRow {
  rowNumber: number;
  subjectName: string;
  topicName?: string;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number; // 0..3
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  source: string;
  tags: string[];
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
  duplicateQuestionSnippet?: string;
}

export interface ImportValidationResult {
  rows: ParsedQuestionRow[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
}

/**
 * Standard CSV Template header string
 */
export const SAMPLE_CSV_TEMPLATE = `subject,topic,question,option_a,option_b,option_c,option_d,correct_letter,explanation,difficulty,source,tags
Programming in C,Pointers,"What will be the output of \`int a=5; int *p=&a; printf(\\"%d\\", *p);\`?",5,Address of a,Garbage value,Compilation error,A,*p dereferences pointer p and prints value of a (5).,EASY,C Basics,c;pointers
Data Structures & Algorithms,Sorting,Which sorting algorithm has worst-case time complexity of O(n log n)?,Quick Sort,Merge Sort,Bubble Sort,Insertion Sort,B,Merge Sort always divides array in half and runs in O(n log n) even in worst case.,EASY,Standard DSA,dsa;sorting
Database Management Systems (DBMS) & SQL,SQL Queries,Which SQL clause is used to filter groups created by GROUP BY?,WHERE,ORDER BY,HAVING,FILTER,C,HAVING clause filters groups after grouping whereas WHERE filters rows before grouping.,MEDIUM,DBMS Guide,dbms;sql
`;

/**
 * Standard JSON Template
 */
export const SAMPLE_JSON_TEMPLATE = JSON.stringify(
  [
    {
      subject: "Operating Systems",
      topic: "Deadlocks",
      question: "Which of the following is NOT one of Coffman's four conditions for deadlock?",
      option_a: "Mutual Exclusion",
      option_b: "Hold and Wait",
      option_c: "Preemption",
      option_d: "Circular Wait",
      correct_letter: "C",
      explanation: "No preemption is the condition. If preemption is allowed, deadlock cannot occur.",
      difficulty: "MEDIUM",
      source: "OS Concepts",
      tags: "os;deadlocks",
    },
    {
      subject: "Computer Networks & Network Security",
      topic: "OSI Model",
      question: "At which layer of the OSI model does a router operate?",
      option_a: "Data Link Layer",
      option_b: "Network Layer",
      option_c: "Transport Layer",
      option_d: "Physical Layer",
      correct_letter: "B",
      explanation: "Routers operate at Layer 3 (Network Layer) and make routing decisions based on IP addresses.",
      difficulty: "EASY",
      source: "Networking Basics",
      tags: "networks;osi",
    },
  ],
  null,
  2
);

/**
 * Parse raw file content (CSV, JSON, or Excel buffer/base64) into raw objects
 */
export function parseRawImport(
  content: string | ArrayBuffer,
  fileType: "csv" | "json" | "xlsx" | "xls"
): RawImportRow[] {
  if (fileType === "json") {
    const text = typeof content === "string" ? content : new TextDecoder().decode(content);
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed as RawImportRow[];
    }
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed.questions as RawImportRow[];
    }
    throw new Error("JSON must contain an array of question objects");
  }

  if (fileType === "csv") {
    const text = typeof content === "string" ? content : new TextDecoder().decode(content);
    const result = Papa.parse<RawImportRow>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (result.errors.length > 0 && result.data.length === 0) {
      throw new Error(`CSV Parsing failed: ${result.errors[0].message}`);
    }
    return result.data;
  }

  if (fileType === "xlsx" || fileType === "xls") {
    const workbook = XLSX.read(content, { type: typeof content === "string" ? "binary" : "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
    });

    return jsonData.map((row) => {
      const normalizedRow: Record<string, string> = {};
      for (const [key, val] of Object.entries(row)) {
        const normKey = key.trim().toLowerCase().replace(/\s+/g, "_");
        normalizedRow[normKey] = String(val ?? "").trim();
      }
      return normalizedRow as unknown as RawImportRow;
    });
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

/**
 * Validate parsed raw rows against subjects, options, and duplicate detection
 */
export function validateImportRows(
  rawRows: RawImportRow[],
  existingQuestions: { text: string; subjectName?: string }[],
  validSubjectNames: string[]
): ImportValidationResult {
  const rows: ParsedQuestionRow[] = [];
  let validCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  // Build subject lookup map (lowercase -> original)
  const subjectMap = new Map<string, string>();
  for (const s of validSubjectNames) {
    subjectMap.set(s.toLowerCase(), s);
    // Also add simplified version without punctuation
    subjectMap.set(normalizeText(s), s);
  }

  rawRows.forEach((row, index) => {
    const rowNumber = index + 1;
    const errors: string[] = [];

    // Subject resolution
    const rawSubject = (row.subject || "").trim();
    let resolvedSubject = "";
    if (!rawSubject) {
      errors.push("Subject is required");
    } else {
      const exactMatch = subjectMap.get(rawSubject.toLowerCase()) || subjectMap.get(normalizeText(rawSubject));
      if (exactMatch) {
        resolvedSubject = exactMatch;
      } else {
        // Find partial match
        const partial = validSubjectNames.find((s) =>
          s.toLowerCase().includes(rawSubject.toLowerCase()) ||
          rawSubject.toLowerCase().includes(s.toLowerCase())
        );
        if (partial) {
          resolvedSubject = partial;
        } else {
          errors.push(`Unknown subject "${rawSubject}". Valid subjects: ${validSubjectNames.slice(0, 4).join(", ")}...`);
        }
      }
    }

    // Question text
    const questionText = (row.question || "").trim();
    if (!questionText || questionText.length < 5) {
      errors.push("Question text is required and must be at least 5 characters");
    }

    // Options extraction
    let options: [string, string, string, string] = ["", "", "", ""];
    if (Array.isArray(row.options) && row.options.length === 4) {
      options = [
        String(row.options[0] || "").trim(),
        String(row.options[1] || "").trim(),
        String(row.options[2] || "").trim(),
        String(row.options[3] || "").trim(),
      ];
    } else {
      options = [
        (row.option_a || "").trim(),
        (row.option_b || "").trim(),
        (row.option_c || "").trim(),
        (row.option_d || "").trim(),
      ];
    }

    if (options.some((opt) => opt.length === 0)) {
      errors.push("All 4 options (A, B, C, D) must be provided");
    }

    // Correct answer resolution
    let correctIndex = -1;
    if (typeof row.correctIndex === "number" && row.correctIndex >= 0 && row.correctIndex <= 3) {
      correctIndex = row.correctIndex;
    } else {
      const letter = String(row.correct_letter || "").trim().toUpperCase();
      if (letter === "A" || letter === "0" || letter === "1") {
        correctIndex = letter === "1" ? 0 : letter === "0" ? 0 : 0;
      }
      if (letter === "A" || letter === "OPTION_A" || letter === "1" || letter === "0") correctIndex = 0;
      else if (letter === "B" || letter === "OPTION_B" || letter === "2") correctIndex = 1;
      else if (letter === "C" || letter === "OPTION_C" || letter === "3") correctIndex = 2;
      else if (letter === "D" || letter === "OPTION_D" || letter === "4") correctIndex = 3;
    }

    if (correctIndex < 0 || correctIndex > 3) {
      errors.push("Correct answer must be specified as A, B, C, or D");
    }

    // Difficulty
    let difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM";
    const rawDiff = (row.difficulty || "").trim().toUpperCase();
    if (rawDiff === "EASY") difficulty = "EASY";
    else if (rawDiff === "HARD") difficulty = "HARD";
    else difficulty = "MEDIUM";

    // Tags
    let tags: string[] = [];
    if (typeof row.tags === "string" && row.tags.trim()) {
      tags = row.tags
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (Array.isArray(row.tags)) {
      tags = (row.tags as unknown[])
        .map((t) => String(t).trim())
        .filter(Boolean);
    }

    // Duplicate check against existing questions
    let isDuplicate = false;
    let duplicateQuestionSnippet: string | undefined;

    if (questionText.length > 10) {
      for (const eq of existingQuestions) {
        if (textSimilarity(questionText, eq.text) > 0.85) {
          isDuplicate = true;
          duplicateQuestionSnippet = eq.text.slice(0, 60) + "...";
          duplicateCount++;
          break;
        }
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      errorCount++;
    }

    rows.push({
      rowNumber,
      subjectName: resolvedSubject || rawSubject,
      topicName: row.topic?.trim(),
      questionText,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: (row.explanation || "").trim(),
      difficulty,
      source: (row.source || "Import").trim(),
      tags,
      isValid,
      error: errors.length > 0 ? errors.join("; ") : undefined,
      isDuplicate,
      duplicateQuestionSnippet,
    });
  });

  return {
    rows,
    totalRows: rawRows.length,
    validCount,
    errorCount,
    duplicateCount,
  };
}
