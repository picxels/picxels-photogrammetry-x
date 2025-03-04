
import { Request, Response } from 'express';
import { validateCommand } from '@/utils/commandValidationUtils';
import { exec } from 'child_process';
import { DEBUG_SETTINGS } from '@/config/jetson.config';

// Export a function that takes an Express router and registers routes on it
export default function registerExecuteCommandRoutes(router: any) {
  // Register the POST route for executing commands
  router.post('/execute-command', async (req: Request, res: Response) => {
    try {
      const { command } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'No command provided' });
      }

      if (!validateCommand(command)) {
        return res.status(403).json({ error: 'Command not allowed' });
      }

      // Log the command being executed
      console.log(`Executing command: ${command}`);

      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error && !DEBUG_SETTINGS.cameraDebugMode) {
          console.error(`Error executing command: ${error.message}`);
          return res.status(500).json({ error: error.message, stderr });
        }

        console.log(`Command output: ${stdout}`);
        if (stderr) {
          console.warn(`Command stderr: ${stderr}`);
        }

        return res.json({ stdout, stderr });
      });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
