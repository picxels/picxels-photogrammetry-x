
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SocialMediaShare } from '@/types/workflow';
import { Twitter, Instagram, Facebook, Share2, MessageSquare } from 'lucide-react';

interface SocialMediaSharingProps {
  socialSharing: SocialMediaShare[];
  onSocialSharingChange: (socialSharing: SocialMediaShare[]) => void;
  storeLink: string;
  onStoreLinkChange: (storeLink: string) => void;
}

const SocialMediaSharing: React.FC<SocialMediaSharingProps> = ({
  socialSharing,
  onSocialSharingChange,
  storeLink,
  onStoreLinkChange
}) => {
  const updatePlatformEnabled = (platform: SocialMediaShare['platform'], enabled: boolean) => {
    const updatedSharing = socialSharing.map(item => 
      item.platform === platform ? { ...item, enabled } : item
    );
    onSocialSharingChange(updatedSharing);
  };

  const updateCustomText = (platform: SocialMediaShare['platform'], customText: string) => {
    const updatedSharing = socialSharing.map(item => 
      item.platform === platform ? { ...item, customText } : item
    );
    onSocialSharingChange(updatedSharing);
  };

  const getPlatformIcon = (platform: SocialMediaShare['platform']) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-5 w-5 text-[#E1306C]" />;
      case 'twitter': return <Twitter className="h-5 w-5 text-[#1DA1F2]" />;
      case 'facebook': return <Facebook className="h-5 w-5 text-[#4267B2]" />;
      case 'reddit': return <MessageSquare className="h-5 w-5 text-[#FF4500]" />;
      case 'tiktok': return <Share2 className="h-5 w-5 text-[#000000]" />;
      default: return <Share2 className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform: SocialMediaShare['platform']) => {
    switch (platform) {
      case 'twitter': return 'X (Twitter)';
      default: return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <span>Social Media Sharing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-link">Store Link (Optional)</Label>
          <Input
            id="store-link"
            placeholder="https://yourstore.com/product/123"
            value={storeLink}
            onChange={(e) => onStoreLinkChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Link to where this model can be purchased</p>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-medium">Share On</h3>
          {socialSharing.map((item) => (
            <div key={item.platform} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPlatformIcon(item.platform)}
                  <Label htmlFor={`${item.platform}-toggle`} className="cursor-pointer">
                    {getPlatformName(item.platform)}
                  </Label>
                </div>
                <Switch
                  id={`${item.platform}-toggle`}
                  checked={item.enabled}
                  onCheckedChange={(checked) => updatePlatformEnabled(item.platform, checked)}
                />
              </div>
              
              {item.enabled && (
                <div className="pl-7">
                  <Input
                    placeholder={`Custom text for ${getPlatformName(item.platform)}...`}
                    value={item.customText || ''}
                    onChange={(e) => updateCustomText(item.platform, e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaSharing;
