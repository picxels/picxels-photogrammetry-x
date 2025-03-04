
import { toast } from "@/components/ui/use-toast";
import { RCNodeConfig } from "@/types";

// Local storage keys
const RC_NODE_URL_KEY = "RC_NODE_URL";
const RC_NODE_AUTH_TOKEN_KEY = "RC_NODE_AUTH_TOKEN";

/**
 * Loads RC Node configuration from local storage
 */
export const loadRCNodeConfig = (): RCNodeConfig => {
  const nodeUrl = localStorage.getItem(RC_NODE_URL_KEY) || "";
  const authToken = localStorage.getItem(RC_NODE_AUTH_TOKEN_KEY) || "";
  
  return {
    nodeUrl,
    authToken,
    isConnected: false
  };
};

/**
 * Saves RC Node configuration to local storage
 */
export const saveRCNodeConfig = (config: Partial<RCNodeConfig>): void => {
  if (config.nodeUrl) {
    localStorage.setItem(RC_NODE_URL_KEY, config.nodeUrl);
  }
  
  if (config.authToken) {
    localStorage.setItem(RC_NODE_AUTH_TOKEN_KEY, config.authToken);
  }
};

/**
 * Tests connection to RC Node
 */
export const testRCNodeConnection = async (config: RCNodeConfig): Promise<boolean> => {
  try {
    // Make sure URL doesn't end with a slash to prevent double slashes
    const baseUrl = config.nodeUrl.endsWith('/') ? config.nodeUrl.slice(0, -1) : config.nodeUrl;
    const url = `${baseUrl}/node/status`;
    
    console.log(`Testing connection to RC Node at: ${url}`);
    console.log(`Using auth token: ${config.authToken.substring(0, 8)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Connection error details: ${errorText}`);
      throw new Error(`Connection failed with status: ${response.status} - ${errorText}`);
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      throw new Error("Invalid JSON response from server");
    }
    
    console.log("RC Node status response:", data);
    
    toast({
      title: "Connection Successful",
      description: `Connected to RC Node version ${data.apiVersion || 'unknown'}`,
    });
    
    return true;
  } catch (error) {
    console.error("RC Node connection error:", error);
    
    // More detailed error message
    let errorMessage = "Failed to connect to RC Node. ";
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage += "Network error - server might be down or URL incorrect.";
    } else if (error instanceof Error) {
      errorMessage += error.message;
    }
    
    toast({
      title: "Connection Failed",
      description: errorMessage,
      variant: "destructive"
    });
    
    return false;
  }
};

/**
 * Sends a command to the RC Node
 */
export const sendRCNodeCommand = async (
  config: RCNodeConfig,
  commandName: string,
  params: Record<string, string> = {}
): Promise<any> => {
  try {
    // Make sure URL doesn't end with a slash
    const baseUrl = config.nodeUrl.endsWith('/') ? config.nodeUrl.slice(0, -1) : config.nodeUrl;
    
    // Construct query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('name', commandName);
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value], index) => {
      queryParams.append(`param${index + 1}`, value);
    });
    
    const url = `${baseUrl}/project/command?${queryParams.toString()}`;
    console.log(`Sending RC Node command: ${commandName} to URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Command error details: ${errorText}`);
      throw new Error(`Command failed with status: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`RC Node command '${commandName}' error:`, error);
    throw error;
  }
};
