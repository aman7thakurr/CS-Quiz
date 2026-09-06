import { prisma } from "@/lib/db";
import { GenerateWizard } from "./generate-wizard";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  type SubjectItem = Awaited<ReturnType<typeof prisma.subject.findMany<{
    include: {
      topics: { orderBy: { name: "asc" } };
    };
  }>>>[number];

  let subjects: SubjectItem[] = [];
  let dbError: string | null = null;

  try {
    subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        topics: { orderBy: { name: "asc" } },
      },
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
        <h1 className="text-2xl font-bold text-slate-900">AI Question Generator</h1>
        <p className="text-slate-500 mt-1">
          Upload subject notes or previous year question PDFs to automatically generate grounded MCQs using AI
        </p>
      </div>

      <GenerateWizard
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
        }))}
      />
    </div>
  );
}
