
import { Session, SessionStatus, CapturedImage, SessionDatabase } from "@/types";
import { JETSON_AI_MODELS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { toast } from "@/components/ui/use-toast";
import { isJetsonPlatform } from "@/utils/platformUtils";

// In-memory database (for non-Jetson platforms or as a cache)
let sessionDatabase: SessionDatabase = {
  sessions: [],
  lastUpdated: new Date(),
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
  }
};

/**
 * Save the session database to disk
 */
export const saveSessionDatabase = async (): Promise<void> => {
  try {
    sessionDatabase.lastUpdated = new Date();
    
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
    
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Convert date strings back to Date objects
      parsedData.lastUpdated = new Date(parsedData.lastUpdated);
      
      parsedData.sessions = parsedData.sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        processingDate: session.processingDate ? new Date(session.processingDate) : undefined,
        images: session.images.map((img: any) => ({
          ...img,
          timestamp: new Date(img.timestamp)
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
        lastUpdated: new Date(),
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
  const sessionToAdd = {
    ...session,
    createdAt: session.createdAt || new Date(),
    updatedAt: session.updatedAt || new Date(),
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
    b.updatedAt.getTime() - a.updatedAt.getTime()
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
  
  // Update session
  sessionDatabase.sessions[existingSessionIndex] = {
    ...session,
    updatedAt: new Date()
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
  
  // Add image to the pass
  session.passes[activePassIndex].images.push(image);
  
  // Also add to session images array for quick access
  session.images.push({
    id: image.id,
    url: image.previewUrl,
    camera: image.camera,
    angle: image.angle || 0,
    timestamp: new Date(image.timestamp),
    hasMask: image.hasMask
  });
  
  // Update session
  session.updatedAt = new Date();
  
  // If this is the first image and session is still initializing, 
  // update status to initialized
  if (session.status === SessionStatus.INITIALIZING && session.images.length === 1) {
    session.status = SessionStatus.INITIALIZED;
  } else if (session.status === SessionStatus.INITIALIZED && session.images.length > 1) {
    session.status = SessionStatus.IN_PROGRESS;
  }
  
  // Save changes
  await updateSession(session);
  
  return session;
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
  
  session.status = status;
  session.updatedAt = new Date();
  
  // If status is PROCESSED, update processed flag
  if (status === SessionStatus.PROCESSED) {
    session.processed = true;
    session.processingDate = new Date();
  }
  
  // Save changes
  await updateSession(session);
  
  return session;
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
  if (metadata.name) session.name = metadata.name;
  if (metadata.subjectMatter) session.subjectMatter = metadata.subjectMatter;
  if (metadata.description) session.description = metadata.description;
  if (metadata.tags) session.tags = metadata.tags;
  
  session.updatedAt = new Date();
  
  // Save changes
  await updateSession(session);
  
  return session;
};

// Initialize database when this module is imported
initSessionDatabase().catch(error => {
  console.error("Failed to initialize session database:", error);
});
