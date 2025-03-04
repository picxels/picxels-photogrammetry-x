
import express from 'express';
import path from 'path';
import { executeCommandHandler } from './api/routes/execute-command';

// Start the server if this file is executed directly
if (require.main === module) {
  const app = express();
  const port = process.env.PORT || 3000;

  // Configure middleware
  app.use(express.json());
  
  // API routes
  app.post('/api/execute-command', executeCommandHandler);
  
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../../dist')));
  
  // Handle all other routes by serving the index.html file
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'));
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// Export the executeCommandHandler for use in other files
export { executeCommandHandler };
