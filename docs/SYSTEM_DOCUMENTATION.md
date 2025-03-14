
# Picxels Photogrammetry X System Documentation

## Overview

Picxels Photogrammetry X is a comprehensive photogrammetry platform built for reality capture using the Jetson Orin Nano platform. The system integrates camera control, motorized turntable positioning, AI-powered image analysis, and photogrammetry processing to create high-quality 3D models from physical objects.

## System Architecture

### Hardware Components

1. **Computing Platform**: Jetson Orin Nano
   - NVIDIA Orin Nano SoC
   - 8GB RAM
   - CUDA-enabled GPU cores for AI acceleration
   - TensorRT optimization support

2. **Camera Setup**
   - Supported cameras: Canon T2i, Canon T3i DSLR cameras
   - USB connection via gphoto2 interface
   - Remote triggering capability

3. **Motorized Turntable**
   - Stepper motor control (200 steps per revolution)
   - GPIO control from Jetson Orin Nano
   - Adjustable speed and acceleration

4. **Reality Capture Node**
   - External processing server running Reality Capture software
   - Connected via HTTP API
   - Manages the photogrammetry reconstruction process

### Software Architecture

1. **Frontend Application**
   - React/TypeScript web application
   - Modular component-based architecture
   - Responsive design for various screen sizes

2. **AI Processing Pipeline**
   - TensorRT-optimized models for image sharpness detection and segmentation
   - Ollama for LLM-powered subject analysis
   - Integrated local AI capabilities with CUDA acceleration

3. **Camera Control System**
   - libgphoto2 integration
   - Direct USB control of DSLR cameras
   - Automatic refocusing for optimal sharpness

4. **Motor Control System**
   - GPIO control via Jetson.GPIO
   - Adafruit motorkit integration
   - Precise positioning with acceleration/deceleration control

5. **RC Node Integration**
   - HTTP API connection to Reality Capture software
   - Secure authentication via API tokens
   - File transfer and processing commands

## Detailed Component Breakdown

### 1. Camera Control

The system uses the `gphoto2` library to interface with Canon DSLR cameras, providing the following capabilities:

- **Camera Detection**: Automatically detects connected cameras via USB
- **Remote Triggering**: Captures images programmatically without physical interaction
- **Image Transfer**: Downloads captured images to the Jetson system
- **Camera Settings**: Controls aperture, shutter speed, and ISO settings
- **Color Profile Application**: Applies specific color profiles for T2i and T3i cameras

**Implementation**:
- `src/utils/cameraUtils.ts`: Core camera interaction functions
- `src/camera_profiles/CameraControl.tsx`: UI component for camera operations
- `src/utils/colorProfileUtils.ts`: Handles camera-specific color profiles

**Camera Initialization Process**:
1. System detects connected cameras via USB
2. Cameras are initialized with libgphoto2
3. Camera permissions are verified using udev rules
4. Camera settings are configured for optimal photogrammetry capture
5. Color profiles are loaded based on camera model

### 2. AI Processing System

The system uses two primary AI systems:

#### A. TensorRT Models for Image Analysis
- **Sharpness Detection**: FocusNet model for analyzing image focus quality
- **Subject Segmentation**: MobileSAM for generating background masks

#### B. Ollama LLMs for Advanced Analysis
- **Subject Identification**: Llama-3 for identifying captured objects 
- **Metadata Generation**: Phi-3 mini for lightweight processing
- **Visual Analysis**: Llava for vision-based object analysis

**Ollama Integration**:
- Uses locally hosted Ollama service on the Jetson
- Communicates via HTTP API at localhost:11434
- Leverages CUDA acceleration for optimal performance
- Dynamically selects models based on task requirements

**AI Processing Pipeline**:
1. Images are captured from cameras
2. Sharpness detection model evaluates focus quality
3. If sharpness is insufficient, camera refocuses and recaptures
4. Subject segmentation model creates background masks
5. Ollama LLM analyzes content and generates metadata
6. Results are used to organize and describe the session

**Implementation**:
- `src/utils/jetsonAI.ts`: Core AI model management and inference
- `src/services/ollamaService.ts`: Interface with Ollama API
- `src/utils/imageAnalysis.ts`: Higher-level analysis functions

### 3. Motor Control System

The system controls a turntable via a stepper motor connected to the Jetson's GPIO pins:

- **Motor Interface**: GPIO pins via Jetson.GPIO library
- **Control Library**: Adafruit CircuitPython MotorKit
- **Precision**: 200 steps per revolution (1.8° per step)
- **Scanning Modes**: Supports variable step counts (12, 24, 36, 72 steps)
- **Automation**: Coordinates with camera capture for automated scanning

**Implementation**:
- `src/utils/motorControl.ts`: Core motor control functions
- `src/camera_profiles/MotorControl.tsx`: UI component for motor operation

**Motor Control Process**:
1. Motor is initialized with acceleration and speed parameters
2. User selects desired angle or configures scan parameters
3. Motor rotates to specified position with controlled acceleration
4. System waits for stabilization before triggering camera
5. For automated scans, process repeats at specified intervals

### 4. Reality Capture Node Integration

The system connects to an external Reality Capture Node server for photogrammetry processing:

- **Communication**: HTTP API
- **Authentication**: Bearer token authentication
- **Configuration**: Stored in localStorage for persistence
- **Commands**: Supports various RC commands for photogrammetry operations

**Implementation**:
- `src/utils/rcNodeService.ts`: Core RC Node communication functions
- `src/components/RCNodeConfig.tsx`: UI component for connection settings

**RC Node Integration Process**:
1. User configures RC Node URL and authentication token
2. System tests connection and verifies access
3. Captured images are prepared for processing
4. Commands are sent to RC Node to initiate photogrammetry operations
5. Results are retrieved from RC Node when processing completes

### 5. Session Management

The system organizes captured images into sessions:

- **Session Structure**: Collection of images with metadata
- **Metadata**: Capture timestamp, angle, camera used, sharpness values
- **Subject Analysis**: AI-derived descriptions of captured objects
- **Quality Metrics**: Average sharpness, mask coverage

**Implementation**:
- `src/camera_profiles/FileManager.tsx`: Session management UI
- `src/camera_profiles/ImagePreview.tsx`: Visual representation of session images
- `src/camera_profiles/SubjectAnalysis.tsx`: AI analysis results display

**Session Workflow**:
1. User creates a new session
2. Images are captured and added to the session
3. AI analyzes images for subject identification
4. System suggests a session name based on analysis
5. User can review, rename, and manage session data
6. Session can be exported to RC Node for processing

## Installation and Setup

### Jetson Orin Nano Setup

#### 1. Ollama Installation
```bash
# Install Ollama with one-line installer
curl -fsSL https://ollama.com/install.sh | sh

# Verify Ollama installation
ollama --version

# Pull required models
ollama pull llama3.2:8b
ollama pull phi3:mini
ollama pull llava:latest

# Test models
echo "Hello, how are you?" | ollama run llama3.2:8b
```

#### 2. Camera Control Setup
```bash
# Install gphoto2
sudo apt install -y gphoto2 libgphoto2-dev

# Install Python libraries for camera control
pip3 install gphoto2 numpy Pillow rawpy exifread

# Set up camera access permissions
sudo usermod -a -G plugdev $USER
sudo bash -c 'echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04a9\", MODE=\"0666\"" > /etc/udev/rules.d/51-canon-cameras.rules'
sudo udevadm control --reload-rules
sudo udevadm trigger
```

#### 3. TensorRT Model Setup
```bash
# Create models directory
mkdir -p ~/models/{sharpness,masks}

# Download sharpness detection model
curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/356_FocusNet/model/FocusNet_480x384_float32.onnx -o ~/models/sharpness/focus_net.onnx

# Download segmentation model for masks
curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/115_MobileSAM/model/mobile_sam_predictor_quantized.onnx -o ~/models/masks/mobile_sam.onnx

# Convert ONNX models to TensorRT for faster inference
/usr/bin/trtexec --onnx=~/models/sharpness/focus_net.onnx --saveEngine=~/models/sharpness/focus_net.trt
/usr/bin/trtexec --onnx=~/models/masks/mobile_sam.onnx --saveEngine=~/models/masks/mobile_sam.trt
```

#### 4. Motor Control Setup
```bash
# Install libraries for GPIO and motor control
pip3 install Jetson.GPIO Adafruit-Blinka adafruit-circuitpython-motorkit

# Set up permissions for GPIO
sudo groupadd -f -r gpio
sudo usermod -a -G gpio $USER
sudo bash -c 'echo "SUBSYSTEM==\"gpio\", KERNEL==\"gpiochip*\", GROUP=\"gpio\", MODE=\"0660\"" > /etc/udev/rules.d/99-gpio.rules'
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Web Application Setup

```bash
# Clone the repository
git clone https://github.com/picxels/picxels-photogrammetry-x.git
cd picxels-photogrammetry-x

# Install dependencies
npm install

# Start the development server
npm run dev
```

## RC Node Configuration

The Reality Capture Node is an external service that powers the photogrammetry reconstruction. To configure the connection:

1. Ensure your RC Node is running on your local network
2. Configure the connection in the application:
   - Enter the RC Node URL (e.g., `http://192.168.1.16:8000`)
   - Enter your authentication token
   - Test the connection

The configuration will be saved in browser localStorage and automatically reconnected on future sessions.

Example configuration:
```
RC_NODE_URL = "http://192.168.1.16:8000"  # Replace with your RC Node URL
AUTH_TOKEN = "E38BBD4E-69DE-4BCA-ADCB-98B8614CD6A7"  # Replace with your Auth Token
```

## Operational Workflow

### Standard Photogrammetry Session

1. **Setup**
   - Connect cameras via USB
   - Position object on turntable
   - Ensure proper lighting conditions

2. **Create Session**
   - Start new session in the application
   - Verify camera connections
   - Set up motor control parameters

3. **Capture Process**
   - Select scanning parameters (number of steps, auto-capture)
   - Start automated scan, or manually control rotation
   - System captures images at each position
   - AI evaluates image sharpness in real-time

4. **Processing**
   - System applies color profiles to images
   - AI generates background masks
   - Ollama analyzes the captured object
   - Session is named based on AI analysis

5. **Export**
   - Connect to Reality Capture Node
   - Export images and masks
   - Initiate photogrammetry reconstruction
   - Monitor processing progress

6. **Results**
   - View completed 3D model
   - Download or refine as needed

## Technical Implementation Details

### Ollama LLM Integration

The system uses Ollama for LLM capabilities with the following implementation:

```javascript
// Ollama API service
export const analyzeImage = async (
  base64Image: string,
  prompt: string,
  model: string
): Promise<string> => {
  try {
    const generateRequest = {
      model,
      prompt,
      images: [base64Image],
      options: {
        temperature: 0.3,
        num_predict: OLLAMA_CONFIG.maxTokens
      }
    };
    
    const response = await fetch(`${OLLAMA_CONFIG.apiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generateRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama image analysis failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error analyzing image with Ollama:", error);
    throw error;
  }
};
```

### Camera Image Capture

The camera capture process follows this sequence:

```javascript
// Camera capture sequence
export const captureImage = async (
  cameraId: string,
  sessionId: string,
  angle?: number
): Promise<CapturedImage | null> => {
  // In production, this would trigger the actual camera via gphoto2
  try {
    // Trigger camera capture
    
    // Check image sharpness
    if (sharpness < 80) {
      // Refocus camera and retake if sharpness is insufficient
      ...
    }
    
    // Apply appropriate color profile
    const cameraType = getCameraTypeFromId(cameraId);
    const profiledImage = await applyColorProfile(image, cameraType);
    
    return profiledImage;
  } catch (error) {
    // Handle capture errors
    ...
  }
};
```

### Motor Control for Automated Scanning

The motor control system for automated scanning uses:

```javascript
// Automated scan sequence
export const performFullScan = async (
  settings: MotorSettings,
  steps: number,
  onStepComplete: (position: MotorPosition) => Promise<void>
): Promise<void> => {
  const degreesPerStep = 360 / steps;
  
  try {
    // Reset to 0 position first
    await moveMotorToPosition(settings, { angle: 0, step: 0 });
    
    // Perform each step of the scan
    for (let i = 0; i < steps; i++) {
      const angle = i * degreesPerStep;
      const position: MotorPosition = {
        angle,
        step: Math.round(angle / (360 / settings.stepsPerRevolution))
      };
      
      // Move to position
      const newPosition = await moveMotorToPosition(settings, position);
      
      // Wait for stability
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Capture image at this position
      await onStepComplete(newPosition);
    }
    
    // Return to starting position
    await moveMotorToPosition(settings, { angle: 0, step: 0 });
    
  } catch (error) {
    // Handle scan errors
    ...
  }
};
```

## Troubleshooting

### Common Issues and Solutions

#### Ollama Issues

**Issue**: Ollama service not responding or model errors
**Solution**:
1. Check if Ollama service is running: `systemctl status ollama`
2. Restart the service: `sudo systemctl restart ollama`
3. Check logs: `journalctl -u ollama`
4. Verify models are installed: `ollama list`
5. Try pulling models manually: `ollama pull llama3.2:8b`
6. Test API directly: `curl http://localhost:11434/api/tags`

#### Camera Connection Problems

**Issue**: Cameras not detected by the system
**Solution**:
1. Verify USB connections
2. Check that camera is powered on
3. Ensure udev rules are properly configured:
   ```
   sudo bash -c 'echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04a9\", MODE=\"0666\"" > /etc/udev/rules.d/51-canon-cameras.rules'
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```
4. Verify user is in the plugdev group: `sudo usermod -a -G plugdev $USER`
5. Restart the camera and/or system

#### Motor Control Issues

**Issue**: Motor doesn't move or moves erratically
**Solution**:
1. Verify GPIO permissions are set correctly
2. Check that the user is in the gpio group
3. Ensure the motor driver is properly connected
4. Check power supply to the motor
5. Verify the motor wiring matches the driver connections
6. Adjust acceleration and speed settings to be more conservative

#### RC Node Connection Problems

**Issue**: Cannot connect to Reality Capture Node
**Solution**:
1. Verify the RC Node is running and accessible
2. Check that the provided URL is correct and includes the port
3. Ensure the authentication token is valid
4. Check network connectivity between Jetson and RC Node
5. Verify the RC Node API version is compatible

## Extending the System

### Adding New Camera Support

To add support for a new camera model:

1. Update the camera detection logic in `cameraUtils.ts`
2. Create a new color profile for the camera model
3. Add the new profile to `colorProfileUtils.ts`
4. Update the udev rules if necessary for the new camera's vendor ID

### Adding New AI Models to Ollama

To add new LLM models to Ollama:

1. Pull the new model: `ollama pull <model-name>`
2. Update the model configuration in `jetsonAI.config.ts`
3. Test the model: `ollama run <model-name>`
4. Implement any necessary specialized processing in `ollamaService.ts`

### Custom Turntable Hardware

To support different motorized turntables:

1. Update the motor settings in `motorControl.ts`
2. Adjust the steps per revolution and other parameters
3. Modify the GPIO pin configuration if necessary
4. Test and calibrate the new hardware

## Conclusion

The Picxels Photogrammetry X system provides a comprehensive, integrated solution for photogrammetry capturing using the Jetson Orin Nano platform. By combining camera control, motorized positioning, AI-enhanced processing with Ollama, and integration with Reality Capture software, it offers an end-to-end solution for creating high-quality 3D models from physical objects.

The modular architecture allows for extensibility and customization, while the optimized AI processing pipeline ensures efficient, high-quality results even on the resource-constrained Jetson platform.
