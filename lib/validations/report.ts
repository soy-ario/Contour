import { z } from "zod";

export const generateReportSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2099),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
