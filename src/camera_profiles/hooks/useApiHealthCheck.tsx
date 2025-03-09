
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";

/**
 * Hook to check API availability
 * Returns apiAvailable state and initialization function
 */
export const useApiHealthCheck = () => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  const checkApiAvailability = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' }
      });
      setApiAvailable(response.ok);
      
      if (!response.ok) {
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
  };
  
  useEffect(() => {
    checkApiAvailability();
  }, []);
  
  return { apiAvailable, checkApiAvailability };
};
