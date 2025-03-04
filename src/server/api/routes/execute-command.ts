
import { Request, Response } from 'express';
import { executeShellCommand } from '../execute-command';

/**
 * Express route handler for the execute-command endpoint
 * This validates the request and calls executeShellCommand
 */
export function executeCommandHandler(req: Request, res: Response): void {
  try {
    // Validate the request body
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      res.status(400).json({ 
        error: 'Invalid request',
        message: 'Command is required and must be a string'
      });
      return;
    }
    
    // Execute the command (use Promise handling)
    executeShellCommand(command)
      .then(result => {
        // Check if there was an error
        if (result.error) {
          res.status(400).json(result);
        } else {
          // Return successful response
          res.status(200).json(result);
        }
      })
      .catch(error => {
        console.error('Error in execute command handler:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error)
        });
      });
  } catch (error) {
    console.error('Error in execute command handler:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
