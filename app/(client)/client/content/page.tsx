import Link from "next/link";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, MessageSquare, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  FACEBOOK: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  LINKEDIN: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  TIKTOK: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  YOUTUBE: "bg-red-500/10 text-red-400 border-red-500/20",
  X: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default async function ClientContentPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const contents = await prisma.content.findMany({
    where: {
      clientId,
      status: {
        notIn: ["IDEA", "DRAFT", "ARCHIVED"],
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      approvalEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const pending = contents.filter((c) => c.status === "CLIENT_APPROVAL_PENDING");
  const rest = contents.filter((c) => c.status !== "CLIENT_APPROVAL_PENDING");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Content</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve your upcoming content.
        </p>
      </header>

      {/* Pending Approvals Banner */}
      {pending.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">
              {pending.length} item{pending.length !== 1 ? "s" : ""} awaiting your approval
            </p>
          </div>
          <div className="space-y-2">
            {pending.map((content) => (
              <Link
                key={content.id}
                href={`/client/content/${content.id}`}
                className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-card px-4 py-3 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${
                      PLATFORM_COLORS[content.platform] ?? "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {content.platform}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{content.title}</p>
                    <p className="text-xs text-muted-foreground">{content.contentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={content.status} />
                  <span className="text-xs text-muted-foreground">Review →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Content */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">All Content</CardTitle>
        </CardHeader>
        <CardContent>
          {rest.length === 0 && pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No content has been shared with you yet.
            </p>
          ) : rest.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No other content to show.
            </p>
          ) : (
            <div className="space-y-2">
              {rest.map((content) => (
                <Link
                  key={content.id}
                  href={`/client/content/${content.id}`}
                  className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${
                        PLATFORM_COLORS[content.platform] ?? "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {content.platform}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{content.title}</p>
                      <p className="text-xs text-muted-foreground">{content.contentType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {content.scheduledAt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {new Date(content.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                    <StatusBadge status={content.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
