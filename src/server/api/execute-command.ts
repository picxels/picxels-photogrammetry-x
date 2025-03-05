
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Execute a shell command and return the output
 */
export const executeCommand = async (command: string): Promise<string> => {
  try {
    console.log(`Executing command: ${command}`);
    
    // Validate command to prevent injection
    if (!isValidCommand(command)) {
      throw new Error('Invalid command');
    }
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.warn(`Command stderr: ${stderr}`);
    }
    
    return stdout;
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    throw error;
  }
};

/**
 * Validate a command to prevent command injection
 * This is a simple validation, you may want to enhance it
 */
function isValidCommand(command: string): boolean {
  // List of allowed commands or command patterns
  const allowedCommands = [
    /^gphoto2\s/,
    /^which\s/,
    /^lsusb/,
    /^pkill\s/,
  ];
  
  return allowedCommands.some(pattern => 
    typeof pattern === 'string' 
      ? command === pattern 
      : pattern.test(command)
  );
}
