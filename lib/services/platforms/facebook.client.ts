import type {
  PlatformClient, TokenExchangeResult, ProfileResult,
  PlatformPost, PlatformPostMetrics, PlatformAccountInsights,
} from "./platform-client";
import { PlatformNotConfiguredError, apiFetch } from "./platform-client";

interface FbPost {
  id: string;
  message?: string;
  permalink_url?: string;
  full_picture?: string;
  created_time: string;
  type?: string;
}

interface FbPostInsights {
  data?: Array<{ name: string; period: string; values: Array<{ value: number }> }>;
}

interface FbPageInsights {
  data?: Array<{ name: string; period: string; values: Array<{ value: number }> }>;
}

export class FacebookClient implements PlatformClient {
  private get clientId(): string {
    const id = process.env.FACEBOOK_CLIENT_ID;
    if (!id) throw new PlatformNotConfiguredError("Facebook");
    return id;
  }

  private get clientSecret(): string {
    const s = process.env.FACEBOOK_CLIENT_SECRET;
    if (!s) throw new PlatformNotConfiguredError("Facebook");
    return s;
  }

  private get baseUrl(): string {
    return "https://graph.facebook.com/v22.0";
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("Facebook", `${this.baseUrl}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });
    const data = await res.json();
    const long = await apiFetch("Facebook", `${this.baseUrl}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "fb_exchange_token",
        fb_exchange_token: data.access_token,
      }),
    });
    const longData = await long.json();
    return {
      accessToken: longData.access_token ?? data.access_token,
      refreshToken: undefined,
      expiresAt: new Date(Date.now() + (longData.expires_in ?? 60) * 24 * 60 * 60 * 1000),
    };
  }

  async refreshToken(token: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("Facebook", `${this.baseUrl}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "fb_exchange_token",
        fb_exchange_token: token,
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: undefined,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 60) * 24 * 60 * 60 * 1000),
    };
  }

  async fetchProfile(token: string): Promise<ProfileResult> {
    const res = await apiFetch("Facebook", `${this.baseUrl}/me/accounts?fields=id,name,username,access_token,picture&access_token=${token}`);
    const data = await res.json();
    const pages = data.data ?? [];
    if (pages.length === 0) throw new Error("No Facebook pages found");
    const page = pages[0];
    return {
      platformAccountId: page.id,
      platformUsername: page.name,
      profileData: page,
    };
  }

  async fetchPosts(token: string, since: Date): Promise<PlatformPost[]> {
    const profile = await this.fetchProfile(token);
    const sinceUnix = Math.floor(since.getTime() / 1000);
    const res = await apiFetch(
      "Facebook",
      `${this.baseUrl}/${profile.platformAccountId}/posts?fields=id,message,permalink_url,full_picture,created_time,type&access_token=${token}&since=${sinceUnix}&limit=50`
    );
    const data = await res.json();
    const posts: FbPost[] = data.data ?? [];
    return posts.map((p) => ({
      nativePostId: p.id,
      permalink: p.permalink_url,
      title: p.message?.slice(0, 100),
      caption: p.message,
      thumbnail: p.full_picture,
      publishedAt: new Date(p.created_time),
      contentType: this.mapFbType(p.type),
    }));
  }

  async fetchPostMetrics(token: string, postId: string): Promise<PlatformPostMetrics> {
    const res = await apiFetch(
      "Facebook",
      `${this.baseUrl}/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users,post_reactions_like_total,post_comments_total,post_shares_total,post_clicks,post_video_views,post_video_avg_time_watched&period=lifetime&access_token=${token}`
    );
    const data: FbPostInsights = await res.json();
    const m = this.insightsToMap(data);
    return {
      nativePostId: postId,
      views: m.post_impressions ?? 0,
      reach: m.post_impressions_unique ?? null,
      impressions: m.post_impressions ?? 0,
      likes: m.post_reactions_like_total ?? 0,
      comments: m.post_comments_total ?? 0,
      shares: m.post_shares_total ?? 0,
      saves: 0,
      engagementRate: m.post_engaged_users != null && m.post_impressions ? m.post_engaged_users / m.post_impressions : null,
      videoViews: m.post_video_views ?? 0,
      watchTimeSecs: m.post_video_avg_time_watched ?? 0,
      avgWatchPct: null,
      ctr: null,
      replies: 0,
      reposts: 0,
      reactions: m.post_reactions_like_total ?? 0,
      clicks: m.post_clicks ?? 0,
    };
  }

  async fetchAccountInsights(token: string, since: Date, until: Date): Promise<PlatformAccountInsights> {
    const profile = await this.fetchProfile(token);
    const sinceStr = since.toISOString().split("T")[0];
    const untilStr = until.toISOString().split("T")[0];

    const [insightsRes, pageRes] = await Promise.all([
      apiFetch(
        "Facebook",
        `${this.baseUrl}/${profile.platformAccountId}/insights?metric=page_impressions,page_impressions_unique,page_engaged_users,page_fans,page_impressions_paid,page_impressions_organic,page_views_total&period=day&since=${sinceStr}&until=${untilStr}&access_token=${token}`
      ),
      apiFetch(
        "Facebook",
        `${this.baseUrl}/${profile.platformAccountId}?fields=fan_count&access_token=${token}`
      ),
    ]);

    const insights: FbPageInsights = await insightsRes.json();
    const pageData = await pageRes.json();
    const m = this.insightsToMap(insights);

    return {
      followerCount: pageData.fan_count ?? 0,
      followerGrowth: 0,
      totalViews: m.page_impressions ?? 0,
      totalReach: m.page_impressions_unique ?? null,
      totalImpressions: m.page_impressions ?? 0,
      totalEngagement: m.page_engaged_users ?? 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      avgEngagementRate: m.page_engaged_users != null && m.page_impressions ? m.page_engaged_users / m.page_impressions : null,
      videoViews: 0,
      watchTimeSecs: 0,
      profileVisits: m.page_views_total ?? 0,
      websiteClicks: 0,
      pageLikes: pageData.fan_count ?? 0,
      profileViews: m.page_views_total ?? 0,
      subscribers: 0,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await apiFetch("Facebook", `${this.baseUrl}/me?access_token=${token}`);
      return true;
    } catch { return false; }
  }

  private insightsToMap(data: FbPostInsights | FbPageInsights): Record<string, number> {
    const r: Record<string, number> = {};
    for (const item of data.data ?? []) {
      const val = item.values?.reduce((s: number, v: { value: number }) => s + v.value, 0) ?? 0;
      r[item.name] = val;
    }
    return r;
  }

  private mapFbType(type?: string): string {
    switch (type) {
      case "video": return "VIDEO";
      case "link": return "POST";
      case "photo": return "POST";
      case "status": return "POST";
      case "event": return "POST";
      default: return "POST";
    }
  }
}
