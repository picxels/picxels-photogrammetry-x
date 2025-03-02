
# 3D Scanning Control Application

## Project info

**URL**: https://lovable.dev/projects/6fcbb48e-c1f8-45b1-b6ae-f3e64360b8d3

## Installation Guide for NVIDIA Jetson Orin Nano Super Developer Kit

### Prerequisites
- NVIDIA Jetson Orin Nano Super Developer Kit
- JetPack 6.2 installed
- Internet connection for initial setup
- Canon T2i and T3i cameras connected via USB
- Stepper motor for turntable control connected to GPIO pins

### Initial Setup

1. **Flash JetPack 6.2**
   ```sh
   # Download JetPack 6.2 SDK from NVIDIA Developer site
   # Flash your Jetson Orin Nano following NVIDIA's official instructions
   # https://developer.nvidia.com/embedded/jetpack
   ```

2. **Update and upgrade your system**
   ```sh
   sudo apt update
   sudo apt upgrade -y
   ```

3. **Install system dependencies**
   ```sh
   sudo apt install -y \
     python3-pip \
     python3-dev \
     libusb-1.0-0-dev \
     git \
     nodejs \
     npm \
     build-essential \
     libjpeg-dev \
     libpng-dev \
     libgphoto2-dev \
     cmake
   ```

4. **Install Node.js LTS using NVM**
   ```sh
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   source ~/.bashrc
   nvm install --lts
   nvm use --lts
   ```

### Clone and Install Application

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install Node.js dependencies**
   ```sh
   npm i
   ```

### Camera Control Setup

1. **Install gphoto2**
   ```sh
   sudo apt install -y gphoto2 libgphoto2-dev
   ```

2. **Install Python libraries for camera control**
   ```sh
   pip3 install gphoto2 numpy Pillow rawpy exifread
   ```

3. **Set up camera access permissions**
   ```sh
   sudo usermod -a -G plugdev $USER
   sudo bash -c 'echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04a9\", MODE=\"0666\"" > /etc/udev/rules.d/51-canon-cameras.rules'
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

### AI Model Setup

1. **Install TensorRT and CUDA libraries**
   ```sh
   sudo apt install -y tensorrt-dev cuda-toolkit-12-3
   ```

2. **Install required Python packages for AI**
   ```sh
   pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nv-tensorrt-cu123
   pip3 install onnx onnxruntime-gpu scikit-image transformers opencv-python-headless
   ```

3. **Download and optimize models for Jetson**
   ```sh
   # Create models directory
   mkdir -p ~/models/{sharpness,masks,llm}
   
   # Download sharpness detection model
   curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/356_FocusNet/model/FocusNet_480x384_float32.onnx -o ~/models/sharpness/focus_net.onnx
   
   # Download segmentation model for masks
   curl -L https://github.com/PINTO0309/PINTO_model_zoo/raw/main/115_MobileSAM/model/mobile_sam_predictor_quantized.onnx -o ~/models/masks/mobile_sam.onnx
   
   # Download LLM for subject identification (Phi-2 optimized for Jetson)
   git clone https://github.com/microsoft/Phi-2.git
   cd Phi-2
   python3 convert_to_onnx.py --output-path ~/models/llm/phi2.onnx
   ```

4. **Optimize models with TensorRT**
   ```sh
   # Convert ONNX models to TensorRT for faster inference
   /usr/src/tensorrt/bin/trtexec --onnx=~/models/sharpness/focus_net.onnx --saveEngine=~/models/sharpness/focus_net.trt
   /usr/src/tensorrt/bin/trtexec --onnx=~/models/masks/mobile_sam.onnx --saveEngine=~/models/masks/mobile_sam.trt
   /usr/src/tensorrt/bin/trtexec --onnx=~/models/llm/phi2.onnx --saveEngine=~/models/llm/phi2.trt
   ```

### Motor Control Setup

1. **Install libraries for GPIO and motor control**
   ```sh
   pip3 install Jetson.GPIO Adafruit-Blinka adafruit-circuitpython-motorkit
   ```

2. **Set up permissions for GPIO**
   ```sh
   sudo groupadd -f -r gpio
   sudo usermod -a -G gpio $USER
   sudo bash -c 'echo "SUBSYSTEM==\"gpio\", KERNEL==\"gpiochip*\", GROUP=\"gpio\", MODE=\"0660\"" > /etc/udev/rules.d/99-gpio.rules'
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

### Configure Reality Capture Node Communication

1. **Install networking libraries**
   ```sh
   pip3 install requests websockets
   ```

2. **Set up connection to Reality Capture Node**
   ```sh
   # Create a configuration file
   mkdir -p ~/.config/photogrammetry
   cat > ~/.config/photogrammetry/rc_node.conf << EOF
   {
     "rc_node_url": "http://[YOUR_RENDER_MACHINE_IP]:8080",
     "api_key": "[YOUR_API_KEY]"
   }
   EOF
   chmod 600 ~/.config/photogrammetry/rc_node.conf
   ```

### Starting the Application

1. **Development mode**
   ```sh
   npm run dev
   ```

2. **Production mode**
   ```sh
   npm run build
   npm run preview
   ```

3. **Create a system service (optional)**
   ```sh
   sudo bash -c 'cat > /etc/systemd/system/scanner-app.service << EOF
   [Unit]
   Description=3D Scanner Control Application
   After=network.target
   
   [Service]
   User=YOUR_USERNAME
   WorkingDirectory=/path/to/your/project
   ExecStart=/usr/bin/npm run preview
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   EOF'
   
   sudo systemctl daemon-reload
   sudo systemctl enable scanner-app
   sudo systemctl start scanner-app
   ```

## Troubleshooting

### Camera Connection Issues
- Check USB connection and ensure cameras are powered on
- Run `gphoto2 --auto-detect` to verify camera detection
- Run `gphoto2 --summary` to check camera communication

### Motor Control Issues
- Verify GPIO pin connections
- Check stepper driver power supply
- Run the test script: `python3 -m scripts.test_motor`

### AI Model Performance
- If inference is slow, run `sudo nvpmodel -m 0` to set maximum performance mode
- Run `sudo jetson_clocks` to maximize clock speeds
- Check model loading with `python3 -m scripts.test_models`

## How to edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6fcbb48e-c1f8-45b1-b6ae-f3e64360b8d3) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- TensorRT for AI model optimization
- ONNX for model compatibility
- GPIO libraries for hardware control

## Hardware Requirements

- NVIDIA Jetson Orin Nano Super Developer Kit
- Canon T2i and T3i DSLR cameras
- Stepper motor controller
- Cross-polarized flash setup
- Turntable
