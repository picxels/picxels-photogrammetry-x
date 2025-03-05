
import express from 'express';
import cors from 'cors';
import { executeCommand } from './api/execute-command';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
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

// Start the server
let server: any = null;

export function startServer() {
  if (!server) {
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  return server;
}

export function stopServer() {
  if (server) {
    server.close();
    server = null;
  }
}

// Auto-start the server when this module is imported
startServer();

export default app;
