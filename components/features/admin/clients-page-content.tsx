"use client";

import * as React from "react";
import { Plus, Briefcase, Activity, UserPlus, PauseCircle, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/page-shell";
import ClientListTable from "@/components/features/admin/client-list-table";
import CreateClientDialog from "@/components/features/admin/create-client-sheet";
import { updateClientStatusAction } from "@/lib/actions/client.actions";
import { toast } from "sonner";
import type { ClientStatus } from "@prisma/client";

interface ClientData {
  id: string;
  brandName: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  status: ClientStatus;
  monthlyRetainer: number;
  monthlyBudget: number | null;
  healthScore: number | null;
  contractStart: string | Date | null;
  contractEnd: string | Date | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  logoUrl: string | null;
  amountPaid: number;
  paymentStatus: "PENDING" | "PAID" | "OVERDUE" | "PARTIAL";
  marketingTheme: string | null;
}

interface ClientsPageContentProps {
  initialClients: ClientData[];
  stats: {
    total: number;
    active: number;
    onboarding: number;
    paused: number;
    totalDelta?: number;
    activeDelta?: number;
  };
  user: {
    name: string;
    email: string;
    username: string;
  };
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 52;
  const height = 18;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke="#F2485A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

function KpiCard({
  icon,
  label,
  value,
  meta,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  meta: string;
  trend?: number[];
}) {
  return (
    <div className="bg-white border border-[#ECECF4] rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FFE3E3] flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-medium text-[#6B7280] tracking-widest uppercase block leading-none">
            {label}
          </span>
          <span className="text-[28px] font-bold text-[#111827] leading-none mt-1.5 block tracking-tight">
            {value}
          </span>
          <span className="text-[13px] text-[#6B7280] mt-0.5 block">{meta}</span>
        </div>
        {trend && (
          <div className="self-start mt-1 shrink-0">
            <Sparkline data={trend} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPageContent({
  initialClients,
  stats,
  user,
}: ClientsPageContentProps) {
  const [clients, setClients] = React.useState<ClientData[]>(initialClients);
  const [prevInitialClients, setPrevInitialClients] = React.useState<ClientData[]>(initialClients);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<ClientData | undefined>(undefined);

  if (initialClients !== prevInitialClients) {
    setPrevInitialClients(initialClients);
    setClients(initialClients);
  }

  const handleCreateNew = () => {
    setSelectedClient(undefined);
    setIsSheetOpen(true);
  };

  const handleEdit = (client: ClientData) => {
    setSelectedClient(client);
    setIsSheetOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this client? This will move them to ARCHIVED status.")) {
      return;
    }

    const toastId = toast.loading("Archiving client...");
    try {
      const result = await updateClientStatusAction(id, "ARCHIVED");
      if (result.success) {
        toast.success("Client archived successfully", { id: toastId });
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(result.error || "Failed to archive client", { id: toastId });
      }
    } catch {
      toast.error("An error occurred while archiving the client", { id: toastId });
    }
  };

  const handleFormSuccess = () => {
    window.location.reload();
  };

  const breadcrumbs = [{ label: "Clients", href: "/admin/clients" }];

  const totalDeltaPercent = stats.totalDelta !== undefined ? (stats.totalDelta * 100).toFixed(1) : "0.0";
  const activePercent = stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : "0.0";

  return (
    <PageShell title="Clients" breadcrumbs={breadcrumbs} user={user}>
       <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-end">
          <Button
            onClick={handleCreateNew}
            className="h-10 px-5 rounded-xl bg-[#F2485A] hover:bg-[#D93D4E] active:bg-[#C13145] text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Client
          </Button>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Briefcase className="w-[18px] h-[18px] text-[#C13145]" />}
            label="TOTAL PORTFOLIOS"
            value={stats.total}
            meta={`${totalDeltaPercent}% new this month`}
            trend={[10, 15, 12, 18, 22, 20, 25]}
          />
          <KpiCard
            icon={<Activity className="w-[18px] h-[18px] text-[#C13145]" />}
            label="ACTIVE RETAINERS"
            value={stats.active}
            meta={`${activePercent}% active contracts`}
            trend={[20, 25, 22, 28, 30, 26, 32]}
          />
          <KpiCard
            icon={<UserPlus className="w-[18px] h-[18px] text-[#C13145]" />}
            label="ONBOARDING PIPELINE"
            value={stats.onboarding}
            meta="In progress"
          />
          <KpiCard
            icon={<PauseCircle className="w-[18px] h-[18px] text-[#C13145]" />}
            label="PAUSED ACCOUNTS"
            value={stats.paused}
            meta="On hold"
          />
        </div>

        {/* Client Registry */}
        <div className="bg-white border border-[#ECECF4] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#111827] leading-tight tracking-tight">
                Client Registry
              </h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                View and manage all client portfolios, billing details, contract periods, and health scores.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#F2485A] text-sm font-medium transition-all bg-white">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
              <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#F2485A] text-sm font-medium transition-all bg-white">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          <ClientListTable
            data={clients}
            onEdit={handleEdit}
            onArchive={handleArchive}
          />
        </div>
      </div>

      <CreateClientDialog
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        client={selectedClient}
        onSuccess={handleFormSuccess}
      />
    </PageShell>
  );
}
