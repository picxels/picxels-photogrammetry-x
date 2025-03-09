
import { isJetsonPlatform, isDevelopmentMode, shouldUseSimulationMode } from "./platformUtils";
import { DEBUG_SETTINGS } from "@/config/jetson.config";
import { toast } from "@/components/ui/use-toast";
import { getFallbackCommandResponse } from "./ai/aiUtils";

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
    usingSimulation: shouldUseSimulationMode()
  };
  console.log("Command execution debug info:", debugInfo);
  
  // Centralized check for simulation mode
  if (shouldUseSimulationMode()) {
    console.log("Using simulation mode for command execution");
    return getFallbackCommandResponse(command);
  }
  
  try {
    // Check API availability from localStorage
    const apiAvailable = typeof window !== 'undefined' && 
      window.localStorage.getItem('apiAvailable') === 'true';
    
    // If API is not available, use simulation mode
    if (!apiAvailable) {
      console.log("API unavailable, using simulation mode for command execution");
      return getFallbackCommandResponse(command);
    }
    
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
    
    // Ensure we activate simulation mode when API errors occur
    console.warn("Falling back to simulation for command:", command);
    
    toast({
      title: "API Connection Error",
      description: "Using simulation mode as fallback. API server is not responding.",
      variant: "destructive"
    });
    
    // Update global simulation flags
    if (typeof window !== 'undefined') {
      // Initialize DEBUG_SETTINGS with default values if it doesn't exist
      window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
        enableVerboseLogging: true,
        logNetworkRequests: true,
        simulateCameraConnection: true,
        simulateMotorConnection: true,
        apiServerError: true,
        forceUseLocalSamples: false,
        forceJetsonPlatformDetection: false
      };
      
      // Ensure simulation flags are set
      window.DEBUG_SETTINGS.apiServerError = true;
      window.DEBUG_SETTINGS.simulateCameraConnection = true;
      window.DEBUG_SETTINGS.simulateMotorConnection = true;
      
      // Update localStorage to indicate API is unavailable
      localStorage.setItem('apiAvailable', 'false');
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
