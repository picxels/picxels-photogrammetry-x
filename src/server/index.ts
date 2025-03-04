
import express from 'express';
import path from 'path';
import cors from 'cors';
import { executeCommandHandler } from './api/routes/execute-command';

// Create Express server
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../public')));

// API routes
app.post('/api/execute-command', executeCommandHandler);

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
