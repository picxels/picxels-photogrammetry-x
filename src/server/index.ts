
import express from 'express';
import cors from 'cors';
import registerExecuteCommandRoutes from './api/execute-command';
import { DEBUG_SETTINGS } from '@/config/jetson.config';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create API routes
const apiRouter = express.Router();

// Register API routes
registerExecuteCommandRoutes(apiRouter);

// Use the API router with a prefix
app.use('/api', apiRouter);

// Add a simple test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Camera API server running on port ${PORT}`);
  if (DEBUG_SETTINGS.cameraDebugMode) {
    console.log('Camera debug mode enabled');
  }
});

export default app;
