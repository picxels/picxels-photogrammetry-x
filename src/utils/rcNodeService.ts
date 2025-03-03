
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
    const url = `${config.nodeUrl}/node/status`;
    console.log(`Testing connection to RC Node at: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Connection failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("RC Node status:", data);
    
    toast({
      title: "Connection Successful",
      description: `Connected to RC Node version ${data.apiVersion || 'unknown'}`,
    });
    
    return true;
  } catch (error) {
    console.error("RC Node connection error:", error);
    
    toast({
      title: "Connection Failed",
      description: "Failed to connect to RC Node. Please check URL and Auth Token.",
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
    // Construct query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('name', commandName);
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value], index) => {
      queryParams.append(`param${index + 1}`, value);
    });
    
    const url = `${config.nodeUrl}/project/command?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Command failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`RC Node command '${commandName}' error:`, error);
    throw error;
  }
};
