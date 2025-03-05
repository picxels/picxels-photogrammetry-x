
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

// Command execution endpoint - Fix the route handler registration
app.post('/api/execute-command', async (req, res) => {
  await executeCommand(req, res);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
