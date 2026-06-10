import type { Platform, ContentStatus, ContentType, ClientStatus, PaymentStatus } from "@prisma/client";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  received?: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationErrorDetail[] | Record<string, unknown> | unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export type { Platform, ContentStatus, ContentType, ClientStatus, PaymentStatus };
