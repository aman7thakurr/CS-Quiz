# CBT Trainer — PGIMER Computer Programmer (CP/047) CBT Preparation

**CBT Trainer** is a high-performance, personal exam-practice and simulation platform designed specifically for the **PGIMER Satellite Centre, Sangrur — Computer Programmer, Post Code CP/047, Group B** recruitment Computer Based Test (CBT).

The application replicates the official exam environment, implements the exact negative marking mathematics (+1 / −0.25 / 0), provides instant-feedback practice modes, and includes an AI-powered pipeline to generate grounded Multiple Choice Questions (MCQs) from previous year question papers (PYQs) and technical syllabi.

---

## 📋 Exam Blueprint & Exact Scoring Formula

The application adheres strictly to the official PGIMER CP/047 examination pattern:

- **Post:** Computer Programmer, Post Code CP/047, Group B, PGI Satellite Centre, Sangrur
- **Total Questions:** 100 Objective Type Single-Answer MCQs (4 options per question: A, B, C, D)
- **Total Marks:** 100 Marks (1 mark per question)
- **Exam Duration:** 100 Minutes
- **Negative Marking Scheme:**
  - **Correct Answer:** `+1.00`
  - **Incorrect Answer:** `−0.25`
  - **Unattempted Question:** `0.00` (no penalty)
  - **Formula:** `Score = (Correct × 1.00) − (Wrong × 0.25)`

### Working PGIMER Preparation Domains
- **S-Tier (Core):** Programming in C, Data Structures, Algorithms & Complexity, DBMS & SQL, Operating Systems, Computer Networks
- **A-Tier (Strong):** C++ / OOP, Java Programming, Computer Organization & Architecture, Digital Logic / Number Systems, Software Engineering & System Analysis, Compiler / System Software
- **B-Tier (Selective):** Linux / Unix / Troubleshooting, Web Technologies / Internet, Discrete Mathematics for CS, Computer Security, Files / RAID / Storage Organization

---

## 🚀 Key Features

### 1. Real-CBT Mock Engine (`/mock` & `/mock/[attemptId]`)
- **Full Exam Simulation:** Large sticky countdown timer with automatic submission on timeout.
- **Interactive Question Palette:** Standard CBT numbered grid with real-time status indicators:
  - ⚪ Unvisited / Not attempted
  - 🟢 Answered
  - 🟣 Marked for Review
  - 🟣🟢 Answered & Marked for Review
- **Keyboard Shortcuts:** `1`-`4` select options, `N` next, `P` previous, `M` mark for review, `S` submit.
- **Anti-Loss Resilience:** Progress auto-saves on every click to PostgreSQL and browser state; refresh resumes the exact attempt.
- **Server-Side Grading:** Never trusts client scores. Answer keys and shuffle mapping are securely re-evaluated server-side.
- **Detailed Result & Analytics (`/mock/[attemptId]/result`):**
  - Displays explicit mathematical derivation (e.g., `60 × +1 − 20 × 0.25 = 55.00 / 100`).
  - Question-by-question review with user's selection vs. correct answer and detailed explanations.
  - Filter by All, Wrong Only, or Marked for Review.

### 2. Practice Mode with Instant Feedback (`/practice`)
- Select specific subjects, topics, difficulty, and question count.
- **Instant Explanations:** Real-time feedback after selecting an option without waiting for test completion.
- **Weak Areas Tracking:** Target questions where historical accuracy is below 50%.

### 3. AI Question Generation from PDFs (`/generate`)
- **3-Stage Wizard:**
  1. **Upload:** Drag & drop syllabus PDFs or PYQ papers; server extracts text and checks for scanned/image-only PDFs.
  2. **Configure:** Select subject, topic, difficulty mix, question count, and source citation.
  3. **Batch Review:** Review AI-generated MCQs as editable cards. Toggle correct answers, edit markdown/code snippets, and inspect duplicate detection flags before committing as Draft or Active.
- **Prompt Contract:** Powered by an OpenAI-compatible adapter (`gpt-4o-mini` default) enforcing strict JSON output grounded only in the provided text.

### 4. Bulk Question Import (`/import`)
- Upload CSV, Excel (`.xlsx`, `.xls`), or JSON question banks.
- Built-in validation checks subject matching, 4 options, valid correct letter, and detects near-duplicates against existing questions.
- Downloadable ready-to-use CSV and JSON template files.

### 5. Centralized Question Bank Manager (`/bank`)
- Filter, search, and sort across all subjects, topics, difficulties, and statuses (`ACTIVE`, `DRAFT`, `ARCHIVED`).
- Rich question editor (`/bank/new` and `/bank/edit/[id]`) with live markdown and syntax-highlighted code preview.

### 6. Security & Passcode Gate (`/login`)
- Protected by a simple, single-user `APP_PASSCODE` environment variable.
- Uses SHA-256 HMAC tokens stored in HTTP-only session cookies via Next.js Proxy/Middleware.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + React 19
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Professional exam-grade responsive interface with monospace code rendering)
- **Database & ORM:** PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **AI Integration:** [OpenAI SDK](https://github.com/openai/openai-node) (compatible with OpenAI, Azure, DeepSeek, or local Ollama endpoints)
- **PDF Processing:** `pdf-parse` (Node.js runtime server-side extraction)
- **File Parsing:** `papaparse` (CSV) & `xlsx` (Excel)
- **Validation:** Zod schemas

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description | Default |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URI (Neon, Supabase, or local Postgres) | `postgresql://...` |
| `APP_PASSCODE` | Optional | Access passcode for public deployment gate | `""` (Open access if empty) |
| `AUTH_SECRET` | Optional | Secret key used to sign session cookies | `cbt-trainer-exam-secret` |
| `OPENAI_API_KEY` | Optional | OpenAI API key for PDF MCQ generation | `""` (Required only for `/generate`) |
| `OPENAI_BASE_URL` | Optional | Base URL for OpenAI-compatible endpoint | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Optional | Model identifier to use | `gpt-4o-mini` |

---

## 💻 Local Setup & Development

### 1. Prerequisites
- Node.js `18.18+` or `20+`
- PostgreSQL database (Local or free cloud database from [Neon](https://neon.tech) / [Supabase](https://supabase.com))

### 2. Installation
```bash
# Clone the repository and install dependencies
git clone https://github.com/aman7thakurr/CS-Quiz.git
cd quiz
npm install
```

### 3. Database Migration & Seed
```bash
# Push schema to your database
npx prisma db push

# Seed the 12 subjects and ~30 starter CS MCQs with code snippets
npm run seed
```

### 4. Run Automated Scoring Proof Test
Validate that the scoring engine produces exact results (e.g. `60 correct + 20 wrong + 20 skipped = 55.00/100`):
```bash
npm run test:scoring
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Guide (Vercel + Neon / Supabase)

### Deploy to Vercel in 4 Steps:

1. **Create Database:**
   - Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free PostgreSQL project.
   - Copy the connection string (ensure `?sslmode=require` is appended).

2. **Push Code to GitHub:**
   - Commit your code and push to your private or public GitHub repository.

3. **Import into Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/) → **Add New Project** → Select your repository.
   - Under **Environment Variables**, add:
     - `DATABASE_URL` = Your Neon/Supabase PostgreSQL connection string
     - `APP_PASSCODE` = Your secret access passcode (protects your web app)
     - `OPENAI_API_KEY` = Your OpenAI API key (for PDF generation)
     - `OPENAI_MODEL` = `gpt-4o-mini`

4. **Initialize Production Database:**
   - In your local terminal with the production `DATABASE_URL` set, or via Vercel CLI:
     ```bash
     npx prisma db push
     npm run seed
     ```
   - Your live CBT Trainer is now ready!

---

## ⚠️ AI Content Verification Notice

> **Important:** While the AI generator uses strict temperature settings and grounds questions strictly in the provided text, LLMs may occasionally generate inaccurate technical options or explanations. Always review questions in the **Stage 3 Review Batch** before setting their status to `ACTIVE`.

---

## 📄 License
This project is open-source and built for personal exam preparation and competitive CBT practice.
