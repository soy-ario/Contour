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
import { Loader2, Plus } from "lucide-react";

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
    defaultValues: {
      title: "",
      body: "",
    },
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
      } catch (err) {
        setServerError("An unexpected error occurred");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5"><Plus className="size-4" /> New Request</Button>} />
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create Operations Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-xs text-red-400">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Request Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. Update wellness campaign assets"
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
            />
            {errors.title && (
              <p className="text-xs text-rose-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Details / Context</Label>
            <Textarea
              id="body"
              {...register("body")}
              placeholder="Please provide details about your request..."
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 min-h-[120px]"
            />
            {errors.body && (
              <p className="text-xs text-rose-500">{errors.body.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="border-zinc-800 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating...
                </>
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
