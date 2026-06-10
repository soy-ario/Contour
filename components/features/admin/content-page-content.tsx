"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Platform, ContentStatus, ContentType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContentListView from "@/components/features/admin/content-list-view";
import ContentCalendarView from "@/components/features/admin/content-calendar-view";
import ApprovalQueuePanel from "@/components/features/admin/approval-queue-panel";
import ContentDetailSheet from "@/components/features/admin/content-detail-sheet";
import CreateContentSheet from "@/components/features/admin/create-content-sheet";
import PageShell from "@/components/layout/page-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  List,
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  CirclePlay,
} from "lucide-react";
import { PLATFORM_LABELS } from "@/types";

interface ClientOption {
  id: string;
  brandName: string;
}

interface ContentItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  status: ContentStatus;
  scheduledAt: string | Date | null;
  publishDate: string | Date | null;
  adSpend: number | null;
  clientBrandName?: string;
  clientId: string;
  assetUrls: string[];
  updatedAt: string | Date;
}

interface ContentPageContentProps {
  initialContents: ContentItem[];
  pendingContents: ContentItem[];
  clients: ClientOption[];
  clientId?: string | null; // Pre-filtered if on client page
  user: {
    name: string;
    email: string;
    username: string;
  };
}

export default function ContentPageContent({
  initialContents,
  pendingContents,
  clients,
  clientId = null,
  user,
}: ContentPageContentProps) {
  const router = useRouter();

  // URL State Management using nuqs
  const [view, setView] = useQueryState("view", { defaultValue: "list" });
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [filterClient, setFilterClient] = useQueryState("filterClient", { defaultValue: "all" });
  const [filterPlatform, setFilterPlatform] = useQueryState("filterPlatform", { defaultValue: "all" });
  const [filterStatus, setFilterStatus] = useQueryState("filterStatus", { defaultValue: "all" });

  // UI Dialog/Sheet States
  const [selectedContentId, setSelectedContentId] = React.useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
  const [editContentId, setEditContentId] = React.useState<string | null>(null);

  // Active client ID context (prioritizes route parameter, falls back to filter state)
  const activeClientId = clientId || (filterClient !== "all" ? filterClient : null);

  const handleViewDetails = (id: string) => {
    setSelectedContentId(id);
    setIsDetailOpen(true);
  };

  const handleEditContent = (id: string) => {
    setEditContentId(id);
    setCreateSheetOpen(true);
  };

  const handleCreateContent = () => {
    setEditContentId(null);
    setCreateSheetOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content item? This action is permanent.")) {
      return;
    }
    const toastId = toast.loading("Deleting content...");
    try {
      const targetContent = initialContents.find((c) => c.id === id);
      if (!targetContent) return;

      const response = await fetch(`/api/clients/${targetContent.clientId}/content/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content deleted successfully!", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to delete content", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  const handleApprove = async (id: string) => {
    const targetContent = initialContents.find((c) => c.id === id);
    if (!targetContent) return;

    const toastId = toast.loading("Approving content...");
    try {
      const response = await fetch(`/api/clients/${targetContent.clientId}/content/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "Approved from content list" }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content approved successfully!", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to approve content", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  const handleSubmitApproval = async (id: string) => {
    const targetContent = initialContents.find((c) => c.id === id);
    if (!targetContent) return;

    const toastId = toast.loading("Submitting content for approval...");
    try {
      const response = await fetch(`/api/clients/${targetContent.clientId}/content/${id}/submit`, {
        method: "POST",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content submitted successfully!", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to submit content", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  return (
    <PageShell
      title={clientId ? "Content Management" : "Global Content Pipeline"}
      user={user}
      actions={
        <Button
          onClick={handleCreateContent}
          className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs h-9 shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Content
        </Button>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Workspace */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Filters and View Toggles */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-zinc-900/10 p-3 border border-border/40 rounded-xl">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                <Input
                  placeholder="Search titles/concepts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-850 text-xs placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                />
              </div>

              {!clientId && (
                <Select value={filterClient} onValueChange={(val) => setFilterClient(val)}>
                  <SelectTrigger className="w-full md:w-40 bg-zinc-950 border-zinc-850 focus:ring-zinc-700 text-xs text-zinc-300">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-850 text-zinc-200">
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.brandName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={filterPlatform} onValueChange={(val) => setFilterPlatform(val)}>
                <SelectTrigger className="w-full md:w-36 bg-zinc-950 border-zinc-850 focus:ring-zinc-700 text-xs text-zinc-300">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-850 text-zinc-200">
                  <SelectItem value="all">All Platforms</SelectItem>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
                <SelectTrigger className="w-full md:w-36 bg-zinc-950 border-zinc-850 focus:ring-zinc-700 text-xs text-zinc-300">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-850 text-zinc-200">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="IDEA">Idea</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CLIENT_APPROVAL_PENDING">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View toggler */}
            <div className="flex items-center space-x-1 border border-border/40 rounded-lg p-0.5 bg-zinc-950/60 shrink-0">
              <Button
                size="sm"
                variant={view === "list" ? "secondary" : "ghost"}
                onClick={() => setView("list")}
                className={cn(
                  "h-7 text-xs font-semibold px-2.5",
                  view === "list" ? "bg-zinc-900 text-foreground border-border/20 border" : "text-muted-foreground"
                )}
              >
                <List className="w-3.5 h-3.5 mr-1" /> List
              </Button>
              <Button
                size="sm"
                variant={view === "calendar" ? "secondary" : "ghost"}
                onClick={() => setView("calendar")}
                className={cn(
                  "h-7 text-xs font-semibold px-2.5",
                  view === "calendar" ? "bg-zinc-900 text-foreground border-border/20 border" : "text-muted-foreground"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1" /> Calendar
              </Button>
            </div>
          </div>

          {/* Table / Calendar Renderer */}
          {view === "list" ? (
            <ContentListView
              data={initialContents}
              showClient={!clientId}
              onViewDetails={handleViewDetails}
              onEdit={handleEditContent}
              onSubmitApproval={handleSubmitApproval}
              onApprove={handleApprove}
              onDelete={handleDelete}
              onSchedule={handleViewDetails} // Schedule opens detail modal to select date
            />
          ) : (
            <ContentCalendarView
              data={initialContents}
              onViewDetails={handleViewDetails}
              onCreateContent={handleCreateContent}
            />
          )}
        </div>

        {/* Sidebar Approval Queue Panel (Only on list view and global pages) */}
        {!clientId && view === "list" && (
          <div className="w-full lg:w-80 shrink-0">
            <ApprovalQueuePanel
              items={pendingContents.map((c) => ({
                id: c.id,
                title: c.title,
                platform: c.platform,
                contentType: c.contentType,
                clientBrandName: c.clientBrandName || "Brand",
                clientId: c.clientId,
                updatedAt: c.updatedAt,
              }))}
              onView={handleViewDetails}
              onApproveSuccess={handleSuccess}
            />
          </div>
        )}
      </div>

      {/* Content Detail Sheet */}
      <ContentDetailSheet
        contentId={selectedContentId}
        clientId={
          selectedContentId
            ? initialContents.find((c) => c.id === selectedContentId)?.clientId || clientId
            : clientId
        }
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditContent}
        onStateChanged={handleSuccess}
      />

      {/* Create / Edit Content Sheet */}
      <CreateContentSheet
        clientId={clientId || activeClientId}
        contentIdToEdit={editContentId}
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSuccess={handleSuccess}
      />
    </PageShell>
  );
}
