
import { CAMERA_DEVICE_PATHS } from "@/config/jetson.config";

/**
 * Validates if a command is allowed to be executed
 * This is important for security when executing shell commands
 */
export const validateCommand = (command: string): boolean => {
  // Simple validation for now - should be expanded with proper security checks
  const allowedCommands = [
    'gphoto2', 'which', 'ls', 'mkdir', 'cp', 'pkill', 'exiftool', 'convert'
  ];
  
  // Check if command starts with any of the allowed commands
  const isAllowed = allowedCommands.some(allowed => 
    command.trim().startsWith(allowed)
  );
  
  if (!isAllowed) {
    console.error(`Command validation failed. Disallowed command: ${command}`);
  }
  
  return isAllowed;
};

/**
 * Sanitize command parameters to prevent command injection
 */
export const sanitizeCommand = (command: string): string => {
  // Remove any potentially dangerous characters or sequences
  let sanitized = command
    .replace(/[;&|`$]/g, '') // Remove shell special characters
    .replace(/\.\.\//g, ''); // Remove path traversal attempts
  
  console.log(`Command sanitized: ${sanitized}`);
  return sanitized;
};
