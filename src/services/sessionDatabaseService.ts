import { Session, SessionStatus, CapturedImage, SessionDatabase } from "@/types";
import { JETSON_AI_MODELS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform } from "@/utils/platformUtils";

// In-memory database (for non-Jetson platforms or as a cache)
let sessionDatabase: SessionDatabase = {
  sessions: [],
  lastOpened: null,
  lastUpdated: Date.now(),
  version: "1.0.0"
};

// File paths
const getDbFilePath = () => {
  const basePath = isJetsonPlatform() 
    ? JETSON_AI_MODELS.nanoDB.databasePath 
    : "/tmp/picxels/data";
  
  return `${basePath}/${JETSON_AI_MODELS.nanoDB.sessionDatabaseFile}`;
};

/**
 * Initialize the session database
 */
export const initSessionDatabase = async (): Promise<void> => {
  try {
    // Ensure directory exists
    const dbPath = getDbFilePath();
    const dirPath = dbPath.substring(0, dbPath.lastIndexOf('/'));
    
    await executeCommand(`mkdir -p ${dirPath}`);
    
    // Check if database file exists
    const checkCommand = `ls ${dbPath} 2>/dev/null || echo "not_found"`;
    const result = await executeCommand(checkCommand);
    
    if (result.includes("not_found")) {
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
    toast({
      title: "Database Error",
      description: "Could not initialize session database. Using in-memory fallback.",
      variant: "destructive"
    });
    
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
    
    const dbPath = getDbFilePath();
    const jsonData = JSON.stringify(sessionDatabase, null, 2);
    
    // Write to temporary file first
    const tempPath = `${dbPath}.tmp`;
    await executeCommand(`echo '${jsonData.replace(/'/g, "\\'")}' > ${tempPath}`);
    
    // Move temporary file to final location (atomic operation)
    await executeCommand(`mv ${tempPath} ${dbPath}`);
    
    console.log("Session database saved successfully");
  } catch (error) {
    console.error("Error saving session database:", error);
    toast({
      title: "Database Error",
      description: "Could not save session database.",
      variant: "destructive"
    });
  }
};

/**
 * Load the session database from disk
 */
export const loadSessionDatabase = async (): Promise<void> => {
  try {
    const dbPath = getDbFilePath();
    
    // Check if file exists first
    const checkCommand = `ls ${dbPath} 2>/dev/null || echo "not_found"`;
    const checkResult = await executeCommand(checkCommand);
    
    if (checkResult.includes("not_found")) {
      console.log("Session database file not found, using empty database");
      return;
    }
    
    // Read database file
    const jsonData = await executeCommand(`cat ${dbPath}`);
    
    // Check if the data looks like valid JSON (starts with {)
    if (!jsonData.trim().startsWith('{')) {
      console.error("Database file does not contain valid JSON:", jsonData.substring(0, 50) + "...");
      throw new Error("Invalid JSON data in database file");
    }
    
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
      toast({
        title: "Database Error",
        description: "Session database file is corrupted. Creating new database.",
        variant: "destructive"
      });
      
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
    toast({
      title: "Database Error",
      description: "Could not load session database.",
      variant: "destructive"
    });
    
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
 * Get all sessions from the database
 */
export const getAllSessions = (): Session[] => {
  return [...sessionDatabase.sessions];
};

/**
 * Get a session by ID
 */
export const getSessionById = (sessionId: string): Session | undefined => {
  return sessionDatabase.sessions.find(session => session.id === sessionId);
};

/**
 * Add a new session to the database
 */
export const addSession = async (session: Session): Promise<Session> => {
  // Ensure session has required fields
  const timestamp = Date.now();
  const sessionToAdd = {
    ...session,
    createdAt: session.createdAt || timestamp,
    updatedAt: session.updatedAt || timestamp,
    dateCreated: session.dateCreated || timestamp,
    dateModified: session.dateModified || timestamp,
    status: session.status || SessionStatus.INITIALIZING,
    images: session.images || [],
    passes: session.passes || [],
    processed: session.processed || false
  };
  
  // Add to database
  sessionDatabase.sessions = [
    ...sessionDatabase.sessions.filter(s => s.id !== session.id),
    sessionToAdd
  ];
  
  // Sort by updated date (newest first)
  sessionDatabase.sessions.sort((a, b) => 
    (b.updatedAt || 0) - (a.updatedAt || 0)
  );
  
  // Save changes
  await saveSessionDatabase();
  
  return sessionToAdd;
};

/**
 * Update an existing session
 */
export const updateSession = async (session: Session): Promise<Session> => {
  // Check if session exists
  const existingSessionIndex = sessionDatabase.sessions.findIndex(
    s => s.id === session.id
  );
  
  if (existingSessionIndex === -1) {
    throw new Error(`Session with ID ${session.id} not found`);
  }
  
  const timestamp = Date.now();
  
  // Update session
  sessionDatabase.sessions[existingSessionIndex] = {
    ...session,
    updatedAt: timestamp,
    dateModified: timestamp
  };
  
  // Save changes
  await saveSessionDatabase();
  
  return sessionDatabase.sessions[existingSessionIndex];
};

/**
 * Delete a session by ID
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  sessionDatabase.sessions = sessionDatabase.sessions.filter(
    session => session.id !== sessionId
  );
  
  // Save changes
  await saveSessionDatabase();
};

/**
 * Add an image to a session
 */
export const addImageToSession = async (
  sessionId: string, 
  image: CapturedImage
): Promise<Session> => {
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Find the active pass (most recent incomplete pass, or first pass)
  const activePassIndex = session.passes.findIndex(pass => !pass.completed);
  
  if (activePassIndex === -1) {
    throw new Error(`No active pass found for session ${sessionId}`);
  }
  
  // Add image ID to the pass
  const updatedPasses = [...session.passes];
  updatedPasses[activePassIndex] = {
    ...updatedPasses[activePassIndex],
    images: [...updatedPasses[activePassIndex].images, image.id]
  };
  
  // Also add to session images array for quick access
  const newSessionImage = {
    id: image.id,
    filename: image.path?.split('/').pop() || `img_${Date.now()}.jpg`,
    filePath: image.filePath || image.path || '',
    camera: image.camera,
    angle: image.angle?.toString() || "0",
    dateCaptured: image.timestamp
  };
  
  const updatedSession = {
    ...session,
    passes: updatedPasses,
    images: [...session.images, newSessionImage],
    updatedAt: Date.now(),
    dateModified: Date.now()
  };
  
  // If this is the first image and session is still initializing, 
  // update status to initialized
  if (session.status === SessionStatus.INITIALIZING && session.images.length === 1) {
    updatedSession.status = SessionStatus.INITIALIZED;
  } else if (session.status === SessionStatus.INITIALIZED && session.images.length > 1) {
    updatedSession.status = SessionStatus.IN_PROGRESS;
  }
  
  // Save changes
  await updateSession(updatedSession);
  
  return updatedSession;
};

/**
 * Update session status
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: SessionStatus
): Promise<Session> => {
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  const timestamp = Date.now();
  const updatedSession = {
    ...session,
    status,
    updatedAt: timestamp,
    dateModified: timestamp
  };
  
  // If status is PROCESSED, update processed flag
  if (status === SessionStatus.PROCESSED) {
    updatedSession.processed = true;
    updatedSession.processingDate = timestamp;
  }
  
  // Save changes
  await updateSession(updatedSession);
  
  return updatedSession;
};

/**
 * Update session metadata
 */
export const updateSessionMetadata = async (
  sessionId: string,
  metadata: {
    name?: string;
    subjectMatter?: string;
    description?: string;
    tags?: string[];
  }
): Promise<Session> => {
  const session = getSessionById(sessionId);
  
  if (!session) {
    throw new Error(`Session with ID ${sessionId} not found`);
  }
  
  // Update metadata fields
  const updatedSession = { ...session };
  if (metadata.name) updatedSession.name = metadata.name;
  if (metadata.subjectMatter) updatedSession.subjectMatter = metadata.subjectMatter;
  if (metadata.description) updatedSession.description = metadata.description;
  if (metadata.tags) updatedSession.tags = metadata.tags;
  
  updatedSession.updatedAt = Date.now();
  updatedSession.dateModified = Date.now();
  
  // Save changes
  await updateSession(updatedSession);
  
  return updatedSession;
};

// Initialize database when this module is imported
initSessionDatabase().catch(error => {
  console.error("Failed to initialize session database:", error);
});
