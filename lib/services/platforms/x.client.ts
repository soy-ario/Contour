import type {
  PlatformClient, TokenExchangeResult, ProfileResult,
  PlatformPost, PlatformPostMetrics, PlatformAccountInsights,
} from "./platform-client";
import { PlatformNotConfiguredError, apiFetch } from "./platform-client";

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
  attachments?: { media_keys?: string[] };
}

export class XClient implements PlatformClient {
  private get clientId(): string {
    const id = process.env.X_CLIENT_ID;
    if (!id) throw new PlatformNotConfiguredError("X");
    return id;
  }

  private get clientSecret(): string {
    const s = process.env.X_CLIENT_SECRET;
    if (!s) throw new PlatformNotConfiguredError("X");
    return s;
  }

  private get tokenUrl(): string {
    return "https://api.twitter.com/2/oauth2/token";
  }
  private get baseUrl(): string {
    return "https://api.twitter.com/2";
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult> {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await apiFetch("X", this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: "challenge",
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 7200) * 1000),
    };
  }

  async refreshToken(token: string): Promise<TokenExchangeResult> {
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const res = await apiFetch("X", this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        refresh_token: token,
        grant_type: "refresh_token",
        client_id: this.clientId,
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 7200) * 1000),
    };
  }

  async fetchProfile(token: string): Promise<ProfileResult> {
    const res = await apiFetch("X", `${this.baseUrl}/users/me?user.fields=id,name,username,profile_image_url,public_metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const u = data.data;
    return {
      platformAccountId: u.id,
      platformUsername: u.username,
      profileData: u,
    };
  }

  async fetchPosts(token: string, since: Date): Promise<PlatformPost[]> {
    const profile = await this.fetchProfile(token);
    const sinceStr = since.toISOString().replace("Z", "");

    const res = await apiFetch(
      "X",
      `${this.baseUrl}/users/${profile.platformAccountId}/tweets?max_results=100&tweet.fields=created_at,public_metrics,attachments&start_time=${sinceStr}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const tweets: XTweet[] = data.data ?? [];

    return tweets.map((t) => ({
      nativePostId: t.id,
      permalink: `https://x.com/${profile.platformUsername}/status/${t.id}`,
      title: t.text.slice(0, 100),
      caption: t.text,
      thumbnail: undefined,
      publishedAt: new Date(t.created_at),
      contentType: "POST",
    }));
  }

  async fetchPostMetrics(_token: string, postId: string): Promise<PlatformPostMetrics> {
    const res = await apiFetch(
      "X",
      `${this.baseUrl}/tweets/${postId}?tweet.fields=public_metrics`,
      { headers: { Authorization: `Bearer ${_token}` } }
    );
    const data = await res.json();
    const t: XTweet = data.data;
    const m = t?.public_metrics;

    if (!m) {
      return { nativePostId: postId, views: 0, reach: null, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagementRate: null, videoViews: 0, watchTimeSecs: 0, avgWatchPct: null, ctr: null, replies: 0, reposts: 0, reactions: 0, clicks: 0 };
    }

    const impressions = m.impression_count ?? 0;
    const engagements = (m.like_count ?? 0) + (m.retweet_count ?? 0) + (m.reply_count ?? 0) + (m.quote_count ?? 0) + (m.bookmark_count ?? 0);

    return {
      nativePostId: postId,
      views: impressions,
      reach: null,
      impressions,
      likes: m.like_count ?? 0,
      comments: m.reply_count ?? 0,
      shares: (m.retweet_count ?? 0) + (m.quote_count ?? 0),
      saves: m.bookmark_count ?? 0,
      engagementRate: impressions > 0 ? engagements / impressions : null,
      videoViews: 0,
      watchTimeSecs: 0,
      avgWatchPct: null,
      ctr: null,
      replies: m.reply_count ?? 0,
      reposts: m.retweet_count ?? 0,
      reactions: engagements,
      clicks: 0,
    };
  }

  async fetchAccountInsights(token: string, _since: Date, _until: Date): Promise<PlatformAccountInsights> {
    const profile = await this.fetchProfile(token);
    const pm = profile.profileData as any;
    const metrics = pm?.public_metrics;

    return {
      followerCount: metrics?.followers_count ?? 0,
      followerGrowth: 0,
      totalViews: metrics?.tweet_count ?? 0,
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
      await this.fetchProfile(token);
      return true;
    } catch { return false; }
  }
}
