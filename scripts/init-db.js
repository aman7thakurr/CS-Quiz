/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");

const dbUrl = process.env.DATABASE_URL || "";

if (dbUrl && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
  console.log("\n========================================================");
  console.log("REMOTE POSTGRES DATABASE DETECTED — AUTOMATIC SETUP");
  console.log("========================================================");

  try {
    console.log("1. Pushing Prisma schema to remote PostgreSQL...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("✓ All PostgreSQL tables created successfully!");

    console.log("2. Seeding 12 syllabus subjects and starter MCQs...");
    execSync("npx ts-node prisma/seed.ts", { stdio: "inherit" });
    console.log("✓ Seed completed successfully!");
  } catch (err) {
    console.warn("⚠️ Notice: Database auto-setup had a warning:", err.message);
    console.warn("Continuing with Next.js build...");
  }
} else {
  console.log("Local/placeholder database detected. Skipping build-time remote DB push.");
}
