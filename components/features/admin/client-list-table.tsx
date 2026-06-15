"use client";

import * as React from "react";
import Link from "next/link";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/shared/status-badge";
import HealthScoreRing from "@/components/shared/health-score-ring";
import { formatCurrency } from "@/lib/utils";
import {
  MoreHorizontal,
  Search,
  Eye,
  Edit,
  Archive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ClientStatus, PaymentStatus } from "@prisma/client";

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
  paymentStatus: PaymentStatus;
  marketingTheme: string | null;
}

interface ClientListTableProps {
  data: ClientData[];
  loading?: boolean;
  onEdit?: (client: ClientData) => void;
  onArchive?: (id: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getContractLabel(start: string | Date | null, end: string | Date | null): { label: string; variant: "active" | "inactive" | "default" } {
  if (!start) return { label: "Not started", variant: "inactive" };
  const now = new Date();
  const s = new Date(start);
  if (end) {
    const e = new Date(end);
    if (now >= s && now <= e) return { label: "Active", variant: "active" };
    if (now > e) return { label: "Expired", variant: "inactive" };
  }
  if (now < s) return { label: "Upcoming", variant: "inactive" };
  return { label: "Active", variant: "active" };
}

export default function ClientListTable({
  data,
  loading = false,
  onEdit,
  onArchive,
}: ClientListTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const columns = React.useMemo<ColumnDef<ClientData>[]>(
    () => [
      {
        accessorKey: "brandName",
        header: "Brand / Client",
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-full bg-[#F2F8D7] text-[#5B7A1A] border border-[#ECECF4]">
                <AvatarFallback className="font-bold text-xs">
                  {getInitials(client.brandName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/admin/clients/${client.id}/overview`}
                  className="text-sm font-bold text-[#111827] hover:text-[#5B7A1A] transition-colors truncate"
                >
                  {client.brandName}
                </Link>
                <span className="text-[12px] text-[#6B7280] truncate">{client.contactEmail}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      },
      {
        accessorKey: "monthlyRetainer",
        header: "Monthly Retainer",
        cell: ({ row }) => (
          <div>
            <p className="text-base font-bold text-[#111827] leading-none">
              {formatCurrency(row.getValue("monthlyRetainer"))}
            </p>
            <p className="text-[12px] text-[#6B7280] mt-0.5">USD / month</p>
          </div>
        ),
      },
      {
        accessorKey: "healthScore",
        header: "Health Score",
        cell: ({ row }) => {
          const score = row.getValue("healthScore") as number | null;
          return (
            <div className="flex items-center gap-2">
              <HealthScoreRing score={score} size={36} strokeWidth={3} />
              <span className="text-xs font-semibold text-[#6B7280]">
                {score !== null && score !== undefined ? `${score}/100` : "No score yet"}
              </span>
            </div>
          );
        },
      },
      {
        id: "contractPeriod",
        header: "Contract Period",
        cell: ({ row }) => {
          const { contractStart, contractEnd } = row.original;
          if (!contractStart) {
            return (
              <div>
                <p className="text-xs text-[#6B7280]">No contract</p>
                <span className="inline-flex h-5 items-center px-2 rounded-full text-[10px] font-medium bg-[#F4F4FA] text-[#6B7280] mt-0.5">
                  Not started
                </span>
              </div>
            );
          }
          const { label, variant } = getContractLabel(contractStart, contractEnd);
          return (
            <div>
              <p className="text-xs text-[#6B7280]">
                {new Date(contractStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <span className={`inline-flex h-5 items-center px-2 rounded-full text-[10px] font-medium mt-0.5 ${
                variant === "active"
                  ? "bg-[#EEFAF3] text-[#27AE60]"
                  : "bg-[#F4F4FA] text-[#6B7280]"
              }`}>
                {label}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const client = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 border-[#ECECF4] bg-white text-[#111827] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                <DropdownMenuItem
                  render={
                    <Link
                      href={`/admin/clients/${client.id}/overview`}
                      className="flex items-center cursor-pointer"
                    />
                  }
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    render={
                      <Link
                        href={`/admin/clients/${client.id}/settings`}
                        className="flex items-center cursor-pointer"
                      />
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Client
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <>
                    <DropdownMenuSeparator className="bg-[#ECECF4]" />
                    <DropdownMenuItem
                      onClick={() => onArchive(client.id)}
                      className="flex items-center text-rose-500 focus:text-rose-400 focus:bg-rose-50 cursor-pointer"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onArchive]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[280px] rounded-xl bg-muted" />
        <div className="border border-[#ECECF4] rounded-xl overflow-hidden">
          <div className="bg-[#FAFAFC] p-4 border-b border-[#ECECF4]">
            <div className="grid grid-cols-6 gap-4">
              <Skeleton className="h-4 w-28 bg-muted" />
              <Skeleton className="h-4 w-16 bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-20 bg-muted" />
              <Skeleton className="h-4 w-28 bg-muted" />
              <Skeleton className="h-4 w-8 bg-muted" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3.5 border-b border-[#F0F1F5] last:border-0">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full bg-muted" />
                  <div>
                    <Skeleton className="h-3.5 w-28 bg-muted" />
                    <Skeleton className="h-2.5 w-36 bg-muted mt-1" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 bg-muted rounded-full" />
                <Skeleton className="h-3.5 w-20 bg-muted" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-full bg-muted" />
                  <Skeleton className="h-3.5 w-16 bg-muted" />
                </div>
                <Skeleton className="h-3.5 w-24 bg-muted" />
                <Skeleton className="h-8 w-8 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { pageIndex, pageSize } = table.getState().pagination;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, data.length);
  const pageCount = table.getPageCount();

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-[280px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B7280]" />
        <Input
          placeholder="Search by brand or contact..."
          value={(table.getColumn("brandName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("brandName")?.setFilterValue(event.target.value)
          }
          className="h-10 w-full rounded-xl border border-[#ECECF4] bg-white pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#6B7280]/60 focus-visible:ring-2 focus-visible:ring-[#C5F135]/30 focus-visible:border-[#C5F135] transition-all"
        />
      </div>

      {/* Table */}
      <div className="border border-[#ECECF4] rounded-xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-[#FAFAFC] border-b border-[#ECECF4]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-[#ECECF4] hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[#6B7280] font-semibold text-[10px] uppercase tracking-wider py-3 px-5"
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
                  className="border-b border-[#F0F1F5] last:border-0 hover:bg-[#FAFAFC] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5 px-5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center text-[#6B7280] text-sm">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-[#6B7280]">
          Showing {from} to {to} of {data.length} clients
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => table.setPageIndex(i)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  i === pageIndex
                    ? "bg-[#C5F135] text-[#111827]"
                    : "border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
