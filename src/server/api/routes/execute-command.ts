
import { Request, Response } from 'express';
import { exec } from 'child_process';
import { CAMERA_DEVICE_PATHS } from '@/config/jetson.config';

/**
 * Handler for executing shell commands, specifically for gphoto2 camera control
 */
export const executeCommandHandler = (req: Request, res: Response) => {
  const { command } = req.body;
  
  if (!command) {
    console.error('No command provided');
    return res.status(400).json({ error: 'No command provided' });
  }
  
  console.log(`Executing command: ${command}`);
  
  // Validate the command for security
  if (!isAllowedCommand(command)) {
    console.error(`Command not allowed: ${command}`);
    return res.status(403).json({ error: 'Command not allowed for security reasons' });
  }
  
  // Execute the command
  exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Command execution error: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: error.message, stderr });
    }
    
    console.log(`Command executed successfully`);
    console.log(`stdout: ${stdout}`);
    
    if (stderr) {
      console.warn(`stderr (non-fatal): ${stderr}`);
    }
    
    return res.status(200).json({ stdout, stderr });
  });
};

/**
 * Validates if a command is allowed for security reasons
 * Only permits specific gphoto2 and related commands
 */
const isAllowedCommand = (command: string): boolean => {
  const allowedCommands = CAMERA_DEVICE_PATHS.detection.allowedCommands;
  const commandTemplates = CAMERA_DEVICE_PATHS.detection.commandTemplates;
  
  // Check if it's in the allowed commands list
  for (const allowedCommand of allowedCommands) {
    // Direct match
    if (command === allowedCommand) {
      return true;
    }
    
    // Check if it matches a template
    if (allowedCommand.includes('{')) {
      // Replace placeholders with regex
      const templateRegex = allowedCommand.replace(
        /{(\w+)}/g,
        (match, placeholder) => {
          const template = commandTemplates[placeholder as keyof typeof commandTemplates];
          return template ? `(${template})` : '.+';
        }
      );
      
      const regex = new RegExp(`^${templateRegex}$`);
      if (regex.test(command)) {
        return true;
      }
    }
  }
  
  // Special handling for common camera commands
  if (command.startsWith('gphoto2 --auto-detect') || 
      command.startsWith('which gphoto2') ||
      command.startsWith('ls -la /tmp/picxels') ||
      command.startsWith('mkdir -p /tmp/picxels') ||
      command.startsWith('mkdir -p public/captures') ||
      command.startsWith('cp /tmp/picxels/captures') ||
      command.startsWith('ls -la public/captures')) {
    return true;
  }
  
  console.warn(`Command not in allowlist: ${command}`);
  return false;
};
