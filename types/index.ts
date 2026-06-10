import type {
  User,
  Client,
  Content,
  Product,
  Report,
  Request as PrismaRequest,
  ContentAnalytic,
  AnalyticsSnapshot,
  SocialAccount,
  AuditLog,
  ApprovalEvent,
  StatusLog,
  InternalNote,
  RequestComment,
  HealthScoreLog,
  PlatformDailyMetric,
  Session,
  UserRole,
  ClientStatus,
  PaymentStatus,
  Platform,
  ContentType,
  ContentStatus,
  ApprovalAction,
  ProductStatus,
  ReportStatus,
  RequestStatus,
  ConnectionStatus,
  SyncStatus,
} from "@prisma/client";

// Re-export all Prisma types for convenience
export type {
  User,
  Client,
  Content,
  Product,
  Report,
  PrismaRequest,
  ContentAnalytic,
  AnalyticsSnapshot,
  SocialAccount,
  AuditLog,
  ApprovalEvent,
  StatusLog,
  InternalNote,
  RequestComment,
  HealthScoreLog,
  PlatformDailyMetric,
  Session,
  UserRole,
  ClientStatus,
  PaymentStatus,
  Platform,
  ContentType,
  ContentStatus,
  ApprovalAction,
  ProductStatus,
  ReportStatus,
  RequestStatus,
  ConnectionStatus,
  SyncStatus,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION & AUTH TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  clientId: string | null;
}

export interface AuthSession {
  user: SessionUser;
  session: {
    id: string;
    expiresAt: Date;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ClientWithRelations extends Client {
  user: User | null;
  socialAccounts: SocialAccount[];
  _count: {
    contents: number;
    products: number;
    requests: number;
  };
}

export interface ClientListItem {
  id: string;
  brandName: string;
  logoUrl: string | null;
  contactName: string;
  contactEmail: string;
  status: ClientStatus;
  healthScore: number | null;
  paymentStatus: PaymentStatus;
  monthlyRetainer: number;
  contentCount: number;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContentWithRelations extends Content {
  client: Pick<Client, "id" | "brandName" | "logoUrl">;
  analytics: ContentAnalytic | null;
  products: Array<{ product: Product }>;
  approvalEvents: ApprovalEvent[];
  statusLogs: StatusLog[];
  creator: Pick<User, "id" | "username"> | null;
}

export interface ContentListItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  status: ContentStatus;
  scheduledAt: Date | null;
  clientBrandName: string;
  clientId: string;
  adSpend: number | null;
  thumbnails: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgencyMetrics {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  outstandingRevenue: number;
  totalContent: number;
  pendingApprovals: number;
  avgHealthScore: number;
  totalReach: number;
  totalViews: number;
  totalEngagement: number;
}

export interface ClientAnalyticsSummary {
  totalViews: number;
  totalReach: number;
  totalEngagement: number;
  totalImpressions: number;
  followerGrowth: number;
  engagementRate: number;
  contentCount: number;
  delta: {
    views: number;
    reach: number;
    engagement: number;
    followers: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// API & PAGINATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

export const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  INSTAGRAM: "#e1306c",
  FACEBOOK: "#1877f2",
  LINKEDIN: "#0a66c2",
  TIKTOK: "#ee1d52",
  YOUTUBE: "#ff0000",
  X: "#e7e9ea",
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  LEAD: "Lead",
  DISCOVERY: "Discovery",
  PROPOSAL_SENT: "Proposal Sent",
  CONTRACT_SIGNED: "Contract Signed",
  SETUP: "Setup",
  DASHBOARD_READY: "Dashboard Ready",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: "Idea",
  DRAFT: "Draft",
  CLIENT_APPROVAL_PENDING: "Pending Approval",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  REEL: "Reel",
  POST: "Post",
  STORY: "Story",
  VIDEO: "Video",
  CAROUSEL: "Carousel",
  THREAD: "Thread",
  SHORT: "Short",
  LIVE: "Live",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  PARTIAL: "Partial",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
