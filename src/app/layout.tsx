import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/nav/sidebar";

export const metadata: Metadata = {
  title: "CBT Trainer — Computer Programmer Exam Practice",
  description:
    "Personal CBT mock-test trainer for Punjab Government Group B Computer Programmer recruitment exam. Practice with AI-generated MCQs, full mock tests, and detailed analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-bg)]">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64 min-h-screen">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
