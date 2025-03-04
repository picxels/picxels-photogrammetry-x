
import express from 'express';
import path from 'path';
import cors from 'cors';
import { executeCommandHandler } from './api/routes/execute-command';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.post('/api/execute-command', executeCommandHandler);

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Simple error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
