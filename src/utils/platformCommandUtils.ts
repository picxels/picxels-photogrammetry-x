
import { isJetsonPlatform, isDevelopmentMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";
import { getFallbackCommandResponse } from "./ai/fallbackUtils";

/**
 * Execute a shell command on the Jetson platform
 */
export const executeJetsonCommand = async (command: string): Promise<string> => {
  console.log("Executing command:", command);
  
  // Add direct debugging information
  const debugInfo = {
    isJetson: isJetsonPlatform(),
    isDev: isDevelopmentMode(),
    command: command,
    usingSimulation: false
  };
  console.log("Command execution debug info:", debugInfo);
  
  // Use simulation mode if:
  // 1. DEBUG_SETTINGS.simulateCameraConnection is true
  // 2. DEBUG_SETTINGS.apiServerError is true
  // 3. bypassApiCheck is set to 'true' in localStorage
  // 4. Any of window.DEBUG_SETTINGS related flags are set
  const bypassApiCheck = localStorage.getItem('bypassApiCheck') === 'true';
  const useSimulation = 
    DEBUG_SETTINGS.simulateCameraConnection || 
    DEBUG_SETTINGS.apiServerError || 
    bypassApiCheck ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.apiServerError) ||
    (typeof window !== 'undefined' && window.DEBUG_SETTINGS?.simulateCameraConnection);
  
  if (useSimulation) {
    console.log("Using simulation mode for command execution");
    return getFallbackCommandResponse(command);
  }
  
  try {
    // Attempt to execute the command through the API
    const response = await fetch('/api/execute-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.output || '';
  } catch (error) {
    console.error("Error executing command via API:", error);
    
    // Always enable simulation mode when API errors occur
    console.warn("Falling back to simulation for command:", command);
    
    toast({
      title: "API Connection Error",
      description: "Using simulation mode as fallback. API server is not responding.",
      variant: "destructive"
    });
    
    // Mark API as having an error for future commands
    if (typeof window !== 'undefined') {
      // Initialize DEBUG_SETTINGS if it doesn't exist
      window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
        enableVerboseLogging: true,
        logNetworkRequests: true,
        simulateCameraConnection: true,
        simulateMotorConnection: true,
        apiServerError: true,
        forceUseLocalSamples: false,
        forceJetsonPlatformDetection: false
      };
      
      // Then set the required properties
      window.DEBUG_SETTINGS.apiServerError = true;
      window.DEBUG_SETTINGS.simulateCameraConnection = true;
      window.DEBUG_SETTINGS.simulateMotorConnection = true;
    }
    
    // Return mock data as fallback
    return getFallbackCommandResponse(command);
  }
};

/**
 * This function is kept for API compatibility, but now throws an error 
 * since we no longer want to simulate commands
 */
export const executeDevCommand = async (command: string): Promise<string> => {
  console.log(`Development mode simulation is disabled. Command was: ${command}`);
  return getFallbackCommandResponse(command);
};
