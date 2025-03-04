
import { OAuthConfig, SocialMediaAccount } from '@/types/social';
import { OAUTH_ENDPOINTS, DEFAULT_CLIENT_IDS } from '@/config/socialMedia.config';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Store OAuth states for security verification
const oauthStates: Record<string, { platform: string; timestamp: number }> = {};

/**
 * Initiates the OAuth flow for a specific platform
 */
export const initiateOAuth = (platform: SocialMediaAccount['platform']): void => {
  if (!OAUTH_ENDPOINTS[platform]) {
    toast({
      title: "Configuration Error",
      description: `OAuth configuration for ${platform} not found.`,
      variant: "destructive"
    });
    return;
  }

  // Generate a state parameter for security
  const state = uuidv4();
  oauthStates[state] = { platform, timestamp: Date.now() };

  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  Object.keys(oauthStates).forEach(key => {
    if (oauthStates[key].timestamp < tenMinutesAgo) {
      delete oauthStates[key];
    }
  });

  // Get OAuth configuration
  const oauthConfig = OAUTH_ENDPOINTS[platform];
  const clientId = DEFAULT_CLIENT_IDS[platform];
  
  // Construct redirect URL (in production, this would be a real endpoint)
  const redirectUri = `${window.location.origin}/oauth-callback`;
  
  // Construct the authorization URL
  const authUrl = new URL(oauthConfig.authUrl);
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', oauthConfig.responseType);
  authUrl.searchParams.append('scope', oauthConfig.scope);
  authUrl.searchParams.append('state', state);
  
  // Open the authorization URL in a popup window
  const width = 600;
  const height = 700;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  
  const popup = window.open(
    authUrl.toString(),
    `${platform}Auth`,
    `width=${width},height=${height},left=${left},top=${top}`
  );

  // Check if popup was blocked
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    toast({
      title: "Popup Blocked",
      description: "Please allow popups for this website to connect your account.",
      variant: "destructive"
    });
    return;
  }
  
  // Poll for popup closure
  const popupTimer = setInterval(() => {
    if (popup.closed) {
      clearInterval(popupTimer);
      // In a real implementation, we would handle the OAuth callback and token exchange here
      // For this demo, we'll simulate the callback in handleOAuthCallback
      
      // Simulate callback after 2 seconds
      setTimeout(() => {
        const mockCode = uuidv4();
        handleOAuthCallback(platform, mockCode, state);
      }, 2000);
    }
  }, 500);
};

/**
 * Handles the OAuth callback from the popup window
 */
export const handleOAuthCallback = async (
  platform: SocialMediaAccount['platform'], 
  code: string, 
  state: string
): Promise<SocialMediaAccount | null> => {
  // Verify state parameter
  if (!oauthStates[state] || oauthStates[state].platform !== platform) {
    toast({
      title: "Security Error",
      description: "OAuth state validation failed. Please try again.",
      variant: "destructive"
    });
    return null;
  }
  
  // Clean up the used state
  delete oauthStates[state];
  
  try {
    // In a real implementation, we would exchange the code for tokens here
    // For this demo, we'll simulate a successful exchange
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Processing OAuth callback for ${platform} with code: ${code.substring(0, 6)}...`);
    
    // Mock verification with the platform's API
    const verified = await verifyOAuthConnection(platform, code);
    
    if (!verified) {
      throw new Error("Failed to verify account connection");
    }
    
    // Create a new account object with mock data
    const newAccount: SocialMediaAccount = {
      id: uuidv4(),
      platform,
      username: `user_${platform}_${uuidv4().substring(0, 6)}`,
      connected: true,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform}${Date.now()}`,
      lastUsed: new Date(),
      accessToken: `oauth-token-${uuidv4()}`,
      refreshToken: `refresh-token-${uuidv4()}`,
      tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      scopes: OAUTH_ENDPOINTS[platform].scope.split(',')
    };
    
    toast({
      title: "Account Connected",
      description: `Successfully connected to ${platform}.`,
    });
    
    return newAccount;
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    
    toast({
      title: "Connection Failed",
      description: error instanceof Error ? error.message : `Failed to connect to ${platform}.`,
      variant: "destructive"
    });
    
    return null;
  }
};

/**
 * Verifies the OAuth connection with the platform's API
 */
export const verifyOAuthConnection = async (
  platform: SocialMediaAccount['platform'],
  code: string
): Promise<boolean> => {
  console.log(`Verifying OAuth connection for ${platform} with authorization code`);
  
  // In a real implementation, this would call the platform's API to verify the connection
  // For this demo, we'll simulate the verification process
  
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate a 10% chance of failure to demonstrate error handling
  const randomSuccess = Math.random() > 0.1;
  
  if (!randomSuccess) {
    throw new Error(`${platform} API verification failed. Please try again.`);
  }
  
  console.log(`Verification successful for ${platform}`);
  return true;
};

/**
 * Refreshes the access token for an account
 */
export const refreshAccessToken = async (account: SocialMediaAccount): Promise<SocialMediaAccount> => {
  // In a real implementation, this would refresh the access token using the refresh token
  // For this demo, we'll simulate the refresh process
  
  console.log(`Refreshing access token for ${account.platform} account: ${account.username}`);
  
  // Simulate refresh delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Update the account with a new access token and expiry date
  return {
    ...account,
    accessToken: `new-token-${uuidv4()}`,
    tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    lastUsed: new Date()
  };
};

/**
 * Validates if the account token is still valid
 */
export const validateAccountToken = async (account: SocialMediaAccount): Promise<boolean> => {
  if (!account.tokenExpiry) {
    return false;
  }
  
  // Check if token is expired
  if (account.tokenExpiry < new Date()) {
    console.log(`Token expired for ${account.platform} account: ${account.username}`);
    return false;
  }
  
  // In a real implementation, we would also verify the token with the platform's API
  console.log(`Token valid for ${account.platform} account: ${account.username}`);
  return true;
};
