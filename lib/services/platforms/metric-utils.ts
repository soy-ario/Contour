import type { Platform } from "@prisma/client";

export interface PlatformMetric {
  key: string;
  label: string;
  description: string;
  applicable: Platform[];
  format: "number" | "decimal" | "time" | "percentage";
}

export const PLATFORM_SPECIFIC_METRICS: PlatformMetric[] = [
  { key: "videoViews", label: "Video Views", description: "Views on video content", applicable: ["INSTAGRAM", "FACEBOOK", "YOUTUBE", "TIKTOK", "X"], format: "number" },
  { key: "watchTimeSecs", label: "Watch Time", description: "Total minutes watched", applicable: ["YOUTUBE"], format: "time" },
  { key: "avgWatchPct", label: "Avg Watch %", description: "Average percentage of video watched", applicable: ["YOUTUBE"], format: "percentage" },
  { key: "ctr", label: "CTR", description: "Click-through rate", applicable: ["FACEBOOK", "YOUTUBE", "X", "LINKEDIN"], format: "percentage" },
  { key: "replies", label: "Replies", description: "Reply count", applicable: ["X"], format: "number" },
  { key: "reposts", label: "Reposts", description: "Repost/retweet count", applicable: ["X"], format: "number" },
  { key: "reactions", label: "Reactions", description: "Total reactions", applicable: ["X", "LINKEDIN"], format: "number" },
  { key: "clicks", label: "Clicks", description: "Link clicks", applicable: ["FACEBOOK", "LINKEDIN"], format: "number" },
  { key: "saves", label: "Saves", description: "Saved/bookmarked count", applicable: ["INSTAGRAM", "TIKTOK", "X"], format: "number" },
  { key: "reach", label: "Reach", description: "Unique accounts reached", applicable: ["INSTAGRAM", "FACEBOOK"], format: "number" },
  { key: "subscribers", label: "Subscribers", description: "Subscriber count", applicable: ["YOUTUBE"], format: "number" },
  { key: "profileViews", label: "Profile Views", description: "Profile view count", applicable: ["INSTAGRAM", "TIKTOK", "FACEBOOK"], format: "number" },
  { key: "websiteClicks", label: "Website Clicks", description: "Clicks to website", applicable: ["INSTAGRAM"], format: "number" },
  { key: "pageLikes", label: "Page Likes", description: "Page like count", applicable: ["FACEBOOK"], format: "number" },
];

export function getMetricsForPlatform(platform: Platform | "all"): PlatformMetric[] {
  if (platform === "all") return PLATFORM_SPECIFIC_METRICS;
  return PLATFORM_SPECIFIC_METRICS.filter((m) => m.applicable.includes(platform));
}

export function formatPlatformMetric(value: number | null | undefined, format: PlatformMetric["format"]): string {
  if (value == null) return "—";
  switch (format) {
    case "number":
      return value.toLocaleString();
    case "decimal":
      return value.toFixed(4);
    case "percentage":
      return `${(value * 100).toFixed(1)}%`;
    case "time": {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins}m ${secs}s`;
    }
    default:
      return String(value);
  }
}
