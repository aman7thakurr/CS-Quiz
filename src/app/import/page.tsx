import { prisma } from "@/lib/db";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  let subjects: { name: string }[] = [];
  let dbError: string | null = null;

  try {
    subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { name: true },
    });
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900">
          <p className="font-bold">⚠️ Database Initialization Notice</p>
          <p className="mt-0.5 text-amber-700">Database tables are being initialized ({dbError}).</p>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import Questions</h1>
        <p className="text-slate-500 mt-1">
          Upload bulk questions via CSV, Excel, or JSON with automatic validation, schema checking, and duplicate detection
        </p>
      </div>

      <ImportClient validSubjects={subjects.map((s) => s.name)} />
    </div>
  );
}
