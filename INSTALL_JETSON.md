
# Picxels Photogrammetry X - Jetson Orin Nano Installation Guide

This guide provides step-by-step instructions for installing and running Picxels Photogrammetry X on the NVIDIA Jetson Orin Nano platform with Jetson Linux 36.4.3 GA.

## System Requirements

- NVIDIA Jetson Orin Nano Developer Kit
- NVIDIA Jetson Linux Version 36.4.3 GA or later
- At least 50GB of available storage space
- USB ports for camera connections
- Internet connection for initial setup

## 1. System Preparation

### 1.1 Update your Jetson system

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install essential dependencies

```bash
sudo apt install -y git curl wget libgphoto2-dev libjpeg-dev \
  libpng-dev libtiff-dev libwebp-dev libopenjp2-7-dev libtbb-dev sqlite3 libsqlite3-dev
```

### 1.3 Install Node.js 22.x (if not already installed)

```bash
# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v  # Should output v22.x.x
npm -v   # Should output around 10.x.x
```

## 2. Install CUDA and TensorRT (if not already installed)

These should come pre-installed on your Jetson Orin Nano with JetPack. 
You can verify the installations with:

```bash
# Check CUDA installation
nvcc --version

# Check TensorRT installation
dpkg -l | grep tensorrt
```

If not installed, follow the NVIDIA documentation to install the 
appropriate versions for your Jetson system.

## 3. Install Ollama

Ollama provides an easy way to run LLMs locally on the Jetson platform with CUDA acceleration:

```bash
# Install Ollama (one-line installer)
curl -fsSL https://ollama.com/install.sh | sh

# Verify Ollama is installed and running
ollama --version

# The Ollama API should now be available at localhost:11434
```

### 3.1 Pull required models

```bash
# Pull Llama 3.2 8B model (for text analysis)
ollama pull llama3.2:8b

# Pull Phi-3 Mini model (for lightweight processing)
ollama pull phi3:mini

# Pull Llava (for vision capabilities)
ollama pull llava:latest
```

### 3.2 Test that models work correctly

```bash
# Test text generation
echo "Write a haiku about a camera" | ollama run llama3.2:8b

# Test smaller Phi-3 model
echo "What is photogrammetry?" | ollama run phi3:mini
```

## 4. Set Up Python Environment

### 4.1 Install Python dependencies

```bash
# Core dependencies
pip3 install numpy==1.23.5 Pillow==9.5.0 onnx==1.14.0 opencv-python==4.8.0.74 

# Camera control
pip3 install gphoto2==2.5.0 rawpy==0.20.0 exifread==3.0.0

# AI libraries
pip3 install onnxruntime-gpu==1.15.1 torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/nv-tensorrt-cu126

# Motor control
pip3 install Jetson.GPIO==2.1.4 Adafruit-Blinka==8.20.1 adafruit-circuitpython-motorkit==1.6.8
```

## 5. Install SQLite for Account Storage

```bash
# SQLite is used for storing social media account credentials
sudo apt install -y sqlite3 libsqlite3-dev
```

## 6. Set Up Camera Access

### 6.1 Configure USB permissions

```bash
sudo usermod -a -G plugdev $USER
sudo bash -c 'echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04a9\", MODE=\"0666\"" > /etc/udev/rules.d/51-canon-cameras.rules'
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 6.2 Test camera detection

```bash
gphoto2 --auto-detect
```

## 7. Set Up Motor Control

### 7.1 Configure GPIO permissions

```bash
sudo groupadd -f -r gpio
sudo usermod -a -G gpio $USER
sudo bash -c 'echo "SUBSYSTEM==\"gpio\", KERNEL==\"gpiochip*\", GROUP=\"gpio\", MODE=\"0660\"" > /etc/udev/rules.d/99-gpio.rules'
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## 8. Download and Prepare AI Models

### 8.1 Create directory structure

```bash
sudo mkdir -p /opt/picxels/models/{sharpness,masks}
sudo chown -R $USER:$USER /opt/picxels
```

### 8.2 Download pre-trained models

```bash
# Download sharpness detection model
curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/356_FocusNet/model/FocusNet_480x384_float32.onnx -o /opt/picxels/models/sharpness/focus_net.onnx

# Download segmentation model for masks
curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/115_MobileSAM/model/mobile_sam_predictor_quantized.onnx -o /opt/picxels/models/masks/mobile_sam.onnx
```

### 8.3 Optimize models with TensorRT

```bash
# Convert ONNX models to TensorRT for faster inference
/usr/bin/trtexec --onnx=/opt/picxels/models/sharpness/focus_net.onnx --saveEngine=/opt/picxels/models/sharpness/focus_net.trt --fp16
/usr/bin/trtexec --onnx=/opt/picxels/models/masks/mobile_sam.onnx --saveEngine=/opt/picxels/models/masks/mobile_sam.trt --fp16
```

## 9. Clone and Configure the Application

### 9.1 Clone the repository

```bash
git clone https://github.com/picxels/picxels-photogrammetry-x.git
cd picxels-photogrammetry-x
```

### 9.2 Install dependencies

```bash
npm install
```

### 9.3 Initialize the SQLite database for social media accounts

```bash
# Create database directory
mkdir -p data

# Initialize database
sqlite3 data/social_accounts.db <<EOF
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TEXT,
  connected INTEGER DEFAULT 1,
  last_used TEXT,
  avatar_url TEXT,
  scopes TEXT
);
EOF
```

### 9.4 Add script to package.json

Before building the application, we need to add a start script to the package.json file:

```bash
# Add the start script to package.json
npm pkg set scripts.start="vite preview --host --port 8080"
npm pkg set scripts.dev="vite --host --port 8080"
npm pkg set scripts.build="vite build"
```

### 9.5 Create sample images directory

For demonstration purposes when no real cameras are connected:

```bash
# Create directory for sample images
mkdir -p public/sample_images

# Download some sample images
curl -L "https://unsplash.com/photos/random?topics=product,object&orientation=landscape" -o public/sample_images/sample1.jpg
curl -L "https://unsplash.com/photos/random?topics=product,object&orientation=landscape" -o public/sample_images/sample2.jpg
curl -L "https://unsplash.com/photos/random?topics=product,object&orientation=landscape" -o public/sample_images/sample3.jpg
curl -L "https://unsplash.com/photos/random?topics=product,object&orientation=landscape" -o public/sample_images/sample4.jpg
```

### 9.6 Build the application

```bash
npm run build
```

## 10. Create systemd service for auto-start (optional)

```bash
sudo bash -c 'cat > /etc/systemd/system/picxels.service << EOF
[Unit]
Description=Picxels Photogrammetry X
After=network.target

[Service]
Type=simple
User='$USER'
WorkingDirectory='$(pwd)'
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=picxels

[Install]
WantedBy=multi-user.target
EOF'

# Enable and start the service
sudo systemctl enable picxels
sudo systemctl start picxels
```

## 11. Start the Application

### 11.1 For development

```bash
npm run dev
```

### 11.2 For production

```bash
# First build the application
npm run build

# Then start the production server
npm run start
```

The application will be available at http://localhost:8080 by default.

## 12. Configure Social Media Accounts

1. Navigate to the Social Media tab in the application
2. Click "Connect" on each platform you want to use
3. Follow the OAuth authentication process
4. Your accounts will be securely stored in the local SQLite database

## 13. Troubleshooting

### Ollama Issues

If you encounter issues with Ollama:
- Verify Ollama is running with `systemctl status ollama`
- Restart the service with `sudo systemctl restart ollama`
- Check logs with `journalctl -u ollama`
- Test Ollama directly with `ollama run llama3.2:8b`
- Ensure models are properly pulled with `ollama list`
- Check API availability with `curl http://localhost:11434/api/tags`

### Camera Connection Problems

If cameras are not detected:
- Ensure they are powered on and connected via USB
- Run `gphoto2 --auto-detect` to check camera visibility
- Verify the camera is supported by checking `gphoto2 --list-cameras`

### Motor Control Issues

If the motor doesn't respond:
- Check GPIO pin configurations in `src/config/jetson.config.ts`
- Verify wiring connections to the motor controller
- Ensure you have the correct permissions for GPIO access

### RC Node Connection Issues

If you have trouble connecting to RC Node:
- Check the URL format (make sure it doesn't have trailing slashes)
- Verify the authentication token is correct
- Try using the provided cURL command to test connectivity directly
- Check RC Node logs for any errors or permission issues

### Performance Optimization

If you experience slow processing:
- Run `sudo nvpmodel -m 0` to set the Jetson to maximum performance mode
- Run `sudo jetson_clocks` to maximize all clock speeds
- Reduce the batch size or resolution in the configuration if necessary

## 14. Updating

To update the application:

```bash
cd picxels-photogrammetry-x
git pull
npm install
npm run build
```

If running as a service, restart it:

```bash
sudo systemctl restart picxels
```
