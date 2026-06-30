"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  User, Globe, Mail, Lock, Clock, DollarSign, ChevronRight, Eye, EyeOff,
  ChevronDown, Pencil, Loader2, CheckCircle2,
} from "lucide-react";
import {
  InstagramIcon, FacebookIcon, LinkedinIcon, YoutubeIcon, TiktokIcon, TwitterIcon,
} from "@/components/shared/social-icons";
import type { SettingsData } from "@/app/(client)/client/settings/page";

/* ─── HELPERS ────────────────────────────────── */

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  INSTAGRAM: InstagramIcon, FACEBOOK: FacebookIcon, LINKEDIN: LinkedinIcon,
  YOUTUBE: YoutubeIcon, TIKTOK: TiktokIcon, X: TwitterIcon,
};

const TIMEZONES = [
  { value: "Pacific/Midway", label: "(GMT-11:00) Midway Island" },
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii" },
  { value: "America/Anchorage", label: "(GMT-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "(GMT-07:00) Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "(GMT-06:00) Central Time (US & Canada)" },
  { value: "America/New_York", label: "(GMT-05:00) Eastern Time (US & Canada)" },
  { value: "America/Halifax", label: "(GMT-04:00) Atlantic Time (Canada)" },
  { value: "America/Argentina/Buenos_Aires", label: "(GMT-03:00) Buenos Aires" },
  { value: "Atlantic/Azores", label: "(GMT-01:00) Azores" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Europe/Paris", label: "(GMT+01:00) Central Europe" },
  { value: "Europe/Helsinki", label: "(GMT+02:00) Eastern Europe" },
  { value: "Europe/Moscow", label: "(GMT+03:00) Moscow" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
  { value: "Asia/Karachi", label: "(GMT+05:00) Pakistan" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) India" },
  { value: "Asia/Dhaka", label: "(GMT+06:00) Bangladesh" },
  { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok" },
  { value: "Asia/Shanghai", label: "(GMT+08:00) China" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
  { value: "Pacific/Auckland", label: "(GMT+12:00) Auckland" },
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "BRL", label: "BRL — Brazilian Real" },
  { value: "MXN", label: "MXN — Mexican Peso" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "HKD", label: "HKD — Hong Kong Dollar" },
  { value: "SEK", label: "SEK — Swedish Krona" },
  { value: "NOK", label: "NOK — Norwegian Krone" },
  { value: "DKK", label: "DKK — Danish Krone" },
  { value: "NZD", label: "NZD — New Zealand Dollar" },
  { value: "KRW", label: "KRW — South Korean Won" },
  { value: "AED", label: "AED — UAE Dirham" },
];

function cardClasses() {
  return "bg-white border border-[#ECECF4] rounded-[24px] p-6 transition-all duration-200";
}

function inputClasses() {
  return "w-full h-12 border border-[#E5E7EB] rounded-xl bg-white px-3.5 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#F2485A] focus:ring-1 focus:ring-[#F2485A]/30 transition-all";
}

function selectClasses() {
  return "w-full h-12 border border-[#E5E7EB] rounded-xl bg-white px-3.5 text-[14px] text-[#111827] outline-none focus:border-[#F2485A] focus:ring-1 focus:ring-[#F2485A]/30 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_14px_center] pr-10";
}

/* ─── CONNECT SOCIAL MODAL ─────────────────────── */

function ConnectPlatformDialog({
  clientId, onClose, onConnected,
}: {
  clientId: string; onClose: () => void; onConnected: () => void;
}) {
  const [platform, setPlatform] = React.useState("INSTAGRAM");
  const [accountId, setAccountId] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [accessToken, setAccessToken] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const configs: Record<string, { aidLabel: string; aidPlaceholder: string; tokenLabel: string; tokenPlaceholder: string; hint: string }> = {
    INSTAGRAM: { aidLabel: "Instagram Business Account ID", aidPlaceholder: "e.g. 17841400000000000", tokenLabel: "Access Token", tokenPlaceholder: "Your Instagram access token", hint: "Connect your Instagram Business account to track content performance." },
    FACEBOOK: { aidLabel: "Facebook Page ID", aidPlaceholder: "e.g. 106728889000000", tokenLabel: "Access Token", tokenPlaceholder: "Your Facebook access token", hint: "Connect your Facebook Page to manage and publish content." },
    LINKEDIN: { aidLabel: "LinkedIn Company ID", aidPlaceholder: "e.g. 1234567", tokenLabel: "Access Token", tokenPlaceholder: "Your LinkedIn access token", hint: "Connect your LinkedIn Company Page." },
    TIKTOK: { aidLabel: "TikTok Business Account ID", aidPlaceholder: "e.g. 7000000000000000000", tokenLabel: "Access Token", tokenPlaceholder: "Your TikTok access token", hint: "Connect your TikTok Business account." },
    YOUTUBE: { aidLabel: "YouTube Channel ID", aidPlaceholder: "e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw", tokenLabel: "API Key", tokenPlaceholder: "Your YouTube API key", hint: "Connect your YouTube channel." },
    X: { aidLabel: "X (Twitter) Account ID", aidPlaceholder: "e.g. 123456789", tokenLabel: "API Key", tokenPlaceholder: "Your X API key", hint: "Connect your X profile." },
  };

  const config = configs[platform]!;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim() || !accessToken.trim()) {
      setError(`${config.aidLabel} and ${config.tokenLabel} are required`);
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
        throw new Error(body.error || "Failed to connect");
      }
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect platform");
    }
    setConnecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white border border-[#ECECF4] rounded-[24px] w-full max-w-lg mx-4 overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-[#ECECF4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F4FA] flex items-center justify-center">
              {React.createElement(PLATFORM_ICONS[platform] || Globe, { className: "w-5 h-5" })}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#111827]">Connect {platform.charAt(0) + platform.slice(1).toLowerCase()}</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">{config.hint}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleConnect} className="p-6 space-y-5">
          {error && <div className="p-3 bg-rose-50 border border-rose-200 rounded-[14px] text-sm text-rose-600">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#111827]">Platform</label>
            <div className="relative">
              <select value={platform} onChange={e => { setPlatform(e.target.value); setError(null); }} className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#F2485A]/40 focus:border-transparent cursor-pointer">
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
            <label className="text-sm font-semibold text-[#111827]">{config.aidLabel} *</label>
            <input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder={config.aidPlaceholder} className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#111827]">Display Name</label>
            <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="e.g. @brand_username" className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#111827]">{config.tokenLabel} *</label>
            <input value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder={config.tokenPlaceholder} className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-11 px-5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors">Cancel</button>
            <button type="submit" disabled={connecting} className="h-11 px-5 bg-[#F2485A] rounded-[14px] text-white font-semibold flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-50">
              {connecting && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── CARD WRAPPER ───────────────────────────── */

function SettingsCard({ title, subtitle, action, children }: {
  title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className={cn(cardClasses())}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>
          <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientSettings({ data }: { data: SettingsData }) {
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Form values
  const [contactName, setContactName] = React.useState(data.contactName);
  const [brandName, setBrandName] = React.useState(data.brandName);
  const [industry, setIndustry] = React.useState(data.industry || "Automotive");
  const [website, setWebsite] = React.useState(data.website);
  const [logoUrl, setLogoUrl] = React.useState(data.logoUrl);
  const [userName, setUserName] = React.useState(data.userName);
  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [timezone, setTimezone] = React.useState("America/Los_Angeles");
  const [currency, setCurrency] = React.useState("USD");

  // Connected accounts
  const [accounts, setAccounts] = React.useState(data.accounts);
  const [showConnect, setShowConnect] = React.useState(false);

  const fileRef = React.useRef<HTMLInputElement>(null);

  function markDirty() { setDirty(true); setSaved(false); }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await fetch("/api/client/logo", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setLogoUrl(json.logoUrl);
        markDirty();
      }
    } catch { /* ignore */ }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/client/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName, brandName, industry, website, logoUrl,
          userName, newPassword: newPassword || undefined,
          timezone, currency,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDirty(false);
        setSaved(true);
        setNewPassword("");
        toast.success("Settings saved successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save settings");
      }
    } catch {
      toast.error("An unexpected error occurred while saving settings.");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="mx-auto" style={{ maxWidth: 1440, padding: "24px 32px" }}>
        <div className="space-y-6">

          {/* ═══ HEADER ═══ */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[32px] font-bold text-[#111827] tracking-tight">Settings</h1>
              <p className="text-[15px] font-medium text-[#6B7280] mt-1">
                Manage your account and preferences.
              </p>
            </div>
          </div>

          {/* ═══ TOP ROW: Profile + Credentials ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── PROFILE CARD ── */}
            <SettingsCard title="Profile" subtitle="Update your personal and company information.">
              <div className="flex gap-6">
                {/* Logo with upload overlay */}
                <div className="relative w-[120px] h-[120px] shrink-0 group">
                  <div className="w-full h-full rounded-[24px] bg-[#F4F4FA] flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <Image src={logoUrl} alt="" className="w-full h-full object-cover" unoptimized width={120} height={120} />
                    ) : (
                      <User className="w-8 h-8 text-[#D1D5DB]" />
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white border border-[#ECECF4] shadow-sm flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>

                {/* Form fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Full Name</label>
                      <input type="text" value={contactName} onChange={e => { setContactName(e.target.value); markDirty(); }} className={inputClasses()} placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Job Title</label>
                      <input type="text" defaultValue="Marketing Director" className={inputClasses()} placeholder="Job Title" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Company Name</label>
                      <input type="text" value={brandName} onChange={e => { setBrandName(e.target.value); markDirty(); }} className={inputClasses()} placeholder="Company Name" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Industry</label>
                      <select value={industry} onChange={e => { setIndustry(e.target.value); markDirty(); }} className={selectClasses()}>
                        <option>Automotive</option><option>Technology</option><option>Healthcare</option>
                        <option>Finance</option><option>Retail</option><option>Education</option>
                        <option>Entertainment</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="url" value={website} onChange={e => { setWebsite(e.target.value); markDirty(); }} className={cn(inputClasses(), "pl-10")} placeholder="https://www.example.com" />
                    </div>
                  </div>
                </div>
              </div>
            </SettingsCard>

            {/* ── CREDENTIALS CARD ── */}
            <SettingsCard title="Credentials" subtitle="Manage your login credentials and security.">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Email Address</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="email" value={data.userEmail} className={cn(inputClasses(), "pl-10")} readOnly />
                    </div>
                    <span className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#F2485A] shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Username</label>
                  <input type="text" value={userName} onChange={e => { setUserName(e.target.value); markDirty(); }} className={inputClasses()} placeholder="Username" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Password</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); markDirty(); }}
                        placeholder="Enter new password"
                        className={cn(inputClasses(), "pl-10 pr-10")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={!newPassword || saving}
                      className="h-12 px-4 border border-[#E5E7EB] rounded-xl bg-white text-[13px] font-medium text-[#111827] hover:bg-[#F9FAFB] transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            </SettingsCard>

          </div>

          {/* ═══ BOTTOM ROW: Connected Accounts + Timezone & Currency ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── CONNECTED ACCOUNTS CARD ── */}
            <SettingsCard
              title="Connected Accounts"
              subtitle="Connect your social media and advertising accounts."
              action={
                <button
                  onClick={() => setShowConnect(true)}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-xl bg-white text-[13px] font-medium text-[#111827] hover:bg-[#F9FAFB] transition-all"
                >
                  Manage
                </button>
              }
            >
              {/* Platform icons row */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[#ECECF4]">
                {["INSTAGRAM", "FACEBOOK", "LINKEDIN", "TIKTOK", "YOUTUBE"].map(p => {
                  const Icon = PLATFORM_ICONS[p];
                  return (
                    <div key={p} className="w-9 h-9 rounded-lg bg-[#F4F4FA] flex items-center justify-center">
                      {Icon ? <Icon className="w-5 h-5" /> : <Globe className="w-4 h-4 text-[#9CA3AF]" />}
                    </div>
                  );
                })}
                <button
                  onClick={() => setShowConnect(true)}
                  className="w-9 h-9 rounded-lg border border-dashed border-[#D1D5DB] flex items-center justify-center text-[#9CA3AF] hover:border-[#F2485A] hover:text-[#F2485A] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                </button>
              </div>

              {/* Connected accounts list */}
              {accounts.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-sm text-[#9CA3AF]">No accounts connected yet</div>
              ) : (
                <div>
                  {accounts.map((acct, i) => {
                    const Icon = PLATFORM_ICONS[acct.platform];
                    return (
                      <div key={acct.id}>
                        {i > 0 && <div className="h-px bg-[#F1F5F9]" />}
                        <div className="flex items-center justify-between h-[72px] px-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F4FA] flex items-center justify-center shrink-0">
                              {Icon ? <Icon className="w-5 h-5" /> : <Globe className="w-5 h-5 text-[#6B7280]" />}
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-[#111827]">{acct.accountName || acct.platform}</p>
                              <p className="text-[12px] text-[#6B7280]">{acct.platform.charAt(0) + acct.platform.slice(1).toLowerCase()} Business</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#F2485A]">Connected</span>
                            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SettingsCard>

            {/* ── TIMEZONE & CURRENCY CARD ── */}
            <SettingsCard title="Timezone & Currency" subtitle="Set your timezone and currency preferences.">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Timezone</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                    <select value={timezone} onChange={e => { setTimezone(e.target.value); markDirty(); }} className={cn(selectClasses(), "pl-10")}>
                      {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#6B7280] mb-1.5">Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                    <select value={currency} onChange={e => { setCurrency(e.target.value); markDirty(); }} className={cn(selectClasses(), "pl-10")}>
                      {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-1">
                  {saved && (
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#16A34A]">
                      <CheckCircle2 className="w-4 h-4" /> Saved
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="h-12 px-6 rounded-xl bg-[#F2485A] text-white font-semibold text-[14px] border-none hover:brightness-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Preferences
                  </button>
                </div>
              </div>
            </SettingsCard>

          </div>

        </div>
      </div>

      {/* Connect social modal */}
      {showConnect && (
        <ConnectPlatformDialog
          clientId={data.clientId}
          onClose={() => setShowConnect(false)}
          onConnected={() => {
            setShowConnect(false);
            fetch(`/api/client/social-accounts`)
              .then(r => r.json())
              .then(r => { if (r.accounts) setAccounts(r.accounts); })
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
