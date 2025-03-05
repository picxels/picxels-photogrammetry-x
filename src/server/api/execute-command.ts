
import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Execute a shell command and return the result
 */
export const executeCommand = async (req: Request, res: Response) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }
  
  console.log(`API: Executing command: ${command}`);
  
  try {
    // Execute the Python script
    const pythonScript = '/path/to/your/script.py';
    const result = await execPromise(`python3 ${pythonScript} "${command.replace(/"/g, '\\"')}"`);
    
    console.log('Command execution successful:', result);
    return res.json({ 
      output: result.stdout,
      success: true 
    });
  } catch (error) {
    console.error('Command execution failed:', error);
    return res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
};
