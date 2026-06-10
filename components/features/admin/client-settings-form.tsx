"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updateClientAction,
  createClientUserAction,
} from "@/lib/actions/client.actions";
import { toast } from "sonner";
import { Loader2, Globe, Shield, CreditCard, UserCheck, ShieldAlert } from "lucide-react";
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
  user?: {
    id: string;
    username: string;
    email: string;
  } | null;
}

interface ClientSettingsFormProps {
  client: ClientData;
}

export default function ClientSettingsForm({ client }: ClientSettingsFormProps) {
  const [isPending, startTransition] = React.useTransition();
  const [errorSection, setErrorSection] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const formatDateForInput = (dateVal: string | Date | null) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Section 1: Business Details Form
  const {
    register: regBusiness,
    handleSubmit: subBusiness,
    formState: { errors: errBusiness },
  } = useForm<{
    brandName: string;
    website: string;
    industry: string;
    description: string;
  }>({
    defaultValues: {
      brandName: client.brandName || "",
      website: client.website || "",
      industry: client.industry || "",
      description: client.description || "",
    },
  });

  const onSaveBusiness = async (data: {
    brandName: string;
    website: string;
    industry: string;
    description: string;
  }) => {
    setServerError(null);
    setErrorSection(null);
    startTransition(async () => {
      const result = await updateClientAction(client.id, {
        ...data,
        website: data.website || undefined,
        industry: data.industry || undefined,
        description: data.description || undefined,
      });

      if (result.success) {
        toast.success("Business details updated successfully");
      } else {
        setErrorSection("business");
        setServerError(result.error ?? "Failed to update business details");
      }
    });
  };

  // Section 2: Contact Details Form
  const {
    register: regContact,
    handleSubmit: subContact,
    formState: { errors: errContact },
  } = useForm<{
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  }>({
    defaultValues: {
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || "",
      contactPhone: client.contactPhone || "",
    },
  });

  const onSaveContact = async (data: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  }) => {
    setServerError(null);
    setErrorSection(null);
    startTransition(async () => {
      const result = await updateClientAction(client.id, {
        ...data,
        contactPhone: data.contactPhone || undefined,
      });

      if (result.success) {
        toast.success("Contact details updated successfully");
      } else {
        setErrorSection("contact");
        setServerError(result.error ?? "Failed to update contact details");
      }
    });
  };

  // Section 3: Financial Details Form
  const {
    register: regFinancial,
    handleSubmit: subFinancial,
  } = useForm<{
    monthlyRetainer: number;
    monthlyBudget?: number;
    contractStart: string;
    contractEnd: string;
    amountPaid: number;
    paymentStatus: string;
    marketingTheme: string;
  }>({
    defaultValues: {
      monthlyRetainer: Number(client.monthlyRetainer) || 0,
      monthlyBudget: Number(client.monthlyBudget) || undefined,
      contractStart: formatDateForInput(client.contractStart),
      contractEnd: formatDateForInput(client.contractEnd),
      amountPaid: Number(client.amountPaid) || 0,
      paymentStatus: client.paymentStatus || "PENDING",
      marketingTheme: client.marketingTheme || "",
    },
  });

  const onSaveFinancial = async (data: {
    monthlyRetainer: number;
    monthlyBudget?: number;
    contractStart: string;
    contractEnd: string;
    amountPaid: number;
    paymentStatus: string;
    marketingTheme: string;
  }) => {
    setServerError(null);
    setErrorSection(null);
    startTransition(async () => {
      const result = await updateClientAction(client.id, {
        ...data,
        monthlyBudget: data.monthlyBudget || undefined,
        contractStart: data.contractStart ? new Date(data.contractStart) : undefined,
        contractEnd: data.contractEnd ? new Date(data.contractEnd) : undefined,
        amountPaid: Number(data.amountPaid),
        paymentStatus: data.paymentStatus as PaymentStatus,
        marketingTheme: data.marketingTheme || undefined,
      });

      if (result.success) {
        toast.success("Financial parameters updated successfully");
      } else {
        setErrorSection("financial");
        setServerError(result.error ?? "Failed to update financial parameters");
      }
    });
  };

  // Section 4: Client User Creation Form
  const [credentials, setCredentials] = React.useState({ username: "", password: "" });
  const [credError, setCredError] = React.useState<string | null>(null);

  const handleCreateClientUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);

    if (!credentials.username.trim() || credentials.password.length < 6) {
      setCredError("Username is required and password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const result = await createClientUserAction(
        client.id,
        credentials.username,
        credentials.password
      );

      if (result.success) {
        toast.success(`User @${credentials.username} successfully registered for client.`);
        setCredentials({ username: "", password: "" });
        // Force reload page to fetch newly connected user
        window.location.reload();
      } else {
        setCredError(result.error || "Failed to create portal user");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-8 py-8">
      {/* Business Details Card */}
      <Card className="bg-card border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center space-x-3">
          <Globe className="w-5 h-5 text-primary shrink-0" />
          <div>
            <CardTitle className="text-base font-bold text-foreground">Business Information</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Update client brand name, industry, description, and website properties.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={subBusiness(onSaveBusiness)} className="space-y-6">
            {errorSection === "business" && serverError && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-sm text-red-400">
                {serverError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  {...regBusiness("brandName", { required: "Brand name is required" })}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                {errBusiness.brandName && (
                  <p className="text-xs text-rose-500">{errBusiness.brandName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  {...regBusiness("industry")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  {...regBusiness("website")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="description">About the Brand</Label>
                <Textarea
                  id="description"
                  {...regBusiness("description")}
                  className="bg-zinc-900 border-zinc-800 text-sm min-h-[90px] focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-zinc-900 border border-border text-foreground hover:bg-zinc-800 text-xs font-semibold px-4 py-2"
              >
                {isPending && errorSection === "business" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : null}
                Save Business Info
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Contact Details Card */}
      <Card className="bg-card border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center space-x-3">
          <Shield className="w-5 h-5 text-primary shrink-0" />
          <div>
            <CardTitle className="text-base font-bold text-foreground">Contact Representation</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Edit the contact credentials of the client account representative.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={subContact(onSaveContact)} className="space-y-6">
            {errorSection === "contact" && serverError && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="contactName">Primary Representative Name *</Label>
                <Input
                  id="contactName"
                  {...regContact("contactName", { required: "Contact name is required" })}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                {errContact.contactName && (
                  <p className="text-xs text-rose-500">{errContact.contactName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...regContact("contactEmail", { required: "Contact email is required" })}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
                {errContact.contactEmail && (
                  <p className="text-xs text-rose-500">{errContact.contactEmail.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  {...regContact("contactPhone")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-zinc-900 border border-border text-foreground hover:bg-zinc-800 text-xs font-semibold px-4 py-2"
              >
                {isPending && errorSection === "contact" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : null}
                Save Contact Info
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Financial Parameters Card */}
      <Card className="bg-card border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center space-x-3">
          <CreditCard className="w-5 h-5 text-primary shrink-0" />
          <div>
            <CardTitle className="text-base font-bold text-foreground">Billing & Financial Settings</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Edit billing targets, paid retainers, and dates mapping.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={subFinancial(onSaveFinancial)} className="space-y-6">
            {errorSection === "financial" && serverError && (
              <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="monthlyRetainer">Monthly Retainer ($USD) *</Label>
                <Input
                  id="monthlyRetainer"
                  type="number"
                  step="0.01"
                  {...regFinancial("monthlyRetainer")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="monthlyBudget">Monthly Ad Spend Budget ($USD)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  step="0.01"
                  {...regFinancial("monthlyBudget")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amountPaid">Total Paid Retainer ($USD)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  {...regFinancial("amountPaid")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paymentStatus">Payment Invoice Status</Label>
                <select
                  id="paymentStatus"
                  {...regFinancial("paymentStatus")}
                  className="w-full h-10 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-foreground focus-visible:ring-1 focus-visible:ring-zinc-700 focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="PARTIAL">PARTIAL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contractStart">Contract Start Date</Label>
                <Input
                  id="contractStart"
                  type="date"
                  {...regFinancial("contractStart")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contractEnd">Contract End Date</Label>
                <Input
                  id="contractEnd"
                  type="date"
                  {...regFinancial("contractEnd")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="marketingTheme">Marketing Brand Theme / Focus</Label>
                <Input
                  id="marketingTheme"
                  {...regFinancial("marketingTheme")}
                  className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-zinc-900 border border-border text-foreground hover:bg-zinc-800 text-xs font-semibold px-4 py-2"
              >
                {isPending && errorSection === "financial" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : null}
                Save Financial parameters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Portal Credentials Access Card */}
      <Card className="bg-card border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/40 py-4 px-6 flex flex-row items-center space-x-3">
          <UserCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <CardTitle className="text-base font-bold text-foreground">Client Portal Access Credentials</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Provision or review credentials for the client representative to log in to their dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {client.user ? (
            <div className="flex items-start space-x-4 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Client credentials are connected</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground/75">Username: </span>
                    @{client.user.username}
                  </p>
                  <p>
                    <span className="font-medium text-foreground/75">Email: </span>
                    {client.user.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateClientUser} className="space-y-6">
              <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg flex space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-400">Portal User Account Missing</p>
                  <p className="text-xs text-muted-foreground">
                    This client has no registered username or login credentials. Creating one will allow the client representative to log in to their scoped client portal.
                  </p>
                </div>
              </div>

              {credError && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-md text-sm text-red-400">
                  {credError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="portalUsername">Username *</Label>
                  <Input
                    id="portalUsername"
                    value={credentials.username}
                    onChange={(e) => setCredentials((p) => ({ ...p, username: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                    placeholder="e.g. acme_client"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="portalPassword">Temporary Password *</Label>
                  <Input
                    id="portalPassword"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials((p) => ({ ...p, password: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-1 focus-visible:ring-zinc-700"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4 py-2"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                  Provision Portal User
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
