import Link from "next/link";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import CreateRequestDialog from "@/components/features/client/create-request-dialog";
import { formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { label: string; style: string }> = {
  OPEN: { label: "Open", style: "bg-emerald-50 text-emerald-600" },
  IN_PROGRESS: { label: "In Progress", style: "bg-blue-50 text-blue-600" },
  RESOLVED: { label: "Resolved", style: "bg-zinc-50 text-zinc-600" },
  CLOSED: { label: "Closed", style: "bg-rose-50 text-rose-600" },
};

export default async function ClientRequestsPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const requests = await prisma.request.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { comments: true } },
    },
  });

  const openCount = requests.filter(r => r.status === "OPEN" || r.status === "IN_PROGRESS").length;
  const resolvedCount = requests.filter(r => r.status === "RESOLVED" || r.status === "CLOSED").length;

  return (
    <div className="py-8 px-8 mx-auto" style={{ maxWidth: 1440 }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Requests</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Submit and track agency support or creative operations requests.</p>
          </div>
          <CreateRequestDialog clientId={clientId} />
        </div>

        {/* Summary Row */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#6B7280]">
            <span className="font-semibold text-[#111827]">{requests.length}</span> total
          </span>
          <span className="w-1 h-1 rounded-full bg-[#ECECF4]" />
          <span className="text-[#6B7280]">
            <span className="font-semibold text-[#111827]">{openCount}</span> open
          </span>
          <span className="w-1 h-1 rounded-full bg-[#ECECF4]" />
          <span className="text-[#6B7280]">
            <span className="font-semibold text-[#111827]">{resolvedCount}</span> resolved
          </span>
        </div>

        {/* Requests List */}
        <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F4F4FA] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#6B7280]" />
              </div>
              <h3 className="text-base font-bold text-[#111827]">No requests yet</h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-sm">
                Need assets updated, a new campaign topic, or help with social integration? Submit your first request.
              </p>
              <CreateRequestDialog clientId={clientId} />
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => {
                const cfg = statusConfig[req.status] || { label: req.status, style: "bg-gray-50 text-gray-600" };
                return (
                  <Link
                    key={req.id}
                    href={`/client/requests/${req.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-[#ECECF4] hover:border-[#F2485A]/60 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#F4F4FA] flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4 text-[#6B7280]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">{req.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-[#6B7280] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeDate(req.createdAt)}
                          </span>
                          {req.resolvedAt && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1 text-[11px] text-[#6B7280] bg-[#F4F4FA] px-2 py-1 rounded-lg">
                        <MessageSquare className="w-3 h-3" />
                        {req._count.comments}
                      </span>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.style}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
