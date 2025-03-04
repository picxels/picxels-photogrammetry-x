
import { exec } from 'child_process';
import { promisify } from 'util';
import { CAMERA_DEVICE_PATHS, DEBUG_SETTINGS } from "@/config/jetson.config";

const execAsync = promisify(exec);

// This function executes shell commands and should only be called from server-side code
// It's designed to be exposed as an API endpoint
export async function executeShellCommand(command: string) {
  try {
    console.log(`Executing command: ${command}`);
    
    // Validate the command to prevent command injection
    // Only allow specific gphoto2 commands and basic filesystem commands
    if (!isAllowedCommand(command)) {
      console.error(`Rejected unsafe command: ${command}`);
      return { 
        error: 'Command not allowed for security reasons',
        stdout: '',
        stderr: 'Command rejected'
      };
    }

    // Execute the command with a timeout
    const { stdout, stderr } = await execAsync(command, { 
      timeout: getCommandTimeout(command),
      maxBuffer: 1024 * 1024 // 1MB buffer for command output
    });

    console.log(`Command executed successfully`);
    return { stdout, stderr };
  } catch (error) {
    console.error(`Error executing command: ${error}`);
    return { 
      error: `Command execution failed: ${error.message}`,
      stdout: '',
      stderr: error.message
    };
  }
}

// Function to check if a command is allowed for security
function isAllowedCommand(command: string): boolean {
  // List of allowed command prefixes
  const allowedCommands = [
    'gphoto2 --auto-detect',
    'gphoto2 --port=usb:',
    'gphoto2 --abilities',
    'mkdir -p /tmp/picxels',
    'ls /tmp/picxels',
    'convert /tmp/picxels'
  ];

  // Check if the command starts with any of the allowed prefixes
  return allowedCommands.some(allowedCmd => command.startsWith(allowedCmd));
}

// Function to set appropriate timeouts for different commands
function getCommandTimeout(command: string): number {
  if (command.includes('--capture-image')) {
    // Image capture can take longer
    return CAMERA_DEVICE_PATHS.detection.maxCaptureTimeoutMs || 15000;
  } else if (command.includes('--summary')) {
    // Camera responsiveness check
    return CAMERA_DEVICE_PATHS.detection.requiredResponseTimeoutMs || 5000;
  } else {
    // Default timeout
    return 10000; // 10 seconds
  }
}
