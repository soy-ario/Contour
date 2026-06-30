import type {
  PlatformClient, TokenExchangeResult, ProfileResult,
  PlatformPost, PlatformPostMetrics, PlatformAccountInsights,
} from "./platform-client";
import { PlatformNotConfiguredError, apiFetch } from "./platform-client";

export class TikTokClient implements PlatformClient {
  private get clientKey(): string {
    const key = process.env.TIKTOK_CLIENT_ID;
    if (!key) throw new PlatformNotConfiguredError("TikTok");
    return key;
  }

  private get clientSecret(): string {
    const s = process.env.TIKTOK_CLIENT_SECRET;
    if (!s) throw new PlatformNotConfiguredError("TikTok");
    return s;
  }

  private get baseUrl(): string {
    return "https://open.tiktokapis.com/v2";
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("TikTok", "https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    };
  }

  async refreshToken(token: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("TikTok", "https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        refresh_token: token,
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    };
  }

  async fetchProfile(token: string): Promise<ProfileResult> {
    const res = await apiFetch("TikTok", `${this.baseUrl}/user/info/?fields=open_id,union_id,avatar_url,display_name,username`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const user = data.data?.user;
    return {
      platformAccountId: user.open_id,
      platformUsername: user.username ?? user.display_name,
      profileData: user,
    };
  }

  async fetchPosts(_token: string, _since: Date): Promise<PlatformPost[]> {
    const profile = await this.fetchProfile(_token);
    const res = await apiFetch("TikTok", `${this.baseUrl}/video/list/?fields=id,title,cover_image_url,create_time,embed_link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_count: 20,
        cursor: 0,
      }),
    });
    const data = await res.json();
    return (data.data?.videos ?? []).map((v: any) => ({
      nativePostId: v.id,
      permalink: v.embed_link,
      title: v.title,
      thumbnail: v.cover_image_url,
      publishedAt: new Date(parseInt(v.create_time, 10) * 1000),
      contentType: "SHORT",
    }));
  }

  async fetchPostMetrics(token: string, postId: string): Promise<PlatformPostMetrics> {
    const res = await apiFetch("TikTok", `${this.baseUrl}/video/data/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filters: { video_ids: [postId] },
      }),
    });
    const data = await res.json();
    const v = data.data?.videos?.[0];
    if (!v) {
      return { nativePostId: postId, views: 0, reach: null, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagementRate: null, videoViews: 0, watchTimeSecs: 0, avgWatchPct: null, ctr: null, replies: 0, reposts: 0, reactions: 0, clicks: 0 };
    }

    return {
      nativePostId: postId,
      views: v.view_count ?? 0,
      reach: null,
      impressions: 0,
      likes: v.like_count ?? 0,
      comments: v.comment_count ?? 0,
      shares: v.share_count ?? 0,
      saves: 0,
      engagementRate: null,
      videoViews: v.view_count ?? 0,
      watchTimeSecs: 0,
      avgWatchPct: null,
      ctr: null,
      replies: 0,
      reposts: 0,
      reactions: 0,
      clicks: 0,
    };
  }

  async fetchAccountInsights(token: string, since: Date, until: Date): Promise<PlatformAccountInsights> {
    const profile = await this.fetchProfile(token);
    const sinceStr = since.toISOString().split("T")[0];
    const untilStr = until.toISOString().split("T")[0];

    const res = await apiFetch("TikTok", `${this.baseUrl}/business/account/insights/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: ["follower_count", "total_follower_count", "profile_views", "video_views", "likes", "comments", "shares"],
        start_date: sinceStr,
        end_date: untilStr,
      }),
    });
    const data = await res.json();
    const m = data.data ?? {};

    return {
      followerCount: m.follower_count ?? m.total_follower_count ?? 0,
      followerGrowth: m.follower_delta ?? 0,
      totalViews: m.video_views ?? 0,
      totalReach: null,
      totalImpressions: 0,
      totalEngagement: (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0),
      totalLikes: m.likes ?? 0,
      totalComments: m.comments ?? 0,
      totalShares: m.shares ?? 0,
      totalSaves: 0,
      avgEngagementRate: null,
      videoViews: m.video_views ?? 0,
      watchTimeSecs: 0,
      profileVisits: m.profile_views ?? 0,
      websiteClicks: 0,
      pageLikes: 0,
      profileViews: m.profile_views ?? 0,
      subscribers: 0,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await this.fetchProfile(token);
      return true;
    } catch { return false; }
  }
}
