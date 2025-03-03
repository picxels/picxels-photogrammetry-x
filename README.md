
# Picxels Photogrammetry X

A comprehensive photogrammetry platform for reality capture.

## GitHub Repository

https://github.com/picxels/picxels-photogrammetry-x

## Features

- Camera control and calibration
- Motorized turntable integration
- Subject analysis and identification
- Background mask generation
- Reality Capture Node integration
- Color profile application (T2i and T3i cameras)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/picxels/picxels-photogrammetry-x.git
   cd picxels-photogrammetry-x
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

## RC Node Configuration

To connect to the Reality Capture Node:

1. Ensure your RC Node is running on your local network
2. Configure the connection in the application:
   - Enter the RC Node URL (e.g., `http://192.168.1.16:8000`)
   - Enter your authentication token
   - Test the connection

The configuration will be saved in your browser and automatically reconnected on future sessions.

Example configuration:
```
RC_NODE_URL = "http://192.168.1.16:8000"  # Replace with your RC Node URL
AUTH_TOKEN = "E38BBD4E-69DE-4BCA-ADCB-98B8614CD6A7"  # Replace with your Auth Token
```

## Camera Color Profiles

The system automatically applies camera color profiles for better image quality:

- T2i_ColorProfile.dcp - For Canon T2i cameras
- T3i_ColorProfile.dcp - For Canon T3i cameras

These profiles are applied to every captured image before additional processing.

## Development

- Built with React, TypeScript, and Tailwind CSS
- Uses shadcn/ui for component styling
- Responsive design for desktop and mobile use

## License

MIT
