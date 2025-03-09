
import express from 'express';
import cors from 'cors';
import path from 'path';
import { executeCommand } from './api/execute-command';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

// API Routes
app.post('/api/execute-command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    const result = await executeCommand(command);
    return res.json({ output: result });
  } catch (error) {
    console.error('Error in execute-command endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
});

// Serve the main app for any other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for testing purposes
export default app;
