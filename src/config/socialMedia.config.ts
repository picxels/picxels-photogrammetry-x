
import { SocialMediaPlatformConfig } from '@/types/social';
import { getSavedAccounts, saveAccount } from '@/utils/socialAccountStorage';

/**
 * Social Media Configuration
 * 
 * Contains settings and utilities for social media platform integration.
 * Account credentials are stored in a local SQLite database for security.
 */

// OAuth endpoints for various platforms
export const OAUTH_ENDPOINTS = {
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scope: 'user_profile,user_media',
    responseType: 'code'
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scope: 'tweet.read,tweet.write,users.read,offline.access',
    responseType: 'code'
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'public_profile,publish_to_groups',
    responseType: 'code'
  },
  tiktok: {
    authUrl: 'https://open-api.tiktok.com/platform/oauth/connect/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    scope: 'user.info.basic,video.upload',
    responseType: 'code'
  },
  reddit: {
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scope: 'identity,submit',
    responseType: 'code'
  }
};

// Default app client IDs (these should be replaced with user's own client IDs)
export const DEFAULT_CLIENT_IDS: Record<string, string> = {
  instagram: 'YOUR_INSTAGRAM_CLIENT_ID',
  twitter: 'YOUR_TWITTER_CLIENT_ID',
  facebook: 'YOUR_FACEBOOK_CLIENT_ID',
  tiktok: 'YOUR_TIKTOK_CLIENT_ID',
  reddit: 'YOUR_REDDIT_CLIENT_ID'
};

// Platform-specific settings
export const PLATFORM_CONFIGS: Record<string, SocialMediaPlatformConfig> = {
  instagram: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportedImageFormats: ['jpg', 'jpeg'],
    apiVersion: 'v18.0'
  },
  twitter: {
    maxCaptionLength: 280,
    maxHashtags: 10,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    apiVersion: 'v2'
  },
  facebook: {
    maxCaptionLength: 5000,
    maxHashtags: 30,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    apiVersion: 'v18.0'
  },
  tiktok: {
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportedImageFormats: ['jpg', 'jpeg', 'png'],
    apiVersion: 'v2'
  },
  reddit: {
    maxCaptionLength: 300,
    maxHashtags: 5,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif'],
    apiVersion: 'v1'
  }
};

// Initialize social media accounts from local storage
export const initializeSocialMediaAccounts = async () => {
  return await getSavedAccounts();
};

// Default caption templates
export const DEFAULT_CAPTION_TEMPLATES = {
  default: "Check out my new 3D scan of {model_name}! #3DScan #Photogrammetry",
  instagram: "📸 Just captured this {model_name} with #Picxels Photogrammetry! #3DScan #3DModel",
  twitter: "Check out this {model_name} I just scanned with Picxels Photogrammetry X! #3D",
  facebook: "I'm excited to share this 3D scan of a {model_name} created with Picxels Photogrammetry X! #3DScanning",
  tiktok: "3D scanning a {model_name} with Picxels Photogrammetry! #3DScan #Tech",
  reddit: "{model_name} 3D scan using Picxels Photogrammetry (r/photogrammetry)"
};

