
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import './index.css';

// Simple component to check API health and handle startup
const AppWithHealthCheck = () => {
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    // Check if the API is available
    const checkApiHealth = async () => {
      try {
        console.log('Checking API health...');
        // First try HEAD request which is more efficient
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          console.log('API is available!');
          setApiAvailable(true);
          setError(null);
          setIsLoading(false);
        } else {
          // Fallback to GET request in case HEAD isn't implemented correctly
          console.log('HEAD request failed, trying GET...');
          const getResponse = await fetch('/api/health', { 
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (getResponse.ok) {
            console.log('API is available (via GET)!');
            setApiAvailable(true);
            setError(null);
            setIsLoading(false);
          } else {
            console.warn('API health check failed with status:', getResponse.status);
            setApiAvailable(false);
            setError(`API server returned status ${getResponse.status}`);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('API health check error:', err);
        setApiAvailable(false);
        setError("Cannot connect to API server on port 3001. Is it running?");
        setIsLoading(false);
      }
    };
    
    // Only check API health during initial load or manual retries
    if (isLoading || retries > 0) {
      checkApiHealth();
      if (retries > 0) {
        setRetries(0);
      }
    }
    
    // Initial check (but don't continue polling which could flood logs)
    if (isLoading) {
      checkApiHealth();
    }
  }, [isLoading, retries]);
  
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
        apiServerError: apiAvailable === false,
        forceUseLocalSamples: false,
        forceJetsonPlatformDetection: false
      };
      
      // Update simulation settings based on API availability
      window.DEBUG_SETTINGS.simulateCameraConnection = apiAvailable === false;
      window.DEBUG_SETTINGS.simulateMotorConnection = apiAvailable === false;
      window.DEBUG_SETTINGS.apiServerError = apiAvailable === false;
      
      if (apiAvailable) {
        console.log('API is available - disabling simulation modes');
      } else if (apiAvailable === false) {
        console.log('API is unavailable - enabling simulation modes');
      }
    } catch (err) {
      console.error('Could not set simulation settings:', err);
    }
  }, [apiAvailable]);
  
  const handleRetryConnection = () => {
    setIsLoading(true);
    setRetries(prev => prev + 1);
  };
  
  // Show API connection status during development
  if (apiAvailable === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground">
        <h1 className="text-xl font-bold text-red-500 mb-2">API Server Unreachable</h1>
        <p className="max-w-md text-muted-foreground">
          Cannot connect to the API server on port 3001.
        </p>
        {error && (
          <p className="mt-2 text-sm font-medium text-red-400">{error}</p>
        )}
        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-md max-w-md text-sm">
          <h2 className="font-medium text-yellow-800 dark:text-yellow-400">Troubleshooting:</h2>
          <ol className="list-decimal pl-5 mt-2 text-left space-y-1">
            <li>Make sure the API server is running on port 3001</li>
            <li>Check for console errors in your terminal</li>
            <li>Ensure there are no firewall issues blocking port 3001</li>
            <li>Try running <code className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">node server.js</code> directly</li>
          </ol>
        </div>
        <button 
          onClick={handleRetryConnection}
          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry Connection
        </button>
        <div className="mt-4">
          <button 
            onClick={() => {
              // Force continue to app in simulation mode
              localStorage.setItem('bypassApiCheck', 'true');
              window.location.reload();
            }}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Continue in Simulation Mode
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading && apiAvailable === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg">Checking API server connectivity...</p>
      </div>
    );
  }
  
  // Check if user wants to bypass API check
  const bypassApiCheck = localStorage.getItem('bypassApiCheck') === 'true';
  
  // If API is available or user chose to bypass, render the app
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
    apiServerError: false,
    forceUseLocalSamples: false,
    forceJetsonPlatformDetection: false
  };
  
  // Then try to load config values from jetson.config
  import('@/config/jetson.config').then(config => {
    window.DEBUG_SETTINGS = {
      ...config.DEBUG_SETTINGS,
      simulateCameraConnection: false,
      simulateMotorConnection: false,
      apiServerError: false
    };
  }).catch(err => {
    console.warn('Failed to load jetson config, using defaults:', err);
  });
} catch (err) {
  console.error('Failed to load debug settings:', err);
}

createRoot(document.getElementById("root")!).render(<AppWithHealthCheck />);
