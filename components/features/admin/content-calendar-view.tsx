"use client";

import * as React from "react";
import { useQueryState } from "nuqs";
import type { Platform, ContentStatus, ContentType } from "@prisma/client";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/social-icons";
import { cn } from "@/lib/utils";

interface CalendarItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  status: ContentStatus;
  scheduledAt: string | Date | null;
  publishDate: string | Date | null;
  adSpend: number | null;
}

interface ContentCalendarViewProps {
  data: CalendarItem[];
  onViewDetails: (contentId: string) => void;
  onCreateContent?: (date: Date) => void;
  isAdmin?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Status color helper for calendar dots
function getStatusDotColor(status: ContentStatus) {
  switch (status) {
    case "POSTED":
      return "bg-emerald-400";
    case "CLIENT_APPROVAL_PENDING":
      return "bg-amber-400";
    case "IDEA":
    case "DRAFT":
      return "bg-zinc-400";
    case "APPROVED":
    case "SCHEDULED":
      return "bg-blue-400";
    case "REJECTED":
      return "bg-rose-400";
    default:
      return "bg-zinc-400";
  }
}

export default function ContentCalendarView({
  data,
  onViewDetails,
  onCreateContent,
  isAdmin = true,
}: ContentCalendarViewProps) {
  // Synchronize the selected month with the URL query parameter `month` (format: YYYY-MM)
  const [monthQuery, setMonthQuery] = useQueryState("month", {
    defaultValue: format(new Date(), "yyyy-MM"),
  });

  // Parse active month or fallback to today
  const activeDate = React.useMemo(() => {
    try {
      if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) {
        return new Date(`${monthQuery}-02T00:00:00`); // Use day 2 to avoid timezone shifts
      }
    } catch (e) {
      // Ignore
    }
    return new Date();
  }, [monthQuery]);

  const handlePrevMonth = () => {
    const prev = subMonths(activeDate, 1);
    setMonthQuery(format(prev, "yyyy-MM"));
  };

  const handleNextMonth = () => {
    const next = addMonths(activeDate, 1);
    setMonthQuery(format(next, "yyyy-MM"));
  };

  const handleToday = () => {
    setMonthQuery(format(new Date(), "yyyy-MM"));
  };

  // Generate full calendar days grid including padding days of start and end weeks
  const daysGrid = React.useMemo(() => {
    const monthStart = startOfMonth(activeDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [activeDate]);

  // Group items by day for faster lookups
  const itemsByDayMap = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    data.forEach((item) => {
      const dateVal = item.scheduledAt || item.publishDate;
      if (!dateVal) return;
      const d = new Date(dateVal);
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });
    return map;
  }, [data]);

  return (
    <div className="flex flex-col space-y-4">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-950/20 p-4 border border-border/80 rounded-xl backdrop-blur-sm">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          {format(activeDate, "MMMM yyyy")}
        </h2>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 text-xs bg-zinc-900 border-border text-foreground hover:bg-zinc-800"
          >
            Today
          </Button>
          <div className="flex items-center border border-border rounded-lg bg-zinc-900 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 hover:bg-zinc-800 border-r border-border rounded-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 hover:bg-zinc-800 rounded-none"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="border border-border/80 rounded-xl bg-zinc-950/20 backdrop-blur-sm overflow-hidden flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-zinc-950/50 py-3 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="text-xs font-semibold text-zinc-400 tracking-wider">
              {day}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-border/60 border-t border-l border-border/60">
          {daysGrid.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDayMap.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, activeDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  "p-2 flex flex-col justify-between group relative border-r border-b border-border/60 overflow-hidden transition-colors hover:bg-zinc-900/10",
                  !isCurrentMonth && "bg-zinc-950/40 text-zinc-600 opacity-60"
                )}
              >
                {/* Day Number and Add Button */}
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <span
                    className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      isDayToday
                        ? "bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/20"
                        : isCurrentMonth
                        ? "text-zinc-200"
                        : "text-zinc-500"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {onCreateContent && isAdmin && isCurrentMonth && (
                    <button
                      onClick={() => onCreateContent(day)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      title="Add content to this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Day Items Chip List */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                  {dayItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onViewDetails(item.id)}
                      className="w-full text-left flex items-center space-x-1.5 p-1 rounded bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 transition-colors focus:outline-none shrink-0 group/chip"
                    >
                      <PlatformIcon platform={item.platform} className="w-3 h-3 shrink-0" />
                      <span className="truncate text-[10px] font-medium text-zinc-300 group-hover/chip:text-white leading-none flex-1">
                        {item.title}
                      </span>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", getStatusDotColor(item.status))} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
