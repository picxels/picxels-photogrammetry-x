
/// <reference types="vite/client" />

interface Window {
  DEBUG_SETTINGS?: {
    enableVerboseLogging: boolean;
    logNetworkRequests: boolean;
    simulateCameraConnection: boolean;
    simulateMotorConnection: boolean;
    forceUseLocalSamples: boolean;
    forceJetsonPlatformDetection: boolean;
    [key: string]: any;
  };
}
