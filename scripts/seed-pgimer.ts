import { PrismaClient, Difficulty, QuestionStatus } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

type SubjectSeed = {
  name: string;
  slug: string;
  order: number;
  topics: string[];
};

type QuestionSeed = {
  subjectSlug: string;
  topicName: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  source: string;
  sourceUrl: string;
  tags: string[];
  provenance: "PYQ" | "PYQ-derived" | "source-grounded" | "original";
};

const prisma = new PrismaClient();
const root = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  const filePath = path.join(root, relativePath);
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function main() {
  const subjects = await readJson<SubjectSeed[]>("data/pgimer/subjects.json");
  const questions = await readJson<QuestionSeed[]>("data/pgimer/questions-pgimer.json");

  console.log("\n🎯 Seeding PGIMER CP/047 content...\n");

  const subjectMap = new Map<string, string>();

  for (const subject of subjects) {
    const existing = await prisma.subject.findUnique({ where: { slug: subject.slug } });
    const saved = existing
      ? await prisma.subject.update({
          where: { id: existing.id },
          data: { name: subject.name, order: subject.order, isActive: true },
        })
      : await prisma.subject.create({
          data: {
            name: subject.name,
            slug: subject.slug,
            order: subject.order,
            isActive: true,
          },
        });

    subjectMap.set(subject.slug, saved.id);

    for (const topicName of subject.topics) {
      await prisma.topic.upsert({
        where: { name_subjectId: { name: topicName, subjectId: saved.id } },
        update: {},
        create: { name: topicName, subjectId: saved.id },
      });
    }
  }

  // The repository's old generic blueprint includes Python. It is not a default PGIMER target
  // and is deliberately disabled rather than silently deleting user data.
  await prisma.subject.updateMany({
    where: { slug: "python-programming" },
    data: { isActive: false },
  });

  let inserted = 0;
  let updated = 0;

  for (const question of questions) {
    const subjectId = subjectMap.get(question.subjectSlug);
    if (!subjectId) throw new Error(`Unknown subject slug: ${question.subjectSlug}`);

    const topic = await prisma.topic.findUnique({
      where: { name_subjectId: { name: question.topicName, subjectId } },
    });
    if (!topic) throw new Error(`Unknown topic: ${question.subjectSlug}/${question.topicName}`);

    if (question.options.length !== 4) {
      throw new Error(`Question must have 4 options: ${question.text}`);
    }
    if (question.correctIndex < 0 || question.correctIndex > 3) {
      throw new Error(`Invalid correctIndex: ${question.text}`);
    }

    const source = `${question.source} | ${question.provenance} | ${question.sourceUrl}`;
    const existing = await prisma.question.findFirst({
      where: { text: question.text },
      select: { id: true },
    });

    const data = {
      text: question.text,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      subjectId,
      topicId: topic.id,
      difficulty: Difficulty[question.difficulty.toUpperCase() as keyof typeof Difficulty],
      status: QuestionStatus.ACTIVE,
      source,
      tags: [...question.tags, question.provenance],
    };

    if (existing) {
      await prisma.question.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.question.create({ data });
      inserted++;
    }
  }

  console.log(`✓ Subjects enabled: ${subjects.length}`);
  console.log(`✓ PGIMER questions inserted: ${inserted}`);
  console.log(`✓ PGIMER questions refreshed: ${updated}`);
  console.log("✓ Python subject disabled for PGIMER mode");
  console.log("\n✅ PGIMER content seed complete.\n");
}

main()
  .catch((error) => {
    console.error("PGIMER seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
