import type {
  PlatformClient, TokenExchangeResult, ProfileResult,
  PlatformPost, PlatformPostMetrics, PlatformAccountInsights,
} from "./platform-client";
import { PlatformNotConfiguredError, apiFetch } from "./platform-client";

interface LiPost {
  id: string;
  author: string;
  commentary?: string;
  distribution?: { feedDistribution?: string };
  lifecycleState?: string;
  created: string;
  destinationUrl?: string;
  content?: { media?: { id?: string; title?: string } };
}

interface LiShareStats {
  data?: Array<{
    totalShareStatistics?: {
      impressionCount?: number;
      clickCount?: number;
      likeCount?: number;
      commentCount?: number;
      shareCount?: number;
      engagement?: number;
    };
  }>;
}

export class LinkedInClient implements PlatformClient {
  private get clientId(): string {
    const id = process.env.LINKEDIN_CLIENT_ID;
    if (!id) throw new PlatformNotConfiguredError("LinkedIn");
    return id;
  }

  private get clientSecret(): string {
    const s = process.env.LINKEDIN_CLIENT_SECRET;
    if (!s) throw new PlatformNotConfiguredError("LinkedIn");
    return s;
  }

  private get baseUrl(): string {
    return "https://api.linkedin.com/v2";
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("LinkedIn", "https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: undefined,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 5184000) * 1000),
    };
  }

  async refreshToken(_token: string): Promise<TokenExchangeResult> {
    throw new Error("LinkedIn does not support refresh tokens. Re-authenticate.");
  }

  async fetchProfile(token: string): Promise<ProfileResult> {
    const res = await apiFetch("LinkedIn", `${this.baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await res.json();

    const orgRes = await apiFetch("LinkedIn", `${this.baseUrl}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orgData = await orgRes.json();
    const org = orgData.elements?.[0]?.organizationalTarget;
    const orgId = org?.replace("urn:li:organization:", "");

    return {
      platformAccountId: orgId ?? me.sub,
      platformUsername: `${me.localizedFirstName ?? ""} ${me.localizedLastName ?? ""}`.trim() || me.sub,
      profileData: { me, organizationId: orgId },
    };
  }

  async fetchPosts(token: string, since: Date): Promise<PlatformPost[]> {
    const profile = await this.fetchProfile(token);
    const orgId = profile.profileData.organizationId as string;
    if (!orgId) throw new Error("No LinkedIn organization found");

    const res = await apiFetch(
      "LinkedIn",
      `https://api.linkedin.com/rest/posts?author=urn:li:organization:${orgId}&q=author&count=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202406",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );
    const data = await res.json();
    const posts: LiPost[] = data.elements ?? [];

    return posts.filter((p) => new Date(p.created) >= since).map((p) => ({
      nativePostId: p.id,
      permalink: p.destinationUrl,
      title: p.content?.media?.title ?? p.commentary?.slice(0, 100),
      caption: p.commentary,
      thumbnail: undefined,
      publishedAt: new Date(p.created),
      contentType: "POST",
    }));
  }

  async fetchPostMetrics(token: string, postId: string): Promise<PlatformPostMetrics> {
    const res = await apiFetch(
      "LinkedIn",
      `https://api.linkedin.com/rest/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:share:${postId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202406",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );
    const data: LiShareStats = await res.json();
    const s = data.data?.[0]?.totalShareStatistics;

    return {
      nativePostId: postId,
      views: s?.impressionCount ?? 0,
      reach: null,
      impressions: s?.impressionCount ?? 0,
      likes: s?.likeCount ?? 0,
      comments: s?.commentCount ?? 0,
      shares: s?.shareCount ?? 0,
      saves: 0,
      engagementRate: s?.impressionCount ? (s.engagement ?? 0) / s.impressionCount : null,
      videoViews: 0,
      watchTimeSecs: 0,
      avgWatchPct: null,
      ctr: null,
      replies: 0,
      reposts: 0,
      reactions: 0,
      clicks: s?.clickCount ?? 0,
    };
  }

  async fetchAccountInsights(token: string, _since: Date, _until: Date): Promise<PlatformAccountInsights> {
    const profile = await this.fetchProfile(token);
    const orgId = profile.profileData.organizationId as string;

    let followerCount = 0;
    if (orgId) {
      try {
        const res = await apiFetch("LinkedIn", `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fData = await res.json();
        followerCount = fData.elements?.[0]?.followerCounts?.[0]?.followerDelta?.value ?? 0;
      } catch {
        // Followers API may be behind different scope
      }
    }

    return {
      followerCount,
      followerGrowth: 0,
      totalViews: 0,
      totalReach: null,
      totalImpressions: 0,
      totalEngagement: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      avgEngagementRate: null,
      videoViews: 0,
      watchTimeSecs: 0,
      profileVisits: 0,
      websiteClicks: 0,
      pageLikes: 0,
      profileViews: 0,
      subscribers: 0,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await apiFetch("LinkedIn", `${this.baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch { return false; }
  }
}
