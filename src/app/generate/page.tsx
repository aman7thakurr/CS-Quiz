import { prisma } from "@/lib/db";
import { GenerateWizard } from "./generate-wizard";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      topics: { orderBy: { name: "asc" } },
    },
  });

  return (
    <div className="space-y-6 animate-fadeIn">
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
