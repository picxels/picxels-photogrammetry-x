
import { Request, Response } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// List of allowed commands to prevent command injection
const ALLOWED_COMMANDS = [
  'gphoto2',
  'ls',
  'mkdir',
  'cp',
  'rm',
  'which'
];

// Validate that a command is allowed
const isCommandAllowed = (cmd: string): boolean => {
  const command = cmd.split(' ')[0];
  return ALLOWED_COMMANDS.includes(command);
};

// Execute command handler (Express middleware)
export const executeCommandHandler = (req: Request, res: Response) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  // Security check
  if (!isCommandAllowed(command)) {
    console.error(`Unauthorized command attempted: ${command}`);
    return res.status(403).json({ error: 'Command not allowed' });
  }
  
  console.log(`Executing command: ${command}`);
  
  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).json({ error: error.message, stderr });
    }
    
    if (stderr) {
      console.warn(`Command stderr: ${stderr}`);
    }
    
    console.log(`Command stdout: ${stdout}`);
    return res.json({ stdout, stderr });
  });
};
