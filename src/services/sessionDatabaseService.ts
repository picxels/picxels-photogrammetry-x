
// This file is maintained for backward compatibility
// It re-exports all functionality from the refactored database modules
export * from './database';

// Initialize database when this module is imported
import { initSessionDatabase } from './database';
initSessionDatabase().catch(error => {
  console.error("Failed to initialize session database:", error);
});
