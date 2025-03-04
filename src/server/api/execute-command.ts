
import { exec } from 'child_process';
import { promisify } from 'util';
import { CAMERA_DEVICE_PATHS, DEBUG_SETTINGS } from "@/config/jetson.config";

const execAsync = promisify(exec);

interface CommandResult {
  stdout: string;
  stderr: string;
  error?: string;
}

// This function executes shell commands and should only be called from server-side code
// It's designed to be exposed as an API endpoint
export async function executeShellCommand(command: string): Promise<CommandResult> {
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
    console.error(`Error executing command:`, error);
    return { 
      error: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error)
    };
  }
}

// Function to check if a command is allowed for security
function isAllowedCommand(command: string): boolean {
  // Get the allowed commands from the jetson config
  const allowedCommands = CAMERA_DEVICE_PATHS.detection.allowedCommands || [];
  
  // Check if the command is explicitly allowed
  for (const allowedCmd of allowedCommands) {
    // Check if the command is an exact match or matches a template
    if (command === allowedCmd || matchesTemplate(command, allowedCmd)) {
      return true;
    }
  }
  
  return false;
}

// Check if a command matches a template with placeholders
function matchesTemplate(command: string, template: string): boolean {
  // If there are no templates to substitute, just do a direct comparison
  if (!template.includes('{') || !template.includes('}')) {
    return command === template;
  }
  
  // Convert the template to a regex pattern
  let regexPattern = '^' + template.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$';
  
  // Replace all template variables with their corresponding regex patterns
  const templateVars = CAMERA_DEVICE_PATHS.detection.commandTemplates || {};
  
  for (const [key, pattern] of Object.entries(templateVars)) {
    const placeholder = `\\{${key}\\}`;
    regexPattern = regexPattern.replace(new RegExp(placeholder, 'g'), pattern);
  }
  
  // Test the command against the regex pattern
  const regex = new RegExp(regexPattern);
  return regex.test(command);
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
