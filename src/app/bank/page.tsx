import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus, Search, Filter } from "lucide-react";
import { QuestionBankTable } from "./question-bank-table";

export const dynamic = "force-dynamic";

interface BankPageProps {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    difficulty?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function BankPage({ searchParams }: BankPageProps) {
  const params = await searchParams;
  const search = params.q || "";
  const subjectFilter = params.subject || "";
  const difficultyFilter = params.difficulty || "";
  const statusFilter = params.status || "";
  const page = parseInt(params.page || "1", 10);
  const perPage = 20;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { text: { contains: search, mode: "insensitive" } },
      { explanation: { contains: search, mode: "insensitive" } },
      { source: { contains: search, mode: "insensitive" } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  if (subjectFilter) {
    where.subjectId = subjectFilter;
  }

  if (difficultyFilter) {
    where.difficulty = difficultyFilter;
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  type QuestionItem = Awaited<ReturnType<typeof prisma.question.findMany<{
    include: {
      subject: { select: { name: true; slug: true } };
      topic: { select: { name: true } };
    };
  }>>>[number];

  let questions: QuestionItem[] = [];
  let totalCount = 0;
  let subjects: { id: string; name: string }[] = [];
  let dbError: string | null = null;

  try {
    const [q, tc, s] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          subject: { select: { name: true, slug: true } },
          topic: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.question.count({ where }),
      prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    questions = q;
    totalCount = tc;
    subjects = s;
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6 animate-fadeIn">
      {dbError && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900">
          <p className="font-bold">⚠️ Database Initialization Notice</p>
          <p className="mt-0.5 text-amber-700">Database tables are being initialized ({dbError}).</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
          <p className="text-slate-500 mt-1">
            {totalCount} question{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/bank/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
        <form className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Search questions, explanations, tags..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subject filter */}
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Subject
            </label>
            <select
              name="subject"
              defaultValue={subjectFilter}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty filter */}
          <div className="min-w-[120px]">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Difficulty
            </label>
            <select
              name="difficulty"
              defaultValue={difficultyFilter}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="min-w-[120px]">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Status
            </label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </form>
      </div>

      {/* Question table */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center shadow-sm">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">
            {search || subjectFilter || difficultyFilter || statusFilter
              ? "No questions match your filters"
              : "Question bank is empty"}
          </h3>
          <p className="text-slate-400 mt-2 max-w-md mx-auto">
            {search || subjectFilter || difficultyFilter || statusFilter
              ? "Try adjusting your search or filters."
              : "Generate questions from PDFs, import from CSV/JSON, or add them manually."}
          </p>
          {!search && !subjectFilter && !difficultyFilter && !statusFilter && (
            <div className="flex gap-3 justify-center mt-6">
              <Link
                href="/generate"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                AI Generate
              </Link>
              <Link
                href="/import"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Import
              </Link>
              <Link
                href="/bank/new"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Add Manually
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <QuestionBankTable questions={questions} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * perPage + 1}–
                {Math.min(page * perPage, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/bank?page=${page - 1}${search ? `&q=${search}` : ""}${subjectFilter ? `&subject=${subjectFilter}` : ""}${difficultyFilter ? `&difficulty=${difficultyFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/bank?page=${page + 1}${search ? `&q=${search}` : ""}${subjectFilter ? `&subject=${subjectFilter}` : ""}${difficultyFilter ? `&difficulty=${difficultyFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`}
                    className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-slate-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
