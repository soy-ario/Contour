import LoginForm from "@/components/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-[45%] relative bg-[#0A1023] items-center justify-center overflow-hidden">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(197,241,53,0.03)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(17,24,39,1)_0%,transparent_60%)]" />

        {/* Decorative chart — bottom-left */}
        <div className="absolute bottom-0 left-0 w-full h-[240px] opacity-[0.12]">
          <svg
            viewBox="0 0 690 240"
            fill="none"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 220 Q50 200 100 210 Q150 220 200 180 Q225 160 250 170 Q290 185 320 140 Q340 115 360 120 Q390 130 420 90 Q440 70 460 75 Q490 85 510 50 Q530 30 550 35 Q580 45 600 20 Q620 5 640 10 Q660 20 680 0 L680 240 L0 240 Z"
              fill="url(#chartGrad)"
            />
            <path
              d="M0 220 Q50 200 100 210 Q150 220 200 180 Q225 160 250 170 Q290 185 320 140 Q340 115 360 120 Q390 130 420 90 Q440 70 460 75 Q490 85 510 50 Q530 30 550 35 Q580 45 600 20 Q620 5 640 10 Q660 20 680 0"
              stroke="#C5F135"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              fill="none"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C5F135" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#C5F135" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Soft glow behind logo */}
          <div className="absolute w-[120px] h-[120px] rounded-full bg-[#C5F135]/10 blur-[40px] -translate-y-4" />

          {/* Logo */}
          <div className="w-[64px] h-[64px] rounded-[16px] bg-[#C5F135] flex items-center justify-center shadow-lg shadow-[#C5F135]/20">
            <svg
              className="w-[32px] h-[32px] text-[#0A1023]"
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

          {/* Brand */}
          <h1 className="mt-6 text-[48px] font-bold text-white tracking-tight">
            Contour
          </h1>
          <p className="mt-3 text-[12px] font-medium text-white/40 tracking-[0.2em] uppercase">
            Agency Operations & Analytics
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center bg-[#F4F4FA] p-6">
        <LoginForm />
      </div>

      {/* Footer */}
      <p className="fixed bottom-6 text-[12px] text-[#6B6B80] left-0 right-0 text-center lg:left-[45%] lg:text-center">
        &copy; {new Date().getFullYear()} Contour Platform. All rights reserved.
      </p>
    </div>
  );
}
