
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Shield } from "lucide-react";

interface RCNodeConfigFormProps {
  nodeUrl: string;
  authToken: string;
  onNodeUrlChange: (url: string) => void;
  onAuthTokenChange: (token: string) => void;
}

const RCNodeConfigForm: React.FC<RCNodeConfigFormProps> = ({
  nodeUrl,
  authToken,
  onNodeUrlChange,
  onAuthTokenChange
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="node-url">RC Node URL</Label>
        <div className="flex items-center space-x-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <Input
            id="node-url"
            placeholder="http://192.168.1.16:8000"
            value={nodeUrl}
            onChange={(e) => onNodeUrlChange(e.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The URL where your Reality Capture Node is accessible, including port (no trailing slash)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="auth-token">Authentication Token</Label>
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <Input
            id="auth-token"
            type="password"
            placeholder="E38BBD4E-69DE-4BCA-ADCB-98B8614CD6A7"
            value={authToken}
            onChange={(e) => onAuthTokenChange(e.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The authentication token for accessing your RC Node
        </p>
      </div>
    </div>
  );
};

export default RCNodeConfigForm;
