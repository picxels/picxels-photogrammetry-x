
import express from 'express';
import cors from 'cors';
import { executeCommand } from './api/execute-command.js';

// Create Express application
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
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    console.log('Executing command:', command);
    const result = await executeCommand(command);
    res.json({ output: result });
  } catch (error) {
    console.error('Error in execute-command endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Only start the server if we're running this file directly
// and not importing it as a module
if (import.meta.url === `file://${process.argv[1]}` || process.env.SERVER_SIDE === 'true') {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

export default app;
