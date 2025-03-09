
#!/bin/bash

# Installation script for EfficientViT by MIT-HAN-LAB
# Optimized for Jetson Orin Nano 8GB

set -e

# Configuration
MODEL_DIR="/opt/picxels/models/efficientvit"
SCRIPT_DIR="/opt/picxels/scripts"
REPO_URL="https://github.com/mit-han-lab/efficientvit"
MODEL_VARIANT="L1"

# Ensure directories exist
mkdir -p $MODEL_DIR
mkdir -p $SCRIPT_DIR

# Install dependencies
echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y git python3-pip

# Clone repository if it doesn't exist
if [ ! -d "/tmp/efficientvit" ]; then
    echo "Cloning EfficientViT repository..."
    git clone $REPO_URL /tmp/efficientvit
else
    echo "Updating EfficientViT repository..."
    cd /tmp/efficientvit
    git pull
fi

# Install Python requirements
echo "Installing Python requirements..."
cd /tmp/efficientvit
pip3 install -r requirements.txt
pip3 install onnx onnxruntime-gpu

# Export the model from PyTorch to ONNX
echo "Exporting model to ONNX format..."
python3 -c "
import torch
import sys
sys.path.append('/tmp/efficientvit')
from efficientvit.models.efficientvit import EfficientViTSeg
model = EfficientViTSeg.get_model('l1')
model.eval()
dummy_input = torch.randn(1, 3, 1024, 1024)
torch.onnx.export(
    model, 
    dummy_input, 
    '$MODEL_DIR/efficientViT-L1.onnx', 
    opset_version=13,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)
print('ONNX model exported to $MODEL_DIR/efficientViT-L1.onnx')
"

# Check if TensorRT is available
if command -v trtexec &> /dev/null; then
    echo "Converting ONNX model to TensorRT engine..."
    trtexec --onnx=$MODEL_DIR/efficientViT-L1.onnx \
        --saveEngine=$MODEL_DIR/efficientViT-L1.engine \
        --fp16 \
        --workspace=1024 \
        --verbose
else
    echo "TensorRT not found, skipping engine conversion."
    echo "Please convert the ONNX model to TensorRT engine manually."
fi

# Create Python script to run EfficientViT
echo "Creating EfficientViT runner script..."
cat > $SCRIPT_DIR/run_efficientvit.py << 'EOF'
#!/usr/bin/env python3
import argparse
import time
import cv2
import numpy as np
import torch
import onnxruntime as ort
from PIL import Image

def parse_args():
    parser = argparse.ArgumentParser(description='EfficientViT Segmentation Script')
    parser.add_argument('--model', type=str, required=True, help='Path to TensorRT engine or ONNX model')
    parser.add_argument('--variant', type=str, default='L1', help='Model variant (L0, L1, L2)')
    parser.add_argument('--input', type=str, required=True, help='Input image path')
    parser.add_argument('--output', type=str, required=True, help='Output mask path')
    parser.add_argument('--threshold', type=float, default=0.75, help='Confidence threshold')
    parser.add_argument('--size', type=int, default=1024, help='Input size (width=height)')
    parser.add_argument('--mode', type=str, default='onnx', help='Runtime mode: onnx or tensorrt')
    parser.add_argument('--visualize', action='store_true', help='Save visualization of the mask')
    parser.add_argument('--jetson_optimize', action='store_true', help='Use Jetson optimizations')
    return parser.parse_args()

def preprocess_image(image_path, size):
    # Load image
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize image
    img = cv2.resize(img, (size, size))
    
    # Normalize image
    img = img.astype(np.float32) / 255.0
    img = (img - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    
    # Convert to NCHW format
    img = img.transpose(2, 0, 1)
    img = np.expand_dims(img, axis=0)
    
    return img

def run_inference_onnx(model_path, input_data, jetson_optimize=False):
    print(f"Running ONNX inference with model: {model_path}")
    
    # Set provider based on availability and optimization settings
    providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
    if jetson_optimize:
        providers = ['TensorrtExecutionProvider'] + providers
    
    # Create ONNX session
    sess_options = ort.SessionOptions()
    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    session = ort.InferenceSession(model_path, sess_options, providers=providers)
    
    # Run inference
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    result = session.run([output_name], {input_name: input_data.astype(np.float32)})[0]
    
    return result

def process_output(output, threshold=0.75):
    # Process the model output to create a binary mask
    mask = output[0, 0]  # Take first batch, first channel
    mask = (mask > threshold).astype(np.uint8) * 255
    return mask

def save_mask(mask, output_path, visualize=False):
    # Save binary mask
    cv2.imwrite(output_path, mask)
    
    if visualize:
        # Create visualization (original mask in grayscale)
        vis_path = output_path.replace('.png', '_vis.png')
        cv2.imwrite(vis_path, mask)
        print(f"Visualization saved to {vis_path}")
    
    print(f"Mask saved to {output_path}")

def main():
    args = parse_args()
    
    start_time = time.time()
    
    # Preprocess image
    print(f"Preprocessing image: {args.input}")
    input_data = preprocess_image(args.input, args.size)
    
    # Run inference
    if args.mode == 'onnx':
        output = run_inference_onnx(args.model, input_data, args.jetson_optimize)
    else:
        raise ValueError(f"Unsupported inference mode: {args.mode}")
    
    # Process output
    mask = process_output(output, args.threshold)
    
    # Save mask
    save_mask(mask, args.output, args.visualize)
    
    elapsed_time = (time.time() - start_time) * 1000
    print(f"Total processing time: {elapsed_time:.2f}ms")

if __name__ == "__main__":
    main()
EOF

# Make script executable
chmod +x $SCRIPT_DIR/run_efficientvit.py

echo "Installation complete!"
echo "EfficientViT model is ready for use."
echo "Model path: $MODEL_DIR/efficientViT-$MODEL_VARIANT.engine"
echo "Script path: $SCRIPT_DIR/run_efficientvit.py"

# Check if the installation was successful
if [ -f "$MODEL_DIR/efficientViT-$MODEL_VARIANT.onnx" ]; then
    echo "✅ ONNX model successfully installed."
    if [ -f "$MODEL_DIR/efficientViT-$MODEL_VARIANT.engine" ]; then
        echo "✅ TensorRT engine successfully created."
    else
        echo "⚠️ TensorRT engine not created. Please convert manually."
    fi
    echo "✅ EfficientViT installation successful!"
    exit 0
else
    echo "❌ Error: ONNX model not created."
    echo "❌ EfficientViT installation failed!"
    exit 1
fi
