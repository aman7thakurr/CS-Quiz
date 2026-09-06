import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/nav/sidebar";

export const metadata: Metadata = {
  title: "PGIMER CP/047 CBT Trainer — Computer Programmer Preparation",
  description:
    "Personal CBT mock-test platform and study reference for PGIMER Satellite Centre Sangrur Computer Programmer (CP/047) Group B recruitment. 100 single-answer MCQs, 100 minutes, syllabus-targeted technical practice, and instant teaching explanations.",
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
