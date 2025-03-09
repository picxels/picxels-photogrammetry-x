import { toast } from "@/components/ui/use-toast";
import { RCNodeConfig } from "@/types";
import { DEBUG_SETTINGS } from "@/config/jetson.config";

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
 * Normalize URL to ensure proper format
 */
const normalizeUrl = (url: string): string => {
  // Remove trailing slash for consistency
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

/**
 * Tests connection to RC Node
 */
export const testRCNodeConnection = async (config: RCNodeConfig): Promise<boolean> => {
  try {
    // Normalize URL
    const baseUrl = normalizeUrl(config.nodeUrl);
    const url = `${baseUrl}/node/status`;
    
    console.log(`Testing connection to RC Node at: ${url}`);
    
    // Add a timestamp to prevent caching
    const urlWithNoCache = `${url}?t=${Date.now()}`;
    
    // Create a new AbortController to set a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${config.authToken}`,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
    
    // Check if we should use XMLHttpRequest instead of fetch
    if (DEBUG_SETTINGS.forceUseXhr) {
      console.log("Using XMLHttpRequest instead of fetch due to debug settings");
      const xhrResult = await doXHRConnectionTest(config);
      return xhrResult.success;
    }
    
    // Regular fetch approach
    console.log("Making fetch request with headers:", headers);
    
    const response = await fetch(urlWithNoCache, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: DEBUG_SETTINGS.disableCors ? 'no-cors' : 'cors', // Conditionally disable CORS
      credentials: 'same-origin' // Don't send cookies for cross-origin requests
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    console.log(`Response status: ${response.status}`);
    
    // For no-cors mode, we won't get a proper response
    if (DEBUG_SETTINGS.disableCors) {
      console.log("No-CORS mode detected, assuming connection successful");
      toast({
        title: "Connection Successful",
        description: "Connected to RC Node (CORS disabled mode)",
      });
      return true;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Connection error details: ${errorText}`);
      throw new Error(`Connection failed with status: ${response.status} - ${errorText}`);
    }
    
    let data;
    try {
      data = await response.json();
      console.log("RC Node status response:", data);
      
      // Verify essential fields to ensure it's a valid RC Node
      if (!data.status || !data.apiVersion) {
        throw new Error("Invalid RC Node response format");
      }
      
      toast({
        title: "Connection Successful",
        description: `Connected to RC Node version ${data.apiVersion || 'unknown'}`,
      });
      
      return true;
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError);
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      throw new Error("Invalid JSON response from server");
    }
  } catch (error) {
    console.error("RC Node connection error:", error);
    
    // More detailed error message based on error type
    let errorMessage = "Failed to connect to RC Node. ";
    
    if (error.name === 'AbortError') {
      errorMessage += "Connection timed out after 10 seconds.";
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage += "Network error - server might be down, URL incorrect, or CORS blocked.";
    } else if (error instanceof Error) {
      errorMessage += error.message;
    }
    
    if (DEBUG_SETTINGS.rcNodeDebugMode) {
      console.log("Trying fallback connection methods due to debug mode enabled");
      
      // Try XHR fallback
      doXHRConnectionTest(config).then(fallbackResult => {
        if (fallbackResult.success) {
          console.log("Fallback connection test succeeded with XHR");
          toast({
            title: "XHR Connection Successful",
            description: "Connected with fallback method. This indicates a CORS issue with the main connection.",
          });
        } else {
          console.log("Fallback XHR connection also failed:", fallbackResult.error);
          
          // As a last resort, try opening the URL in a new tab
          if (DEBUG_SETTINGS.useRelaxedAuthFlow) {
            // This merely checks if the URL is accessible at all
            testServerReachable(config.nodeUrl).then(reachableResult => {
              if (reachableResult.reachable) {
                console.log("Server is reachable but authentication or CORS is failing");
                
                toast({
                  title: "Server is Reachable",
                  description: "The server is up, but authentication or CORS is blocking the connection.",
                  variant: "destructive"
                });
              }
            });
          }
        }
      });
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
 * A connection test using XMLHttpRequest which may have different CORS behavior
 */
const doXHRConnectionTest = (config: RCNodeConfig): Promise<{success: boolean, error?: string, data?: any}> => {
  return new Promise((resolve) => {
    try {
      const baseUrl = normalizeUrl(config.nodeUrl);
      const url = `${baseUrl}/node/status?t=${Date.now()}`;
      
      console.log("Trying XHR connection test");
      
      const xhr = new XMLHttpRequest();
      xhr.timeout = 5000; // 5 second timeout
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("XHR success:", xhr.responseText);
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({success: true, data});
            } catch (e) {
              resolve({success: true, data: xhr.responseText});
            }
          } else {
            resolve({
              success: false, 
              error: `XHR failed with status: ${xhr.status} - ${xhr.statusText}`
            });
          }
        }
      };
      
      xhr.ontimeout = function() {
        resolve({success: false, error: "XHR timeout"});
      };
      
      xhr.onerror = function() {
        resolve({success: false, error: "XHR network error"});
      };
      
      xhr.open("GET", url, true);
      xhr.setRequestHeader("Authorization", `Bearer ${config.authToken}`);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send();
    } catch (error) {
      resolve({success: false, error: error.message});
    }
  });
};

/**
 * Utility to test if a server is accessible (even without authorization)
 */
export const testServerReachable = async (url: string): Promise<{reachable: boolean, error?: string}> => {
  try {
    // Normalize URL
    const baseUrl = normalizeUrl(url);
    
    // Create a new AbortController to set a timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    // Just try to ping the root URL with a HEAD request
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // This allows checking if server exists even without CORS headers
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // If we get here with no-cors, we're technically reachable
    return { reachable: true };
  } catch (error) {
    let errorMessage = "Server unreachable";
    if (error.name === 'AbortError') {
      errorMessage = "Connection timed out";
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = "Network error - server might be down or URL incorrect";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { reachable: false, error: errorMessage };
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
    // Normalize URL
    const baseUrl = normalizeUrl(config.nodeUrl);
    
    // Construct query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('name', commandName);
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    const url = `${baseUrl}/project/command?${queryParams.toString()}`;
    console.log(`Sending RC Node command: ${commandName} to URL: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout for commands
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal,
      mode: DEBUG_SETTINGS.disableCors ? 'no-cors' : 'cors'
    });
    
    clearTimeout(timeoutId);
    
    // For no-cors mode, we won't get a proper response
    if (DEBUG_SETTINGS.disableCors) {
      console.log("No-CORS mode detected, assuming command successful");
      return { success: true };
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Command error details: ${errorText}`);
      throw new Error(`Command failed with status: ${response.status} - ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return { 
        success: true, 
        responseText: await response.text() 
      };
    }
  } catch (error) {
    console.error(`RC Node command '${commandName}' error:`, error);
    throw error;
  }
};

/**
 * Attempts to test various ways of connecting to the RC Node
 * based on RC Node API examples
 */
export const testRCNodeConnectionAdvanced = async (config: RCNodeConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // First check if server is reachable at all
    const isReachable = await testServerReachable(config.nodeUrl);
    if (!isReachable.reachable) {
      return {
        success: false,
        message: `Server is not reachable: ${isReachable.error}`
      };
    }
    
    console.log("Server is reachable, trying different connection methods");
    
    // Method 1: Standard fetch with auth header
    try {
      const baseUrl = normalizeUrl(config.nodeUrl);
      const response = await fetch(`${baseUrl}/node/status?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "Standard fetch connection successful",
          details: data
        };
      }
    } catch (e) {
      console.log("Standard fetch method failed:", e);
    }
    
    // Method 2: Try with URL parameter instead of header
    try {
      const baseUrl = normalizeUrl(config.nodeUrl);
      const response = await fetch(`${baseUrl}/node/status?authToken=${config.authToken}&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: "URL parameter auth connection successful",
          details: data
        };
      }
    } catch (e) {
      console.log("URL parameter method failed:", e);
    }
    
    // Method 3: Try with XMLHttpRequest
    const xhrResult = await doXHRConnectionTest(config);
    if (xhrResult.success) {
      return {
        success: true,
        message: "XMLHttpRequest connection successful",
        details: xhrResult.data
      };
    }
    
    // Method 4: Try with no-cors mode
    try {
      const baseUrl = normalizeUrl(config.nodeUrl);
      await fetch(`${baseUrl}/node/status?authToken=${config.authToken}&t=${Date.now()}`, {
        method: 'GET',
        mode: 'no-cors'
      });
      
      // With no-cors we can't read the response, but if no error is thrown,
      // it might indicate the request was accepted
      return {
        success: true,
        message: "No-CORS mode connection may be successful (can't verify response)",
      };
    } catch (e) {
      console.log("No-CORS method failed:", e);
    }
    
    return {
      success: false,
      message: "All connection methods failed. Check URL, token, and network configuration."
    };
  } catch (error) {
    return {
      success: false,
      message: `Advanced connection test error: ${error.message}`
    };
  }
};
