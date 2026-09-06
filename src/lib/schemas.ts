import { z } from "zod";

// ─── Question Schemas ─────────────────────────────────────

export const questionFormSchema = z.object({
  text: z.string().min(10, "Question text must be at least 10 characters"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .length(4, "Exactly 4 options required"),
  correctIndex: z
    .number()
    .int()
    .min(0)
    .max(3, "Correct index must be 0–3"),
  explanation: z.string().default(""),
  subjectId: z.string().min(1, "Subject is required"),
  topicId: z.string().nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  source: z.string().default(""),
  tags: z.array(z.string()).default([]),
});

export type QuestionFormData = z.infer<typeof questionFormSchema>;

// ─── Attempt Configuration ────────────────────────────────

export const attemptConfigSchema = z.object({
  questionCount: z.number().int().min(1).max(200).default(100),
  durationSec: z.number().int().min(60).max(14400).default(6000), // 100 min
  perQuestionMark: z.number().default(1),
  negativeMarkPerWrong: z.number().default(0.25),
  subjectFilter: z.array(z.string()).optional(),
  difficultyFilter: z.array(z.enum(["EASY", "MEDIUM", "HARD"])).optional(),
  shuffle: z.boolean().default(true),
  shuffleSeed: z.number().optional(),
});

export type AttemptConfig = z.infer<typeof attemptConfigSchema>;

// ─── Mock Test Start ──────────────────────────────────────

export const startMockSchema = z.object({
  questionCount: z.number().int().min(1).max(200).default(100),
  durationMinutes: z.number().int().min(1).max(240).default(100),
  subjectFilter: z.array(z.string()).default([]),
  difficultyFilter: z.array(z.enum(["EASY", "MEDIUM", "HARD"])).default([]),
  shuffle: z.boolean().default(true),
});

export type StartMockData = z.infer<typeof startMockSchema>;

// ─── Practice Session Start ───────────────────────────────

export const startPracticeSchema = z.object({
  questionCount: z.number().int().min(1).max(100).default(20),
  subjectFilter: z.array(z.string()).default([]),
  topicFilter: z.array(z.string()).default([]),
  difficultyFilter: z.array(z.enum(["EASY", "MEDIUM", "HARD"])).default([]),
  weakOnly: z.boolean().default(false),
});

export type StartPracticeData = z.infer<typeof startPracticeSchema>;

// ─── Answer Submission ────────────────────────────────────

export const saveAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  chosenIndex: z.number().int().min(0).max(3).nullable(),
});

export type SaveAnswerData = z.infer<typeof saveAnswerSchema>;

// ─── Import Row Schema ───────────────────────────────────

export const importRowSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().optional().default(""),
  question: z.string().min(10, "Question too short"),
  option_a: z.string().min(1, "Option A is required"),
  option_b: z.string().min(1, "Option B is required"),
  option_c: z.string().min(1, "Option C is required"),
  option_d: z.string().min(1, "Option D is required"),
  correct_letter: z
    .string()
    .toUpperCase()
    .refine((v) => ["A", "B", "C", "D"].includes(v), {
      message: "Must be A, B, C, or D",
    }),
  explanation: z.string().optional().default(""),
  difficulty: z
    .string()
    .toUpperCase()
    .refine((v) => ["EASY", "MEDIUM", "HARD"].includes(v), {
      message: "Must be easy, medium, or hard",
    })
    .default("MEDIUM"),
  source: z.string().optional().default(""),
  tags: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      return v.split(",").map((t) => t.trim()).filter(Boolean);
    })
    .default([]),
});

export type ImportRowData = z.infer<typeof importRowSchema>;

// ─── AI Generation Config ─────────────────────────────────

export const generationConfigSchema = z.object({
  sourceDocumentId: z.string(),
  subjectId: z.string(),
  topicId: z.string().nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  questionCount: z.number().int().min(1).max(50).default(10),
  sourceLabel: z.string().default(""),
});

export type GenerationConfig = z.infer<typeof generationConfigSchema>;

// ─── AI Generated Question (from LLM response) ───────────

export const aiGeneratedQuestionSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().default(""),
});

export const aiGenerationResponseSchema = z.object({
  questions: z.array(aiGeneratedQuestionSchema),
});

export type AIGeneratedQuestion = z.infer<typeof aiGeneratedQuestionSchema>;

// ─── Passcode ─────────────────────────────────────────────

export const passcodeSchema = z.object({
  passcode: z.string().min(1, "Passcode is required"),
});
