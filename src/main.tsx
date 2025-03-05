
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import './index.css';

// Simple component to check API health
const AppWithHealthCheck = () => {
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setApiHealthy(true);
        } else {
          setApiHealthy(false);
          setError(`API returned status: ${response.status}`);
        }
      } catch (err) {
        setApiHealthy(false);
        setError(`API connection error: ${err.message}`);
        console.error('API health check failed:', err);
      }
    };

    checkApiHealth();
  }, []);

  if (apiHealthy === null) {
    return <div className="flex h-screen items-center justify-center">Checking system health...</div>;
  }

  if (apiHealthy === false) {
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

  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithHealthCheck />);
