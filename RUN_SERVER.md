
# Running the API Server

Follow these steps to run the API server:

## Prerequisites

Make sure the following packages are installed:
- cors
- express

If they aren't installed, you can install them using:
```
npm install cors express
```

## Starting the Server

To start the API server, run:
```
node server.js
```

This will start the API server on port 3001.

## Verifying the Server is Running

You can verify the server is running by opening your browser to:
```
http://localhost:3001/api/health
```

Or using curl:
```
curl http://localhost:3001/api/health
```

You should see a response like:
```json
{"status":"ok","message":"Server is running"}
```

## Development

When developing, you'll need to run both the Vite dev server and the API server.

1. Start the Vite dev server:
```
npm run dev
```

2. In a separate terminal, start the API server:
```
node server.js
```

The frontend will automatically proxy API requests to the server running on port 3001.

## Troubleshooting

If you encounter issues:

1. Make sure no other process is using port 3001
2. Check for error messages in the terminal
3. If you get module not found errors, make sure you have the required dependencies:
   ```
   npm install cors express
   ```
4. Try setting the PORT environment variable if 3001 is already in use:
   ```
   PORT=3002 node server.js
   ```
