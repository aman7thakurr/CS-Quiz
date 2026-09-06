"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Database,
  Upload,
  Sparkles,
  History,
  Menu,
  X,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mock", label: "Mock CBT", icon: GraduationCap },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/bank", label: "Question Bank", icon: Database },
  { href: "/generate", label: "AI Generate", icon: Sparkles },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/attempts", label: "History", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide sidebar on exam interface
  if (pathname.match(/^\/mock\/[^/]+$/) && !pathname.endsWith("/result")) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-lg p-2 shadow-lg border border-[var(--color-border)]"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--color-bg-sidebar)] text-[var(--color-text-inverse)] z-50 transform transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">CBT Trainer</h1>
              <p className="text-xs text-blue-300/80">CS Exam Practice</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 hover:bg-white/10 rounded"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-blue-600/20 text-blue-400 shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-blue-400" : "text-slate-400"
                  }`}
                />
                {item.label}
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Exam info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Exam Format</p>
            <p>100 MCQs × 1 mark = 100 marks</p>
            <p>120 min • +1 / −0.25 / 0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
