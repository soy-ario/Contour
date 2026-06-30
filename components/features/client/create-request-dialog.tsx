"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRequestSchema, CreateRequestInput } from "@/lib/validations/request";
import { createRequestAction } from "@/lib/actions/request.actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, MessageSquare } from "lucide-react";

interface CreateRequestDialogProps {
  clientId: string;
}

export default function CreateRequestDialog({ clientId }: CreateRequestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: { title: "", body: "" },
  });

  const onSubmit = (data: CreateRequestInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const res = await createRequestAction(clientId, null, data);
        if (res.success) {
          toast.success("Request created successfully!");
          reset();
          setOpen(false);
          router.refresh();
        } else {
          setServerError(res.error || "Failed to create request");
        }
      } catch {
        setServerError("An unexpected error occurred");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="inline-flex items-center gap-2 h-10 px-5 bg-[#F2485A] rounded-[14px] text-white text-sm font-semibold hover:brightness-95 transition-all">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-white border-[#ECECF4] text-[#111827] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#111827]">Create Operations Request</DialogTitle>
              <p className="text-xs text-[#6B7280] mt-0.5">Submit a request for your agency team.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-[#111827]">Request Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. Update wellness campaign assets"
              className="border-[#ECECF4] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#F2485A]"
            />
            {errors.title && <p className="text-xs text-rose-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body" className="text-xs font-semibold text-[#111827]">Details / Context</Label>
            <Textarea
              id="body"
              {...register("body")}
              placeholder="Please provide details about your request..."
              className="border-[#ECECF4] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#F2485A] min-h-[120px]"
            />
            {errors.body && <p className="text-xs text-rose-500">{errors.body.message}</p>}
          </div>

          <DialogFooter className="pt-4 border-t border-[#ECECF4]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-[#ECECF4] text-[#6B7280] hover:bg-[#F4F4FA] hover:text-[#111827] rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}
              className="bg-[#111827] text-white hover:bg-[#1F2937] rounded-xl font-semibold">
              {isPending ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
