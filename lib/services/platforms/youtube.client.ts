import type {
  PlatformClient, TokenExchangeResult, ProfileResult,
  PlatformPost, PlatformPostMetrics, PlatformAccountInsights,
} from "./platform-client";
import { PlatformNotConfiguredError, apiFetch } from "./platform-client";

interface YtVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { high?: { url: string }; default?: { url: string } };
    publishedAt: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
    favoriteCount?: string;
  };
  contentDetails: { duration: string };
}

interface YtChannelStats {
  subscriberCount?: string;
  viewCount?: string;
  videoCount?: string;
}

interface YtAnalyticsRow {
  views?: string;
  comments?: string;
  likes?: string;
  shares?: string;
  estimatedMinutesWatched?: string;
  averageViewDurationSeconds?: string;
  subscribersGained?: string;
  subscribersLost?: string;
  videosAddedToPlaylists?: string;
  videosRemovedFromPlaylists?: string;
}

export class YouTubeClient implements PlatformClient {
  private get clientId(): string {
    const id = process.env.YOUTUBE_CLIENT_ID;
    if (!id) throw new PlatformNotConfiguredError("YouTube");
    return id;
  }

  private get clientSecret(): string {
    const s = process.env.YOUTUBE_CLIENT_SECRET;
    if (!s) throw new PlatformNotConfiguredError("YouTube");
    return s;
  }

  private get tokenUrl(): string {
    return "https://oauth2.googleapis.com/token";
  }

  private get baseUrl(): string {
    return "https://www.googleapis.com/youtube/v3";
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("YouTube", this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
    };
  }

  async refreshToken(token: string): Promise<TokenExchangeResult> {
    const res = await apiFetch("YouTube", this.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: token,
        grant_type: "refresh_token",
      }).toString(),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
    };
  }

  async fetchProfile(token: string): Promise<ProfileResult> {
    const res = await apiFetch("YouTube", `${this.baseUrl}/channels?part=snippet,statistics&mine=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const channel = data.items?.[0];
    if (!channel) throw new Error("No YouTube channel found");

    return {
      platformAccountId: channel.id,
      platformUsername: channel.snippet.title,
      profileData: { ...channel.snippet, statistics: channel.statistics },
    };
  }

  async fetchPosts(token: string, since: Date): Promise<PlatformPost[]> {
    const profile = await this.fetchProfile(token);
    const res = await apiFetch(
      "YouTube",
      `${this.baseUrl}/search?part=snippet&channelId=${profile.platformAccountId}&order=date&maxResults=50&publishedAfter=${since.toISOString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const items: Array<{ id: { videoId: string }; snippet: YtVideo["snippet"] }> = data.items ?? [];

    const videoIds = items.map((i) => i.id.videoId).filter(Boolean).join(",");
    if (!videoIds) return [];

    const statsRes = await apiFetch(
      "YouTube",
      `${this.baseUrl}/videos?part=statistics,contentDetails,snippet&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statsData = await statsRes.json();
    const videos: YtVideo[] = statsData.items ?? [];

    return videos.map((v) => ({
      nativePostId: v.id,
      permalink: `https://www.youtube.com/watch?v=${v.id}`,
      title: v.snippet.title,
      caption: v.snippet.description,
      thumbnail: v.snippet.thumbnails?.high?.url ?? v.snippet.thumbnails?.default?.url,
      publishedAt: new Date(v.snippet.publishedAt),
      contentType: "VIDEO",
    }));
  }

  async fetchPostMetrics(token: string, postId: string): Promise<PlatformPostMetrics> {
    const res = await apiFetch(
      "YouTube",
      `${this.baseUrl}/videos?part=statistics,contentDetails&id=${postId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const v: YtVideo = data.items?.[0];
    if (!v) {
      return { nativePostId: postId, views: 0, reach: null, impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagementRate: null, videoViews: 0, watchTimeSecs: 0, avgWatchPct: null, ctr: null, replies: 0, reposts: 0, reactions: 0, clicks: 0 };
    }
    const stats = v.statistics;
    const views = parseInt(stats?.viewCount ?? "0", 10);
    const likes = parseInt(stats?.likeCount ?? "0", 10);
    const comments = parseInt(stats?.commentCount ?? "0", 10);
    const engagement = views > 0 ? ((likes + comments) / views) : 0;

    return {
      nativePostId: postId,
      views,
      reach: null,
      impressions: 0,
      likes,
      comments,
      shares: 0,
      saves: 0,
      engagementRate: Math.round(engagement * 10000) / 10000,
      videoViews: views,
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
    const sinceFmt = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`;
    const untilFmt = `${until.getFullYear()}-${String(until.getMonth() + 1).padStart(2, "0")}-${String(until.getDate()).padStart(2, "0")}`;

    const [channelRes, analyticsRes] = await Promise.all([
      apiFetch(
        "YouTube",
        `${this.baseUrl}/channels?part=statistics&id=${profile.platformAccountId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      apiFetch(
        "YouTube",
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3D${profile.platformAccountId}&startDate=${sinceFmt}&endDate=${untilFmt}&metrics=views%2Clikes%2Ccomments%2Cshares%2CestimatedMinutesWatched%2CaverageViewDurationSeconds%2CsubscribersGained%2CsubscribersLost&dimensions=day`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    const channelData = await channelRes.json();
    const cs: YtChannelStats = channelData.items?.[0]?.statistics ?? {};
    const subscribers = parseInt(cs.subscriberCount ?? "0", 10);
    const totalChannelViews = parseInt(cs.viewCount ?? "0", 10);

    let analyticsViews = 0;
    let analyticsLikes = 0;
    let analyticsComments = 0;
    let analyticsShares = 0;
    let watchTimeMins = 0;

    try {
      const a = await analyticsRes.json();
      if (a.rows) {
        for (const row of a.rows) {
          analyticsViews += parseInt(row[0] ?? "0", 10);
          analyticsLikes += parseInt(row[1] ?? "0", 10);
          analyticsComments += parseInt(row[2] ?? "0", 10);
          analyticsShares += parseInt(row[3] ?? "0", 10);
          watchTimeMins += parseInt(row[4] ?? "0", 10);
        }
      }
    } catch {
      // Analytics API may not be enabled; fall back
    }

    return {
      followerCount: subscribers,
      followerGrowth: 0,
      totalViews: analyticsViews || totalChannelViews,
      totalReach: null,
      totalImpressions: 0,
      totalEngagement: analyticsLikes + analyticsComments + analyticsShares,
      totalLikes: analyticsLikes,
      totalComments: analyticsComments,
      totalShares: analyticsShares,
      totalSaves: 0,
      avgEngagementRate: analyticsViews > 0 ? ((analyticsLikes + analyticsComments + analyticsShares) / analyticsViews) : null,
      videoViews: analyticsViews || totalChannelViews,
      watchTimeSecs: watchTimeMins * 60,
      profileVisits: 0,
      websiteClicks: 0,
      pageLikes: 0,
      profileViews: 0,
      subscribers,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await apiFetch("YouTube", "https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=" + token);
      return true;
    } catch { return false; }
  }
}
