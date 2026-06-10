"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClientSchema, CreateClientInput } from "@/lib/validations/client";
import { createClientAction, updateClientAction } from "@/lib/actions/client.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any; // If passed, we are in edit mode
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

export default function CreateClientSheet({
  open,
  onOpenChange,
  client,
  onSuccess,
}: CreateClientSheetProps) {
  const [isPending, startTransition] = React.useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const isEditMode = !!client;

  const formatDateForInput = (dateVal: any) => {
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
        monthlyRetainer: client.monthlyRetainer || 0,
        monthlyBudget: client.monthlyBudget || undefined,
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
    resolver: zodResolver(createClientSchema) as any,
    values: defaultValues as any, // dynamic values update when client changes
  });

  // Reset form when sheet opens/closes or client changes
  React.useEffect(() => {
    if (open) {
      setServerError(null);
    }
  }, [open, client, defaultValues]);

  const onSubmit = async (data: ClientFormValues) => {
    setServerError(null);
    startTransition(async () => {
      // Map empty strings to undefined to fit Zod schemas
      const payload: any = {
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
        toast.success(isEditMode ? "Client updated successfully" : "Client created successfully");
        reset();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        setServerError(result.error || "An unexpected error occurred");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto bg-zinc-950 border-zinc-800 text-foreground">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {isEditMode ? "Edit Client Profile" : "Create New Client"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {isEditMode
              ? "Modify the business details and contact parameters of the client record."
              : "Register a new client account. Fill out business details, billing configurations, and onboarding settings."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
          {serverError && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-sm text-red-400">
              {serverError}
            </div>
          )}

          {/* Section 1: Business Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Business Details</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input
                id="brandName"
                {...register("brandName")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="e.g. Acme Corp"
              />
              {errors.brandName && (
                <p className="text-xs text-rose-500">{errors.brandName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  {...register("industry")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                  placeholder="e.g. E-Commerce"
                />
                {errors.industry && (
                  <p className="text-xs text-rose-500">{errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  {...register("website")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-xs text-rose-500">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                className="bg-zinc-900 border-zinc-800 text-sm min-h-[80px] focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="Brief summary of agency scope or brand focus..."
              />
              {errors.description && (
                <p className="text-xs text-rose-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/60">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Contact Details</h3>
            
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Primary Contact Name *</Label>
              <Input
                id="contactName"
                {...register("contactName")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="Jane Smith"
              />
              {errors.contactName && (
                <p className="text-xs text-rose-500">{errors.contactName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                  placeholder="jane@acme.com"
                />
                {errors.contactEmail && (
                  <p className="text-xs text-rose-500">{errors.contactEmail.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  {...register("contactPhone")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                  placeholder="+1 (555) 000-0000"
                />
                {errors.contactPhone && (
                  <p className="text-xs text-rose-500">{errors.contactPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Contract details */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/60">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Billing & Contract</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="monthlyRetainer">Monthly Retainer ($USD) *</Label>
                <Input
                  id="monthlyRetainer"
                  type="number"
                  step="0.01"
                  {...register("monthlyRetainer")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                {errors.monthlyRetainer && (
                  <p className="text-xs text-rose-500">{errors.monthlyRetainer.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthlyBudget">Monthly Ad Spend Budget ($USD)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  step="0.01"
                  {...register("monthlyBudget")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                  placeholder="e.g. 5000"
                />
                {errors.monthlyBudget && (
                  <p className="text-xs text-rose-500">{errors.monthlyBudget.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contractStart">Contract Start Date</Label>
                <Input
                  id="contractStart"
                  type="date"
                  {...register("contractStart")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                {errors.contractStart && (
                  <p className="text-xs text-rose-500">{errors.contractStart.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contractEnd">Contract End Date</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  {...register("contractEnd")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                {errors.contractEnd && (
                  <p className="text-xs text-rose-500">{errors.contractEnd.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="marketingTheme">Marketing Brand Theme / Focus</Label>
              <Input
                id="marketingTheme"
                {...register("marketingTheme")}
                className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                placeholder="e.g. Wellness, High Performance, Luxury"
              />
              {errors.marketingTheme && (
                <p className="text-xs text-rose-500">{errors.marketingTheme.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center space-x-3 pt-6 border-t border-zinc-800">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Profile...
                </>
              ) : isEditMode ? (
                "Save Client Changes"
              ) : (
                "Create Client Record"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-foreground text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
