"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCommentSchema, CreateCommentInput } from "@/lib/validations/request";
import { addRequestCommentAction } from "@/lib/actions/request.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, MessageSquare, Clock, Send, Loader2, User, Shield } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface RequestComment {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    name: string | null;
    username: string;
    role: string;
  } | null;
}

interface RequestDetail {
  id: string;
  title: string;
  body: string | null;
  status: string;
  createdAt: Date;
  comments: RequestComment[];
}

interface RequestThreadProps {
  request: RequestDetail;
  currentUserId: string;
}

const statusConfig: Record<string, { label: string; style: string }> = {
  OPEN: { label: "Open", style: "bg-emerald-50 text-emerald-600" },
  IN_PROGRESS: { label: "In Progress", style: "bg-blue-50 text-blue-600" },
  RESOLVED: { label: "Resolved", style: "bg-zinc-50 text-zinc-600" },
  CLOSED: { label: "Closed", style: "bg-rose-50 text-rose-600" },
};

export default function RequestThread({ request, currentUserId }: RequestThreadProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = (data: CreateCommentInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const res = await addRequestCommentAction(request.id, currentUserId, null, data);
        if (res.success) {
          toast.success("Comment posted!");
          reset();
          router.refresh();
          window.location.reload();
        } else {
          setServerError(res.error || "Failed to post comment");
        }
      } catch {
        setServerError("An unexpected error occurred");
      }
    });
  };

  const cfg = statusConfig[request.status] || { label: request.status, style: "bg-gray-50 text-gray-600" };

  return (
    <div className="py-8 px-8 mx-auto" style={{ maxWidth: 1200 }}>
      <div className="space-y-6">
        {/* Back Link */}
        <Link href="/client/requests" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to requests
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECECF4] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.style}`}>{cfg.label}</span>
              <span className="text-xs text-[#6B7280] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Created {formatDate(request.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight mt-1">{request.title}</h1>
          </div>
        </div>

        {/* Thread Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Conversation Feed */}
          <div className="xl:col-span-2 space-y-6">
            {/* Original Request */}
            <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#ECECF4]">
                <div className="w-6 h-6 rounded-full bg-[#F2F8D7] flex items-center justify-center">
                  <User className="w-3 h-3 text-[#6B7280]" />
                </div>
                <span className="text-xs font-semibold text-[#111827]">Request Details</span>
              </div>
              <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">
                {request.body || <span className="text-[#9CA3AF] italic">No details provided.</span>}
              </p>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#6B7280]" />
                Conversation Thread ({request.comments.length})
              </h3>

              {request.comments.length === 0 ? (
                <div className="border border-dashed border-[#ECECF4] rounded-[24px] p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#F4F4FA] flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-4 h-4 text-[#6B7280]" />
                  </div>
                  <p className="text-sm text-[#6B7280]">No replies yet. The agency staff will review your request shortly.</p>
                </div>
              ) : (
                request.comments.map((comment) => {
                  const isAdmin = comment.author?.role === "ADMIN";
                  const authorName = comment.author?.name || comment.author?.username || "Client User";
                  return (
                    <div key={comment.id} className={cn(
                      "bg-white border rounded-[20px] p-5",
                      isAdmin ? "border-[#C5F135]/40" : "border-[#ECECF4]"
                    )}>
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#ECECF4]">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center",
                            isAdmin ? "bg-[#F2F8D7]" : "bg-[#F4F4FA]"
                          )}>
                            {isAdmin ? <Shield className="w-3.5 h-3.5 text-[#6B7280]" /> : <User className="w-3.5 h-3.5 text-[#6B7280]" />}
                          </div>
                          <span className="text-sm font-semibold text-[#111827]">{authorName}</span>
                          {isAdmin && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C5F135] text-[#111827]">
                              Agency
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#9CA3AF]">{formatDate(comment.createdAt, "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed">{comment.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Reply */}
            <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#ECECF4]">
                <MessageSquare className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm font-bold text-[#111827]">Add a Response</span>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600">{serverError}</div>
                )}
                <Textarea
                  {...register("body")}
                  placeholder="Provide additional details or respond to agency feedback..."
                  className="border-[#ECECF4] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#C5F135] min-h-[100px]"
                />
                {errors.body && <p className="text-xs text-rose-500">{errors.body.message}</p>}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}
                    className="bg-[#111827] text-white hover:bg-[#1F2937] rounded-xl font-semibold gap-1.5">
                    {isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Post Response</>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-4">Request Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECECF4]">
                  <span className="text-[#6B7280]">Request ID</span>
                  <span className="font-mono text-[#111827] text-[10px] select-all">{request.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#ECECF4]">
                  <span className="text-[#6B7280]">Status</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.style}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#ECECF4]">
                  <span className="text-[#6B7280]">Created</span>
                  <span className="text-[#111827]">{formatDate(request.createdAt, "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Comments</span>
                  <span className="text-[#111827] font-semibold">{request.comments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
