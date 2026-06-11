"use client";

import * as React from "react";
import type { Platform, ContentStatus, ContentType } from "@prisma/client";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformIcon } from "@/components/shared/social-icons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CONTENT_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@/types";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  CheckCircle,
  CalendarDays,
  Trash2,
  FileText,
} from "lucide-react";

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
}

interface ContentListViewProps {
  data: ContentItem[];
  loading?: boolean;
  showClient?: boolean;
  onViewDetails: (contentId: string) => void;
  onEdit?: (contentId: string) => void;
  onSubmitApproval?: (contentId: string) => void;
  onApprove?: (contentId: string) => void;
  onSchedule?: (contentId: string) => void;
  onDelete?: (contentId: string) => void;
  isAdmin?: boolean;
}

const STATUS_VARIANTS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B80]" },
  IDEA: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B80]" },
  CLIENT_APPROVAL_PENDING: { bg: "bg-[#FFF4EC]", text: "text-[#E07A2F]" },
  APPROVED: { bg: "bg-[#EEF0FF]", text: "text-[#5B5EEF]" },
  SCHEDULED: { bg: "bg-[#F0EEFF]", text: "text-[#7C5BEF]" },
  POSTED: { bg: "bg-[#EEFAF3]", text: "text-[#27AE60]" },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-500" },
};

function StatusPill({ status }: { status: ContentStatus }) {
  const variant = STATUS_VARIANTS[status] || STATUS_VARIANTS.DRAFT;
  const label = CONTENT_STATUS_LABELS[status] || status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-semibold ${variant.bg} ${variant.text}`}
    >
      {label}
    </span>
  );
}

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  REEL: { bg: "bg-purple-50", text: "text-purple-700" },
  POST: { bg: "bg-blue-50", text: "text-blue-700" },
  STORY: { bg: "bg-orange-50", text: "text-orange-700" },
  VIDEO: { bg: "bg-emerald-50", text: "text-emerald-700" },
  CAROUSEL: { bg: "bg-pink-50", text: "text-pink-700" },
  THREAD: { bg: "bg-indigo-50", text: "text-indigo-700" },
  SHORT: { bg: "bg-amber-50", text: "text-amber-700" },
  LIVE: { bg: "bg-red-50", text: "text-red-700" },
};

export default function ContentListView({
  data,
  loading = false,
  showClient = false,
  onViewDetails,
  onEdit,
  onSubmitApproval,
  onApprove,
  onSchedule,
  onDelete,
  isAdmin = true,
}: ContentListViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<ColumnDef<ContentItem>[]>(() => {
    const cols: ColumnDef<ContentItem>[] = [
      {
        id: "thumbnail",
        size: 60,
        header: "",
        cell: ({ row }) => {
          const type = row.original.contentType;
          const color = CONTENT_TYPE_COLORS[type] || { bg: "bg-[#F5F5F5]", text: "text-[#6B6B80]" };
          return (
            <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center`}>
              <FileText className={`w-4 h-4 ${color.text}`} />
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Content",
        cell: ({ row }) => {
          const content = row.original;
          return (
            <div className="flex flex-col min-w-0">
              <button
                onClick={() => onViewDetails(content.id)}
                className="text-sm font-semibold text-[#111827] hover:text-[#5B7A1A] transition-colors truncate text-left focus:outline-none"
              >
                {content.title}
              </button>
              <span className="text-[12px] text-[#9CA3AF] mt-0.5">
                {PLATFORM_LABELS[content.platform] || content.platform.toLowerCase()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => {
          const platform = row.getValue("platform") as Platform;
          return (
            <div className="flex items-center gap-2">
              <PlatformIcon platform={platform} className="w-4 h-4 shrink-0" />
              <span className="text-[13px] text-[#6B7280] font-medium">
                {PLATFORM_LABELS[platform] || platform.toLowerCase()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "contentType",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("contentType") as ContentType;
          const color = CONTENT_TYPE_COLORS[type] || { bg: "bg-[#F5F5F5]", text: "text-[#6B6B80]" };
          return (
            <span className={`inline-flex items-center h-6 px-2 rounded text-[11px] font-semibold ${color.bg} ${color.text}`}>
              {CONTENT_TYPE_LABELS[type] || type}
            </span>
          );
        },
      },
    ];

    if (showClient) {
      cols.push({
        accessorKey: "clientBrandName",
        header: "Client",
        cell: ({ row }) => (
          <span className="text-[13px] font-semibold text-[#6B7280]">
            {row.original.clientBrandName || "—"}
          </span>
        ),
      });
    }

    cols.push(
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.getValue("status") as ContentStatus} />,
      },
      {
        accessorKey: "scheduledAt",
        header: "Publish Date",
        cell: ({ row }) => {
          const date = row.original.scheduledAt || row.original.publishDate;
          if (!date) return <span className="text-[13px] text-[#9CA3AF]">Unscheduled</span>;
          return (
            <span className="text-[13px] text-[#6B7280] whitespace-nowrap">
              {formatDate(date, "MMM dd, yyyy")}
            </span>
          );
        },
      },
      {
        accessorKey: "adSpend",
        header: "Ad Spend",
        cell: ({ row }) => {
          const spend = row.getValue("adSpend") as number | null;
          if (spend === null || spend === 0) return <span className="text-[13px] text-[#9CA3AF]">—</span>;
          return (
            <span className="text-[13px] font-semibold text-[#111827]">
              {formatCurrency(spend)}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const content = row.original;
          const isDraft = content.status === "DRAFT" || content.status === "IDEA";
          const isPending = content.status === "CLIENT_APPROVAL_PENDING";
          const isApproved = content.status === "APPROVED";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#ECECF4] text-[#9CA3AF] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 border-[#ECECF4] bg-white text-[#111827] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                <DropdownMenuItem onClick={() => onViewDetails(content.id)} className="flex items-center cursor-pointer text-[13px]">
                  <Eye className="w-3.5 h-3.5 mr-2 text-[#6B7280]" />
                  View Details
                </DropdownMenuItem>

                {onEdit && isDraft && (
                  <DropdownMenuItem onClick={() => onEdit(content.id)} className="flex items-center cursor-pointer text-[13px]">
                    <Edit className="w-3.5 h-3.5 mr-2 text-[#6B7280]" />
                    Edit Details
                  </DropdownMenuItem>
                )}

                {onSubmitApproval && content.status === "DRAFT" && isAdmin && (
                  <DropdownMenuItem onClick={() => onSubmitApproval(content.id)} className="flex items-center text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer text-[13px]">
                    <Send className="w-3.5 h-3.5 mr-2" />
                    Submit Approval
                  </DropdownMenuItem>
                )}

                {onApprove && isPending && (
                  <DropdownMenuItem onClick={() => onApprove(content.id)} className="flex items-center text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer text-[13px]">
                    <CheckCircle className="w-3.5 h-3.5 mr-2" />
                    Approve Content
                  </DropdownMenuItem>
                )}

                {onSchedule && isApproved && isAdmin && (
                  <DropdownMenuItem onClick={() => onSchedule(content.id)} className="flex items-center text-blue-600 focus:text-blue-700 focus:bg-blue-50 cursor-pointer text-[13px]">
                    <CalendarDays className="w-3.5 h-3.5 mr-2" />
                    Schedule Post
                  </DropdownMenuItem>
                )}

                {onDelete && (content.status === "IDEA" || content.status === "DRAFT") && isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-[#ECECF4]" />
                    <DropdownMenuItem
                      onClick={() => onDelete(content.id)}
                      className="flex items-center text-rose-500 focus:text-rose-600 focus:bg-rose-50 cursor-pointer text-[13px]"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete Item
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }
    );

    return cols;
  }, [showClient, onViewDetails, onEdit, onSubmitApproval, onApprove, onSchedule, onDelete, isAdmin]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
        <div className="bg-[#FAFAFC] rounded-[14px] p-4 border border-[#ECECF4]">
          <div className="grid grid-cols-8 gap-4">
            <Skeleton className="h-4 w-10 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-32 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-20 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-16 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-24 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-24 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-24 bg-[#E5E7EB]" />
            <Skeleton className="h-4 w-8 bg-[#E5E7EB]" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-4 border-b border-[#F0F1F5] last:border-0">
            <div className="grid grid-cols-8 gap-4 items-center">
              <Skeleton className="w-10 h-10 rounded-lg bg-[#F5F5F5]" />
              <Skeleton className="h-4 w-48 bg-[#F5F5F5]" />
              <Skeleton className="h-4 w-16 bg-[#F5F5F5]" />
              <Skeleton className="h-5 w-12 bg-[#F5F5F5] rounded" />
              <Skeleton className="h-7 w-24 bg-[#F5F5F5] rounded-full" />
              <Skeleton className="h-4 w-24 bg-[#F5F5F5]" />
              <Skeleton className="h-4 w-16 bg-[#F5F5F5]" />
              <Skeleton className="h-8 w-8 bg-[#F5F5F5] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F4F4FA] flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-[#9CA3AF]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">No content items found</h3>
          <p className="text-sm text-[#6B7280] mt-1 mb-5 max-w-sm">
            Create your first content item to start managing campaigns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#111827] leading-tight tracking-tight">
            Content Registry
          </h2>
          <p className="text-[14px] text-[#6B7280] mt-0.5">
            Track content production across all clients.
          </p>
        </div>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-[#FAFAFC] text-[#6B7280] font-semibold text-[11px] uppercase tracking-wider h-[52px] first:rounded-l-[14px] last:rounded-r-[14px] px-4"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-[#F0F1F5] last:border-0 hover:bg-[#FAFAFC] transition-colors"
                style={{ height: 72 }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-0 px-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X",
};
