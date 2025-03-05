
import { Request, Response } from 'express';
import { exec } from 'child_process';

export async function executeCommand(req: Request, res: Response) {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  console.log(`Server executing command: ${command}`);
  
  // Basic validation (this should be enhanced for security)
  if (!isValidCommand(command)) {
    return res.status(403).json({ error: 'Invalid command' });
  }
  
  try {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return res.status(500).json({ error: error.message, stderr });
      }
      
      if (stderr) {
        console.warn(`Command generated stderr: ${stderr}`);
      }
      
      console.log(`Command executed successfully, stdout: ${stdout}`);
      return res.json({ output: stdout, stderr });
    });
  } catch (error) {
    console.error(`Exception during command execution: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
}

// Basic validation to help prevent command injection
// This should be enhanced for production use
function isValidCommand(command: string): boolean {
  // Only allow gphoto2 commands, mkdir, pkill and specific utilities
  if (
    !command.startsWith('gphoto2 ') && 
    !command.startsWith('mkdir ') && 
    !command.startsWith('cp ') && 
    !command.startsWith('ls ') &&
    !command.startsWith('pkill ') &&
    !command.startsWith('which ')
  ) {
    return false;
  }
  
  // Deny commands with dangerous characters
  const dangerousChars = [';', '&&', '||', '|', '>', '<', '$', '`', '"', "'"];
  return !dangerousChars.some(char => command.includes(char));
}
