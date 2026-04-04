export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  accountId?: string;
  accountName?: string;
}

export interface UploadMetadata {
  title: string;
  description: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
}

export interface UploadResult {
  platformVideoId: string;
  platformUrl: string;
}

export interface MetadataConstraints {
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTags: number;
  supportsPrivacy: boolean;
  privacyOptions: string[];
  defaultPrivacy: string;
}

export interface SocialProvider {
  id: string;
  name: string;
  iconPath: string;
  scopes: string[];
  metadataConstraints: MetadataConstraints;

  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
  upload(
    accessToken: string,
    videoUrl: string,
    metadata: UploadMetadata,
  ): Promise<UploadResult>;
  revokeToken(accessToken: string): Promise<void>;
}
