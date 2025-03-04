
import { Request, Response } from 'express';
import { executeShellCommand } from '../execute-command';

export async function executeCommandHandler(req: Request, res: Response) {
  try {
    // Ensure this is a POST request
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the command from the request body
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid command' });
    }

    // Execute the command
    const result = await executeShellCommand(command);
    
    // If there was an error, return it
    if (result.error) {
      return res.status(500).json(result);
    }

    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in execute command handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
