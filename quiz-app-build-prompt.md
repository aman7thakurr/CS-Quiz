# Build Prompt — "CBT Trainer" Quiz App for Computer Programmer (Group B) Exam

> **How to use this prompt:** Copy the whole document (or attach this file) and paste it into an AI coding agent (this workspace's Agent Mode, Cursor, Claude Code, Gemini CLI, v0, etc.). It is written as a complete brief, so the agent should build the app in one pass without needing to re-ask the setup questions already answered here. If the agent still asks clarifying questions, reply with the **"Fixed decisions"** block at the end.

---

## 1. Role & Goal

You are a senior full-stack engineer. Build me a complete, production-quality, single-user web application called **"CBT Trainer"** — a personal exam-practice platform for the **Punjab Government Group B — Computer Programmer** recruitment CBT.

I am the only user (no accounts, no sign-up), but the app will be **deployed on the web** (e.g., Vercel) so I can use it from any device. Because it is public-facing, add a **simple passcode gate** (value from an environment variable) so only I can open it.

I will feed it previous-year question papers and subject PDFs; the app must let me **auto-generate MCQs from those PDFs using an AI/LLM API**, review/edit them, store them, and then practice with them — including full CBT-simulated mock tests that follow my real exam's exact marking scheme.

Deliver a **working app end-to-end**: database schema + migrations, seed data, question bank, PDF→AI question generation, mock-test engine with the exact scoring math, practice mode, analytics, and clear README with setup/deploy steps.

## 2. Exam context (real facts the app must simulate)

- **Post:** Computer Programmer, Group B (Punjab Government recruitment). Objective-type **Computer Based Test (CBT)**.
- **Format:** 100 questions, each carrying **1 mark** → total **100 marks**.
- **Options:** 4 per question, exactly one correct (single-answer MCQ).
- **Marking (must be exact):**
  - Correct answer → **+1**
  - Wrong answer → **−0.25** (negative marking)
  - Unattempted → **0** (no penalty — always leave a question rather than guess blindly)
  - Score = `(number correct × 1) − (number wrong × 0.25)`
- **Duration:** 120 minutes (configurable when starting a test).
- **Language:** English (technical terms stay in English).
- **Syllabus (core Computer Science domain):**
  1. Computer Fundamentals & Computer Awareness
  2. Programming in C
  3. Programming in C++ (OOP)
  4. Java Programming
  5. Python Programming
  6. Data Structures & Algorithms
  7. Database Management Systems (DBMS) & SQL
  8. Operating Systems
  9. Computer Networks & Network Security
  10. Computer Organization & Architecture + Digital Logic
  11. Software Engineering
  12. Web Technologies & Internet Fundamentals

Keep this exact marking formula and subject list in mind everywhere in the UI (show it in the exam instructions screen and the result page).

## 3. Fixed Tech Stack (do not substitute without a strong reason)

- **Next.js** (latest stable, **App Router**), **TypeScript** (strict mode, no `any`), **React** with Server & Client components used appropriately.
- **Styling:** Tailwind CSS. Clean, calm, professional exam UI. System fonts for body, **monospace for all code snippets** in questions/options/answers.
- **Database:** PostgreSQL + **Prisma ORM**. Target serverless Postgres (Neon or Supabase) so it works on Vercel. Provide `prisma migrate`, a `npm run seed` script, and dev instructions.
- **AI question generation:** PDF text extraction server-side with a Node runtime (`pdf-parse` or `pdfjs-dist` — **not** Edge runtime), then call an **LLM** via an OpenAI-compatible adapter in `lib/ai.ts` driven by env vars: `OPENAI_API_KEY`, `OPENAI_BASE_URL` (default `https://api.openai.com/v1`), `OPENAI_MODEL` (default a cheap strong model like `gpt-4o-mini`/`gpt-4.1-mini`). Use structured JSON output (`response_format: { "type": "json_object" }` when supported) plus robust fallback JSON extraction. All AI keys stay **server-side only** (never ship to the browser).
- **Forms/validation:** `zod` on server + client. **Data fetching:** Server Actions for mutations; loading states and error boundaries everywhere.
- **State:** Server-side DB as the source of truth; `localStorage`/`indexedDB` only as a fallback for in-progress attempt auto-save.
- App must pass `next build` with ESLint + type checks clean.

## 4. Database schema (design it, then implement)

Model the domain so nothing is lost later:

- **Subject** — name, slug, order, isActive.
- **Topic** — name, subjectId (a subject has many topics).
- **Question**
  - type: enum `MCQ_SINGLE` (only type needed; keep the enum so more can come later)
  - text (markdown; must support code blocks, e.g. a C snippet as ` ```c ... ``` `)
  - options: JSON array of exactly 4 strings (may include code)
  - correctIndex: number (0–3)
  - explanation: markdown (the "why" — concise, references the source material when available)
  - subjectId, topicId (nullable topic ok)
  - difficulty: enum `easy | medium | hard`
  - status: enum `draft | active | archived` (draft = generated/imported but not yet usable in tests)
  - source: free text, e.g. `"PYQ – Computer Programmer PSSSB 2023"` or `"Subject notes – DBMS.pdf"`
  - tags: string[]
  - stats counters: timesUsed, timesCorrect (increment at submit; used for per-question accuracy)
  - timestamps
- **SourceDocument** — original uploaded PDF: filename, size, parsed text preview length, importedAt (keep parsed text available for regeneration; do not persist raw PDF binary).
- **Attempt**
  - config JSON: `{ questionCount, durationSec, perQuestionMark: 1, negativeMarkPerWrong: 0.25, subjectFilter, shuffleSeed }`
  - questionIds: order of questions presented
  - answerMap: `{ questionId: chosenIndex }` only for attempted ones (store as JSON)
  - markedForReview: questionIds flagged
  - startedAt, submittedAt, timeTakenSec
  - computed result: score, correctCount, wrongCount, skippedCount, accuracy
  - **Compute the score on the server at submit time** by re-reading the actual correct answers from the DB — never trust client-sent numbers.
- **AttemptQuestion** (optional child table if you prefer relational over JSON; your call — keep it simple and consistent).
- **GenerationLog** — AI call history: prompt metadata, tokens used, questions created (ids), status, error message.

Write clean Prisma models with relations, indexes on `(subjectId, topicId)`, `status`, `difficulty`.

## 5. App pages / routes

1. **`/` Dashboard** — big "Start CBT Mock Test" button; stats cards (total active questions, attempts taken, avg score, accuracy); subject-wise mastery bars; recent attempts; link to Practice, Question Bank, Generate Questions.
2. **`/mock` (exam instructions + configure)** — show exam rules (100 Qs, +1/−0.25/0, 120 min, 4 options). Defaults to 100 Qs / 120 min / −0.25; allow override of question count, optional subject filter, difficulty filter, and shuffle. Start button creates the Attempt and goes to the exam screen.
3. **`/mock/[attemptId]` (exam interface — make this feel like the real CBT)**
   - Full-screen, distraction-light layout.
   - Sticky countdown timer (large); on zero → **auto-submit automatically**.
   - **Question palette** (numbered grid): grey = not visited, red/orange = answered, purple = marked for review, and an option "answered & marked for review".
   - Prev/Next, "Clear response", "Mark for review & Next", Submit button with confirmation dialog listing answered/unanswered counts.
   - Question shows text/options; options selectable (radio). Code renders as `<pre>` monospace.
   - Keyboard shortcuts: `1..4` choose option, `N`/`P` navigate, `M` mark for review, `S` submit.
   - Auto-save progress on every action (DB or local fallback) so a refresh resumes.
   - Disable copy/selection of question text is **not** required (it's my own bank).
4. **`/mock/[attemptId]/result`** — big score number; correct / wrong / skipped counts; marks earned; accuracy; **scoring formula shown** (e.g., "80 × +1 − 12 × 0.25 = 77.00 / 100"); subject-wise performance bars; a review list of every question with the user's answer vs. correct answer and the explanation; toggle filter "wrong only / marked review / all". Option to add wrong questions to a "weak list".
5. **`/practice`** — pick subject → topic(s) → difficulty → number of questions → **practice mode with instant feedback**: after each answer, immediately show correct/incorrect + explanation. Progress bar. End screen summary. Also a "Weak questions" view (questions you've gotten wrong before).
6. **`/bank` (Question Bank manager)** — filterable/sortable/searchable table of questions (search across text/options/explanation/tags; filters by subject, topic, difficulty, status, source). Bulk actions: activate, archive, delete. Row → editor page.
7. **`/bank/new` and `/bank/edit/[id]`** — full question editor: subject/topic/difficulty/source/tags, markdown text box with **live preview** (code blocks working), 4 option fields (with "correct" radio + option to swap options with the correct one via keyboard/move arrows), explanation field, draft/active toggle. Save with zod validation; duplicate-detection warning (compare normalized question text against DB).
8. **`/generate` (AI question generation — the core workflow)** — three-stage wizard:
   - **Stage 1 – Upload:** drag & drop one or more PDFs (subject notes, PYQ papers). Server extracts text (report per-file page/char counts; warn clearly if a PDF looks scanned/image-only: "OCR not supported — please upload text-based PDFs").
   - **Stage 2 – Configure:** for each uploaded PDF pick a **subject**, optional **topic**, difficulty mix, and number of questions (e.g. 20). Choose source label (auto-suggested from filename + free text, e.g. "Subject notes – DBMS.pdf").
   - **Stage 3 – Review batch:** generated questions appear as editable cards (question, 4 options with correct highlighted, explanation, subject/topic/difficulty). Buttons per card: *Edit, Regenerate, Delete*. Group actions: *Accept all*, *Accept selected*, *Save all as draft*. Show an AI-warning banner: "AI-generated content — verify every answer before activating." Show any questions flagged as near-duplicates of existing bank questions.
   - Never auto-activate generated questions; they must be explicitly accepted (active) or left as draft.
9. **`/import` (backup path)** — upload **CSV/Excel/JSON** in the documented template (columns: `subject, topic, question, option_a, option_b, option_c, option_d, correct_letter, explanation, difficulty, source, tags`). Validate all rows, show a per-row report (valid / error reason), import only valid rows, duplicates flagged. Provide a downloadable sample template file.
10. **`/attempts`** — history list: date, mode (CBT/practice), config, score, accuracy; open result of each.

Also add a **passcode lock screen** checked in the root layout via `APP_PASSCODE` env var + a signed HTTP-only cookie after entry (single user → simple is fine, but not trivially bypassable client-side).

## 6. AI generation prompt contract (embed in the app)

The system prompt you send to the LLM per PDF-text chunk must demand:

- Produce exactly `N` **fresh** single-answer MCQs **grounded only in the provided text**. No questions whose answers can't be supported by that text.
- Each question: concise question text, **exactly 4 options**, exactly **one clearly correct** answer, 3 plausible but incorrect distractors (not obviously silly), one short explanation (1–3 sentences) citing/referencing what the source says.
- Preserve technical accuracy; if the text contains code, questions may include code snippets verbatim in fenced blocks.
- Output **strict JSON**: `{ "questions": [ { "question": string, "options": [4 strings], "correctIndex": 0-3, "explanation": string } ] }`.
- English only. Difficulty consistent with the requested mix.

Implementation notes:
- Chunk text by pages with a sliding window (~4,000 chars, ~300 overlap) to fit context; call per chunk for large PDFs.
- Validate every returned question with **zod**; drop/report malformed ones.
- Normalize question text (lowercase, strip whitespace/punctuation) and compare with existing bank to flag near-duplicates (simple similarity is enough — no embeddings required, but allowed).
- Guard: max tokens, request timeout, retry once on JSON-parse failure, friendly error UI, token/usage logged in `GenerationLog`.

## 7. CBT mock-test engine — exact rules

- Shuffle question order per attempt (seeded, record seed) and shuffle option order (record mapping so review shows what the user actually saw). Keep per-question option order stable within the attempt.
- A question counts as **attempted** only when an option is chosen. Unattempted = 0.
- Submit only via explicit action, time-out, or auto-save restore. Guard double-submit.
- Server-side grading exactly as section 2; store immutable result; a wrong answer ever is −0.25 regardless.
- Result screen and practice stats update question-level counters (`timesUsed`, `timesCorrect`).

## 8. Design & UX requirements

- Clean professional dashboard aesthetic (like a serious exam-prep tool), calm palette, good contrast; fully **responsive** (I'll use it on phone + laptop).
- Real-CBT feel for the mock: clear timer, palette, unambiguous selected option styling.
- Readable typography; markdown preview for question/explanation; code blocks monospace with subtle background.
- Loading skeletons, empty states ("Bank is empty — generate or import questions"), confirm dialogs on destructive actions.
- Every screen works without JS-only tricks breaking SEO isn't a concern (personal tool), but keep it a proper Next.js app, not an SPA hack.
- Show question count and answerable status in the bank, e.g. badge counts per subject on the dashboard.

## 9. Deliverables & quality bar (Definition of Done)

1. Repository builds with `npm run build` (type-safe, lint-clean), `prisma migrate dev`, `npm run seed`, and starts with `npm run dev`.
2. Seed script creates the **12 subjects** from section 2 with sensible topic lists **plus a starter bank of ~30 real, correct CS MCQs** (mix across subjects/difficulty, properly formatted with explanations) so the app is useful the moment it runs. At least a few questions must include code snippets.
3. **Prove the scoring math:** include a scripted/automated test (or clearly documented manual check) that, e.g., 60 correct + 20 wrong + 20 skipped must produce exactly `55.00/100`.
4. Mock CBT works end-to-end: configure → attempt (palette, timer, mark-review, keyboard) → auto/manual submit → result page with review.
5. Practice mode with instant feedback works; wrong answers feed the weak-questions view.
6. AI generation: uploading a sample text PDF → configure → returns reviewable draft questions saved to DB; errors surface cleanly if no API key.
7. CSV/JSON import validates and imports; template downloadable.
8. Full README: setup, env vars table (`DATABASE_URL`, `APP_PASSCODE`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`), seed, deploy-to-Vercel + Neon/Supabase steps, and a note that AI content must be manually verified.
9. `.env.example` committed; `.env` and secrets git-ignored; no key ever in client code.

## 10. Out of scope (do not build now)

- Multi-user auth, roles, teams, leaderboards, payments.
- Proctoring / anti-cheat / browser-lockdown.
- OCR for scanned PDFs (warn instead).
- Mobile apps, PWA installability, offline-full usage.
- Multi-select, image-option, or numeric-answer question types.

## 11. Build order (milestones)

1. Project scaffold, Prisma schema, seed script, README skeleton.
2. Question bank CRUD + editor with markdown preview.
3. Practice mode with instant feedback + weak list.
4. CBT mock engine (timer, palette, keyboard, auto-submit) + result/review + history.
5. Dashboard + analytics + attempts list.
6. CSV/Excel/JSON import with validation.
7. PDF upload → AI generation → review workflow.
8. Passcode gate, polish, full `next build` pass, deploy instructions.

## Fixed decisions (reply these verbatim if an agent asks)

- Single user, **no login**; add an `APP_PASSCODE` env gate because it's hosted publicly.
- Subjects: core Computer Science only (the 12 in section 2); no GK/aptitude section.
- Exam format to simulate: **100 Qs × 1 mark = 100 marks, 120 minutes, 4 options, +1 correct / −0.25 wrong / 0 unattempted**; these are the defaults but user can configure count/filters per test.
- Question sourcing: primary path = **AI-generate MCQs from uploaded PDFs inside the app** (my own OpenAI-compatible API key); keep manual add + CSV/JSON import as full first-class backups. Generated questions land as drafts for me to review/activate.
- Full feature set wanted: CBT mock + practice mode + explanations + attempt history + per-subject performance analytics.
- Hosted on the web (Vercel + Neon/Supabase Postgres).
