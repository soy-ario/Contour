"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { getMetricsForPlatform, formatPlatformMetric, type PlatformMetric } from "@/lib/services/platforms/metric-utils";

interface PlatformSpecificMetricsSectionProps {
  platformFilter: string;
  platformSpecificMetrics: Record<string, number>;
}

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X (Twitter)",
};

export function PlatformSpecificMetricsSection({
  platformFilter,
  platformSpecificMetrics,
}: PlatformSpecificMetricsSectionProps) {
  if (platformFilter === "all") return null;

  const metrics = getMetricsForPlatform(platformFilter as any);
  if (metrics.length === 0) return null;

  const getMetricValue = (m: PlatformMetric): number | null => {
    const val = platformSpecificMetrics[m.key];
    if (val == null || val === undefined) return null;
    return val;
  };

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-1.5">
        <Info className="w-4 h-4 text-[#82D616]" />
        Platform-Specific Insights:{" "}
        {PLATFORM_LABELS[platformFilter] ?? platformFilter}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const value = getMetricValue(m);
          if (value === null) return null;

          return (
            <div key={m.key} className="bg-white p-4 rounded-xl border border-[#E5E7EB]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                {m.label}
              </span>
              <span className="text-2xl font-black text-[#111827] block mt-1">
                {formatPlatformMetric(value, m.format)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
