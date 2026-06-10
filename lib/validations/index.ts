export { loginSchema, mfaVerifySchema } from "./auth";
export type { LoginInput, MfaVerifyInput } from "./auth";

export {
  createClientSchema,
  updateClientSchema,
  updateClientStatusSchema,
  updatePaymentStatusSchema,
} from "./client";
export type {
  CreateClientInput,
  UpdateClientInput,
  UpdateClientStatusInput,
  UpdatePaymentStatusInput,
} from "./client";

export {
  createContentSchema,
  updateContentSchema,
  updateContentStatusSchema,
} from "./content";
export type {
  CreateContentInput,
  UpdateContentInput,
  UpdateContentStatusInput,
} from "./content";

export {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from "./product";
export type {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductStatusInput,
} from "./product";

export {
  createRequestSchema,
  createCommentSchema,
  updateRequestStatusSchema,
} from "./request";
export type {
  CreateRequestInput,
  CreateCommentInput,
  UpdateRequestStatusInput,
} from "./request";

export { generateReportSchema } from "./report";
export type { GenerateReportInput } from "./report";
