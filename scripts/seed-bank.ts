import { PrismaClient, Difficulty, QuestionStatus } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import Papa from "papaparse";

const prisma = new PrismaClient();
const root = process.cwd();

interface CsvRow {
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
}

interface SubjectSeed {
  name: string;
  slug: string;
  order: number;
  topics: string[];
}

const subjectAliasMap: Record<string, string> = {
  "programming in c": "Programming in C",
  "data structures": "Data Structures",
  "data structures & algorithms": "Data Structures",
  "algorithms & complexity": "Algorithms & Complexity",
  "algorithms": "Algorithms & Complexity",
  "dbms & sql": "DBMS & SQL",
  "database management systems (dbms) & sql": "DBMS & SQL",
  "operating systems": "Operating Systems",
  "operating system": "Operating Systems",
  "computer networks": "Computer Networks",
  "computer network": "Computer Networks",
  "computer networks & network security": "Computer Networks",
  "c++ / oop": "C++ / OOP",
  "programming in c++ (oop)": "C++ / OOP",
  "cpp": "C++ / OOP",
  "java": "Java Programming",
  "java programming": "Java Programming",
  "python programming": "Python Programming",
  "python": "Python Programming",
  "computer organization & architecture": "Computer Organization & Architecture",
  "computer organization & architecture + digital logic": "Computer Organization & Architecture",
  "computer organization": "Computer Organization & Architecture",
  "digital logic": "Digital Logic",
  "software engineering": "Software Engineering",
  "system analysis & design": "System Analysis & Design",
  "compiler & system software": "Compiler & System Software",
  "compiler and system software": "Compiler & System Software",
  "linux/unix & troubleshooting": "Linux / Unix & Troubleshooting",
  "linux / unix & troubleshooting": "Linux / Unix & Troubleshooting",
  "linux/unix and troubleshooting": "Linux / Unix & Troubleshooting",
  "web technologies & internet / php": "Web Technologies & Internet / PHP",
  "web technologies & internet fundamentals": "Web Technologies & Internet / PHP",
  "web technologies": "Web Technologies & Internet / PHP",
  "discrete mathematics for cs": "Discrete Mathematics for CS",
  "computer security": "Computer Security",
  "storage / raid / data organization": "Storage / RAID / Data Organization",
  "storage/raid/data organization": "Storage / RAID / Data Organization",
  "computer fundamentals & systems": "Computer Fundamentals & Systems",
  "computer fundamentals & computer awareness": "Computer Fundamentals & Systems",
};

function findCsvFiles(dirPath: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findCsvFiles(full));
    } else if (entry.name.endsWith(".csv")) {
      results.push(full);
    }
  }
  return results;
}

function parseDifficulty(raw?: string): Difficulty {
  const d = (raw || "").trim().toUpperCase();
  if (d === "EASY") return Difficulty.EASY;
  if (d === "HARD") return Difficulty.HARD;
  return Difficulty.MEDIUM;
}

function parseCorrectIndex(letter?: string): number {
  const l = (letter || "").trim().toUpperCase();
  switch (l) {
    case "A": return 0;
    case "B": return 1;
    case "C": return 2;
    case "D": return 3;
    default: return -1;
  }
}

async function main() {
  console.log("\n========================================================");
  console.log("📚 SEEDING COMPREHENSIVE QUESTION BANK (14,000+ MCQS)");
  console.log("========================================================\n");

  // 1. Load subjects from data/pgimer/subjects.json
  const subjectsPath = path.join(root, "data/pgimer/subjects.json");
  const subjectList: SubjectSeed[] = JSON.parse(fs.readFileSync(subjectsPath, "utf8"));

  console.log(`1. Initializing ${subjectList.length} syllabus subjects...`);

  // Handle migration from old combined slugs if present
  try {
    const oldDsa = await prisma.subject.findUnique({ where: { slug: "data-structures-algorithms" } });
    if (oldDsa) {
      await prisma.subject.update({
        where: { id: oldDsa.id },
        data: { name: "Data Structures", slug: "data-structures" },
      });
    }
  } catch {
    // ignore if not present
  }

  const subjectMap = new Map<string, string>(); // name -> id

  for (const sub of subjectList) {
    // Upsert subject by slug or name
    let existing = await prisma.subject.findUnique({ where: { slug: sub.slug } });
    if (!existing) {
      existing = await prisma.subject.findUnique({ where: { name: sub.name } });
    }

    const saved = existing
      ? await prisma.subject.update({
          where: { id: existing.id },
          data: { name: sub.name, slug: sub.slug, order: sub.order, isActive: true },
        })
      : await prisma.subject.create({
          data: {
            name: sub.name,
            slug: sub.slug,
            order: sub.order,
            isActive: true,
          },
        });

    subjectMap.set(sub.name, saved.id);

    // Upsert topics for this subject in batch
    const existingTopics = await prisma.topic.findMany({
      where: { subjectId: saved.id },
      select: { name: true },
    });
    const existingTopicNames = new Set(existingTopics.map((t) => t.name.toLowerCase()));

    const newTopics = sub.topics
      .filter((t) => !existingTopicNames.has(t.toLowerCase()))
      .map((t) => ({ name: t, subjectId: saved.id }));

    if (newTopics.length > 0) {
      await prisma.topic.createMany({
        data: newTopics,
        skipDuplicates: true,
      });
    }
  }

  console.log(`✓ All ${subjectMap.size} subjects and topic structures initialized.`);

  // 2. Build topic lookup map: [subjectId + "::" + topicName.toLowerCase()] -> topicId
  const allDbTopics = await prisma.topic.findMany({
    select: { id: true, name: true, subjectId: true },
  });
  const topicLookup = new Map<string, string>();
  for (const t of allDbTopics) {
    topicLookup.set(`${t.subjectId}::${t.name.toLowerCase().trim()}`, t.id);
  }

  // 3. Find and read all CSV files
  const csvFiles = [
    ...findCsvFiles(path.join(root, "question-bank/csv")),
    ...findCsvFiles(path.join(root, "csv")),
  ];
  console.log(`\n2. Reading ${csvFiles.length} CSV question bank files...`);

  // 4. Fetch existing questions to guarantee idempotency and avoid duplicates
  const existingQuestions = await prisma.question.findMany({
    select: { text: true },
  });
  const seenQuestionTexts = new Set<string>();
  for (const eq of existingQuestions) {
    seenQuestionTexts.add(eq.text.toLowerCase().replace(/\s+/g, " ").trim());
  }
  console.log(`✓ Found ${existingQuestions.length} existing questions already in database.`);

  const questionsToInsert: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    subjectId: string;
    topicId: string | null;
    difficulty: Difficulty;
    status: QuestionStatus;
    source: string;
    tags: string[];
  }> = [];

  let skippedInvalid = 0;
  let skippedDuplicates = 0;
  const perSubjectCount: Record<string, number> = {};

  for (const filePath of csvFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const parsed = Papa.parse<CsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of parsed.data) {
      const qText = (row.question || "").trim();
      if (!qText) {
        skippedInvalid++;
        continue;
      }

      const optA = (row.option_a || "").trim();
      const optB = (row.option_b || "").trim();
      const optC = (row.option_c || "").trim();
      const optD = (row.option_d || "").trim();

      if (!optA || !optB || !optC || !optD) {
        skippedInvalid++;
        continue;
      }

      const correctIndex = parseCorrectIndex(row.correct_letter);
      if (correctIndex < 0) {
        skippedInvalid++;
        continue;
      }

      const normalizedText = qText.toLowerCase().replace(/\s+/g, " ");
      if (seenQuestionTexts.has(normalizedText)) {
        skippedDuplicates++;
        continue;
      }
      seenQuestionTexts.add(normalizedText);

      const rawSubj = (row.subject || "").trim().toLowerCase();
      const mappedSubjName = subjectAliasMap[rawSubj] || "Computer Fundamentals & Systems";
      const subjectId = subjectMap.get(mappedSubjName) || subjectMap.get("Computer Fundamentals & Systems")!;

      const rawTopic = (row.topic || "General").trim();
      let topicId = topicLookup.get(`${subjectId}::${rawTopic.toLowerCase()}`) || null;

      if (!topicId) {
        // Find default or first topic for subject
        const fallbackTopic = allDbTopics.find((t) => t.subjectId === subjectId);
        topicId = fallbackTopic ? fallbackTopic.id : null;
      }

      const tags = (row.tags || "")
        .split(/[;,]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (!tags.includes("question-bank")) {
        tags.push("question-bank");
      }

      const source = (row.source || "PGIMER CP-047 Practice Bank").trim();

      questionsToInsert.push({
        text: qText,
        options: [optA, optB, optC, optD],
        correctIndex,
        explanation: (row.explanation || "").trim(),
        subjectId,
        topicId,
        difficulty: parseDifficulty(row.difficulty),
        status: QuestionStatus.ACTIVE,
        source,
        tags,
      });

      perSubjectCount[mappedSubjName] = (perSubjectCount[mappedSubjName] || 0) + 1;
    }
  }

  // Also include questions from data/pgimer/questions-pgimer.json and questions-deep.json if not present
  for (const jsonFile of ["questions-pgimer.json", "questions-deep.json"]) {
    const jsonPath = path.join(root, "data/pgimer", jsonFile);
    if (fs.existsSync(jsonPath)) {
      try {
        const jsonQs = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        for (const jq of jsonQs) {
          const qText = (jq.text || "").trim();
          if (!qText || !Array.isArray(jq.options) || jq.options.length !== 4) continue;
          const normalizedText = qText.toLowerCase().replace(/\s+/g, " ");
          if (seenQuestionTexts.has(normalizedText)) continue;
          seenQuestionTexts.add(normalizedText);

          const subject = subjectList.find((s) => s.slug === jq.subjectSlug);
          const subjName = subject ? subject.name : "Computer Fundamentals & Systems";
          const subjectId = subjectMap.get(subjName) || subjectMap.get("Computer Fundamentals & Systems")!;
          const topicId = topicLookup.get(`${subjectId}::${(jq.topicName || "").toLowerCase().trim()}`) || null;

          questionsToInsert.push({
            text: qText,
            options: jq.options,
            correctIndex: jq.correctIndex ?? 0,
            explanation: (jq.explanation || "").trim(),
            subjectId,
            topicId,
            difficulty: parseDifficulty(jq.difficulty),
            status: QuestionStatus.ACTIVE,
            source: jq.sourceUrl ? `${jq.source} | ${jq.provenance} | ${jq.sourceUrl}` : `${jq.source} | ${jq.provenance}`,
            tags: Array.isArray(jq.tags) ? jq.tags : ["pgimer-curated"],
          });

          perSubjectCount[subjName] = (perSubjectCount[subjName] || 0) + 1;
        }
      } catch (err) {
        console.warn(`Note: Could not parse ${jsonFile}:`, err);
      }
    }
  }

  console.log(`\n3. Prepared ${questionsToInsert.length} new questions to insert.`);
  console.log(`   (Skipped ${skippedDuplicates} duplicate questions, ${skippedInvalid} invalid rows)`);

  // 5. Batch insert in chunks of 500
  const CHUNK_SIZE = 500;
  let totalInserted = 0;

  for (let i = 0; i < questionsToInsert.length; i += CHUNK_SIZE) {
    const chunk = questionsToInsert.slice(i, i + CHUNK_SIZE);
    await prisma.question.createMany({
      data: chunk,
    });
    totalInserted += chunk.length;
    process.stdout.write(`\r   → Inserted ${totalInserted} / ${questionsToInsert.length} questions...`);
  }

  console.log(`\n\n✓ Batch insert completed successfully! Total new questions added: ${totalInserted}`);

  // Summary per subject
  console.log("\n========================================================");
  console.log("QUESTION BANK SUBJECT SUMMARY");
  console.log("========================================================");
  for (const [subj, count] of Object.entries(perSubjectCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  • ${subj.padEnd(42)} : +${count} questions`);
  }
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
