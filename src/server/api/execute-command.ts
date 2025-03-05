
import { Request, Response } from 'express';
import { exec } from 'child_process';

export const executeCommand = async (req: Request, res: Response): Promise<void> => {
  const { command } = req.body;

  if (!command) {
    res.status(400).json({ error: 'No command provided' });
    return;
  }

  console.log(`API executing command: ${command}`);

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      res.status(500).json({ 
        error: 'Command execution failed', 
        message: error.message,
        stderr
      });
      return;
    }

    if (stderr) {
      console.warn(`Command stderr: ${stderr}`);
    }

    console.log(`Command stdout: ${stdout}`);
    res.status(200).json({ 
      success: true, 
      output: stdout 
    });
  });
};
