import type {
  PlatformClient,
  TokenExchangeResult,
  ProfileResult,
  PlatformPost,
  PlatformPostMetrics,
  PlatformAccountInsights,
} from "./platform-client";
import {
  PlatformNotConfiguredError,
  PlatformAuthError,
  apiFetch,
} from "./platform-client";

interface IgMedia {
  id: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
  caption?: string;
  timestamp: string;
  thumbnail_url?: string;
}

interface IgMediaInsights {
  data?: Array<{
    name: string;
    period: string;
    values: Array<{ value: number }>;
  }>;
}

interface IgUserInsights {
  data?: Array<{
    name: string;
    period: string;
    values: Array<{ value: number }>;
  }>;
}

export class InstagramClient implements PlatformClient {
  private get clientId(): string {
    const id = process.env.FACEBOOK_CLIENT_ID;
    if (!id) throw new PlatformNotConfiguredError("Instagram");
    return id;
  }

  private get clientSecret(): string {
    const secret = process.env.FACEBOOK_CLIENT_SECRET;
    if (!secret) throw new PlatformNotConfiguredError("Instagram");
    return secret;
  }

  private get baseUrl(): string {
    return "https://graph.facebook.com/v22.0";
  }

  getRedirectUri(): string {
    return `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/callback/instagram`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("Instagram", `${this.baseUrl}/oauth/access_token`, {
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
    // Short-lived token — exchange for long-lived
    const longLivedRes = await apiFetch("Instagram", `${this.baseUrl}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "fb_exchange_token",
        fb_exchange_token: data.access_token,
      }),
    });

    const longLived = await longLivedRes.json();

    return {
      accessToken: longLived.access_token ?? data.access_token,
      refreshToken: undefined,
      expiresAt: new Date(Date.now() + (longLived.expires_in ?? 60) * 24 * 60 * 60 * 1000),
    };
  }

  async refreshToken(token: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("Instagram", `${this.baseUrl}/oauth/access_token`, {
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
    const meRes = await apiFetch("Instagram", `${this.baseUrl}/me?fields=id,name,accounts&access_token=${token}`);
    const me = await meRes.json();

    const pages = me.accounts?.data;
    if (!pages || pages.length === 0) {
      throw new PlatformAuthError("Instagram", "No Facebook pages found. Link Instagram to a Facebook page first.");
    }

    const page = pages[0];
    const igRes = await apiFetch(
      "Instagram",
      `${this.baseUrl}/${page.id}?fields=instagram_business_account&access_token=${token}`
    );
    const igData = await igRes.json();
    const igId = igData.instagram_business_account?.id;

    if (!igId) {
      throw new PlatformAuthError("Instagram", "No Instagram Business account linked to this Facebook page.");
    }

    const accountRes = await apiFetch(
      "Instagram",
      `${this.baseUrl}/${igId}?fields=id,username,profile_picture_url,name&access_token=${token}`
    );
    const account = await accountRes.json();

    return {
      platformAccountId: account.id,
      platformUsername: account.username,
      profileData: account as unknown as Record<string, unknown>,
    };
  }

  async fetchPosts(token: string, since: Date): Promise<PlatformPost[]> {
    const profile = await this.fetchProfile(token);
    const sinceUnix = Math.floor(since.getTime() / 1000);

    const res = await apiFetch(
      "Instagram",
      `${this.baseUrl}/${profile.platformAccountId}/media?fields=id,media_type,media_url,permalink,caption,timestamp,thumbnail_url&access_token=${token}&since=${sinceUnix}&limit=50`
    );
    const data = await res.json();
    const media: IgMedia[] = data.data ?? [];

    return media.map((m) => ({
      nativePostId: m.id,
      permalink: m.permalink,
      caption: m.caption,
      thumbnail: m.thumbnail_url ?? m.media_url,
      publishedAt: new Date(m.timestamp),
      contentType: this.mapMediaType(m.media_type),
    }));
  }

  async fetchPostMetrics(token: string, postId: string): Promise<PlatformPostMetrics> {
    const res = await apiFetch(
      "Instagram",
      `${this.baseUrl}/${postId}/insights?metric=impressions,reach,engagement,saved,video_views,likes,comments,shares&period=lifetime&access_token=${token}`
    );
    const data: IgMediaInsights = await res.json();
    const map = this.insightsToMap(data);

    return {
      nativePostId: postId,
      views: map.impressions ?? 0,
      reach: map.reach ?? null,
      impressions: map.impressions ?? 0,
      likes: map.likes ?? 0,
      comments: map.comments ?? 0,
      shares: map.shares ?? 0,
      saves: map.saved ?? 0,
      engagementRate: null,
      videoViews: map.video_views ?? 0,
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

    const res = await apiFetch(
      "Instagram",
      `${this.baseUrl}/${profile.platformAccountId}/insights?metric=follower_count,impressions,reach,profile_views,email_contacts,phone_call_clicks,text_message_clicks,get_directions_clicks,website_clicks&period=day&since=${sinceStr}&until=${untilStr}&access_token=${token}`
    );
    const data: IgUserInsights = await res.json();
    const map = this.insightsToMap(data);

    const followerRes = await apiFetch(
      "Instagram",
      `${this.baseUrl}/${profile.platformAccountId}?fields=followers_count&access_token=${token}`
    );
    const followerData = await followerRes.json();

    const followersNow = followerData.followers_count ?? 0;

    return {
      followerCount: followersNow,
      followerGrowth: 0,
      totalViews: map.impressions ?? 0,
      totalReach: map.reach ?? null,
      totalImpressions: map.impressions ?? 0,
      totalEngagement: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      avgEngagementRate: null,
      videoViews: 0,
      watchTimeSecs: 0,
      profileVisits: map.profile_views ?? 0,
      websiteClicks: map.website_clicks ?? 0,
      pageLikes: 0,
      profileViews: map.profile_views ?? 0,
      subscribers: 0,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await apiFetch("Instagram", `${this.baseUrl}/me?access_token=${token}`);
      return true;
    } catch {
      return false;
    }
  }

  private insightsToMap(
    insights: IgMediaInsights | IgUserInsights
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of insights.data ?? []) {
      const val = item.values?.[0]?.value ?? 0;
      result[item.name] = val;
    }
    return result;
  }

  private mapMediaType(type: string): string {
    switch (type) {
      case "IMAGE":
      case "CAROUSEL_ALBUM":
        return "POST";
      case "VIDEO":
        return "REEL";
      default:
        return "POST";
    }
  }
}
