
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import './index.css';

// Simple component to check API health and start in simulation mode if needed
const AppWithHealthCheck = () => {
  const [simMode, setSimMode] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Running in simulation mode by default');
    
    // Enable simulation mode
    try {
      // Make simulation mode available globally
      window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
        enableVerboseLogging: true,
        logNetworkRequests: true,
        simulateCameraConnection: true,
        simulateMotorConnection: true,
        forceUseLocalSamples: false,
        forceJetsonPlatformDetection: false
      };
      window.DEBUG_SETTINGS.simulateCameraConnection = true;
      window.DEBUG_SETTINGS.simulateMotorConnection = true;
    } catch (err) {
      console.error('Could not set simulation settings:', err);
      setError("Failed to initialize simulation mode");
    }
    
    // A brief delay to show the simulation mode message
    const timer = setTimeout(() => {
      setError(null);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Always show a simulation banner initially
  return error ? (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground">
      <h1 className="text-xl font-bold text-yellow-500">Camera API Unavailable</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Running in simulation mode. No camera hardware will be accessed.
      </p>
      {error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}
      <p className="mt-4 text-sm animate-pulse">Starting application in simulation mode...</p>
    </div>
  ) : <App />;
};

// Make DEBUG_SETTINGS available on window
try {
  // Create a default DEBUG_SETTINGS object with required properties
  window.DEBUG_SETTINGS = {
    enableVerboseLogging: true,
    logNetworkRequests: true,
    simulateCameraConnection: true,
    simulateMotorConnection: true,
    forceUseLocalSamples: false,
    forceJetsonPlatformDetection: false
  };
  
  // Then try to load config values from jetson.config
  import('@/config/jetson.config').then(config => {
    window.DEBUG_SETTINGS = {
      ...config.DEBUG_SETTINGS,
      simulateCameraConnection: true,
      simulateMotorConnection: true
    };
  }).catch(err => {
    console.warn('Failed to load jetson config, using defaults:', err);
  });
} catch (err) {
  console.error('Failed to load debug settings:', err);
}

createRoot(document.getElementById("root")!).render(<AppWithHealthCheck />);
