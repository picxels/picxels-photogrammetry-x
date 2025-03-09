import { useState, useEffect, useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to check API availability
 * Returns apiAvailable state and initialization function
 */
export const useApiHealthCheck = () => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkApiAvailability = useCallback(async () => {
    try {
      console.log("API health check - Sending request");
      
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(5000)
      });
      
      const isAvailable = response.ok;
      console.log(`API health check - Response received, status: ${response.status}, available: ${isAvailable}`);
      
      setApiAvailable(isAvailable);
      setLastChecked(new Date());
      
      // Store API availability in localStorage for other components
      if (typeof window !== 'undefined') {
        localStorage.setItem('apiAvailable', isAvailable ? 'true' : 'false');
        localStorage.setItem('apiLastChecked', new Date().toISOString());
      }
      
      if (isAvailable) {
        console.log("API is available - disabling simulation modes");
        
        if (typeof window !== 'undefined' && window.DEBUG_SETTINGS) {
          // Keep simulation settings that should persist
          const keepSettings = {
            enableVerboseLogging: window.DEBUG_SETTINGS.enableVerboseLogging,
            logNetworkRequests: window.DEBUG_SETTINGS.logNetworkRequests,
            forceUseLocalSamples: window.DEBUG_SETTINGS.forceUseLocalSamples,
            forceJetsonPlatformDetection: window.DEBUG_SETTINGS.forceJetsonPlatformDetection
          };
          
          // Reset simulation flags
          window.DEBUG_SETTINGS = {
            ...keepSettings,
            simulateCameraConnection: false,
            simulateMotorConnection: false,
            apiServerError: false
          };
        }
      } else {
        console.warn('API health check failed, falling back to simulation mode');
        
        if (typeof window !== 'undefined') {
          // Initialize with default values if window.DEBUG_SETTINGS is undefined
          window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
            enableVerboseLogging: true,
            logNetworkRequests: true,
            simulateCameraConnection: true,
            simulateMotorConnection: true,
            apiServerError: true,
            forceUseLocalSamples: false,
            forceJetsonPlatformDetection: false
          };
          
          // Then ensure the required properties are set
          window.DEBUG_SETTINGS.apiServerError = true;
          window.DEBUG_SETTINGS.simulateCameraConnection = true;
          window.DEBUG_SETTINGS.simulateMotorConnection = true;
        }
      }
    } catch (error) {
      console.error('API health check error:', error);
      setApiAvailable(false);
      setLastChecked(new Date());
      
      // Store API availability in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('apiAvailable', 'false');
        localStorage.setItem('apiLastChecked', new Date().toISOString());
        
        // Initialize with default values if window.DEBUG_SETTINGS is undefined
        window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
          enableVerboseLogging: true,
          logNetworkRequests: true,
          simulateCameraConnection: true,
          simulateMotorConnection: true,
          apiServerError: true,
          forceUseLocalSamples: false,
          forceJetsonPlatformDetection: false
        };
        
        // Then ensure the required properties are set
        window.DEBUG_SETTINGS.apiServerError = true;
        window.DEBUG_SETTINGS.simulateCameraConnection = true;
        window.DEBUG_SETTINGS.simulateMotorConnection = true;
      }
    }
  }, []);
  
  useEffect(() => {
    // Initial check
    checkApiAvailability();
    
    // Set up regular API health checks
    const intervalId = setInterval(checkApiAvailability, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [checkApiAvailability]);
  
  return { apiAvailable, lastChecked, checkApiAvailability };
};
