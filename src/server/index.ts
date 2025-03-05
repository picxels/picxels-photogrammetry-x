
import express from 'express';
import cors from 'cors';
import { executeCommand } from './api/execute-command';

// Only run server code if we're on the server side
// This prevents Node.js modules from being imported in the browser
if (typeof window === 'undefined' || process.env.SERVER_SIDE) {
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    console.log('API health check called');
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Command execution endpoint
  app.post('/api/execute-command', async (req, res) => {
    try {
      await executeCommand(req, res);
    } catch (error) {
      console.error('Error in execute-command endpoint:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  });

  // Start the server automatically
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

// The module doesn't do anything when imported in the browser
export default {};
