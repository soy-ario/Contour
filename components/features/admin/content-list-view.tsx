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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/shared/status-badge";
import { PlatformIcon } from "@/components/shared/social-icons";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Edit,
  Send,
  CheckCircle,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { CONTENT_TYPE_LABELS } from "@/types";

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
        accessorKey: "title",
        header: "Content Item",
        cell: ({ row }) => {
          const content = row.original;
          return (
            <div className="flex flex-col min-w-0">
              <button
                onClick={() => onViewDetails(content.id)}
                className="font-semibold text-foreground hover:text-white transition-colors truncate text-left focus:outline-none"
              >
                {content.title}
              </button>
              <span className="text-[10px] text-zinc-500 mt-0.5">ID: {content.id}</span>
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
            <div className="flex items-center space-x-2">
              <PlatformIcon platform={platform} className="w-4 h-4 shrink-0" />
              <span className="text-xs text-zinc-300 font-medium capitalize">
                {platform.toLowerCase()}
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
          return (
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded">
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
          <span className="font-semibold text-emerald-400 text-xs uppercase tracking-wider">
            {row.original.clientBrandName || "N/A"}
          </span>
        ),
      });
    }

    cols.push(
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      },
      {
        accessorKey: "scheduledAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4 font-semibold text-foreground/80 hover:text-foreground"
          >
            Scheduled Date
            <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.original.scheduledAt || row.original.publishDate;
          if (!date) return <span className="text-zinc-600 text-xs">Unscheduled</span>;
          return (
            <span className="text-xs text-zinc-300 whitespace-nowrap">
              {formatDate(date, "MMM dd, yyyy")}
            </span>
          );
        },
      },
      {
        accessorKey: "adSpend",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4 font-semibold text-foreground/80 hover:text-foreground"
          >
            Ad Spend
            <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        ),
        cell: ({ row }) => {
          const spend = row.getValue("adSpend") as number | null;
          if (spend === null || spend === 0) return <span className="text-zinc-600 text-xs">—</span>;
          return (
            <span className="font-semibold text-emerald-400">
              {formatCurrency(spend)}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const content = row.original;
          const isDraft = content.status === "DRAFT" || content.status === "IDEA" || content.status === "CLIENT_APPROVAL_PENDING";
          const isPending = content.status === "CLIENT_APPROVAL_PENDING";
          const isApproved = content.status === "APPROVED";

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 border-border bg-popover text-popover-foreground">
                <DropdownMenuItem onClick={() => onViewDetails(content.id)} className="flex items-center cursor-pointer">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>

                {onEdit && isDraft && (
                  <DropdownMenuItem onClick={() => onEdit(content.id)} className="flex items-center cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                )}

                {onSubmitApproval && content.status === "DRAFT" && isAdmin && (
                  <DropdownMenuItem onClick={() => onSubmitApproval(content.id)} className="flex items-center text-amber-400 focus:text-amber-300 focus:bg-amber-950/20 cursor-pointer">
                    <Send className="w-4 h-4 mr-2" />
                    Submit Approval
                  </DropdownMenuItem>
                )}

                {onApprove && isPending && (
                  <DropdownMenuItem onClick={() => onApprove(content.id)} className="flex items-center text-emerald-400 focus:text-emerald-300 focus:bg-emerald-950/20 cursor-pointer">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Content
                  </DropdownMenuItem>
                )}

                {onSchedule && isApproved && isAdmin && (
                  <DropdownMenuItem onClick={() => onSchedule(content.id)} className="flex items-center text-blue-400 focus:text-blue-300 focus:bg-blue-950/20 cursor-pointer">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Schedule Post
                  </DropdownMenuItem>
                )}

                {onDelete && (content.status === "IDEA" || content.status === "DRAFT") && isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => onDelete(content.id)}
                      className="flex items-center text-rose-500 focus:text-rose-400 focus:bg-rose-950/20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
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
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="border border-border rounded-xl bg-card/25 overflow-hidden">
        <div className="bg-zinc-950/40 p-4 border-b border-border">
          <div className="grid grid-cols-6 gap-4">
            <Skeleton className="h-4 w-32 bg-muted" />
            <Skeleton className="h-4 w-20 bg-muted" />
            <Skeleton className="h-4 w-16 bg-muted" />
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-4 w-24 bg-muted" />
            <Skeleton className="h-4.w-8 bg-muted" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border-b border-border last:border-0">
            <div className="grid grid-cols-6 gap-4 items-center">
              <Skeleton className="h-4 w-48 bg-muted" />
              <Skeleton className="h-4 w-16 bg-muted" />
              <Skeleton className="h-4.5 w-12 bg-muted rounded" />
              <Skeleton className="h-5 w-20 bg-muted rounded-full" />
              <Skeleton className="h-4.w-24 bg-muted" />
              <Skeleton className="h-8 w-8 bg-muted rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl bg-zinc-950/20 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950/50 border-b border-border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-zinc-400 font-semibold text-xs py-4.px-6"
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-zinc-900/20 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4.5 px-6 align-middle text-sm text-zinc-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-zinc-500">
                No content items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
