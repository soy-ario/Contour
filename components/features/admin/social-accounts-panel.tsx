"use client";

import * as React from "react";
import type { Platform } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/status-badge";
import ConnectSocialAccountModal from "@/components/features/admin/connect-social-account-modal";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import {
  Share2,
  RefreshCw,
  Unlink,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

interface SocialAccount {
  id: string;
  clientId: string;
  platform: Platform;
  accountId: string;
  accountName: string | null;
  status: string;
  lastSyncAt: string | Date | null;
  syncError: string | null;
}

interface SocialAccountsPanelProps {
  clientId: string;
  initialAccounts: SocialAccount[];
}

// Custom inline SVGs for social platforms since they are missing from lucide-react in this environment
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

export default function SocialAccountsPanel({
  clientId,
  initialAccounts,
}: SocialAccountsPanelProps) {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>(initialAccounts);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform | null>(null);
  const [actionPendingId, setActionPendingId] = React.useState<string | null>(null);
  const [actionType, setActionType] = React.useState<"sync" | "disconnect" | null>(null);
  const [prevInitialAccounts, setPrevInitialAccounts] = React.useState<SocialAccount[]>(initialAccounts);

  if (initialAccounts !== prevInitialAccounts) {
    setPrevInitialAccounts(initialAccounts);
    setAccounts(initialAccounts);
  }

  const platforms = [
    { name: "INSTAGRAM", label: "Instagram", icon: InstagramIcon, color: "text-pink-500" },
    { name: "FACEBOOK", label: "Facebook", icon: FacebookIcon, color: "text-blue-600" },
    { name: "TIKTOK", label: "TikTok", icon: Share2, color: "text-cyan-400" },
    { name: "LINKEDIN", label: "LinkedIn", icon: LinkedinIcon, color: "text-blue-500" },
    { name: "YOUTUBE", label: "YouTube", icon: YoutubeIcon, color: "text-red-500" },
    { name: "X", label: "X (Twitter)", icon: TwitterIcon, color: "text-zinc-200" },
  ];

  const handleConnectClick = (platformName: string) => {
    setSelectedPlatform(platformName as Platform);
    setIsModalOpen(true);
  };

  const handleDisconnect = async (accountId: string, platformLabel: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platformLabel}? All sync connections will be removed.`)) {
      return;
    }

    setActionType("disconnect");
    setActionPendingId(accountId);

    try {
      const response = await fetch(`/api/clients/${clientId}/social-accounts/${accountId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Successfully disconnected ${platformLabel}`);
        setAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
      } else {
        toast.error(result.error?.message || `Failed to disconnect ${platformLabel}`);
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setActionType(null);
      setActionPendingId(null);
    }
  };

  const handleSync = async (accountId: string, platformLabel: string) => {
    setActionType("sync");
    setActionPendingId(accountId);
    const toastId = toast.loading(`Triggering manual sync for ${platformLabel}...`);

    try {
      const response = await fetch(`/api/clients/${clientId}/social-accounts/${accountId}/sync`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Sync successfully queued (Sync Log: ${result.data.syncLogId})`, { id: toastId });
        // Optimistically update sync date in UI
        setAccounts((prev) =>
          prev.map((a) =>
            a.accountId === accountId ? { ...a, lastSyncAt: new Date().toISOString() } : a
          )
        );
      } else {
        toast.error(result.error?.message || `Failed to queue sync for ${platformLabel}`, { id: toastId });
      }
    } catch {
      toast.error("A network error occurred. Please try again.", { id: toastId });
    } finally {
      setActionType(null);
      setActionPendingId(null);
    }
  };

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/social-accounts`);
      const result = await response.json();
      if (response.ok && result.success) {
        setAccounts(result.data);
      }
    } catch {
      console.error("Failed to refresh social accounts list");
    }
  };

  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/40 py-4 px-6">
        <CardTitle className="text-base font-bold text-foreground">
          Social Media Integrations
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Connect brand accounts to pull analytics snapshots and manage content pipelines.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="divide-y divide-border/40">
          {platforms.map((p) => {
            const matched = accounts.find((a) => a.platform === p.name as Platform);
            const isConnected = !!matched;
            const PlatformIcon = p.icon;
            
            const isDisconnecting =
              isConnected && actionType === "disconnect" && actionPendingId === matched.accountId;
            const isSyncing =
              isConnected && actionType === "sync" && actionPendingId === matched.accountId;

            return (
              <div key={p.name} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0">
                {/* Platform Label, Icon, User details */}
                <div className="flex items-center space-x-3 min-w-0">
                  <PlatformIcon className={cn("w-6 h-6 shrink-0", p.color)} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground leading-snug">
                      {p.label}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {isConnected && matched.accountName ? `@${matched.accountName}` : "Disconnected"}
                    </span>
                  </div>
                </div>

                {/* Right side connection info and buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-x-6 shrink-0">
                  {/* Status & Sync Meta */}
                  <div className="flex flex-col items-start sm:items-end">
                    <StatusBadge status={isConnected ? "ACTIVE" : "INACTIVE"} size="sm" />
                    {isConnected && matched.lastSyncAt && (
                      <span className="text-[10px] text-zinc-500 mt-1">
                        Synced {formatDate(matched.lastSyncAt, "MMM dd, yyyy h:mm a")}
                      </span>
                    )}
                  </div>

                  {/* Operational Buttons */}
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSync(matched.accountId, p.label)}
                          disabled={actionType !== null}
                          className="h-8 text-xs font-semibold hover:bg-zinc-800 text-muted-foreground hover:text-foreground flex items-center space-x-1"
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden md:inline">Sync</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDisconnect(matched.accountId, p.label)}
                          disabled={actionType !== null}
                          className="h-8 text-xs font-semibold hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 flex items-center space-x-1"
                        >
                          {isDisconnecting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Unlink className="w-3.5 h-3.5" />
                          )}
                          <span>Disconnect</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnectClick(p.name)}
                        className="h-8 text-xs font-semibold bg-zinc-900 border border-border text-foreground hover:bg-zinc-800 flex items-center space-x-1"
                      >
                        <LinkIcon className="w-3.5 h-3.5 mr-1" />
                        <span>Connect</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <ConnectSocialAccountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        clientId={clientId}
        platform={selectedPlatform}
        onSuccess={refreshData}
      />
    </Card>
  );
}
