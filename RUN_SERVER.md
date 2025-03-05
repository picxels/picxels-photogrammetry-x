
# Running the API Server

Since we can't modify package.json directly, follow these manual steps to run the server:

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
