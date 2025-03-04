
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Plus, Settings2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { SocialMediaAccount, SocialMediaConnectionState } from '@/types/social';
import PlatformCard from './PlatformCard';
import { Textarea } from '@/components/ui/textarea';
import {
  getSavedAccounts,
  saveAccount,
  deleteAccount,
  initializeDatabase
} from '@/utils/socialAccountStorage';
import {
  DEFAULT_CAPTION_TEMPLATES,
  PLATFORM_CONFIGS
} from '@/config/socialMedia.config';
import {
  initiateOAuth,
  handleOAuthCallback,
  validateAccountToken
} from '@/services/oauthService';

const SocialMediaConnections: React.FC = () => {
  const [connectionState, setConnectionState] = useState<SocialMediaConnectionState>({
    accounts: [],
    isConnecting: false
  });

  const [captionTemplate, setCaptionTemplate] = useState<string>(
    DEFAULT_CAPTION_TEMPLATES.default
  );

  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [connectingPlatform, setConnectingPlatform] = useState<SocialMediaAccount['platform'] | null>(null);

  const platforms: SocialMediaAccount['platform'][] = [
    'instagram', 'twitter', 'facebook', 'tiktok', 'reddit'
  ];

  // Initialize database and load saved accounts
  useEffect(() => {
    const initializeStorage = async () => {
      const initialized = await initializeDatabase();
      setIsDbReady(initialized);
      
      if (initialized) {
        const savedAccounts = await getSavedAccounts();
        
        if (savedAccounts.length > 0) {
          // Verify all saved accounts are still valid
          const validatedAccounts = [];
          for (const account of savedAccounts) {
            const isValid = await validateAccountToken(account);
            if (isValid) {
              validatedAccounts.push(account);
            } else {
              await deleteAccount(account.id);
              toast({
                title: "Account Expired",
                description: `Your ${account.platform} connection has expired and was removed.`
              });
            }
          }
          
          setConnectionState(prev => ({
            ...prev,
            accounts: validatedAccounts
          }));
          
          toast({
            title: "Accounts Verified",
            description: `${validatedAccounts.length} social media accounts loaded.`
          });
        }
      }
    };
    
    initializeStorage();
  }, []);

  const handleConnect = async (platform: SocialMediaAccount['platform']) => {
    if (!isDbReady) {
      toast({
        title: "Database Not Ready",
        description: "The account database is still initializing. Please try again in a moment.",
        variant: "destructive"
      });
      return;
    }
    
    setConnectingPlatform(platform);
    setConnectionState(prev => ({ ...prev, isConnecting: true }));
    
    try {
      // Initiate OAuth flow
      initiateOAuth(platform);
      
      // The OAuth flow will continue in a popup window
      // The callback will be handled by handleOAuthCallback
      // For this demo implementation, we simulate the callback
      
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${platform}. Please try again.`,
        variant: "destructive"
      });
      
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: error instanceof Error ? error.message : "Unknown error"
      }));
      
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      // Find account before deletion
      const accountToDelete = connectionState.accounts.find(account => account.id === accountId);
      
      if (!accountToDelete) {
        throw new Error("Account not found");
      }
      
      // Delete account from secure storage
      const deleted = await deleteAccount(accountId);
      
      if (deleted) {
        setConnectionState(prev => ({
          ...prev,
          accounts: prev.accounts.filter(account => account.id !== accountId)
        }));
        
        toast({
          title: "Account Disconnected",
          description: `Your ${accountToDelete.platform} account has been disconnected.`,
        });
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (error) {
      console.error("Error disconnecting account:", error);
      
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect account. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Listen for OAuth callback events (in a real implementation, this would be a callback endpoint)
  useEffect(() => {
    const simulateOAuthCallback = async () => {
      if (connectingPlatform) {
        // In a real implementation, we would listen for a message from the popup window
        // For this demo, we simulate the callback after a delay
        
        setTimeout(async () => {
          try {
            const newAccount = await handleOAuthCallback(
              connectingPlatform,
              "simulated-auth-code",
              "simulated-state"
            );
            
            if (newAccount) {
              // Save account to secure storage
              const saved = await saveAccount(newAccount);
              
              if (saved) {
                setConnectionState(prev => ({
                  ...prev,
                  isConnecting: false,
                  accounts: [...prev.accounts, newAccount]
                }));
              } else {
                throw new Error("Failed to save account");
              }
            } else {
              throw new Error("OAuth flow completed but no account was returned");
            }
          } catch (error) {
            console.error(`Error in OAuth callback for ${connectingPlatform}:`, error);
            toast({
              title: "Connection Error",
              description: error instanceof Error ? error.message : "Unknown connection error",
              variant: "destructive"
            });
          } finally {
            setConnectionState(prev => ({ ...prev, isConnecting: false }));
            setConnectingPlatform(null);
          }
        }, 3000); // Simulate delay for OAuth flow
      }
    };
    
    if (connectingPlatform && connectionState.isConnecting) {
      simulateOAuthCallback();
    }
  }, [connectingPlatform, connectionState.isConnecting]);

  const getConnectedAccount = (platform: SocialMediaAccount['platform']) => {
    return connectionState.accounts.find(account => account.platform === platform);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaptionTemplate(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Social Media Connections</h2>
        </div>
        <Badge variant="outline" className="px-2 py-1">
          {connectionState.accounts.length} Connected
        </Badge>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Connected Accounts</CardTitle>
          <CardDescription>
            Connect your social media accounts to share your 3D models directly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map(platform => (
              <PlatformCard
                key={platform}
                platform={platform}
                connectedAccount={getConnectedAccount(platform)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isConnecting={connectingPlatform === platform && connectionState.isConnecting}
              />
            ))}
          </div>
          
          <div className="mt-6 flex justify-center space-x-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Custom Platform
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Settings2 className="h-4 w-4" />
              OAuth Settings
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sharing Settings</CardTitle>
          <CardDescription>
            Configure default sharing options for your 3D models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These settings will be applied as defaults when sharing your 3D models to social media platforms.
            You can always customize these options before sharing.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Default Caption Template</label>
              <Textarea 
                className="min-h-[80px]"
                placeholder="Check out my new 3D scan of {model_name}! #3DScan #Photogrammetry"
                value={captionTemplate}
                onChange={handleCaptionChange}
              />
              <p className="text-xs text-muted-foreground">Use {"{model_name}"} as a placeholder for your model name</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaConnections;
