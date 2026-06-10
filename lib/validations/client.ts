import { z } from "zod";

export const createClientSchema = z.object({
  brandName: z
    .string()
    .min(1, "Brand name is required")
    .max(200, "Brand name must be at most 200 characters"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  contactName: z
    .string()
    .min(1, "Contact name is required")
    .max(200, "Contact name must be at most 200 characters"),
  contactEmail: z
    .string()
    .min(1, "Contact email is required")
    .email("Must be a valid email"),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  monthlyRetainer: z.coerce
    .number()
    .min(0, "Retainer must be a positive number")
    .default(0),
  monthlyBudget: z.coerce.number().min(0).optional(),
  marketingTheme: z.string().max(500).optional().or(z.literal("")),
  contractStart: z.coerce.date().optional(),
  contractEnd: z.coerce.date().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const updateClientStatusSchema = z.object({
  status: z.enum([
    "LEAD",
    "DISCOVERY",
    "PROPOSAL_SENT",
    "CONTRACT_SIGNED",
    "SETUP",
    "DASHBOARD_READY",
    "ACTIVE",
    "PAUSED",
    "ARCHIVED",
  ]),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIAL"]),
  amountPaid: z.coerce.number().min(0).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
