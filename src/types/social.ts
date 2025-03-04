
export interface SocialMediaAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'reddit';
  username: string;
  connected: boolean;
  avatarUrl?: string;
  lastUsed?: Date;
}

export interface SocialMediaConnectionState {
  accounts: SocialMediaAccount[];
  isConnecting: boolean;
  connectionError?: string;
}
