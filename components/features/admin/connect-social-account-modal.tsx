"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Platform } from "@prisma/client";
import { toast } from "sonner";
import { Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface ConnectSocialAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  platform: Platform | null;
  onSuccess?: () => void;
}

const PLATFORM_NAMES: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X (Twitter)",
};

export default function ConnectSocialAccountModal({
  open,
  onOpenChange,
  clientId,
  platform,
  onSuccess,
}: ConnectSocialAccountModalProps) {
  const [connecting, setConnecting] = React.useState(false);
  const [showManual, setShowManual] = React.useState(false);

  const handleOAuthConnect = async () => {
    if (!platform) return;
    setConnecting(true);

    try {
      const res = await fetch(
        `/api/auth/connect/${platform.toLowerCase()}?clientId=${clientId}&role=admin`
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to initiate OAuth");
        setConnecting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Failed to initiate OAuth connection");
      setConnecting(false);
    }
  };

  const platformLabel = platform ? PLATFORM_NAMES[platform] ?? platform.toLowerCase() : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Connect {platformLabel}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Authorize Contour to access your {platformLabel} analytics data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <Button
            onClick={handleOAuthConnect}
            disabled={connecting || !platform}
            className="w-full h-12 bg-[#F2485A] text-white font-semibold hover:brightness-95 transition-all flex items-center justify-center gap-2"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            {connecting ? "Redirecting..." : `Continue with ${platformLabel}`}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-zinc-950 px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <button
            onClick={() => setShowManual(!showManual)}
            className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showManual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showManual ? "Hide manual entry" : "Admin: Connect with existing token"}
          </button>

          {showManual && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!platform) return;
                const form = e.currentTarget;
                const formData = new FormData(form);

                try {
                  const res = await fetch(`/api/clients/${clientId}/social-accounts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      platform,
                      accountId: formData.get("accountId"),
                      accountName: formData.get("accountName") || undefined,
                      accessToken: formData.get("accessToken"),
                      refreshToken: formData.get("refreshToken") || undefined,
                      tokenExpiresAt: formData.get("tokenExpiresAt")
                        ? new Date(formData.get("tokenExpiresAt") as string).toISOString()
                        : undefined,
                    }),
                  });

                  const result = await res.json();
                  if (res.ok && result.success) {
                    toast.success(`Connected ${platformLabel}`);
                    onOpenChange(false);
                    onSuccess?.();
                  } else {
                    toast.error(result.error?.message || "Failed to connect");
                  }
                } catch {
                  toast.error("Network error");
                }
              }}
              className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800"
            >
              <input
                name="accountId"
                placeholder="Platform Account ID"
                required
                className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-foreground"
              />
              <input
                name="accountName"
                placeholder="Account Name (optional)"
                className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-foreground"
              />
              <input
                name="accessToken"
                placeholder="Access Token"
                required
                className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-foreground"
              />
              <input
                name="refreshToken"
                placeholder="Refresh Token (optional)"
                className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-foreground"
              />
              <input
                name="tokenExpiresAt"
                type="datetime-local"
                className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-foreground"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-foreground text-xs font-semibold"
              >
                Connect
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
