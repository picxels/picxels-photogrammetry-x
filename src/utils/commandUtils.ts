
/**
 * Utility to execute shell commands
 * Note: This is a client-side wrapper around the server API
 */
export const executeCommand = async (command: string): Promise<string> => {
  console.log("Executing command via API:", command);
  
  try {
    const response = await fetch('/api/execute-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.output || '';
  } catch (error) {
    console.error("Error executing command:", error);
    throw error;
  }
};
