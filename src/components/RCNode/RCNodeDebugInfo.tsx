
import React from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Terminal, Copy, Check, X, RefreshCw } from "lucide-react";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

interface RCNodeDebugInfoProps {
  showDebugInfo: boolean;
  onShowDebugInfoChange: (show: boolean) => void;
  debugLog: string[];
  isTesting: boolean;
  generateTestCommand: () => string;
  advancedResults: any;
  onCopyCommand: () => void;
  onBrowserTest: () => void;
  onRunAdvancedDiagnostics: () => void;
}

const RCNodeDebugInfo: React.FC<RCNodeDebugInfoProps> = ({
  showDebugInfo,
  onShowDebugInfoChange,
  debugLog,
  isTesting,
  generateTestCommand,
  advancedResults,
  onCopyCommand,
  onBrowserTest,
  onRunAdvancedDiagnostics
}) => {
  return (
    <Collapsible open={showDebugInfo} onOpenChange={onShowDebugInfoChange} className="mt-4">
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1">
          <Terminal className="h-4 w-4" />
          {showDebugInfo ? "Hide Debugging Info" : "Show Debugging Info"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="p-3 bg-muted rounded-md text-xs font-mono space-y-2">
          <div className="flex justify-between items-center mb-2">
            <p className="font-medium">Connection Test Commands:</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <p>cURL Command:</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={onCopyCommand}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2 bg-background/50 rounded overflow-x-auto whitespace-pre text-xs">
                {generateTestCommand()}
              </div>
            </div>
            
            <div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full mb-2"
                onClick={onBrowserTest}
              >
                Open in Browser
              </Button>
              
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full"
                onClick={onRunAdvancedDiagnostics}
                disabled={isTesting}
              >
                {isTesting ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Run Advanced Diagnostics
              </Button>
            </div>
          </div>
          
          {advancedResults && (
            <div className="border rounded p-2 mb-4 bg-background/50">
              <p className="font-medium flex items-center">
                Advanced Test Results: 
                {advancedResults.success ? (
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                ) : (
                  <X className="h-4 w-4 text-red-500 ml-2" />
                )}
              </p>
              <p className="text-xs mt-1">{advancedResults.message}</p>
              
              {advancedResults.details && (
                <div className="mt-2 text-xs">
                  <p>Details:</p>
                  <pre className="p-1 bg-black/10 overflow-auto max-h-20 rounded text-xs mt-1">
                    {JSON.stringify(advancedResults.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {debugLog.length > 0 && (
            <>
              <p className="font-medium mt-2">Connection Log:</p>
              <div className="p-2 bg-background/50 rounded overflow-y-auto max-h-40">
                {debugLog.map((log, index) => (
                  <div key={index} className="text-xs">{log}</div>
                ))}
              </div>
            </>
          )}
          
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Troubleshooting Tips:</p>
            <ul className="text-xs ml-4 list-disc text-muted-foreground mt-1 space-y-1">
              <li>Make sure the URL has no trailing slash</li>
              <li>Verify the auth token is correct (case sensitive)</li>
              <li>Check that the RC Node server is running</li>
              <li>Try accessing the URL directly in a browser</li>
              <li>Check network settings/firewalls (port 8000 open)</li>
              <li>Try on same device with curl to rule out CORS</li>
              <li>If curl works but the app doesn't, it's likely a CORS issue</li>
              <li>Check if RC Node allows cross-origin requests</li>
            </ul>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Debugging Mode: {DEBUG_SETTINGS.rcNodeDebugMode ? "Enabled" : "Disabled"}<br/>
            CORS Mode: {DEBUG_SETTINGS.disableCors ? "Disabled (no-cors)" : "Enabled (cors)"}<br/>
            Ignore HTTPS Errors: {DEBUG_SETTINGS.ignoreHttpsErrors ? "Yes" : "No"}<br/>
            Force XHR: {DEBUG_SETTINGS.forceUseXhr ? "Yes" : "No"}<br/>
            Simulation Mode: {showDebugInfo ? "Active" : "Inactive"}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default RCNodeDebugInfo;
