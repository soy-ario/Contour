"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      // Sign in using Better Auth's signIn.email
      // The username plugin configured on the server allows us to pass
      // the username directly in the email field.
      const result = await signIn.email({
        email: data.username,
        password: data.password,
        callbackURL: "/", // Fallback callback URL
      });

      if (result.error) {
        setErrorMsg(result.error.message || "Invalid username or password");
        setIsLoading(false);
      } else {
        // Successful login: the session was created and cookies set.
        // Better Auth client handles redirection or we can redirect
        // explicitly based on the role on the user object returned.
        const user = result.data?.user;
        if (user) {
          const redirectPath = user.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard";
          router.push(redirectPath);
          router.refresh();
        } else {
          // If user object not returned immediately, redirecting to "/"
          // which the middleware will intercept and route to the correct dashboard.
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
    <Card className="w-full max-w-md border-border bg-card shadow-2xl backdrop-blur-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-center text-foreground">
          Sign In
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Enter your credentials to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMsg && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-950/20 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm font-medium">{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="border-input bg-background text-foreground focus-visible:ring-primary focus-visible:ring-1"
              disabled={isLoading}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs font-semibold text-red-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="border-input bg-background text-foreground focus-visible:ring-primary focus-visible:ring-1"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-semibold text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
