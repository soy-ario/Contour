import type { Platform } from "@prisma/client";
import type { PlatformClient } from "./platform-client";
import { InstagramClient } from "./instagram.client";
import { FacebookClient } from "./facebook.client";
import { YouTubeClient } from "./youtube.client";
import { TikTokClient } from "./tiktok.client";
import { XClient } from "./x.client";
import { LinkedInClient } from "./linkedin.client";
import { PlatformNotConfiguredError } from "./platform-client";

const clients: Partial<Record<Platform, PlatformClient>> = {};

export function getPlatformClient(platform: Platform): PlatformClient {
  if (clients[platform]) return clients[platform]!;

  let client: PlatformClient;
  switch (platform) {
    case "INSTAGRAM":
      client = new InstagramClient();
      break;
    case "FACEBOOK":
      client = new FacebookClient();
      break;
    case "YOUTUBE":
      client = new YouTubeClient();
      break;
    case "TIKTOK":
      client = new TikTokClient();
      break;
    case "X":
      client = new XClient();
      break;
    case "LINKEDIN":
      client = new LinkedInClient();
      break;
    default:
      throw new PlatformNotConfiguredError(platform);
  }

  clients[platform] = client;
  return client;
}

export function getOAuthConnectUrl(platform: Platform, redirectUri: string): string {
  const baseConfigs: Record<Platform, { authUrl: string; clientId: string; scopes: string }> = {
    INSTAGRAM: {
      authUrl: "https://www.facebook.com/v22.0/dialog/oauth",
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      scopes: "instagram_basic,instagram_content_publish,pages_read_engagement",
    },
    FACEBOOK: {
      authUrl: "https://www.facebook.com/v22.0/dialog/oauth",
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      scopes: "pages_read_engagement,pages_read_user_content,pages_show_list",
    },
    YOUTUBE: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      clientId: process.env.YOUTUBE_CLIENT_ID ?? "",
      scopes: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
    },
    TIKTOK: {
      authUrl: "https://www.tiktok.com/v2/auth/authorize",
      clientId: process.env.TIKTOK_CLIENT_ID ?? "",
      scopes: "user.info.basic,video.list,video.data,account.info",
    },
    X: {
      authUrl: "https://twitter.com/i/oauth2/authorize",
      clientId: process.env.X_CLIENT_ID ?? "",
      scopes: "tweet.read users.read offline.access",
    },
    LINKEDIN: {
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      clientId: process.env.LINKEDIN_CLIENT_ID ?? "",
      scopes: "w_member_social r_emailaddress r_organization_social r_organization_admin",
    },
  };

  const config = baseConfigs[platform];
  if (!config.clientId) {
    throw new PlatformNotConfiguredError(platform);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes,
    state: crypto.randomUUID(),
  });

  if (platform === "LINKEDIN") {
    params.set("response_type", "code");
  }

  return `${config.authUrl}?${params.toString()}`;
}
