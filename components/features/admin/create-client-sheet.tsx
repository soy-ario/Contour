"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateClientInput } from "@/lib/validations/client";
import { createClientAction, createClientUserAction, updateClientAction } from "@/lib/actions/client.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { PaymentStatus, Prisma } from "@prisma/client";

interface ClientData {
  id: string;
  brandName: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  monthlyRetainer: number | string | Prisma.Decimal;
  monthlyBudget: number | string | Prisma.Decimal | null;
  contractStart: string | Date | null;
  contractEnd: string | Date | null;
  amountPaid: number | string | Prisma.Decimal;
  paymentStatus: PaymentStatus;
  marketingTheme: string | null;
}

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientData;
  onSuccess?: () => void;
}

interface ClientFormValues {
  brandName: string;
  website: string;
  industry: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  monthlyRetainer: number;
  monthlyBudget?: number;
  marketingTheme: string;
  contractStart: string;
  contractEnd: string;
}

export default function CreateClientDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: CreateClientDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const isEditMode = !!client;

  const formatDateForInput = (dateVal: string | Date | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const defaultValues = React.useMemo(() => {
    if (client) {
      return {
        brandName: client.brandName || "",
        website: client.website || "",
        industry: client.industry || "",
        description: client.description || "",
        contactName: client.contactName || "",
        contactEmail: client.contactEmail || "",
        contactPhone: client.contactPhone || "",
        monthlyRetainer: Number(client.monthlyRetainer) || 0,
        monthlyBudget: client.monthlyBudget == null ? undefined : Number(client.monthlyBudget),
        marketingTheme: client.marketingTheme || "",
        contractStart: formatDateForInput(client.contractStart),
        contractEnd: formatDateForInput(client.contractEnd),
      };
    }
    return {
      brandName: "",
      website: "",
      industry: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      monthlyRetainer: 0,
      monthlyBudget: undefined,
      marketingTheme: "",
      contractStart: "",
      contractEnd: "",
    };
  }, [client]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    values: defaultValues,
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setServerError(null);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: ClientFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const payload: CreateClientInput = {
        ...data,
        website: data.website || undefined,
        industry: data.industry || undefined,
        description: data.description || undefined,
        contactPhone: data.contactPhone || undefined,
        marketingTheme: data.marketingTheme || undefined,
        contractStart: data.contractStart ? new Date(data.contractStart) : undefined,
        contractEnd: data.contractEnd ? new Date(data.contractEnd) : undefined,
      };

      const result = isEditMode
        ? await updateClientAction(client.id, payload)
        : await createClientAction(payload);

      if (result.success) {
        const newClientId = result.data?.id;
        if (!isEditMode && username && password && newClientId) {
          const userResult = await createClientUserAction(newClientId, username, password);
          if (!userResult.success) {
            toast.error("Client created but user account failed: " + userResult.error);
          }
        }
        toast.success(isEditMode ? "Client updated successfully" : "Client created successfully");
        reset();
        handleOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        setServerError(result.error || "An unexpected error occurred");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl border-[#ECECF4]"
        showCloseButton={false}
      >
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-[#ECECF4]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-[#111827]">
                  {isEditMode ? "Edit Client Profile" : "New Client Onboarding"}
                </DialogTitle>
                <DialogDescription className="text-sm text-[#6B7280] mt-1">
                  {isEditMode
                    ? "Modify the business details and contact parameters of the client record."
                    : "Register a new client account. Fill out business details, billing configurations, and onboarding settings."}
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#ECECF4] text-[#6B7280] hover:text-[#111827] hover:border-[#F2485A] bg-white transition-all shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {serverError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-[14px] text-sm text-rose-600">
                {serverError}
              </div>
            )}

          {/* Section 1: Business Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">Business Details</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="brandName" className="text-sm font-semibold text-[#111827]">Brand Name *</Label>
              <Input
                id="brandName"
                {...register("brandName")}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                placeholder="e.g. Acme Corp"
              />
              {errors.brandName && (
                <p className="text-xs text-rose-500">{errors.brandName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-sm font-semibold text-[#111827]">Industry</Label>
                <Input
                  id="industry"
                  {...register("industry")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  placeholder="e.g. E-Commerce"
                />
                {errors.industry && (
                  <p className="text-xs text-rose-500">{errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-sm font-semibold text-[#111827]">Website URL</Label>
                <Input
                  id="website"
                  {...register("website")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-xs text-rose-500">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-semibold text-[#111827]">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                className="flex w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A] min-h-[80px]"
                placeholder="Brief summary of agency scope or brand focus..."
              />
              {errors.description && (
                <p className="text-xs text-rose-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-4 pt-4 border-t border-[#ECECF4]">
            <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">Contact Details</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-sm font-semibold text-[#111827]">Primary Contact Name *</Label>
              <Input
                id="contactName"
                {...register("contactName")}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                placeholder="Jane Smith"
              />
              {errors.contactName && (
                <p className="text-xs text-rose-500">{errors.contactName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-sm font-semibold text-[#111827]">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  placeholder="jane@acme.com"
                />
                {errors.contactEmail && (
                  <p className="text-xs text-rose-500">{errors.contactEmail.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPhone" className="text-sm font-semibold text-[#111827]">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  {...register("contactPhone")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  placeholder="+1 (555) 000-0000"
                />
                {errors.contactPhone && (
                  <p className="text-xs text-rose-500">{errors.contactPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Portal Login (new clients only) */}
          {!isEditMode && (
            <div className="space-y-4 pt-4 border-t border-[#ECECF4]">
              <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">Portal Login</h3>
              <p className="text-xs text-[#6B7280]">Create a username and password for the client portal. Skip to do this later.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-semibold text-[#111827]">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                    placeholder="e.g. acme_admin"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-[#111827]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Billing & Contract details */}
          <div className="space-y-4 pt-4 border-t border-[#ECECF4]">
            <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">Billing & Contract</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="monthlyRetainer" className="text-sm font-semibold text-[#111827]">Monthly Retainer ($USD) *</Label>
                <Input
                  id="monthlyRetainer"
                  type="number"
                  step="0.01"
                  {...register("monthlyRetainer")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                />
                {errors.monthlyRetainer && (
                  <p className="text-xs text-rose-500">{errors.monthlyRetainer.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthlyBudget" className="text-sm font-semibold text-[#111827]">Monthly Ad Spend Budget ($USD)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  step="0.01"
                  {...register("monthlyBudget")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                  placeholder="e.g. 5000"
                />
                {errors.monthlyBudget && (
                  <p className="text-xs text-rose-500">{errors.monthlyBudget.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contractStart" className="text-sm font-semibold text-[#111827]">Contract Start Date</Label>
                <Input
                  id="contractStart"
                  type="date"
                  {...register("contractStart")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                />
                {errors.contractStart && (
                  <p className="text-xs text-rose-500">{errors.contractStart.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contractEnd" className="text-sm font-semibold text-[#111827]">Contract End Date</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  {...register("contractEnd")}
                  className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                />
                {errors.contractEnd && (
                  <p className="text-xs text-rose-500">{errors.contractEnd.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="marketingTheme" className="text-sm font-semibold text-[#111827]">Marketing Brand Theme / Focus</Label>
              <Input
                id="marketingTheme"
                {...register("marketingTheme")}
                className="flex h-11 w-full rounded-[14px] border border-[#E5E7EB] bg-white px-3.5 text-sm text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#F2485A]/40 focus-visible:border-[#F2485A]"
                placeholder="e.g. Wellness, High Performance, Luxury"
              />
              {errors.marketingTheme && (
                <p className="text-xs text-rose-500">{errors.marketingTheme.message}</p>
              )}
            </div>
          </div>

          </div>

          <div className="shrink-0 px-6 pb-6 pt-4 border-t border-[#ECECF4] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-11 px-5 border border-[#E5E7EB] rounded-[14px] text-sm font-semibold text-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 px-5 bg-[#F2485A] rounded-[14px] text-white font-semibold flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : isEditMode ? (
                "Save Client Changes"
              ) : (
                "Create Client Record"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
