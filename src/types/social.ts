
export interface SocialMediaAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'reddit';
  username: string;
  connected: boolean;
  avatarUrl?: string;
  lastUsed?: Date;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scopes?: string[];
}

export interface SocialMediaConnectionState {
  accounts: SocialMediaAccount[];
  isConnecting: boolean;
  connectionError?: string;
}

export interface SocialMediaPlatformConfig {
  maxCaptionLength: number;
  maxHashtags: number;
  supportedImageFormats: string[];
  apiVersion: string;
}

export interface SocialMediaShareOptions {
  platforms: SocialMediaAccount['platform'][];
  caption: string;
  hashtags: string[];
  includeModelLink: boolean;
  isPublic: boolean;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUrl: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  responseType: string;
}

export interface ShareResult {
  platform: SocialMediaAccount['platform'];
  success: boolean;
  postUrl?: string;
  error?: string;
}

