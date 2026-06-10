import Link from "next/link";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import CreateRequestDialog from "@/components/features/client/create-request-dialog";

export const dynamic = "force-dynamic";

function RequestStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "OPEN":
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Open</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">In Progress</Badge>;
    case "RESOLVED":
      return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Resolved</Badge>;
    case "CLOSED":
      return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Closed</Badge>;
    default:
      return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">{status}</Badge>;
  }
}

export default async function ClientRequestsPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const requests = await prisma.request.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Requests</h1>
          <p className="text-sm text-muted-foreground">
            Submit and track agency support or creative operations requests.
          </p>
        </div>
        <CreateRequestDialog clientId={clientId} />
      </header>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="size-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No requests found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Need assets updated, a new campaign topic, or help with social integration? Create your first request.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/client/requests/${req.id}`}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-muted/10 px-2 rounded-md transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground truncate hover:underline">
                      {req.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.resolvedAt && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <RequestStatusBadge status={req.status} />
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded-md">
                      <MessageSquare className="size-3" />
                      {req._count.comments}
                    </span>
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
