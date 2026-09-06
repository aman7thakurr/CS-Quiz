import { Brain } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Passcode Required — CBT Trainer",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">CBT Trainer</h1>
          <p className="text-xs text-slate-500">
            Punjab Government Group B — Computer Programmer
          </p>
        </div>

        {/* Form */}
        <LoginForm redirectTo={redirectTo || "/"} />

        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            This personal practice portal is secured by your environment passcode (<code>APP_PASSCODE</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
