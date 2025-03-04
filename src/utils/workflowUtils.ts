
import yaml from 'yaml';
import { v4 as uuidv4 } from 'uuid';
import { Workflow, WorkflowFile, RCCommand } from '@/types/workflow';
import { toast } from '@/components/ui/use-toast';

/**
 * Scan a directory for YAML workflow files
 */
export const scanWorkflowDirectory = async (directoryPath: string = './workflows'): Promise<WorkflowFile[]> => {
  try {
    console.log(`Scanning directory: ${directoryPath} for workflow files`);
    
    // In a browser environment, we'll simulate this with a mock implementation
    // In a real electron or node.js app, you would use fs.readdir
    
    // Mock implementation - in production this would access the file system
    const mockFiles = [
      { id: uuidv4(), name: 'Basic Alignment', path: `${directoryPath}/basic_alignment.yaml` },
      { id: uuidv4(), name: 'Full Photogrammetry', path: `${directoryPath}/full_photogrammetry.yaml` },
      { id: uuidv4(), name: 'Texture Only', path: `${directoryPath}/texture_only.yaml` },
    ];
    
    return mockFiles;
  } catch (error) {
    console.error('Error scanning workflow directory:', error);
    toast({
      title: 'Error Scanning Workflows',
      description: 'Could not scan the workflow directory. Please check if the directory exists.',
      variant: 'destructive'
    });
    return [];
  }
};

/**
 * Load and parse a YAML workflow file
 */
export const loadWorkflowFile = async (filePath: string): Promise<Workflow | null> => {
  try {
    console.log(`Loading workflow file: ${filePath}`);
    
    // In a browser environment, we'll simulate this with mock data
    // In a real electron or node.js app, you would use fs.readFile
    
    // Mock implementation based on file name
    let yamlContent = '';
    
    if (filePath.includes('basic_alignment')) {
      yamlContent = `
workflow_name: "Basic Alignment"
stages:
  - name: "Initialize"
    commands:
      - { command: "headless" }
      - { command: "newScene" }
  - name: "Import Images"
    commands:
      - { command: "addFolder", params: ["${filePath.replace('.yaml', '/images')}"] }
  - name: "Align Images"
    commands:
      - { command: "align" }
      - { command: "selectMaximalComponent" }
      - { command: "save", params: ["./projects/basic_alignment.rcproj"] }
`;
    } else if (filePath.includes('full_photogrammetry')) {
      yamlContent = `
workflow_name: "Full Photogrammetry"
stages:
  - name: "Initialize"
    commands:
      - { command: "headless" }
      - { command: "newScene" }
  - name: "Import Images"
    commands:
      - { command: "addFolder", params: ["${filePath.replace('.yaml', '/images')}"] }
  - name: "Align Images"
    commands:
      - { command: "align" }
      - { command: "selectMaximalComponent" }
  - name: "Create Model"
    commands:
      - { command: "setReconstructionRegionAuto" }
      - { command: "calculateNormalModel" }
  - name: "Create Texture"
    commands:
      - { command: "calculateTexture" }
  - name: "Export Model"
    commands:
      - { command: "exportSelectedModel", params: ["./output/model.obj", "./settings/exportModel.xml"] }
      - { command: "save", params: ["./projects/full_photogrammetry.rcproj"] }
`;
    } else if (filePath.includes('texture_only')) {
      yamlContent = `
workflow_name: "Texture Only"
stages:
  - name: "Initialize"
    commands:
      - { command: "headless" }
      - { command: "load", params: ["./projects/model.rcproj"] }
  - name: "Create Texture"
    commands:
      - { command: "calculateTexture" }
      - { command: "exportSelectedModel", params: ["./output/textured_model.obj", "./settings/exportModel.xml"] }
      - { command: "save", params: ["./projects/textured_model.rcproj"] }
`;
    } else {
      throw new Error(`Unknown workflow file: ${filePath}`);
    }
    
    // Parse YAML content
    return yaml.parse(yamlContent) as Workflow;
    
  } catch (error) {
    console.error('Error loading workflow file:', error);
    toast({
      title: 'Error Loading Workflow',
      description: `Could not load workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: 'destructive'
    });
    return null;
  }
};

/**
 * Convert workflow to RC commands for execution
 */
export const workflowToRCCommands = (workflow: Workflow): { stageName: string, commands: RCCommand[] }[] => {
  return workflow.stages.map(stage => ({
    stageName: stage.name,
    commands: stage.commands
  }));
};

/**
 * Format RC command with parameters for execution
 */
export const formatRCCommand = (command: RCCommand): string => {
  if (!command.params || command.params.length === 0) {
    return `-${command.command}`;
  }
  
  return `-${command.command} ${command.params.join(' ')}`;
};
