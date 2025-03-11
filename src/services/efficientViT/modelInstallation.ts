import { EFFICIENTVIT_CONFIG, JETSON_AI_MODELS } from "@/config/jetsonAI.config";
import { executeCommand } from "@/utils/commandUtils";
import { toast } from "@/components/ui/use-toast";

/**
 * Install EfficientViT model from GitHub
 */
export const installEfficientViT = async (): Promise<boolean> => {
  try {
    console.log("Starting EfficientViT installation...");
    toast({
      title: "Installing EfficientViT",
      description: "Downloading and setting up the segmentation model. This may take a few minutes.",
    });
    
    // Ensure the model directory exists
    const modelDir = JETSON_AI_MODELS.efficientViT.modelPath.split('/').slice(0, -1).join('/');
    await executeCommand(`mkdir -p ${modelDir}`);
    
    // Clone the EfficientViT repository
    const repoDir = `${EFFICIENTVIT_CONFIG.tempDir}/efficientvit-repo`;
    await executeCommand(`mkdir -p ${repoDir}`);
    
    // Check if repo already exists
    const checkRepoCommand = `ls -la ${repoDir}`;
    const checkRepoOutput = await executeCommand(checkRepoCommand);
    
    if (!checkRepoOutput.includes(".git")) {
      // Clone the repository
      await executeCommand(`git clone https://github.com/mit-han-lab/efficientvit.git ${repoDir}`);
    } else {
      // Update the repository
      await executeCommand(`cd ${repoDir} && git pull`);
    }
    
    // Install dependencies
    await executeCommand(`pip3 install -e ${repoDir}`);
    
    // Download the pre-trained model
    const modelUrl = EFFICIENTVIT_CONFIG.modelDownloadUrl;
    const downloadedModel = `${EFFICIENTVIT_CONFIG.tempDir}/efficientvit_sam_l0.pt`;
    
    await executeCommand(`wget -O ${downloadedModel} ${modelUrl}`);
    
    // Convert model to ONNX format if needed
    if (JETSON_AI_MODELS.efficientViT.modelPath.endsWith(".onnx")) {
      // Run the conversion script (assuming it's in the repo)
      await executeCommand(`python3 ${repoDir}/scripts/export_onnx.py --model-path ${downloadedModel} --output-path ${JETSON_AI_MODELS.efficientViT.modelPath}`);
    } else {
      // Otherwise just copy the PyTorch model
      await executeCommand(`cp ${downloadedModel} ${JETSON_AI_MODELS.efficientViT.modelPath}`);
    }
    
    // Verify the model exists
    const checkModelCommand = `ls -la ${JETSON_AI_MODELS.efficientViT.modelPath}`;
    await executeCommand(checkModelCommand);
    
    // Optimize with TensorRT if enabled
    if (EFFICIENTVIT_CONFIG.useTensorRT) {
      console.log("Optimizing model with TensorRT...");
      const trtModelPath = JETSON_AI_MODELS.efficientViT.modelPath.replace(".onnx", ".trt");
      
      await executeCommand(`/usr/src/tensorrt/bin/trtexec --onnx=${JETSON_AI_MODELS.efficientViT.modelPath} --saveEngine=${trtModelPath} --fp16`);
      
      // Update the model path to use the TensorRT version
      await executeCommand(`cp ${trtModelPath} ${JETSON_AI_MODELS.efficientViT.modelPath}.trt`);
    }
    
    console.log("EfficientViT installation completed successfully");
    toast({
      title: "Installation Successful",
      description: "EfficientViT model has been installed and is ready to use",
    });
    
    return true;
  } catch (error) {
    console.error("Error installing EfficientViT:", error);
    toast({
      title: "Installation Failed",
      description: "Failed to install EfficientViT model",
      variant: "destructive"
    });
    return false;
  }
};
