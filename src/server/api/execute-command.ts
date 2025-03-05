
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Safely execute a command and return its output
 * This function runs only on the server side
 */
export const executeCommand = async (command: string): Promise<string> => {
  // Perform basic validation/sanitization
  if (!command || typeof command !== 'string') {
    throw new Error('Invalid command provided');
  }

  // Execute the command and return the output
  try {
    console.log(`Server executing command: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn(`Command produced stderr: ${stderr}`);
    }
    
    return stdout;
  } catch (error) {
    console.error(`Command execution error:`, error);
    throw error;
  }
};
