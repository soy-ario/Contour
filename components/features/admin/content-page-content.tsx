"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import type { Platform, ContentStatus, ContentType } from "@prisma/client";
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
} from "lucide-react";
import { PLATFORM_LABELS, CONTENT_STATUS_LABELS } from "@/types";

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
  clientId?: string | null;
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

  const [view, setView] = useQueryState("view", { defaultValue: "list" });
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [filterClient, setFilterClient] = useQueryState("filterClient", { defaultValue: "all" });
  const [filterPlatform, setFilterPlatform] = useQueryState("filterPlatform", { defaultValue: "all" });
  const [filterStatus, setFilterStatus] = useQueryState("filterStatus", { defaultValue: "all" });

  const [selectedContentId, setSelectedContentId] = React.useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
  const [editContentId, setEditContentId] = React.useState<string | null>(null);

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
    } catch {
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
    } catch {
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
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  const breadcrumbs = [{ label: "Content", href: "/admin/content" }];

  return (
    <PageShell
      title="Content"
      breadcrumbs={breadcrumbs}
      user={user}
      actions={
        <Button
          onClick={handleCreateContent}
          className="h-11 px-[18px] rounded-xl bg-[#C5F135] hover:bg-[#B8E620] active:bg-[#8FBF00] text-[#111827] text-sm font-semibold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Content
        </Button>
      }
    >
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Filter Card */}
        <div className="bg-white rounded-[20px] border border-[#ECECF4] p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none" />
              <Input
                placeholder="Search titles, concepts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 rounded-xl border border-[#ECECF4] text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5F135] focus-visible:border-transparent"
              />
            </div>

            {!clientId && (
              <Select value={filterClient} onValueChange={(val) => setFilterClient(val)}>
                <SelectTrigger className="w-[220px] h-[42px] rounded-xl border border-[#ECECF4] text-sm text-[#111827] bg-white focus:ring-[#C5F135] px-3.5">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
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
              <SelectTrigger className="w-[220px] h-[42px] rounded-xl border border-[#ECECF4] text-sm text-[#111827] bg-white focus:ring-[#C5F135] px-3.5">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                <SelectItem value="all">All Platforms</SelectItem>
                {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
              <SelectTrigger className="w-[180px] h-[42px] rounded-xl border border-[#ECECF4] text-sm text-[#111827] bg-white focus:ring-[#C5F135] px-3.5">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(CONTENT_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center rounded-lg border border-[#ECECF4] p-0.5 bg-white">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all",
                  view === "list"
                    ? "bg-[#F2F8D7] text-[#111827]"
                    : "text-[#9CA3AF] hover:text-[#6B7280] bg-white"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={cn(
                  "flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all",
                  view === "calendar"
                    ? "bg-[#F2F8D7] text-[#111827]"
                    : "text-[#9CA3AF] hover:text-[#6B7280] bg-white"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            {view === "list" ? (
              <ContentListView
                data={initialContents}
                showClient={!clientId}
                onViewDetails={handleViewDetails}
                onEdit={handleEditContent}
                onSubmitApproval={handleSubmitApproval}
                onApprove={handleApprove}
                onDelete={handleDelete}
                onSchedule={handleViewDetails}
              />
            ) : (
              <ContentCalendarView
                data={initialContents}
                onViewDetails={handleViewDetails}
                onCreateContent={handleCreateContent}
              />
            )}
          </div>

          {!clientId && view === "list" && (
            <div className="w-[300px] shrink-0">
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
      </div>

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
