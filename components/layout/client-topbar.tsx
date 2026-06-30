"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { Calendar as CalendarIcon, ChevronDown, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ClientTopbarProps {
  brandName: string;
  contractStart?: Date;
  contractEnd?: Date;
}

const navItems = [
  { label: "Overview", href: "/client/dashboard" },
  { label: "Analytics", href: "/client/analytics" },
  { label: "Content", href: "/client/content" },
  { label: "Products", href: "/client/products" },
  { label: "Requests & Feedback", href: "/client/requests" },
  { label: "Settings", href: "/client/settings" },
];

function getContractPeriod(now: Date, contractStart?: Date, contractEnd?: Date) {
  if (contractStart && contractEnd) {
    return {
      from: new Date(contractStart),
      to: new Date(contractEnd),
    };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from, to };
}

function getDefaultComparison(contractFrom: Date) {
  const to = new Date(contractFrom);
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from, to };
}

export default function ClientTopbar({ brandName, contractStart, contractEnd }: ClientTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const now = new Date();
  const contract = getContractPeriod(now, contractStart, contractEnd);

  const [comparisonRange, setComparisonRange] = React.useState<{ from: Date; to: Date }>(
    getDefaultComparison(contract.from)
  );
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [hoveredDate, setHoveredDate] = React.useState<Date | null>(null);
  const hoverRef = React.useRef<Date | null>(null);

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fmtFull = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const currentLabel = `${fmt(contract.from)} – ${fmtFull(contract.to)}`;
  const comparisonLabel = `vs ${fmt(comparisonRange.from)} – ${fmtFull(comparisonRange.to)}`;

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const handlePointerMove = React.useCallback((e: React.PointerEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-day]");
    if (!btn) return;
    const dayStr = btn.getAttribute("data-day");
    if (!dayStr) return;
    const d = new Date(dayStr);
    if (isNaN(d.getTime())) return;
    const prev = hoverRef.current;
    if (!prev || d.getTime() !== prev.getTime()) {
      hoverRef.current = d;
      setHoveredDate(d);
    }
  }, [setHoveredDate]);

  const handlePointerLeave = React.useCallback(() => {
    hoverRef.current = null;
    setHoveredDate(null);
  }, [setHoveredDate]);

  const rangeStart = React.useMemo(() => {
    if (!hoveredDate) return null;
    const s = new Date(hoveredDate);
    s.setDate(s.getDate() - 29);
    return s;
  }, [hoveredDate]);

  return (
    <header className="h-[72px] border-b border-[#ECECF4] bg-white sticky top-0 z-30 flex items-center justify-between px-8">
      {/* LEFT: Brand + Campaign */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/client/dashboard" className="shrink-0">
          <div className="w-10 h-10 bg-black flex items-center justify-center rounded-xl">
            <span className="text-white text-base font-bold">{brandName?.charAt(0) || "C"}</span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">{brandName}</span>
          <span className="bg-[#FFE3E3] text-[#F2485A] text-xs font-bold px-2.5 py-0.5 rounded-full">
            Campaign Active
          </span>
        </div>
      </div>

      {/* CENTER: Navigation */}
      <nav className="hidden md:flex items-center space-x-8 mx-auto">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative pb-3 transition-colors duration-200 whitespace-nowrap"
            >
              <span className={cn(
                "text-sm transition-colors duration-200",
                isActive ? "text-gray-900 font-bold" : "text-[#6B7280] hover:text-gray-900"
              )}>
                {item.label}
              </span>
              <span className={cn(
                "absolute bottom-0 left-2 right-2 h-0.5 bg-[#F2485A] rounded-full transition-all duration-300 ease-in-out",
                isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
              )} />
            </Link>
          );
        })}
      </nav>

      {/* RIGHT: Date + User */}
      <div className="flex items-center gap-4">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger className="hidden lg:flex items-center space-x-2 border border-gray-200 bg-white rounded-full px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <CalendarIcon className="w-4 h-4 text-[#6B7280]" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{currentLabel}</span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">{comparisonLabel}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-auto p-3"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <Calendar
              mode="single"
              onSelect={(date) => {
                if (!date) return;
                const from = new Date(date);
                from.setDate(from.getDate() - 29);
                setComparisonRange({ from, to: date });
                setCalendarOpen(false);
              }}
              disabled={{ after: new Date() }}
              modifiers={{
                contractPeriod: contract,
                hoverRange: (date: Date) => {
                  if (!rangeStart || !hoveredDate) return false;
                  return date >= rangeStart && date <= hoveredDate && !(date >= contract.from && date <= contract.to);
                },
              }}
              modifiersStyles={{
                contractPeriod: { backgroundColor: "#FFE5E5", borderRadius: "4px", fontWeight: "600" },
                hoverRange: { backgroundColor: "#FFEAEA", borderRadius: "4px" },
              }}
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={handleSignOut}
          className="w-9 h-9 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#B91C1C] hover:brightness-95 transition-all"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
