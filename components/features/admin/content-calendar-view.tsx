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
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const CONTENT_CHIP_COLORS: Record<string, string> = {
  REEL: "bg-purple-50 text-purple-700 border-purple-200",
  POST: "bg-blue-50 text-blue-700 border-blue-200",
  STORY: "bg-orange-50 text-orange-700 border-orange-200",
  VIDEO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CAROUSEL: "bg-pink-50 text-pink-700 border-pink-200",
  THREAD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHORT: "bg-amber-50 text-amber-700 border-amber-200",
  LIVE: "bg-red-50 text-red-700 border-red-200",
};

function getChipStyle(contentType: ContentType): string {
  return CONTENT_CHIP_COLORS[contentType] || "bg-[#F5F5F5] text-[#6B6B80] border-[#ECECF4]";
}

export default function ContentCalendarView({
  data,
  onViewDetails,
}: ContentCalendarViewProps) {
  const [monthQuery, setMonthQuery] = useQueryState("month", {
    defaultValue: format(new Date(), "yyyy-MM"),
  });

  const activeDate = React.useMemo(() => {
    try {
      if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) {
        return new Date(`${monthQuery}-02T00:00:00`);
      }
    } catch {
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

  const daysGrid = React.useMemo(() => {
    const monthStart = startOfMonth(activeDate);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [activeDate]);

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

  const isCurrentMonthActive = isSameMonth(activeDate, new Date());

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-5">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <h2 className="text-base font-bold text-[#111827] min-w-[140px] text-center select-none">
            {format(activeDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={handleNextMonth}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#C5F135] bg-white transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={handleToday}
          className={cn(
            "h-7 px-3 rounded-lg text-xs font-medium transition-all border",
            isCurrentMonthActive
              ? "bg-[#F2F8D7] text-[#111827] border-[#C5F135]"
              : "bg-white text-[#6B7280] border-[#ECECF4] hover:text-[#111827] hover:border-[#C5F135]"
          )}
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden">
        {/* Week Header */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center">
              <span className="text-[13px] font-medium text-[#9CA3AF]">{day}</span>
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 border-t border-l border-[#ECECF4] rounded-[12px] overflow-hidden">
          {daysGrid.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDayMap.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, activeDate);
            const isDayToday = isToday(day);
            const displayItems = dayItems.slice(0, 2);
            const remainingCount = dayItems.length - 2;

            return (
              <div
                key={idx}
                className={cn(
                  "h-[110px] p-2 flex flex-col border-r border-b border-[#ECECF4] transition-colors",
                  isCurrentMonth ? "bg-white" : "bg-[#FAFAFC]"
                )}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between shrink-0 mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full leading-none",
                      isDayToday
                        ? "bg-[#C5F135] text-[#111827] font-bold"
                        : isCurrentMonth
                        ? "text-[#6B7280]"
                        : "text-[#D1D5DB]"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Content Chips */}
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {displayItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onViewDetails(item.id)}
                      className={cn(
                        "w-full flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium truncate border transition-colors",
                        getChipStyle(item.contentType),
                        "hover:opacity-80"
                      )}
                    >
                      <PlatformIcon platform={item.platform} className="w-3 h-3 shrink-0" />
                      <span className="truncate leading-none">{item.title}</span>
                    </button>
                  ))}
                  {remainingCount > 0 && (
                    <button
                      onClick={() => {
                        /* Could open a day-detail view */
                      }}
                      className="text-[11px] font-medium text-[#6B7280] hover:text-[#111827] ml-1 leading-none"
                    >
                      +{remainingCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
