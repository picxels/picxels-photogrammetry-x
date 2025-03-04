
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Plus, Settings2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { SocialMediaAccount, SocialMediaConnectionState } from '@/types/social';
import PlatformCard from './PlatformCard';
import { v4 as uuidv4 } from 'uuid';
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

const SocialMediaConnections: React.FC = () => {
  const [connectionState, setConnectionState] = useState<SocialMediaConnectionState>({
    accounts: [],
    isConnecting: false
  });

  const [captionTemplate, setCaptionTemplate] = useState<string>(
    DEFAULT_CAPTION_TEMPLATES.default
  );

  const [isDbReady, setIsDbReady] = useState<boolean>(false);

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
          setConnectionState(prev => ({
            ...prev,
            accounts: savedAccounts
          }));
          
          toast({
            title: "Accounts Loaded",
            description: `${savedAccounts.length} social media accounts loaded.`
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
    
    setConnectionState(prev => ({ ...prev, isConnecting: true }));
    
    // In a production implementation, this would initiate OAuth flow
    // For demo purposes, we're simulating a successful connection
    try {
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newAccount: SocialMediaAccount = {
        id: uuidv4(),
        platform,
        username: `demo_user_${platform}`,
        connected: true,
        lastUsed: new Date(),
        accessToken: `mock-token-${uuidv4()}`,
        refreshToken: `mock-refresh-${uuidv4()}`,
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        scopes: PLATFORM_CONFIGS[platform]?.supportedImageFormats || []
      };
      
      // Save account to secure storage
      const saved = await saveAccount(newAccount);
      
      if (saved) {
        setConnectionState(prev => ({
          ...prev,
          isConnecting: false,
          accounts: [...prev.accounts, newAccount]
        }));
        
        toast({
          title: "Account Connected",
          description: `Successfully connected ${platform} account.`,
        });
      } else {
        throw new Error("Failed to save account");
      }
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
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      // Delete account from secure storage
      const deleted = await deleteAccount(accountId);
      
      if (deleted) {
        setConnectionState(prev => ({
          ...prev,
          accounts: prev.accounts.filter(account => account.id !== accountId)
        }));
        
        toast({
          title: "Account Disconnected",
          description: "Your social media account has been disconnected.",
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
