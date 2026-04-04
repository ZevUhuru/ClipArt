import { google } from "googleapis";
import type {
  SocialProvider,
  OAuthTokens,
  UploadMetadata,
  UploadResult,
} from "../types";
import { Readable } from "stream";

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;

function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUri);
}

const PRIVACY_MAP: Record<string, string> = {
  public: "public",
  unlisted: "unlisted",
  private: "private",
};

export const youtubeProvider: SocialProvider = {
  id: "youtube",
  name: "YouTube",
  iconPath: "/icons/youtube.svg",
  scopes: ["https://www.googleapis.com/auth/youtube.upload"],

  metadataConstraints: {
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxTags: 30,
    supportsPrivacy: true,
    privacyOptions: ["public", "unlisted", "private"],
    defaultPrivacy: "unlisted",
  },

  getAuthUrl(state: string, redirectUri: string): string {
    const client = getOAuth2Client(redirectUri);
    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: this.scopes,
      state,
    });
  },

  async exchangeCode(
    code: string,
    redirectUri: string,
  ): Promise<OAuthTokens> {
    const client = getOAuth2Client(redirectUri);
    const { tokens } = await client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : undefined,
      accountName: "YouTube",
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const client = getOAuth2Client();
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : undefined,
    };
  },

  async upload(
    accessToken: string,
    videoUrl: string,
    metadata: UploadMetadata,
  ): Promise<UploadResult> {
    const client = getOAuth2Client();
    client.setCredentials({ access_token: accessToken });
    const yt = google.youtube({ version: "v3", auth: client });

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error("Failed to fetch video from storage");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const res = await yt.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title.slice(0, 100),
          description: metadata.description.slice(0, 5000),
          tags: metadata.tags.slice(0, 30),
          categoryId: "22", // People & Blogs
        },
        status: {
          privacyStatus: PRIVACY_MAP[metadata.privacy] || "unlisted",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: Readable.from(videoBuffer),
      },
    });

    const videoId = res.data.id!;
    return {
      platformVideoId: videoId,
      platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  },

  async revokeToken(accessToken: string): Promise<void> {
    const client = getOAuth2Client();
    client.setCredentials({ access_token: accessToken });
    try {
      await client.revokeToken(accessToken);
    } catch {
      // Token may already be expired/revoked
    }
  },
};
