
import { Workflow, WorkflowStage, RCCommand } from "@/types";
import { v4 as uuidv4 } from 'uuid';

export const advancedWorkflowTemplate = (sessionName: string, subject: string, tags: string[] = []): Workflow => {
  const sanitizedName = sessionName.replace(/[^a-zA-Z0-9]/g, '_');
  const projectFolder = `./projects/${sanitizedName}`;
  const timestamp = Date.now();
  
  // Helper to create a stage with an ID
  const createStage = (name: string, commands: RCCommand[]): WorkflowStage => ({
    id: uuidv4(),
    name,
    commands,
    description: `Stage: ${name}`
  });
  
  return {
    id: uuidv4(),
    name: `${subject} Workflow`,
    workflow_name: `Complete ${subject} Photogrammetry Pipeline`,
    description: `Full photogrammetry pipeline for ${subject}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    stages: [
      createStage("Initialize", [
        { command: "headless" },
        { command: "newScene" },
        { command: "createFolder", params: [projectFolder] },
        { command: "createFolder", params: [`${projectFolder}/Images`] },
        { command: "createFolder", params: [`${projectFolder}/Output`] },
        { command: "createFolder", params: [`${projectFolder}/Output/Renders`] },
        { command: "tag", params: ["session", sessionName] },
        { command: "tag", params: ["subject", subject] }
      ]),
      
      createStage("Import Initial Construction Images", [
        { 
          command: "addFolder", 
          params: [`${projectFolder}/Images/.geometry`],
          description: "Adding construction images without masks first"
        }
      ]),
      
      createStage("First Alignment", [
        { command: "align" },
        { command: "selectMaximalComponent" },
        { command: "printProgress", params: ["Initial alignment completed"] }
      ]),
      
      createStage("Marker Recognition", [
        { 
          command: "detectMarkers", 
          params: ["auto"],
          description: "Auto-detecting markers in the scene" 
        },
        { 
          command: "loadMarkersData", 
          params: [`${projectFolder}/markers.csv`],
          description: "Loading marker coordinate data from CSV file" 
        },
        { 
          command: "applyMarkerDistances",
          description: "Applying real-world distances between markers" 
        },
        { 
          command: "setGroundPointFromMarker", 
          params: ["1"],
          description: "Setting ground point from marker #1" 
        }
      ]),
      
      createStage("Lock Initial Cameras", [
        { command: "selectAll" },
        { command: "lockSelectedCameras" },
        { command: "printProgress", params: ["Cameras locked"] }
      ]),
      
      createStage("Import Masks and Texturing Images", [
        { 
          command: "addFolder", 
          params: [`${projectFolder}/Images/.mask`],
          description: "Adding masks for the initial images" 
        },
        { 
          command: "addFolder", 
          params: [`${projectFolder}/Images/.texture.TextureLayer`],
          description: "Adding high-quality texture images" 
        }
      ]),
      
      createStage("Import Additional Passes", [
        { 
          command: "addFolder", 
          params: [`${projectFolder}/Images/Additional`],
          description: "Adding remaining images from all cameras and passes" 
        },
        { 
          command: "addFolder", 
          params: [`${projectFolder}/Images/Additional/.mask`], 
          description: "Adding masks for additional images"
        },
        { 
          command: "addFolder", 
          params: [`${projectFolder}/Images/Additional/.texture.TextureLayer`],
          description: "Adding texturing images for additional passes" 
        }
      ]),
      
      createStage("Complete Alignment", [
        { command: "align" },
        { command: "selectMaximalComponent" },
        { 
          command: "save", 
          params: [`${projectFolder}/Project/${sanitizedName}_aligned.rcproj`],
          description: "Saving the aligned project" 
        }
      ]),
      
      createStage("Mesh Creation", [
        { command: "setReconstructionRegionAuto" },
        { 
          command: "calculateModel", 
          params: ["medium"],
          description: "Creating a medium-detail mesh" 
        },
        { command: "renameSelectedModel", params: [subject] },
        { command: "printProgress", params: ["Medium mesh created"] }
      ]),
      
      createStage("Mesh Cleanup", [
        { command: "selectIsolatedRegions" },
        { command: "removeSelectedTriangles" },
        { command: "selectNonManifoldTriangles" },
        { command: "removeSelectedTriangles" },
        { command: "selectByColor", params: ["0", "0", "0", "10"] }, // Select very dark triangles (background remnants)
        { command: "removeSelectedTriangles" },
        { command: "printProgress", params: ["Mesh cleaned"] }
      ]),
      
      createStage("Texturing", [
        { 
          command: "calculateTexture", 
          params: ["4096"],
          description: "Creating a 4K texture from 16-bit images" 
        },
        { 
          command: "save", 
          params: [`${projectFolder}/Project/${sanitizedName}_textured.rcproj`],
          description: "Saving the textured project" 
        },
        { command: "printProgress", params: ["Texturing completed"] }
      ]),
      
      createStage("Optimization", [
        { 
          command: "simplify", 
          params: ["5000"],
          description: "Simplifying to 5K triangles" 
        },
        { command: "renameSelectedModel", params: [`${subject}_Simplified`] },
        { 
          command: "unwrap",
          description: "Unwrapping the simplified model" 
        },
        { 
          command: "reprojectTexture", 
          params: [subject, `${subject}_Simplified`, "4096", "normalmap"],
          description: "Reprojecting texture with normal map at 4K" 
        },
        { command: "printProgress", params: ["Optimization completed"] }
      ]),
      
      createStage("Render Views", [
        { 
          command: "renderTurntable", 
          params: ["6", "1920", "1080", `${projectFolder}/Output/Renders/view_`],
          description: "Rendering 6 views around the object" 
        },
        { command: "printProgress", params: ["Renders completed"] }
      ]),
      
      createStage("Export", [
        { 
          command: "exportModel", 
          params: [`${subject}_Simplified`, `${projectFolder}/Output/${sanitizedName}.glb`, "glb"],
          description: "Exporting as GLB with embedded textures" 
        },
        { 
          command: "exportMetadata", 
          params: [`${projectFolder}/Output/${sanitizedName}_metadata.json`],
          description: "Exporting metadata with session tags and subject info" 
        },
        { command: "printProgress", params: ["Export completed"] }
      ]),
      
      createStage("Upload to Sketchfab", [
        { 
          command: "sketchfabUpload", 
          params: [
            `${projectFolder}/Output/${sanitizedName}.glb`, 
            `${subject} 3D Scan`, 
            `3D scan of ${subject} created with Reality Capture`,
            "photogrammetry,3d-scan," + tags.join(","),
            "", // Store link (empty by default)
            "social=instagram:false,twitter:false,facebook:false,reddit:false,tiktok:false" // Social sharing defaults
          ],
          description: "Uploading to Sketchfab with metadata and social sharing options" 
        },
        { command: "printProgress", params: ["Upload completed"] }
      ])
    ]
  };
};

export const getWorkflowTemplateFromSession = (
  session: { name: string; subjectMatter?: string; images: any[] }, 
  tags: string[] = []
): Workflow => {
  // If there's no subject matter, use a generic name
  const subject = session.subjectMatter || "Object";
  
  // Generate workflow from template
  return advancedWorkflowTemplate(
    session.name, 
    subject,
    tags
  );
};
