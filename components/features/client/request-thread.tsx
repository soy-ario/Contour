"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCommentSchema, CreateCommentInput } from "@/lib/validations/request";
import { addRequestCommentAction } from "@/lib/actions/request.actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, MessageSquare, Clock, Send, ShieldAlert, Loader2 } from "lucide-react";
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
    defaultValues: {
      body: "",
    },
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
          // Force reload or fetch again because of Server Components updates
          window.location.reload();
        } else {
          setServerError(res.error || "Failed to post comment");
        }
      } catch (err) {
        setServerError("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/client/requests"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to requests
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3.5" />
              Created on {new Date(request.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {request.title}
          </h1>
        </div>
      </header>

      {/* Thread Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Conversation Feed */}
        <div className="xl:col-span-2 space-y-6">
          {/* Original Request Post */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border bg-muted/10 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Request Details
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed select-text">
                {request.body || <span className="text-muted-foreground italic">No details provided.</span>}
              </p>
            </CardContent>
          </Card>

          {/* Activity / Comment Feed */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="size-4" /> Conversation Thread ({request.comments.length})
            </h3>

            <div className="space-y-4">
              {request.comments.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No replies yet. The agency staff will review your request shortly.</p>
                </div>
              ) : (
                request.comments.map((comment) => {
                  const isAdmin = comment.author?.role === "ADMIN";
                  const authorName = comment.author?.name || comment.author?.username || "Client User";

                  return (
                    <Card
                      key={comment.id}
                      className={cn(
                        "border shadow-xs",
                        isAdmin ? "border-primary/20 bg-primary/5" : "border-border bg-card"
                      )}
                    >
                      <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{authorName}</span>
                          {isAdmin && (
                            <Badge className="bg-primary/25 text-primary border-primary/30 text-[10px] py-0 px-1.5">
                              Agency Staff
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(comment.createdAt, "MMM dd, h:mm a")}
                        </span>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed select-text">
                          {comment.body}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Reply Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Add a Response
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-xs text-red-400">
                    {serverError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Textarea
                    {...register("body")}
                    placeholder="Provide additional details or respond to agency feedback..."
                    className="bg-muted/40 border-border text-sm placeholder:text-muted-foreground/60 min-h-[100px]"
                  />
                  {errors.body && (
                    <p className="text-xs text-rose-500">{errors.body.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={isPending} className="gap-1.5">
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" /> Post Response
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Request Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Request ID:</span>
                <span className="font-mono text-[11px] text-foreground select-all">{request.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Status:</span>
                <RequestStatusBadge status={request.status} />
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">{new Date(request.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Comments Count:</span>
                <span className="text-foreground font-semibold">{request.comments.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
