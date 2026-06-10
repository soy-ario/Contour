"use client";

import * as React from "react";
import { Platform, ContentStatus, ContentType } from "@prisma/client";
import { Calendar, CircleDollarSign, Edit3, CheckCircle, Send, MoreVertical, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/status-badge";
import { PlatformIcon } from "@/components/shared/social-icons";
import { cn, formatDate } from "@/lib/utils";
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
  assetUrls: string[];
  clientBrandName?: string;
}

interface ContentCardProps {
  content: ContentItem;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onSubmitApproval?: (e: React.MouseEvent) => void;
  onApprove?: (e: React.MouseEvent) => void;
  isAdmin?: boolean;
}

export default function ContentCard({
  content,
  onClick,
  onEdit,
  onSubmitApproval,
  onApprove,
  isAdmin = true,
}: ContentCardProps) {
  const { title, platform, contentType, status, scheduledAt, publishDate, adSpend, assetUrls, clientBrandName } = content;

  // Use scheduledAt or fallback to publishDate
  const displayDate = scheduledAt || publishDate;
  const maxThumbnails = 3;
  const extraAssetsCount = assetUrls.length > maxThumbnails ? assetUrls.length - maxThumbnails : 0;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden bg-zinc-950/40 hover:bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300 shadow-lg cursor-pointer rounded-xl backdrop-blur-sm"
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center space-x-2">
          <PlatformIcon platform={platform} className="w-5 h-5 shrink-0" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded">
            {CONTENT_TYPE_LABELS[contentType]}
          </span>
        </div>
        <StatusBadge status={status} size="sm" />
      </CardHeader>

      <CardContent className="p-4 pt-1 pb-3">
        {clientBrandName && (
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
            {clientBrandName}
          </span>
        )}
        <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {title}
        </h3>

        {/* Date & Spend Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
          {displayDate && (
            <div className="flex items-center space-x-1.5 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{formatDate(displayDate, "MMM dd, yyyy")}</span>
            </div>
          )}
          {adSpend !== null && adSpend > 0 && (
            <div className="flex items-center space-x-1.5 shrink-0 text-emerald-400/90 font-medium">
              <CircleDollarSign className="w-3.5 h-3.5" />
              <span>${adSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          )}
        </div>

        {/* Assets thumbnails preview */}
        {assetUrls.length > 0 && (
          <div className="mt-4 flex items-center space-x-2">
            {assetUrls.slice(0, maxThumbnails).map((url, i) => (
              <div
                key={i}
                className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Asset ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {extraAssetsCount > 0 && (
              <div className="w-10 h-10 rounded-lg border border-zinc-800 bg-zinc-900/80 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-zinc-400">+{extraAssetsCount}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 bg-zinc-950/20 border-t border-zinc-900/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[10px] text-zinc-500 pl-2 flex items-center gap-1 font-medium">
          <Eye className="w-3 h-3" /> Click to view details
        </span>

        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          {onEdit && (status === "IDEA" || status === "DRAFT" || status === "CLIENT_APPROVAL_PENDING") && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Edit Content"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          )}

          {onSubmitApproval && status === "DRAFT" && isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onSubmitApproval}
              className="h-7 w-7 rounded-lg text-amber-500 hover:text-amber-400 hover:bg-amber-950/20"
              title="Submit for Approval"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}

          {onApprove && status === "CLIENT_APPROVAL_PENDING" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onApprove}
              className="h-7 w-7 rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20"
              title="Approve Content"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
