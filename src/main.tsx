
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import './index.css';

// Simple component to check API health and handle startup
const AppWithHealthCheck = () => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the API is available
    const checkApiHealth = async () => {
      try {
        console.log('Checking API health...');
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          console.log('API is available!');
          setApiAvailable(true);
          setError(null);
        } else {
          console.warn('API health check failed with status:', response.status);
          setApiAvailable(false);
          setError(`API server returned status ${response.status}`);
        }
      } catch (err) {
        console.error('API health check error:', err);
        setApiAvailable(false);
        setError("Cannot connect to API server on port 3001. Is it running?");
      }
    };
    
    checkApiHealth();
    
    // Check API health regularly
    const interval = setInterval(checkApiHealth, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Ensure DEBUG_SETTINGS is initialized correctly
  useEffect(() => {
    // Make simulation mode available globally
    try {
      // Create a default DEBUG_SETTINGS object with required properties
      window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {
        enableVerboseLogging: true,
        logNetworkRequests: true,
        simulateCameraConnection: apiAvailable === false,
        simulateMotorConnection: apiAvailable === false,
        forceUseLocalSamples: false,
        forceJetsonPlatformDetection: false
      };
      
      // Update simulation settings based on API availability
      window.DEBUG_SETTINGS.simulateCameraConnection = apiAvailable === false;
      window.DEBUG_SETTINGS.simulateMotorConnection = apiAvailable === false;
    } catch (err) {
      console.error('Could not set simulation settings:', err);
    }
  }, [apiAvailable]);
  
  // Show API connection status
  if (apiAvailable === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground">
        <h1 className="text-xl font-bold text-red-500">API Server Unreachable</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Cannot connect to the API server on port 3001.
        </p>
        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md max-w-md text-sm">
          <h2 className="font-medium text-yellow-800 dark:text-yellow-400">Troubleshooting:</h2>
          <ol className="list-decimal pl-5 mt-2 text-left space-y-1">
            <li>Make sure the API server is running on port 3001</li>
            <li>Check for console errors in your terminal</li>
            <li>Ensure there are no firewall issues blocking port 3001</li>
            <li>Try running <code className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">node src/server/index.js</code> directly</li>
          </ol>
        </div>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }
  
  return <App />;
};

// Make DEBUG_SETTINGS available on window
try {
  // Create a default DEBUG_SETTINGS object with required properties
  window.DEBUG_SETTINGS = {
    enableVerboseLogging: true,
    logNetworkRequests: true,
    simulateCameraConnection: false,
    simulateMotorConnection: false,
    forceUseLocalSamples: false,
    forceJetsonPlatformDetection: false
  };
  
  // Then try to load config values from jetson.config
  import('@/config/jetson.config').then(config => {
    window.DEBUG_SETTINGS = {
      ...config.DEBUG_SETTINGS,
      simulateCameraConnection: false,
      simulateMotorConnection: false
    };
  }).catch(err => {
    console.warn('Failed to load jetson config, using defaults:', err);
  });
} catch (err) {
  console.error('Failed to load debug settings:', err);
}

createRoot(document.getElementById("root")!).render(<AppWithHealthCheck />);
