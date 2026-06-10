"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Platform } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ConnectSocialAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  platform: Platform | null;
  onSuccess?: () => void;
}

interface SocialAccountFormValues {
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  scope: string;
}

export default function ConnectSocialAccountModal({
  open,
  onOpenChange,
  clientId,
  platform,
  onSuccess,
}: ConnectSocialAccountModalProps) {
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SocialAccountFormValues>({
    defaultValues: {
      accountId: "",
      accountName: "",
      accessToken: "",
      refreshToken: "",
      tokenExpiresAt: "",
      scope: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setServerError(null);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: SocialAccountFormValues) => {
    if (!platform) return;
    setServerError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/social-accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            platform,
            accountId: data.accountId,
            accountName: data.accountName || undefined,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || undefined,
            tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt).toISOString() : undefined,
            scope: data.scope || undefined,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success(`Successfully connected ${platform.toLowerCase()}`);
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          setServerError(result.error?.message || "Failed to connect social account");
        }
      } catch (error) {
        setServerError("A network error occurred. Please try again.");
      }
    });
  };

  const getPlatformLabel = (p: Platform | null) => {
    if (!p) return "";
    return p.charAt(0) + p.slice(1).toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Connect {getPlatformLabel(platform)} Account
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect via manual API credential inputs. In production, this will trigger the platform OAuth consent flow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-sm text-red-400">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="accountId">Native Account / Page ID *</Label>
              <Input
                id="accountId"
                {...register("accountId", { required: "Native Account ID is required" })}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="e.g. 17841400008460056"
              />
              {errors.accountId && (
                <p className="text-xs text-rose-500">{errors.accountId.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="accountName">Display Username / Handle</Label>
              <Input
                id="accountName"
                {...register("accountName")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="e.g. acme_co"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              <Input
                id="accessToken"
                type="password"
                {...register("accessToken", { required: "Access token is required" })}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="Plaintext OAuth access token"
              />
              {errors.accessToken && (
                <p className="text-xs text-rose-500">{errors.accessToken.message}</p>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="refreshToken">Refresh Token (Optional)</Label>
              <Input
                id="refreshToken"
                type="password"
                {...register("refreshToken")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="Long-lived refresh token"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tokenExpiresAt">Expiration Date</Label>
              <Input
                id="tokenExpiresAt"
                type="datetime-local"
                {...register("tokenExpiresAt")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scope">Scopes</Label>
              <Input
                id="scope"
                {...register("scope")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="e.g. instagram_basic,instagram_manage_insights"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-foreground text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
