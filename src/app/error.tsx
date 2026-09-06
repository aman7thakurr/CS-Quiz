"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Database } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary caught:", error);
  }, [error]);

  const isDatabaseError =
    error.message?.includes("DATABASE_URL") ||
    error.message?.includes("prisma") ||
    error.message?.includes("Can't reach database") ||
    error.message?.includes("connect");

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-lg text-center space-y-5">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isDatabaseError ? "Database Connection Required" : "Something Went Wrong"}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {isDatabaseError
              ? "The application cannot connect to the database. If this is deployed on Vercel, please ensure DATABASE_URL is added to your Vercel Environment Variables and the database schema is pushed."
              : error.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>

        {isDatabaseError && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left text-[11px] font-mono text-slate-700 space-y-1">
            <p className="font-bold text-slate-900 font-sans flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-600" /> Quick Fix Steps:
            </p>
            <p>1. In Vercel Project Settings → Environment Variables:</p>
            <p className="pl-3 text-blue-600">Add DATABASE_URL = your_postgres_url</p>
            <p>2. In your local terminal, push the schema:</p>
            <p className="pl-3 text-slate-800">npx prisma db push && npm run seed</p>
          </div>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
