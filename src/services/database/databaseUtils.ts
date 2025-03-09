
import { executeCommand } from "@/utils/commandUtils";
import { isJetsonPlatform } from "@/utils/platformUtils";
import { JETSON_AI_MODELS } from "@/config/jetsonAI.config";
import { toast } from "@/components/ui/use-toast";

/**
 * Get the database file path based on platform
 */
export const getDbFilePath = () => {
  const basePath = isJetsonPlatform() 
    ? JETSON_AI_MODELS.nanoDB.databasePath 
    : "/tmp/picxels/data";
  
  return `${basePath}/${JETSON_AI_MODELS.nanoDB.sessionDatabaseFile}`;
};

/**
 * Ensure the database directory exists
 */
export const ensureDatabaseDirectory = async (): Promise<void> => {
  const dbPath = getDbFilePath();
  const dirPath = dbPath.substring(0, dbPath.lastIndexOf('/'));
  
  await executeCommand(`mkdir -p ${dirPath}`);
};

/**
 * Check if database file exists
 */
export const checkDatabaseExists = async (): Promise<boolean> => {
  const dbPath = getDbFilePath();
  const checkCommand = `ls ${dbPath} 2>/dev/null || echo "not_found"`;
  const result = await executeCommand(checkCommand);
  
  return !result.includes("not_found");
};

/**
 * Write data to database file (safe atomic write)
 */
export const writeDatabaseFile = async (jsonData: string): Promise<void> => {
  try {
    const dbPath = getDbFilePath();
    // Write to temporary file first
    const tempPath = `${dbPath}.tmp`;
    await executeCommand(`echo '${jsonData.replace(/'/g, "\\'")}' > ${tempPath}`);
    
    // Move temporary file to final location (atomic operation)
    await executeCommand(`mv ${tempPath} ${dbPath}`);
    
    console.log("Database file saved successfully");
  } catch (error) {
    console.error("Error writing database file:", error);
    throw error;
  }
};

/**
 * Read database file content
 */
export const readDatabaseFile = async (): Promise<string> => {
  try {
    const dbPath = getDbFilePath();
    
    // Check if file exists first
    if (!await checkDatabaseExists()) {
      throw new Error("Database file not found");
    }
    
    // Read database file
    const jsonData = await executeCommand(`cat ${dbPath}`);
    
    // Check if the data looks like valid JSON (starts with {)
    if (!jsonData.trim().startsWith('{')) {
      console.error("Database file does not contain valid JSON:", jsonData.substring(0, 50) + "...");
      throw new Error("Invalid JSON data in database file");
    }
    
    return jsonData;
  } catch (error) {
    console.error("Error reading database file:", error);
    throw error;
  }
};

/**
 * Show database error toast message
 */
export const showDatabaseErrorToast = (message: string): void => {
  toast({
    title: "Database Error",
    description: message,
    variant: "destructive"
  });
};
