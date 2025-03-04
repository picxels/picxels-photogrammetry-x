
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Twitter, Instagram, Facebook, MessageSquare, Share2, Loader2 } from 'lucide-react';
import { SocialMediaAccount } from '@/types/social';

interface PlatformCardProps {
  platform: SocialMediaAccount['platform'];
  connectedAccount?: SocialMediaAccount;
  onConnect: (platform: SocialMediaAccount['platform']) => void;
  onDisconnect: (accountId: string) => void;
  isConnecting: boolean;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  connectedAccount,
  onConnect,
  onDisconnect,
  isConnecting
}) => {
  const [autoShare, setAutoShare] = useState<boolean>(true);

  const getPlatformIcon = (platform: SocialMediaAccount['platform']) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-5 w-5 text-[#E1306C]" />;
      case 'twitter': return <Twitter className="h-5 w-5 text-[#1DA1F2]" />;
      case 'facebook': return <Facebook className="h-5 w-5 text-[#4267B2]" />;
      case 'reddit': return <MessageSquare className="h-5 w-5 text-[#FF4500]" />;
      case 'tiktok': return <Share2 className="h-5 w-5 text-[#000000]" />;
      default: return <Share2 className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform: SocialMediaAccount['platform']) => {
    switch (platform) {
      case 'twitter': return 'X (Twitter)';
      default: return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  const isConnected = !!connectedAccount;
  const isCurrentlyConnecting = isConnecting && !isConnected;

  const handleAutoShareToggle = (checked: boolean) => {
    setAutoShare(checked);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlatformIcon(platform)}
            <CardTitle className="text-base">{getPlatformName(platform)}</CardTitle>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          {isConnected 
            ? `Connected as @${connectedAccount.username}`
            : `Connect your ${getPlatformName(platform)} account`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-sharing</span>
            <Switch 
              checked={autoShare} 
              onCheckedChange={handleAutoShareToggle} 
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 pt-2">
        {isConnected ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={() => onDisconnect(connectedAccount.id)}
            disabled={isCurrentlyConnecting}
          >
            Disconnect
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onConnect(platform)}
            disabled={isCurrentlyConnecting}
          >
            {isCurrentlyConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlatformCard;
