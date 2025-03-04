
import { Request, Response } from 'express';
import { executeShellCommand } from '../execute-command';

/**
 * Express route handler for the execute-command endpoint
 * This validates the request and calls executeShellCommand
 */
export async function executeCommandHandler(req: Request, res: Response): Promise<Response> {
  try {
    // Validate the request body
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Command is required and must be a string'
      });
    }
    
    // Execute the command
    const result = await executeShellCommand(command);
    
    // Check if there was an error
    if (result.error) {
      return res.status(400).json(result);
    }
    
    // Return successful response
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in execute command handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
