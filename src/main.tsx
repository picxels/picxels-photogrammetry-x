
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import './index.css';

// Simple component to check API health
const AppWithHealthCheck = () => {
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        // Attempt API health check
        const response = await fetch('/api/health', { 
          method: 'GET',
          // Add cache busting parameter
          headers: { 'Cache-Control': 'no-cache' } 
        });
        
        if (response.ok) {
          console.log('API health check successful');
          setApiHealthy(true);
        } else {
          console.error(`API returned status: ${response.status}`);
          setApiHealthy(false);
          setError(`API returned status: ${response.status}`);
        }
      } catch (err) {
        console.error('API health check failed:', err);
        setApiHealthy(false);
        setError(`API connection error: ${err.message}`);
      }
    };

    // Only check once initially
    if (apiHealthy === null) {
      checkApiHealth();
    }
    
    // Only retry once if explicitly requested (e.g., by clicking a retry button)
    // Don't set up automatic retries that could cause flickering
  }, [retryCount, apiHealthy]);

  // While checking
  if (apiHealthy === null) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p>Checking system health...</p>
      </div>
    </div>;
  }

  // Always allow the app to run in simulation mode if API is unavailable
  if (apiHealthy === false) {
    console.log('API is unavailable - running in simulation mode');
    
    try {
      // Make simulation mode available globally
      window.DEBUG_SETTINGS = window.DEBUG_SETTINGS || {};
      window.DEBUG_SETTINGS.simulateCameraConnection = true;
    } catch (err) {
      console.error('Could not set simulation settings:', err);
    }
    
    // Show a brief message then proceed to the app
    setTimeout(() => {
      setError(null);
    }, 3000);
    
    return error ? (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center bg-background text-foreground">
        <h1 className="text-xl font-bold text-yellow-500">API Unavailable</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Camera control API is unavailable. Running in simulation mode.
        </p>
        {error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}
        <p className="mt-4 text-sm animate-pulse">Starting application in simulation mode...</p>
      </div>
    ) : <App />;
  }

  // If API is healthy, render the app
  return <App />;
};

// Make DEBUG_SETTINGS available on window for the health check
try {
  import('@/config/jetson.config').then(config => {
    window.DEBUG_SETTINGS = config.DEBUG_SETTINGS;
  });
} catch (err) {
  console.error('Failed to load debug settings:', err);
}

createRoot(document.getElementById("root")!).render(<AppWithHealthCheck />);
