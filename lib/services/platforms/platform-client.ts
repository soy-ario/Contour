export class PlatformNotConfiguredError extends Error {
  constructor(platform: string) {
    super(`${platform} API is not configured. Set ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET environment variables.`);
    this.name = "PlatformNotConfiguredError";
  }
}

export class PlatformAuthError extends Error {
  constructor(platform: string, message: string) {
    super(`[${platform}] Auth error: ${message}`);
    this.name = "PlatformAuthError";
  }
}

export class PlatformRateLimitError extends Error {
  constructor(platform: string, retryAfter?: number) {
    super(`[${platform}] Rate limited. Retry after ${retryAfter ?? "unknown"}s`);
    this.name = "PlatformRateLimitError";
  }
}

export class PlatformApiError extends Error {
  constructor(platform: string, status: number, body: string) {
    super(`[${platform}] API ${status}: ${body}`);
    this.name = "PlatformApiError";
  }
}

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface ProfileResult {
  platformAccountId: string;
  platformUsername: string;
  profileData: Record<string, unknown>;
}

export interface PlatformPost {
  nativePostId: string;
  permalink?: string;
  title?: string;
  caption?: string;
  thumbnail?: string;
  publishedAt: Date;
  contentType: string;
  contentTypeLabel?: string;
}

export interface PlatformPostMetrics {
  nativePostId: string;
  views: number;
  reach: number | null;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number | null;
  videoViews: number;
  watchTimeSecs: number;
  avgWatchPct: number | null;
  ctr: number | null;
  replies: number;
  reposts: number;
  reactions: number;
  clicks: number;
}

export interface PlatformAccountInsights {
  followerCount: number;
  followerGrowth: number;
  totalViews: number;
  totalReach: number | null;
  totalImpressions: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  avgEngagementRate: number | null;
  videoViews: number;
  watchTimeSecs: number;
  profileVisits: number;
  websiteClicks: number;
  pageLikes: number;
  profileViews: number;
  subscribers: number;
}

export interface PlatformClient {
  exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult>;
  refreshToken(token: string): Promise<TokenExchangeResult>;
  fetchProfile(token: string): Promise<ProfileResult>;
  fetchPosts(token: string, since: Date): Promise<PlatformPost[]>;
  fetchPostMetrics(token: string, postId: string): Promise<PlatformPostMetrics>;
  fetchAccountInsights(token: string, since: Date, until: Date): Promise<PlatformAccountInsights>;
  validateToken(token: string): Promise<boolean>;
}

const BASE_RETRY_DELAY_MS = 1000;

export async function apiFetch(
  platform: string,
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: { "User-Agent": "Contour/1.0", ...options.headers },
    });

    if (res.ok) return res;

    if (res.status === 429 && attempt < retries) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? `${BASE_RETRY_DELAY_MS}`, 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000 || BASE_RETRY_DELAY_MS * 2 ** attempt));
      continue;
    }

    const body = await res.text().catch(() => "unknown");
    if (res.status === 401) throw new PlatformAuthError(platform, body);
    if (res.status === 429) throw new PlatformRateLimitError(platform);
    throw new PlatformApiError(platform, res.status, body);
  }

  throw new PlatformRateLimitError(platform);
}
