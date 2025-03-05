
// This file is used to run the API server separately
// Run with: node server.js

// Import required modules
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Safely execute a command and return its output
 */
const executeCommand = async (command) => {
  // Perform basic validation/sanitization
  if (!command || typeof command !== 'string') {
    throw new Error('Invalid command provided');
  }

  // Execute the command and return the output
  try {
    console.log(`Server executing command: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn(`Command produced stderr: ${stderr}`);
    }
    
    return stdout;
  } catch (error) {
    console.error(`Command execution error:`, error);
    throw error;
  }
};

// Health check endpoint - support both GET and HEAD methods
app.head('/api/health', (req, res) => {
  console.log('API health check called (HEAD)');
  res.status(200).end();
});

app.get('/api/health', (req, res) => {
  console.log('API health check called (GET)');
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

// Start the server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
  console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
});
