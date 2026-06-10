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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/shared/status-badge";
import HealthScoreRing from "@/components/shared/health-score-ring";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MoreHorizontal,
  ArrowUpDown,
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4 font-semibold text-foreground/80 hover:text-foreground"
          >
            Brand Name
            <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        ),
        cell: ({ row }) => {
          const client = row.original;
          const initials = client.brandName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div className="flex items-center space-x-3">
              <Avatar className="w-9 h-9 border border-border bg-zinc-800 text-zinc-200">
                <AvatarFallback className="font-bold text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <Link
                  href={`/admin/clients/${client.id}/overview`}
                  className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                >
                  {client.brandName}
                </Link>
                {client.industry && (
                  <span className="text-xs text-muted-foreground truncate">{client.industry}</span>
                )}
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4 font-semibold text-foreground/80 hover:text-foreground"
          >
            Monthly Retainer
            <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {formatCurrency(row.getValue("monthlyRetainer"))}
          </span>
        ),
      },
      {
        accessorKey: "healthScore",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent -ml-4 font-semibold text-foreground/80 hover:text-foreground"
          >
            Health
            <ArrowUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex justify-start pl-2">
            <HealthScoreRing score={row.getValue("healthScore")} size={40} strokeWidth={3} />
          </div>
        ),
      },
      {
        accessorKey: "contractDates",
        header: "Contract Period",
        cell: ({ row }) => {
          const start = row.original.contractStart;
          const end = row.original.contractEnd;
          if (!start) return <span className="text-muted-foreground">No contract</span>;
          return (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(start, "MMM dd, yyyy")}
              {end && ` - ${formatDate(end, "MMM dd, yyyy")}`}
            </span>
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
                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-40 border-border bg-popover text-popover-foreground">
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
                    onClick={() => onEdit(client)}
                    className="flex items-center cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Client
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={() => onArchive(client.id)}
                      className="flex items-center text-rose-500 focus:text-rose-400 focus:bg-rose-950/20 cursor-pointer"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Client
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

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72 bg-muted" />
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/30 p-4 border-b border-border">
            <div className="grid grid-cols-6 gap-4">
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-16 bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-12 bg-muted" />
              <Skeleton className="h-4 w-28 bg-muted" />
              <Skeleton className="h-4 w-8 bg-muted" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-border last:border-0">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                </div>
                <Skeleton className="h-5 w-16 bg-muted rounded-full" />
                <Skeleton className="h-4 w-16 bg-muted" />
                <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                <Skeleton className="h-4 w-32 bg-muted" />
                <Skeleton className="h-8 w-8 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brand or contact..."
            value={(table.getColumn("brandName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("brandName")?.setFilterValue(event.target.value)
            }
            className="pl-9 bg-zinc-900 border-border text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-zinc-700"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="border border-border rounded-lg bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-950/40 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground font-semibold text-xs py-4 px-6"
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
                  className="border-b border-border last:border-0 hover:bg-zinc-900/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-6 align-middle text-sm text-foreground/90">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <div>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length
            )}{" "}
            of {data.length} clients
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="bg-zinc-900 border-border hover:bg-zinc-800 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <span className="text-xs font-semibold text-foreground/80">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="bg-zinc-900 border-border hover:bg-zinc-800 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
