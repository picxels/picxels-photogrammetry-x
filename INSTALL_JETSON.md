
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

### 1.3 Install Node.js 12.22.9

```bash
# Install Node.js 12.22.9 using the package manager
sudo apt install -y libnode-dev=12.22.9* nodejs=12.22.9* npm

# Verify installation
node -v  # Should output v12.22.9
npm -v   # Verify npm version
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

## 3. Set Up Python Environment

### 3.1 Install Python dependencies

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

## 4. Install SQLite for Account Storage

```bash
# SQLite is used for storing social media account credentials
sudo apt install -y sqlite3 libsqlite3-dev
```

## 5. Set Up Camera Access

### 5.1 Configure USB permissions

```bash
sudo usermod -a -G plugdev $USER
sudo bash -c 'echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04a9\", MODE=\"0666\"" > /etc/udev/rules.d/51-canon-cameras.rules'
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 5.2 Test camera detection

```bash
gphoto2 --auto-detect
```

## 6. Set Up Motor Control

### 6.1 Configure GPIO permissions

```bash
sudo groupadd -f -r gpio
sudo usermod -a -G gpio $USER
sudo bash -c 'echo "SUBSYSTEM==\"gpio\", KERNEL==\"gpiochip*\", GROUP=\"gpio\", MODE=\"0660\"" > /etc/udev/rules.d/99-gpio.rules'
sudo udevadm control --reload-rules
sudo udevadm trigger
```

## 7. Download and Prepare AI Models

### 7.1 Create directory structure

```bash
sudo mkdir -p /opt/picxels/models/{sharpness,masks,llm}
sudo chown -R $USER:$USER /opt/picxels
```

### 7.2 Download pre-trained models

```bash
# Download sharpness detection model
curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/356_FocusNet/model/FocusNet_480x384_float32.onnx -o /opt/picxels/models/sharpness/focus_net.onnx

# Download segmentation model for masks
curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/115_MobileSAM/model/mobile_sam_predictor_quantized.onnx -o /opt/picxels/models/masks/mobile_sam.onnx

# Download LLM for subject identification (Phi-2 optimized for Jetson)
git clone https://github.com/microsoft/Phi-2.git
cd Phi-2
python3 convert_to_onnx.py --output-path /opt/picxels/models/llm/phi2.onnx
```

### 7.3 Optimize models with TensorRT

```bash
# Convert ONNX models to TensorRT for faster inference
/usr/bin/trtexec --onnx=/opt/picxels/models/sharpness/focus_net.onnx --saveEngine=/opt/picxels/models/sharpness/focus_net.trt
/usr/bin/trtexec --onnx=/opt/picxels/models/masks/mobile_sam.onnx --saveEngine=/opt/picxels/models/masks/mobile_sam.trt
/usr/bin/trtexec --onnx=/opt/picxels/models/llm/phi2.onnx --saveEngine=/opt/picxels/models/llm/phi2.trt
```

## 8. Clone and Configure the Application

### 8.1 Clone the repository

```bash
git clone https://github.com/picxels/picxels-photogrammetry-x.git
cd picxels-photogrammetry-x
```

### 8.2 Install dependencies

```bash
# Use a specific npm version compatible with Node.js 12.22.9
npm install -g npm@6.14.16
npm install
```

### 8.3 Initialize the SQLite database for social media accounts

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

### 8.4 Build the application

```bash
# Set Node.js options for older Node versions if needed
export NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

## 9. Create systemd service for auto-start (optional)

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

## 10. Start the Application

### 10.1 For development

```bash
npm run dev
```

### 10.2 For production

```bash
npm run start
```

The application will be available at http://localhost:8080 by default.

## 11. Configure Social Media Accounts

1. Navigate to the Social Media tab in the application
2. Click "Connect" on each platform you want to use
3. Follow the OAuth authentication process
4. Your accounts will be securely stored in the local SQLite database

## 12. Troubleshooting

### Node.js Compatibility Issues

If you encounter errors related to Node.js version 12.22.9:

- For ES module import errors, modify the `type` in package.json to "commonjs"
- For memory limitations, use `export NODE_OPTIONS=--max-old-space-size=4096` before running commands
- Some newer npm packages may not be compatible with Node.js 12; if errors persist, consider downgrading those packages:
  ```bash
  npm install package-name@older-version
  ```

### Model Path Issues

If you encounter issues with model loading, verify the paths in `src/config/jetson.config.ts` match your actual model locations.

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

### Performance Optimization

If you experience slow processing:
- Run `sudo nvpmodel -m 0` to set the Jetson to maximum performance mode
- Run `sudo jetson_clocks` to maximize all clock speeds
- Reduce the batch size or resolution in the configuration if necessary

## 13. Updating

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
