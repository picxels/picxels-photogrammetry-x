
// This file is used to run the API server separately
// Run with: node server.js

// Set environment variable to indicate we're on the server
process.env.SERVER_SIDE = 'true';

console.log('API Server starting...');

// Import and start the server
require('./src/server/index.js');
