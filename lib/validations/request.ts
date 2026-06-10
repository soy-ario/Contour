import { z } from "zod";

export const createRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  body: z.string().max(5000).optional().or(z.literal("")),
});

export const createCommentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment is required")
    .max(5000, "Comment must be at most 5000 characters"),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
