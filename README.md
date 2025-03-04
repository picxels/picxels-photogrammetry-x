
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
- Social media sharing and account management

## Installation Options

### For Development

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

### For Jetson Orin Nano (Production Use)

For full installation instructions for Jetson Orin Nano with NVIDIA Jetson Linux 36.4.3 GA, see:

**[Jetson Installation Guide](INSTALL_JETSON.md)**

This guide includes:
- System setup and dependencies
- AI model optimization with TensorRT
- Camera and motor configuration
- Social media account database setup
- Performance optimization

## Hardware Setup for Jetson Orin Nano

### Camera Control Setup

1. Install gphoto2
   ```bash
   sudo apt install -y gphoto2 libgphoto2-dev
   ```

2. Install Python libraries for camera control
   ```bash
   pip3 install gphoto2 numpy Pillow rawpy exifread
   ```

3. Set up camera access permissions
   ```bash
   sudo usermod -a -G plugdev $USER
   sudo bash -c 'echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04a9\", MODE=\"0666\"" > /etc/udev/rules.d/51-canon-cameras.rules'
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

### AI Model Setup

1. Verify TensorRT and CUDA installation
   ```bash
   # Check TensorRT installation
   dpkg -l | grep -i tensorrt

   # Check CUDA Toolkit installation  
   dpkg -l | grep cuda-toolkit
   ```

2. Install required Python packages for AI
   ```bash
   # For your CUDA 12.6 setup
   pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nv-tensorrt-cu126
   pip3 install onnx onnxruntime-gpu scikit-image transformers opencv-python-headless
   ```

3. Download and optimize models for Jetson
   ```bash
   # Create models directory
   sudo mkdir -p /opt/picxels/models/{sharpness,masks,llm}
   sudo chown -R $USER:$USER /opt/picxels

   # Download sharpness detection model
   curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/356_FocusNet/model/FocusNet_480x384_float32.onnx -o /opt/picxels/models/sharpness/focus_net.onnx

   # Download segmentation model for masks
   curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/115_MobileSAM/model/mobile_sam_predictor_quantized.onnx -o /opt/picxels/models/masks/mobile_sam.onnx

   # Download LLM for subject identification (Phi-2 optimized for Jetson)
   git clone https://github.com/microsoft/Phi-2.git
   cd Phi-2
   python3 convert_to_onnx.py --output-path /opt/picxels/models/llm/phi2.onnx
   ```

4. Optimize models with TensorRT
   ```bash
   # Convert ONNX models to TensorRT for faster inference
   /usr/bin/trtexec --onnx=/opt/picxels/models/sharpness/focus_net.onnx --saveEngine=/opt/picxels/models/sharpness/focus_net.trt
   /usr/bin/trtexec --onnx=/opt/picxels/models/masks/mobile_sam.onnx --saveEngine=/opt/picxels/models/masks/mobile_sam.trt
   /usr/bin/trtexec --onnx=/opt/picxels/models/llm/phi2.onnx --saveEngine=/opt/picxels/models/llm/phi2.trt
   ```

### Motor Control Setup

1. Install libraries for GPIO and motor control
   ```bash
   pip3 install Jetson.GPIO Adafruit-Blinka adafruit-circuitpython-motorkit
   ```

2. Set up permissions for GPIO
   ```bash
   sudo groupadd -f -r gpio
   sudo usermod -a -G gpio $USER
   sudo bash -c 'echo "SUBSYSTEM==\"gpio\", KERNEL==\"gpiochip*\", GROUP=\"gpio\", MODE=\"0660\"" > /etc/udev/rules.d/99-gpio.rules'
   sudo udevadm control --reload-rules
   sudo udevadm trigger
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

## Social Media Integration

The application includes a dedicated social media management tab where you can:

1. Connect multiple social media accounts (Instagram, Twitter/X, Facebook, TikTok, Reddit)
2. Configure default sharing settings for 3D models
3. Customize caption templates with placeholders for model names
4. Share directly to connected platforms after completing photogrammetry workflows

Account credentials are securely stored in a local SQLite database.

## Development

- Built with React, TypeScript, and Tailwind CSS
- Uses shadcn/ui for component styling
- Responsive design for desktop and mobile use

## License

MIT
