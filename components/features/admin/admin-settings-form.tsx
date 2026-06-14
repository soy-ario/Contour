"use client";

import * as React from "react";
import PageShell from "@/components/layout/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Building2,
  User,
  Monitor,
  BarChart3,
  Puzzle,
  Sliders,
  Shield,
  AlertTriangle,
  ChevronRight,
  Upload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Clock,
  Calendar,
  Eye,
  LogOut,
  Activity,
  Key,
  Trash2,
  Download,
  Archive,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "agency", label: "Agency Profile", icon: Building2 },
  { id: "account", label: "Admin Account", icon: User },
  { id: "portal", label: "Client Portal", icon: Monitor },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "security", label: "Security", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

interface SettingsSidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

function SettingsSidebar({ active, onNavigate }: SettingsSidebarProps) {
  return (
    <nav className="w-56 shrink-0 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        const isDanger = item.id === "danger";
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-medium transition-all text-left ${
              isActive
                ? "bg-[#C5F135] text-[#111827]"
                : isDanger
                  ? "text-rose-500 hover:bg-rose-50"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-white"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </button>
        );
      })}
    </nav>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[#ECECF4] rounded-2xl p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="text-base font-bold text-[#111827]">{title}</h2>
        {subtitle && <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-[#111827]">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135]"
    />
  );
}

function StyledSelect({ options, ...props }: { options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full h-11 appearance-none bg-white border border-[#E5E7EB] rounded-[14px] px-3.5 pr-10 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-[#C5F135]/40 focus:border-transparent cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none rotate-90" />
    </div>
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          enabled ? "bg-[#C5F135]" : "bg-[#E5E7EB]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label && <span className="text-sm text-[#6B7280]">{label}</span>}
    </div>
  );
}

function DangerButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-sm font-semibold hover:bg-rose-100 transition-colors"
    >
      {children}
    </button>
  );
}

interface AdminSettingsFormProps {
  user: { name: string; email: string; username: string };
  platformCounts: Record<string, number>;
  defaultSection?: string;
}

const PLATFORMS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "X", label: "X (Twitter)" },
];

export default function AdminSettingsForm({ user, platformCounts, defaultSection }: AdminSettingsFormProps) {
  const [activeSection, setActiveSection] = React.useState(defaultSection && NAV_ITEMS.some(i => i.id === defaultSection) ? defaultSection : "agency");

  const sessionUser = {
    name: user.name,
    email: user.email,
    username: user.username,
  };

  const renderAgencyProfile = () => (
    <SectionCard title="Agency Profile" subtitle="Configure agency branding and operational information.">
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#C5F135] flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[#111827]">C</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#111827]">Contour</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Agency Operations & Analytics</p>
            <button
              type="button"
              className="mt-3 h-9 px-4 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              Change Logo
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Agency Name" required>
            <StyledInput defaultValue="Contour" />
          </FormField>
          <FormField label="Agency Website">
            <StyledInput defaultValue="https://contour.agency" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Agency Email" required>
            <StyledInput defaultValue="hello@contour.agency" />
          </FormField>
          <FormField label="Agency Phone">
            <StyledInput defaultValue="+1 (555) 000-0000" />
          </FormField>
        </div>
        <FormField label="Business Address">
          <StyledInput defaultValue="123 Agency Street, New York, NY 10001" />
        </FormField>
        <FormField label="Agency Description">
          <Textarea
            defaultValue="Full-service digital marketing agency specializing in brand strategy, content creation, and social media management."
            className="flex w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135]/40 focus-visible:border-[#C5F135] min-h-[80px]"
          />
        </FormField>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold text-sm hover:brightness-95 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </SectionCard>
  );

  const renderAdminAccount = () => (
    <SectionCard title="Admin Account" subtitle="Manage your personal account.">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-2xl border border-[#ECECF4]">
          <div className="w-12 h-12 rounded-full bg-[#C5F135] flex items-center justify-center text-sm font-bold text-[#111827] shrink-0">
            AR
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{user.name}</p>
            <p className="text-xs text-[#6B7280]">Owner</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required>
            <StyledInput defaultValue={user.name} />
          </FormField>
          <FormField label="Email" required>
            <StyledInput defaultValue={user.email} />
          </FormField>
        </div>
        <FormField label="Username">
          <StyledInput defaultValue={user.username} />
        </FormField>
        <div className="border-t border-[#ECECF4] pt-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">Change Password</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Current Password">
              <StyledInput type="password" placeholder="Enter current password" />
            </FormField>
            <FormField label="New Password">
              <StyledInput type="password" placeholder="Min. 8 characters" />
            </FormField>
            <FormField label="Confirm Password">
              <StyledInput type="password" placeholder="Re-enter new password" />
            </FormField>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold text-sm hover:brightness-95 transition-all"
          >
            Update Credentials
          </button>
        </div>
      </div>
    </SectionCard>
  );

  const renderClientPortal = () => (
    <SectionCard title="Client Portal" subtitle="Configure how clients access Contour.">
      <div className="space-y-6">
        <FormField label="Portal URL">
          <div className="relative">
            <StyledInput defaultValue="portal.contour.agency" />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 rounded-lg bg-[#F4F4FA] text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </button>
          </div>
        </FormField>
        <FormField label="Login Method">
          <StyledSelect
            options={[
              { value: "username", label: "Username + Password" },
              { value: "email", label: "Email + Password" },
            ]}
            defaultValue="username"
          />
        </FormField>
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-[#111827]">Client Credential Policy</h3>
          <Toggle enabled label="Auto-generate credentials" onChange={() => {}} />
          <Toggle enabled label="Require password reset on first login" onChange={() => {}} />
          <Toggle enabled label="Allow client self password reset" onChange={() => {}} />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold text-sm hover:brightness-95 transition-all"
          >
            Save Portal Settings
          </button>
        </div>
      </div>
    </SectionCard>
  );

  const renderReporting = () => (
    <SectionCard title="Reporting & Analytics" subtitle="Configure report generation and defaults.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Report Generation Day">
            <StyledSelect
              options={[
                { value: "1", label: "1st of Month" },
                { value: "5", label: "5th of Month" },
                { value: "last", label: "Last Day" },
              ]}
              defaultValue="1"
            />
          </FormField>
          <FormField label="Default Date Range">
            <StyledSelect
              options={[
                { value: "prev-month", label: "Previous Month" },
                { value: "this-month", label: "This Month" },
                { value: "last-30", label: "Last 30 Days" },
                { value: "quarter", label: "This Quarter" },
              ]}
              defaultValue="prev-month"
            />
          </FormField>
        </div>
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-[#111827]">Report Features</h3>
          <Toggle enabled label="Generate AI Monthly Insights" onChange={() => {}} />
          <Toggle enabled label="Include Contour Branding" onChange={() => {}} />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#111827]">Export Formats</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#E5E7EB] text-[#C5F135] focus:ring-[#C5F135]/40" />
              <span className="text-sm text-[#111827]">PDF</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-[#E5E7EB] text-[#C5F135] focus:ring-[#C5F135]/40" />
              <span className="text-sm text-[#111827]">CSV</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold text-sm hover:brightness-95 transition-all"
          >
            Save Report Settings
          </button>
        </div>
      </div>
    </SectionCard>
  );

  const renderIntegrations = () => {
    const platformStatus: Record<string, { connected: boolean; error: boolean }> = {
      INSTAGRAM: { connected: !!platformCounts.INSTAGRAM, error: false },
      FACEBOOK: { connected: !!platformCounts.FACEBOOK, error: false },
      LINKEDIN: { connected: !!platformCounts.LINKEDIN, error: false },
      TIKTOK: { connected: !!platformCounts.TIKTOK, error: false },
      YOUTUBE: { connected: !!platformCounts.YOUTUBE, error: false },
      X: { connected: !!platformCounts.X, error: false },
    };

    return (
      <SectionCard title="Platform Integrations" subtitle="Manage connected social platforms.">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-4 py-2 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            <span>Platform</span>
            <span>Status</span>
            <span>Accounts</span>
            <span className="text-right">Actions</span>
          </div>
          {PLATFORMS.map((p) => {
            const status = platformStatus[p.value];
            const count = platformCounts[p.value] || 0;
            return (
              <div
                key={p.value}
                className="grid grid-cols-[1fr_120px_120px_100px] gap-4 items-center px-4 py-3 rounded-xl border border-[#ECECF4] hover:border-[#C5F135]/50 transition-colors"
              >
                <span className="text-sm font-medium text-[#111827]">{p.label}</span>
                <div>
                  {status.connected ? (
                    <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-[#F4F4FA] text-[#6B7280] text-xs font-medium">
                      <XCircle className="w-3 h-3" />
                      Disconnected
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#6B7280]">{count} account{count !== 1 ? "s" : ""}</span>
                <div className="flex justify-end">
                  {status.connected ? (
                    <button
                      type="button"
                      className="h-8 px-3 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
                    >
                      Manage
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="h-8 px-3 rounded-lg bg-[#C5F135] text-xs font-semibold text-[#111827] hover:brightness-95 transition-all"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    );
  };

  const renderPreferences = () => (
    <SectionCard title="Platform Preferences" subtitle="Set operational defaults for the platform.">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Default Currency">
            <StyledSelect
              options={[
                { value: "USD", label: "USD - US Dollar" },
                { value: "EUR", label: "EUR - Euro" },
                { value: "GBP", label: "GBP - British Pound" },
                { value: "CAD", label: "CAD - Canadian Dollar" },
              ]}
              defaultValue="USD"
            />
          </FormField>
          <FormField label="Default Timezone">
            <StyledSelect
              options={[
                { value: "America/New_York", label: "America/New_York (EST)" },
                { value: "America/Chicago", label: "America/Chicago (CST)" },
                { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
                { value: "Europe/London", label: "Europe/London (GMT)" },
              ]}
              defaultValue="America/New_York"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Default Date Format">
            <StyledSelect
              options={[
                { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
              ]}
              defaultValue="DD/MM/YYYY"
            />
          </FormField>
          <FormField label="Default Content View">
            <StyledSelect
              options={[
                { value: "list", label: "List" },
                { value: "calendar", label: "Calendar" },
              ]}
              defaultValue="list"
            />
          </FormField>
        </div>
        <FormField label="Default Analytics Period">
          <StyledSelect
            options={[
              { value: "7", label: "7 Days" },
              { value: "30", label: "30 Days" },
              { value: "90", label: "90 Days" },
              { value: "365", label: "1 Year" },
            ]}
            defaultValue="30"
          />
        </FormField>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="h-11 px-5 bg-[#C5F135] rounded-[14px] text-[#111827] font-semibold text-sm hover:brightness-95 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </SectionCard>
  );

  const renderSecurity = () => (
    <SectionCard title="Security" subtitle="Manage agency security settings.">
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#ECECF4]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#111827]" />
            <div>
              <p className="text-sm font-semibold text-[#111827]">Two-Factor Authentication</p>
              <p className="text-xs text-[#6B7280]">Add an extra layer of security to your account.</p>
            </div>
          </div>
          <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#F4F4FA] text-[#6B7280] text-xs font-medium">
            Disabled
          </span>
        </div>

        <div className="border-t border-[#ECECF4] pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#111827]">Session Controls</h3>
            <button
              type="button"
              className="h-8 px-3 rounded-lg border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              Log out all devices
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] border border-[#ECECF4]">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[#6B7280]" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">MacBook Pro — Chrome</p>
                  <p className="text-xs text-[#6B7280]">New York, US</p>
                </div>
              </div>
              <span className="text-xs text-[#6B7280]">Active now</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] border border-[#ECECF4]">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[#6B7280]" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">iPhone 15 — Safari</p>
                  <p className="text-xs text-[#6B7280]">New York, US</p>
                </div>
              </div>
              <span className="text-xs text-[#6B7280]">2h ago</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#ECECF4] pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">API Keys</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Manage API access for third-party integrations.</p>
            </div>
            <button
              type="button"
              className="h-9 px-4 rounded-xl bg-[#C5F135] text-[#111827] text-xs font-semibold hover:brightness-95 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              Generate API Key
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  const renderDangerZone = () => (
    <SectionCard title="Danger Zone" subtitle="Irreversible actions that affect your entire agency." className="border-rose-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div>
            <p className="text-sm font-semibold text-rose-800">Archive Agency Data</p>
            <p className="text-xs text-rose-600 mt-0.5">Archive all clients, content, and reports.</p>
          </div>
          <DangerButton onClick={() => {}}>
            <Archive className="w-3.5 h-3.5 mr-1.5 inline" />
            Archive
          </DangerButton>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div>
            <p className="text-sm font-semibold text-rose-800">Export Agency Backup</p>
            <p className="text-xs text-rose-600 mt-0.5">Download a complete backup of all agency data.</p>
          </div>
          <DangerButton onClick={() => {}}>
            <Download className="w-3.5 h-3.5 mr-1.5 inline" />
            Export
          </DangerButton>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div>
            <p className="text-sm font-semibold text-rose-800">Delete All Client Data</p>
            <p className="text-xs text-rose-600 mt-0.5">Permanently remove all client records and associated data.</p>
          </div>
          <DangerButton onClick={() => {}}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5 inline" />
            Delete
          </DangerButton>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div>
            <p className="text-sm font-semibold text-rose-800">Delete Agency</p>
            <p className="text-xs text-rose-600 mt-0.5">Permanently delete the entire Contour workspace. Requires typing <span className="font-mono font-bold">DELETE CONTOUR</span> to confirm.</p>
          </div>
          <DangerButton onClick={() => {}}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5 inline" />
            Delete Agency
          </DangerButton>
        </div>
      </div>
    </SectionCard>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "agency": return renderAgencyProfile();
      case "account": return renderAdminAccount();
      case "portal": return renderClientPortal();
      case "reporting": return renderReporting();
      case "integrations": return renderIntegrations();
      case "preferences": return renderPreferences();
      case "security": return renderSecurity();
      case "danger": return renderDangerZone();
      default: return renderAgencyProfile();
    }
  };

  return (
    <PageShell
      title="Settings"
      breadcrumbs={[{ label: "Settings", href: "/admin/settings" }]}
      user={sessionUser}
    >
      <div className="flex gap-6">
        <SettingsSidebar active={activeSection} onNavigate={setActiveSection} />
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </PageShell>
  );
}
