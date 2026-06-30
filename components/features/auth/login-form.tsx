"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await signIn.username({
        username: data.username,
        password: data.password,
        callbackURL: "/",
      });

      if (result.error) {
        setErrorMsg(result.error.message || "Invalid username or password");
        setIsLoading(false);
      } else {
        const user = result.data?.user;
        if (user) {
          const redirectPath = user.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard";
          router.push(redirectPath);
          router.refresh();
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Card */}
      <div className="bg-white border border-[#ECECF4] rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-bold text-[#1A1A2E] leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#6B6B80] mt-1.5">
            Sign in to access your Contr.studio dashboard
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <Alert variant="destructive" className="mb-5 border-rose-200 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <AlertDescription className="text-sm font-medium">{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-[13px] font-medium text-[#1A1A2E]">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B80]" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="h-12 w-full rounded-xl border-[1.5px] border-[#E6E8F0] bg-white pl-10 pr-4 text-[14px] text-[#1A1A2E] placeholder:text-[#6B6B80]/60 focus-visible:border-[#F2485A] focus-visible:ring-[3px] focus-visible:ring-[#F2485A]/20 transition-all"
                disabled={isLoading}
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-xs font-semibold text-rose-500">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-medium text-[#1A1A2E]">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B80]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border-[1.5px] border-[#E6E8F0] bg-white pl-10 pr-10 text-[14px] text-[#1A1A2E] placeholder:text-[#6B6B80]/60 focus-visible:border-[#F2485A] focus-visible:ring-[3px] focus-visible:ring-[#F2485A]/20 transition-all"
                disabled={isLoading}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B6B80] hover:text-[#1A1A2E] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-rose-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E6E8F0] text-[#F2485A] focus:ring-[#F2485A] focus:ring-offset-0 accent-[#F2485A]"
              />
              <span className="text-[13px] text-[#6B6B80]">Remember me</span>
            </label>
            <button
              type="button"
              className="text-[13px] text-[#6B6B80] hover:text-[#1A1A2E] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* CTA */}
          <Button
            type="submit"
            className="w-full h-12 rounded-[12px] bg-[#F2485A] hover:bg-[#D93D4E] active:bg-[#C13145] text-[#1A1A2E] text-[15px] font-semibold group transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
