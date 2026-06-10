import { z } from "zod";

export const createProductSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be at most 200 characters"),
  category: z.string().max(100).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0).optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updateProductSchema = createProductSchema.partial().omit({
  clientId: true,
});

export const updateProductStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED"]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductStatusInput = z.infer<typeof updateProductStatusSchema>;
