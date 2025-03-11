
/**
 * Generates a random ID for use across the application
 * @returns A random string ID
 */
export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
