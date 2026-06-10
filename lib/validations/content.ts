import { z } from "zod";

export const createContentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  topic: z.string().max(200).optional().or(z.literal("")),
  platform: z.enum([
    "INSTAGRAM",
    "FACEBOOK",
    "LINKEDIN",
    "TIKTOK",
    "YOUTUBE",
    "X",
  ]),
  contentType: z.enum([
    "REEL",
    "POST",
    "STORY",
    "VIDEO",
    "CAROUSEL",
    "THREAD",
    "SHORT",
    "LIVE",
  ]),
  caption: z.string().max(2200).optional().or(z.literal("")),
  script: z.string().max(10000).optional().or(z.literal("")),
  hashtags: z.array(z.string()).default([]),
  assetUrls: z.array(z.string()).default([]),
  publishDate: z.coerce.date().optional(),
  scheduledAt: z.coerce.date().optional(),
  adSpend: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).optional().or(z.literal("")),
  productIds: z.array(z.string()).default([]),
});

export const updateContentSchema = createContentSchema.partial().omit({
  clientId: true,
});

export const updateContentStatusSchema = z.object({
  status: z.enum([
    "IDEA",
    "DRAFT",
    "CLIENT_APPROVAL_PENDING",
    "APPROVED",
    "SCHEDULED",
    "POSTED",
    "REJECTED",
    "ARCHIVED",
  ]),
  note: z.string().max(1000).optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type UpdateContentStatusInput = z.infer<typeof updateContentStatusSchema>;
