import LoginForm from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-background px-4 overflow-hidden">
      {/* Decorative Glow Background Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="z-10 flex flex-col items-center mb-8 space-y-2">
        <div className="flex items-center space-x-2">
          {/* Minimalist modern abstract Contour Logo */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Contour
          </span>
        </div>
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
          Agency Operations & Analytics
        </p>
      </div>

      {/* Login Form Card */}
      <div className="z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <LoginForm />
      </div>

      {/* Footer / Copyright */}
      <div className="absolute bottom-6 text-xs text-muted-foreground font-medium tracking-wide">
        &copy; {new Date().getFullYear()} Contour Platform. All rights reserved.
      </div>
    </main>
  );
}
