"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  updateClientAction,
  createClientUserAction,
  resetClientPasswordAction,
  deleteClientAction,
  updateClientStatusAction,
} from "@/lib/actions/client.actions";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/shared/social-icons";
import {
  Globe,
  Shield,
  CreditCard,
  UserCheck,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Send,
  Trash2,
  Archive,
  PauseCircle,
  Link,
  RefreshCw,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import type { Platform, Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";

type ClientSettings = Prisma.ClientGetPayload<{
  include: {
    user: { select: { id: true; username: true; email: true } };
    socialAccounts: true;
  };
}>;

function SettingsCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] overflow-hidden">
      <div className="px-7 pt-7 pb-0">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#ECECF4]">
          <div className="w-10 h-10 rounded-xl bg-[#F2F8D7] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[#111827]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827]">{title}</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-7 pb-7">{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-[#111827]">{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: "#DCFCE7", text: "#16A34A" },
    PAUSED: { bg: "#FEF3C7", text: "#D97706" },
    ARCHIVED: { bg: "#F3F4F6", text: "#6B7280" },
    PAID: { bg: "#DCFCE7", text: "#16A34A" },
    PENDING: { bg: "#FEF3C7", text: "#D97706" },
    OVERDUE: { bg: "#FEE2E2", text: "#EF4444" },
    PARTIAL: { bg: "#E0F2FE", text: "#0369A1" },
    CONNECTED: { bg: "#DCFCE7", text: "#16A34A" },
    DISCONNECTED: { bg: "#F3F4F6", text: "#6B7280" },
    TOKEN_EXPIRED: { bg: "#FEF3C7", text: "#D97706" },
    ERROR: { bg: "#FEE2E2", text: "#EF4444" },
  };
  const c = colors[status] ?? { bg: "#F3F4F6", text: "#6B7280" };
  return (
    <span
      className="inline-flex h-[26px] items-center px-3 rounded-full text-[12px] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

function SocialAccountRow({
  clientId,
  account,
  lastSync,
  onDisconnected,
}: {
  clientId: string;
  account: { id: string; platform: string; accountName: string | null; accountId: string; status: string };
  lastSync: string;
  onDisconnected: () => void;
}) {
  const [disconnecting, setDisconnecting] = React.useState(false);

  const handleDisconnect = async () => {
    const isConfirmed = window.confirm(
      `Are you sure you want to disconnect this ${account.platform.toLowerCase()} account? This will permanently stop all background analytics syncs.`
    );
    if (!isConfirmed) return;

    setDisconnecting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/social-accounts/${account.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      onDisconnected();
    } catch {
      toast.error("Failed to disconnect platform");
    }
    setDisconnecting(false);
  };

  return (
    <tr className="h-[72px] border-b border-[#F1F5F9] hover:bg-[#FAFAFC] transition-colors">
      <td className="px-4 py-0">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={account.platform as Platform} />
          <span className="text-sm font-semibold text-[#111827] capitalize">
            {account.platform.toLowerCase()}
          </span>
        </div>
      </td>
      <td className="px-4 py-0">
        <StatusBadge status={account.status} />
      </td>
      <td className="px-4 py-0 text-sm text-[#6B7280]">{lastSync}</td>
      <td className="px-4 py-0 text-sm text-[#111827] font-medium">
        {account.accountName ?? account.accountId}
      </td>
      <td className="px-4 py-0 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center border border-[#E5E7EB] rounded-[10px] bg-white hover:bg-[#F9FAFB] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-9 h-9 flex items-center justify-center border border-[#E5E7EB] rounded-[10px] bg-white hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WifiOff className="w-3.5 h-3.5 text-[#6B7280]" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

const PLATFORM_CONFIGS: Record<string, { accountIdLabel: string; accountIdPlaceholder: string; tokenLabel: string; tokenPlaceholder: string; hint: string }> = {
  INSTAGRAM: {
    accountIdLabel: "Instagram Business Account ID",
    accountIdPlaceholder: "e.g. 178414123456789",
    tokenLabel: "Facebook Page Access Token",
    tokenPlaceholder: "Paste the page access token with instagram_basic scope",
    hint: "Requires a Facebook Page connected to your Instagram Business Account.",
  },
  FACEBOOK: {
    accountIdLabel: "Facebook Page ID",
    accountIdPlaceholder: "e.g. 123456789012345",
    tokenLabel: "Facebook Page Access Token",
    tokenPlaceholder: "Paste the page access token",
    hint: "Token must have pages_show_list and pages_read_engagement permissions.",
  },
  LINKEDIN: {
    accountIdLabel: "LinkedIn Organization ID",
    accountIdPlaceholder: "e.g. urn:li:organization:123456",
    tokenLabel: "LinkedIn Access Token",
    tokenPlaceholder: "Paste the OAuth 2.0 access token",
    hint: "Token needs w_member_social and r_organization_social scopes.",
  },
  TIKTOK: {
    accountIdLabel: "TikTok User ID",
    accountIdPlaceholder: "e.g. 1234567890123456789",
    tokenLabel: "TikTok Access Token",
    tokenPlaceholder: "Paste the TikTok API access token",
    hint: "Token must include user.info.basic and video.publish scopes.",
  },
  YOUTUBE: {
    accountIdLabel: "YouTube Channel ID",
    accountIdPlaceholder: "e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw",
    tokenLabel: "YouTube OAuth Token",
    tokenPlaceholder: "Paste the OAuth 2.0 access token",
    hint: "Token needs youtube.readonly and youtube.upload scopes.",
  },
  X: {
    accountIdLabel: "X (Twitter) User ID",
    accountIdPlaceholder: "e.g. 1234567890",
    tokenLabel: "X Bearer Token",
    tokenPlaceholder: "Paste the API bearer token",
    hint: "Token requires tweet.read and users.read scopes.",
  },
};

function ConnectPlatformDialog({
  clientId,
  onClose,
  onConnected,
}: {
  clientId: string;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [platform, setPlatform] = React.useState("INSTAGRAM");
  const [accountId, setAccountId] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [accessToken, setAccessToken] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const config = PLATFORM_CONFIGS[platform]!;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim() || !accessToken.trim()) {
      setError(`${config.accountIdLabel} and ${config.tokenLabel} are required`);
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/social-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, accountId: accountId.trim(), accountName: accountName.trim() || undefined, accessToken: accessToken.trim() }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || body.errors?.[0]?.message || "Failed to connect");
      }
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect platform");
    }
    setConnecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-[#ECECF4] rounded-[24px] w-full max-w-lg mx-4 overflow-hidden shadow-xl">
        <div className="px-6 pt-6 pb-4 border-b border-[#ECECF4]">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={platform as Platform} className="w-5 h-5" />
            <div>
              <h3 className="text-lg font-bold text-[#111827]">Connect {platform.charAt(0) + platform.slice(1).toLowerCase()}</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">{config.hint}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleConnect} className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-[14px] text-sm text-rose-600">{error}</div>}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#111827]">Platform</Label>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => { setPlatform(e.target.value); setError(null); }}
                className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#C5F135]/40 focus:border-transparent cursor-pointer"
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="TIKTOK">TikTok</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="X">X (Twitter)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#111827]">{config.accountIdLabel} *</Label>
            <input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder={config.accountIdPlaceholder}
              className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#111827]">Display Name</Label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. @brand_username"
              className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#111827]">{config.tokenLabel} *</Label>
            <input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={config.tokenPlaceholder}
              className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-50"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientSettingsForm({ client }: { client: ClientSettings }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [, setServerError] = React.useState<string | null>(null);

  const formatDateForInput = (dateVal: string | Date | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const defaultValues = {
    brandName: client.brandName || "",
    industry: client.industry || "",
    website: client.website || "",
    description: client.description || "",
    contactName: client.contactName || "",
    contactEmail: client.contactEmail || "",
    contactPhone: client.contactPhone || "",
    monthlyRetainer: Number(client.monthlyRetainer) || 0,
    monthlyBudget: Number(client.monthlyBudget) || 0,
    amountPaid: Number(client.amountPaid) || 0,
    paymentStatus: client.paymentStatus || "PENDING",
    contractStart: formatDateForInput(client.contractStart),
    contractEnd: formatDateForInput(client.contractEnd),
    marketingTheme: client.marketingTheme || "",
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setServerError(null);

    const form = e.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());

    const result = await updateClientAction(client.id, data);
    if (result.success) {
      toast.success("Settings saved");
      router.refresh();
    } else {
      setServerError(result.error ?? "Failed to save settings");
    }
    setSaving(false);
  };

  // ─── Portal credentials ─────────────────────────────────────
  const [showPassword, setShowPassword] = React.useState(false);
  const [pwActionLoading, setPwActionLoading] = React.useState(false);
  const [passwordRevealed, setPasswordRevealed] = React.useState<string | null>(null);

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPwActionLoading(true);
    const result = await resetClientPasswordAction(client.id);
    if (result.success) {
      setPasswordRevealed(result.password!);
      setShowPassword(true);
      toast.success("New password generated");
    } else {
      toast.error(result.error || "Failed to reset password");
    }
    setPwActionLoading(false);
  };

  const handleCopyCredentials = async (e: React.MouseEvent) => {
    e.preventDefault();
    const pw = passwordRevealed;
    if (!client.user || !pw) {
      toast.error("Password only available immediately after reset");
      return;
    }
    try {
      await navigator.clipboard.writeText(`Username: ${client.user.username}\nPassword: ${pw}`);
      toast.success("Credentials copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  // ─── Client User Creation ────────────────────────────────────
  const [credForm, setCredForm] = React.useState({ username: "", password: "" });
  const [credError, setCredError] = React.useState<string | null>(null);
  const [creatingUser, setCreatingUser] = React.useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);
    if (!credForm.username.trim() || credForm.password.length < 6) {
      setCredError("Username is required and password must be at least 6 characters.");
      return;
    }
    setCreatingUser(true);
    const result = await createClientUserAction(client.id, credForm.username, credForm.password);
    if (result.success) {
      setPasswordRevealed(credForm.password);
      setShowPassword(true);
      toast.success(`Portal user @${credForm.username} created`);
      router.refresh();
    } else {
      setCredError(result.error || "Failed to create user");
    }
    setCreatingUser(false);
  };

  // ─── Danger zone ─────────────────────────────────────────────
  const [dangerLoading, setDangerLoading] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const handleDangerAction = async (action: "disable" | "archive" | "delete") => {
    setDangerLoading(true);
    setActionError(null);
    let result;
    if (action === "disable") {
      const s = client.status === "PAUSED" ? "ACTIVE" : "PAUSED";
      result = await updateClientStatusAction(client.id, s as never);
      if (result.success) {
        toast.success(s === "PAUSED" ? "Portal access disabled" : "Portal access re-enabled");
        router.refresh();
      }
    } else if (action === "archive") {
      result = await updateClientStatusAction(client.id, "ARCHIVED" as never);
      if (result.success) {
        toast.success("Client archived");
        router.push("/admin/clients");
      }
    } else if (action === "delete") {
      result = await deleteClientAction(client.id);
      if (result.success) {
        toast.success("Client deleted");
        router.push("/admin/clients");
      }
    }
    if (result && !result.success) {
      setActionError(result.error ?? "Action failed");
    }
    setDangerLoading(false);
  };

  // ─── Connect Platform ────────────────────────────────────────
  const [showConnectModal, setShowConnectModal] = React.useState(false);

  // ─── Derived values ──────────────────────────────────────────
  const initials = client.brandName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const createdDate = new Date(client.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const user = client.user;

  return (
    <div className="px-8 py-8 max-w-[1440px] mx-auto w-full">
      {actionError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">{actionError}</div>
      )}

      <div className="space-y-6">

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — CLIENT IDENTITY
         ══════════════════════════════════════════════════════════════ */}
      <SettingsCard icon={Globe} title="Client Identity" subtitle="Core brand information and profile metadata">
        <div className="flex items-start justify-between mb-7">
          <div className="flex items-center gap-5">
            <div className="w-[72px] h-[72px] rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0">
              <span className="text-[24px] font-bold text-[#111827]">{initials}</span>
            </div>
            <div>
              <p className="text-[18px] font-bold text-[#111827] leading-tight">{client.brandName}</p>
              <p className="text-sm text-[#6B7280] mt-1">
                {client.industry ?? "No industry"} · Created {createdDate}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            <FormField label="Brand Name *">
              <input
                name="brandName"
                defaultValue={defaultValues.brandName}
                required
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="Industry">
              <input
                name="industry"
                defaultValue={defaultValues.industry}
                placeholder="e.g. SaaS, E-commerce, Healthcare"
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="Website">
              <input
                name="website"
                defaultValue={defaultValues.website}
                placeholder="https://example.com"
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
          </div>
          <div className="space-y-5">
            <FormField label="Brand Theme / Focus">
              <input
                name="marketingTheme"
                defaultValue={defaultValues.marketingTheme}
                placeholder="e.g. Seasonal campaign, product launch"
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="About the Brand">
              <textarea
                name="description"
                defaultValue={defaultValues.description}
                className="flex h-[140px] w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none resize-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
          </div>
        </div>
      </SettingsCard>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — PORTAL ACCESS & SECURITY
         ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#ECECF4] rounded-[24px] overflow-hidden">
        <div className="px-7 pt-7 pb-0">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#ECECF4]">
            <div className="w-10 h-10 rounded-xl bg-[#F2F8D7] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#111827]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Portal Access & Security</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Manage dashboard access for the client representative.</p>
            </div>
          </div>
        </div>
        <div className="px-7 pb-7">
          {user ? (
            <div className="space-y-5">
              {/* Credential Status Banner */}
              <div className="flex items-center gap-4 p-4 bg-[#F0FDF4] border border-[#D1FAE5] rounded-[14px]">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#111827]">Client Portal Active</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Credentials have been generated</p>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>

              {/* Credentials Block */}
              <div className="border border-[#ECECF4] rounded-[14px] p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <FormField label="Username">
                      <div className="flex items-center h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-3.5">
                        <span className="text-sm font-mono text-[#6B7280]">@{user.username}</span>
                      </div>
                    </FormField>
                    <FormField label="Email">
                      <div className="flex items-center h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-3.5">
                        <span className="text-sm text-[#6B7280]">{user.email}</span>
                      </div>
                    </FormField>
                  </div>
                  <div className="space-y-3">
                    <FormField label="Password">
                      <div className="flex items-center h-11 bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 gap-2">
                        <span className="flex-1 text-sm font-mono text-[#111827]">
                          {showPassword && passwordRevealed ? passwordRevealed : "••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (passwordRevealed) {
                              setShowPassword(!showPassword);
                            }
                          }}
                          disabled={!passwordRevealed}
                          className="h-8 px-3 bg-[#F8F9FC] border border-[#E5E7EB] rounded-[10px] text-xs font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {passwordRevealed ? (showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />) : <Eye className="w-3.5 h-3.5" />}
                          {passwordRevealed ? (showPassword ? "Hide" : "Show") : "Locked"}
                        </button>
                      </div>
                    </FormField>
                    <FormField label="&nbsp;">
                      <p className="text-xs text-[#9CA3AF] h-11 flex items-center">
                        {passwordRevealed ? "Password shown above — copy it now, it won't be stored" : "Password is only displayed once after creation or reset"}
                      </p>
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4 text-[#6B7280]" />
                  Copy Credentials
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={pwActionLoading}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {pwActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4 text-[#6B7280]" />}
                  Reset Password
                </button>
                <button
                  type="button"
                  className="h-10 px-4 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#6B7280]" />
                  Send Login Instructions
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[14px]">
                <ShieldAlert className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Portal User Account Missing</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    This client has no registered username or login credentials. Create one below.
                  </p>
                </div>
              </div>
              {credError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-[14px] text-sm text-rose-600">{credError}</div>
              )}
              <form onSubmit={handleCreateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormField label="Username *">
                    <input
                      value={credForm.username}
                      onChange={(e) => setCredForm((p) => ({ ...p, username: e.target.value }))}
                      placeholder="e.g. acme_client"
                      className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
                    />
                  </FormField>
                  <FormField label="Temporary Password *">
                    <input
                      type="password"
                      value={credForm.password}
                      onChange={(e) => setCredForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
                    />
                  </FormField>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-50"
                  >
                    {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Provision Portal User
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — COMMERCIAL & BILLING
         ══════════════════════════════════════════════════════════════ */}
      <SettingsCard icon={CreditCard} title="Commercial & Billing" subtitle="Retainer, budgets, and contract terms">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          <div className="bg-white border border-[#ECECF4] rounded-2xl p-4">
            <p className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#6B7280]">Monthly Retainer</p>
            <p className="text-[22px] font-bold text-[#111827] leading-none mt-2">
              ${Number(client.monthlyRetainer).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-[#ECECF4] rounded-2xl p-4">
            <p className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#6B7280]">Paid To Date</p>
            <p className="text-[22px] font-bold text-[#111827] leading-none mt-2">
              ${Number(client.amountPaid).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-[#ECECF4] rounded-2xl p-4">
            <p className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#6B7280]">Monthly Ad Budget</p>
            <p className="text-[22px] font-bold text-[#111827] leading-none mt-2">
              ${Number(client.monthlyBudget ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-[#ECECF4] rounded-2xl p-4">
            <p className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#6B7280]">Invoice Status</p>
            <div className="mt-2">
              <StatusBadge status={client.paymentStatus} />
            </div>
          </div>
        </div>

        <form id="settings-form" onSubmit={handleSave}>
          <input type="hidden" name="contactName" value={defaultValues.contactName} />
          <input type="hidden" name="contactEmail" value={defaultValues.contactEmail} />
          <input type="hidden" name="contactPhone" value={defaultValues.contactPhone} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Monthly Retainer ($USD)">
              <input
                name="monthlyRetainer"
                type="number"
                step="0.01"
                defaultValue={defaultValues.monthlyRetainer}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="Monthly Ad Spend Budget ($USD)">
              <input
                name="monthlyBudget"
                type="number"
                step="0.01"
                defaultValue={defaultValues.monthlyBudget}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="Total Paid Retainer ($USD)">
              <input
                name="amountPaid"
                type="number"
                step="0.01"
                defaultValue={defaultValues.amountPaid}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="Invoice Status">
              <div className="relative">
                <select
                  name="paymentStatus"
                  defaultValue={defaultValues.paymentStatus}
                  className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#C5F135]/40 focus:border-transparent cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PARTIAL">Partial</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
              </div>
            </FormField>
            <FormField label="Contract Start Date">
              <input
                name="contractStart"
                type="date"
                defaultValue={defaultValues.contractStart}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
            <FormField label="Contract End Date">
              <input
                name="contractEnd"
                type="date"
                defaultValue={defaultValues.contractEnd}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
              />
            </FormField>
          </div>
        </form>
      </SettingsCard>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — CONNECTED PLATFORMS
         ══════════════════════════════════════════════════════════════ */}
      <SettingsCard icon={Link} title="Connected Platforms" subtitle="Social media integrations and sync status">
        <div className="flex items-center justify-end mb-5">
          <button
            type="button"
            onClick={() => setShowConnectModal(true)}
            className="h-10 px-4 bg-[#C5F135] rounded-[14px] text-[#111827] text-sm font-semibold flex items-center gap-2 hover:brightness-95 transition-all"
          >
            + Connect Platform
          </button>
        </div>
        {client.socialAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <WifiOff className="w-10 h-10 text-[#D1D5DB] mb-2" />
            <p className="text-sm font-medium text-[#6B7280]">No platforms connected</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Connect social accounts to track content performance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAFAFC] h-12">
                  <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">Platform</th>
                  <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">Status</th>
                  <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">Last Sync</th>
                  <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0">Connected Account</th>
                  <th className="text-[12px] font-semibold tracking-[0.04em] uppercase text-[#6B7280] px-4 py-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.socialAccounts.map((account) => {
                  const lastSync = account.lastSyncAt
                    ? new Date(account.lastSyncAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "Never";
                  return (
                    <SocialAccountRow
                      key={account.id}
                      clientId={client.id}
                      account={account}
                      lastSync={lastSync}
                      onDisconnected={() => { router.refresh(); toast.success("Platform disconnected"); }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — DANGER ZONE
         ══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[24px] p-7 space-y-5">
        <div className="flex items-center gap-3 pb-5 border-b border-[#FECACA]">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#111827]">Danger Zone</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Irreversible actions for client account management</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Disable Portal */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#FECACA] rounded-[14px]">
            <div className="flex items-center gap-3">
              <PauseCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  {client.status === "PAUSED" ? "Enable Client Portal" : "Disable Client Portal"}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {client.status === "PAUSED" ? "Restore dashboard access for the client" : "Temporarily revoke dashboard access"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDangerAction("disable")}
              disabled={dangerLoading}
              className="h-9 px-4 border border-rose-200 rounded-[10px] text-sm font-semibold text-rose-700 bg-white hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              {client.status === "PAUSED" ? "Enable" : "Disable"}
            </button>
          </div>

          {/* Archive Client */}
          {client.status !== "ARCHIVED" && (
            <div className="flex items-center justify-between p-4 bg-white border border-[#FECACA] rounded-[14px]">
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Archive Client</p>
                  <p className="text-xs text-[#6B7280]">Remove from active operations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDangerAction("archive")}
                disabled={dangerLoading}
                className="h-9 px-4 border border-rose-200 rounded-[10px] text-sm font-semibold text-rose-700 bg-white hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                Archive
              </button>
            </div>
          )}

          {/* Delete Client */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#FECACA] rounded-[14px]">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Delete Client</p>
                <p className="text-xs text-[#6B7280]">
                  {confirmDelete ? "Click Delete to confirm permanent removal" : "Permanent removal of all client data"}
                </p>
              </div>
            </div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-[10px] text-sm font-semibold text-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDangerAction("delete")}
                  disabled={dangerLoading}
                  className="h-9 px-4 bg-rose-600 rounded-[10px] text-sm font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {dangerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-9 px-4 border border-rose-200 rounded-[10px] text-sm font-semibold text-rose-700 bg-white hover:bg-rose-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STICKY ACTION BAR
         ══════════════════════════════════════════════════════════════ */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 py-4 bg-gradient-to-t from-[#F6F7FB] via-[#F6F7FB] to-transparent">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="h-11 px-5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="settings-form"
          disabled={saving}
          className="h-11 px-6 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
      {/* ── Connect Platform Modal ── */}
      {showConnectModal && (
        <ConnectPlatformDialog
          clientId={client.id}
          onClose={() => setShowConnectModal(false)}
          onConnected={() => {
            setShowConnectModal(false);
            router.refresh();
            toast.success("Platform connected");
          }}
        />
      )}
      </div>
    </div>
  );
}
