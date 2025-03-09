
import { SessionDatabase } from "@/types";
import { 
  ensureDatabaseDirectory,
  checkDatabaseExists,
  writeDatabaseFile,
  readDatabaseFile,
  showDatabaseErrorToast
} from "./databaseUtils";

// In-memory database (for non-Jetson platforms or as a cache)
let sessionDatabase: SessionDatabase = {
  sessions: [],
  lastOpened: null,
  lastUpdated: Date.now(),
  version: "1.0.0"
};

/**
 * Initialize the session database
 */
export const initSessionDatabase = async (): Promise<void> => {
  try {
    // Ensure directory exists
    await ensureDatabaseDirectory();
    
    // Check if database file exists
    const dbExists = await checkDatabaseExists();
    
    if (!dbExists) {
      console.log("Session database not found, creating new one");
      // Create new empty database
      await saveSessionDatabase();
    } else {
      // Load existing database
      await loadSessionDatabase();
    }
    
    console.log("Session database initialized successfully");
  } catch (error) {
    console.error("Error initializing session database:", error);
    showDatabaseErrorToast("Could not initialize session database. Using in-memory fallback.");
    
    // Create a fresh database in case of initialization error
    sessionDatabase = {
      sessions: [],
      lastOpened: null,
      lastUpdated: Date.now(),
      version: "1.0.0"
    };
    
    // Try to save the fresh database
    try {
      await saveSessionDatabase();
    } catch (saveError) {
      console.error("Error saving fresh database:", saveError);
    }
  }
};

/**
 * Save the session database to disk
 */
export const saveSessionDatabase = async (): Promise<void> => {
  try {
    sessionDatabase.lastUpdated = Date.now();
    
    const jsonData = JSON.stringify(sessionDatabase, null, 2);
    await writeDatabaseFile(jsonData);
    
    console.log("Session database saved successfully");
  } catch (error) {
    console.error("Error saving session database:", error);
    showDatabaseErrorToast("Could not save session database.");
  }
};

/**
 * Load the session database from disk
 */
export const loadSessionDatabase = async (): Promise<void> => {
  try {
    // Check if file exists first
    const dbExists = await checkDatabaseExists();
    
    if (!dbExists) {
      console.log("Session database file not found, using empty database");
      return;
    }
    
    // Read database file
    const jsonData = await readDatabaseFile();
    
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Validate the parsed data has expected structure
      if (!parsedData || typeof parsedData !== 'object' || !Array.isArray(parsedData.sessions)) {
        throw new Error("Invalid database structure");
      }
      
      // Convert date strings back to numbers if they were stored as ISO strings
      parsedData.lastUpdated = typeof parsedData.lastUpdated === 'string' 
        ? new Date(parsedData.lastUpdated).getTime() 
        : parsedData.lastUpdated;
      
      parsedData.sessions = parsedData.sessions.map((session: any) => ({
        ...session,
        createdAt: typeof session.createdAt === 'string' ? new Date(session.createdAt).getTime() : session.createdAt,
        updatedAt: typeof session.updatedAt === 'string' ? new Date(session.updatedAt).getTime() : session.updatedAt,
        processingDate: session.processingDate ? 
          (typeof session.processingDate === 'string' ? new Date(session.processingDate).getTime() : session.processingDate) 
          : undefined,
        images: session.images.map((img: any) => ({
          ...img,
          dateCaptured: typeof img.dateCaptured === 'string' ? new Date(img.dateCaptured).getTime() : img.dateCaptured
        }))
      }));
      
      sessionDatabase = parsedData;
      console.log(`Loaded ${sessionDatabase.sessions.length} sessions from database`);
    } catch (parseError) {
      console.error("Error parsing session database:", parseError);
      showDatabaseErrorToast("Session database file is corrupted. Creating new database.");
      
      // Create new database if parsing fails
      sessionDatabase = {
        sessions: [],
        lastOpened: null,
        lastUpdated: Date.now(),
        version: "1.0.0"
      };
      
      await saveSessionDatabase();
    }
  } catch (error) {
    console.error("Error loading session database:", error);
    showDatabaseErrorToast("Could not load session database.");
    
    // Ensure we have a valid database object even on error
    if (!sessionDatabase || !Array.isArray(sessionDatabase.sessions)) {
      sessionDatabase = {
        sessions: [],
        lastOpened: null,
        lastUpdated: Date.now(),
        version: "1.0.0"
      };
    }
  }
};

/**
 * Get the current database state
 */
export const getSessionDatabase = (): SessionDatabase => {
  return sessionDatabase;
};

/**
 * Update the database state
 */
export const setSessionDatabase = (newDatabase: SessionDatabase): void => {
  sessionDatabase = newDatabase;
};
