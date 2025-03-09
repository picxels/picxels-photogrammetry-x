
import express from 'express';
import cors from 'cors';
import { executeCommand } from './api/execute-command';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Helper function to wrap async route handlers
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Set up routes
app.post('/api/execute-command', asyncHandler(async (req: express.Request, res: express.Response) => {
  const command = req.body.command;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  try {
    const result = await executeCommand(command);
    res.json({ output: result });
  } catch (error) {
    console.error('Error in execute-command endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
}));

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Unknown error'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
