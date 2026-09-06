import { prisma } from "@/lib/db";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { name: true },
  });

  return (
    <div className="space-y-6 animate-fadeIn">
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
