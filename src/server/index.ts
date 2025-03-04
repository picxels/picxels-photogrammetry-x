
import express from 'express';
import cors from 'cors';
import registerExecuteCommandRoutes from './api/execute-command';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create API routes
const apiRouter = express.Router();
registerExecuteCommandRoutes(apiRouter);

// Use the API router with a prefix
app.use('/api', apiRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
