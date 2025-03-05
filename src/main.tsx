
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

    checkApiHealth();
    
    // Set up auto-retry if API check fails
    if (apiHealthy === false && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying API health check (attempt ${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        checkApiHealth();
      }, 5000); // Retry every 5 seconds, up to 3 times
      
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  // While checking
  if (apiHealthy === null) {
    return <div className="flex h-screen items-center justify-center">Checking system health...</div>;
  }

  // If API is unhealthy but we have the DEBUG flag to allow running without it
  if (apiHealthy === false) {
    // Check if we should allow the app to run in demo/simulated mode
    try {
      // Access the config via window to avoid import cycle
      const allowSimulation = window.DEBUG_SETTINGS?.simulateCameraConnection;
      
      if (allowSimulation) {
        console.log('Allowing app to run in simulation mode despite API being unavailable');
        return <App />;
      }
    } catch (err) {
      console.log('Could not check simulation settings:', err);
    }
    
    // Default error message
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-red-500">Backend Connection Error</h1>
        <p className="mt-2 max-w-md text-gray-600">
          Cannot connect to the camera control backend. Please ensure the server is running.
        </p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button 
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600" 
          onClick={() => window.location.reload()}
        >
          Retry Connection
        </button>
      </div>
    );
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
