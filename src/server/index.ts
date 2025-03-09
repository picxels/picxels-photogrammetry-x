
import express from 'express';
import cors from 'cors';
import path from 'path';
import { executeCommandHandler } from './api/execute-command';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

// API Routes
app.post('/api/execute-command', executeCommandHandler);

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
