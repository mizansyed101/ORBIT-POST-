import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-mint/5 blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <span className="text-xl font-bold text-cream tracking-tight">
              Orbit<span className="text-indigo">Post</span>
            </span>
          </div>
          <p className="text-sm text-cream-muted">AI-powered social media automation</p>
        </div>

        {/* Auth Card */}
        <div className="bg-obsidian-raised border border-obsidian-border rounded-2xl p-8 shadow-2xl shadow-black/40 animate-slide-in-up">
          {children}
        </div>
      </div>
    </div>
  );
}
