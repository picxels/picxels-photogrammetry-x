
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { SocialMediaAccount, SocialMediaConnectionState } from '@/types/social';
import PlatformCard from './PlatformCard';
import { v4 as uuidv4 } from 'uuid';

const SocialMediaConnections: React.FC = () => {
  const [connectionState, setConnectionState] = useState<SocialMediaConnectionState>({
    accounts: [
      {
        id: '1',
        platform: 'instagram',
        username: 'photogrammetryx',
        connected: true,
        lastUsed: new Date()
      }
    ],
    isConnecting: false
  });

  const platforms: SocialMediaAccount['platform'][] = [
    'instagram', 'twitter', 'facebook', 'tiktok', 'reddit'
  ];

  const handleConnect = (platform: SocialMediaAccount['platform']) => {
    setConnectionState(prev => ({ ...prev, isConnecting: true }));
    
    // In a real implementation, this would redirect to OAuth flow
    // For demo purposes, we're simulating a successful connection
    setTimeout(() => {
      const newAccount: SocialMediaAccount = {
        id: uuidv4(),
        platform,
        username: `demo_user_${platform}`,
        connected: true,
        lastUsed: new Date()
      };
      
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        accounts: [...prev.accounts, newAccount]
      }));
      
      toast({
        title: "Account Connected",
        description: `Successfully connected ${platform} account.`,
      });
    }, 1500);
  };

  const handleDisconnect = (accountId: string) => {
    setConnectionState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(account => account.id !== accountId)
    }));
    
    toast({
      title: "Account Disconnected",
      description: "Your social media account has been disconnected.",
    });
  };

  const getConnectedAccount = (platform: SocialMediaAccount['platform']) => {
    return connectionState.accounts.find(account => account.platform === platform);
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
          
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Custom Platform
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
              <textarea 
                className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                placeholder="Check out my new 3D scan of {model_name}! #3DScan #Photogrammetry"
                defaultValue="Check out my new 3D scan of {model_name}! #3DScan #Photogrammetry"
              />
              <p className="text-xs text-muted-foreground">Use {model_name} as a placeholder for your model name</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaConnections;
