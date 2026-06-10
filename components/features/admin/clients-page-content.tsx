"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/page-shell";
import StatCard from "@/components/shared/stat-card";
import ClientListTable from "@/components/features/admin/client-list-table";
import CreateClientSheet from "@/components/features/admin/create-client-sheet";
import { updateClientStatusAction } from "@/lib/actions/client.actions";
import { toast } from "sonner";
import { ClientStatus } from "@prisma/client";

interface ClientData {
  id: string;
  brandName: string;
  industry: string | null;
  status: ClientStatus;
  monthlyRetainer: number;
  healthScore: number | null;
  contractStart: string | Date | null;
  contractEnd: string | Date | null;
  contactName: string;
  contactEmail: string;
  logoUrl: string | null;
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

export default function ClientsPageContent({
  initialClients,
  stats,
  user,
}: ClientsPageContentProps) {
  const [clients, setClients] = React.useState<ClientData[]>(initialClients);
  const [prevInitialClients, setPrevInitialClients] = React.useState<ClientData[]>(initialClients);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<ClientData | undefined>(undefined);

  // Keep state sync with props updates (due to revalidatePath)
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
        // Optimistically remove/update from state or rely on revalidation
        setClients((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast.error(result.error || "Failed to archive client", { id: toastId });
      }
    } catch (error) {
      toast.error("An error occurred while archiving the client", { id: toastId });
    }
  };

  const handleFormSuccess = () => {
    // Revalidation happens server-side, props will update.
    // If not immediate, let's trigger a page refresh or route reload.
    window.location.reload();
  };

  const breadcrumbs = [{ label: "Clients", href: "/admin/clients" }];

  const headerActions = (
    <Button
      onClick={handleCreateNew}
      className="bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold flex items-center space-x-1.5"
    >
      <Plus className="w-4 h-4" />
      <span>New Client</span>
    </Button>
  );

  return (
    <PageShell title="Client Portfolios" breadcrumbs={breadcrumbs} actions={headerActions} user={user}>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Portfolios"
            value={stats.total}
            delta={stats.totalDelta}
            deltaLabel="new this month"
          />
          <StatCard
            label="Active Retainers"
            value={stats.active}
            delta={stats.activeDelta}
            deltaLabel="active contracts"
          />
          <StatCard
            label="Onboarding Pipeline"
            value={stats.onboarding}
          />
          <StatCard
            label="Paused Accounts"
            value={stats.paused}
          />
        </div>

        {/* Client List Table */}
        <div className="bg-zinc-950/20 rounded-xl border border-border/60 p-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Client Registry</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage all billing details, contact information, account lifecycles, and health scores.
              </p>
            </div>
            <ClientListTable
              data={clients}
              onEdit={handleEdit}
              onArchive={handleArchive}
            />
          </div>
        </div>
      </div>

      {/* Slide-over Form Sheet */}
      <CreateClientSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        client={selectedClient}
        onSuccess={handleFormSuccess}
      />
    </PageShell>
  );
}
