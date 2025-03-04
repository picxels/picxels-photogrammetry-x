
import { Workflow } from "@/types";

export const advancedWorkflowTemplate = (sessionName: string, subject: string, tags: string[] = []): Workflow => {
  const sanitizedName = sessionName.replace(/[^a-zA-Z0-9]/g, '_');
  const projectFolder = `./projects/${sanitizedName}`;
  
  return {
    workflow_name: `Complete ${subject} Photogrammetry Pipeline`,
    metadata: {
      description: `Full photogrammetry pipeline for ${subject}`,
      tags: tags,
      requiredMarkers: true,
      requiresMasks: true,
      requiresTextures: true,
      version: "1.0"
    },
    stages: [
      {
        name: "Initialize",
        commands: [
          { command: "headless" },
          { command: "newScene" },
          { command: "createFolder", params: [projectFolder] },
          { command: "createFolder", params: [`${projectFolder}/Images`] },
          { command: "createFolder", params: [`${projectFolder}/Output`] },
          { command: "createFolder", params: [`${projectFolder}/Output/Renders`] },
          { command: "tag", params: ["session", sessionName] },
          { command: "tag", params: ["subject", subject] }
        ],
        description: "Setting up the project structure and initializing Reality Capture"
      },
      {
        name: "Import Initial Construction Images",
        commands: [
          { 
            command: "addFolder", 
            params: [`${projectFolder}/Images/.geometry`],
            description: "Adding construction images without masks first"
          }
        ]
      },
      {
        name: "First Alignment",
        commands: [
          { command: "align" },
          { command: "selectMaximalComponent" },
          { command: "printProgress", params: ["Initial alignment completed"] }
        ]
      },
      {
        name: "Marker Recognition",
        commands: [
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
        ]
      },
      {
        name: "Lock Initial Cameras",
        commands: [
          { command: "selectAll" },
          { command: "lockSelectedCameras" },
          { command: "printProgress", params: ["Cameras locked"] }
        ]
      },
      {
        name: "Import Masks and Texturing Images",
        commands: [
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
        ]
      },
      {
        name: "Import Additional Passes",
        commands: [
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
        ]
      },
      {
        name: "Complete Alignment",
        commands: [
          { command: "align" },
          { command: "selectMaximalComponent" },
          { 
            command: "save", 
            params: [`${projectFolder}/Project/${sanitizedName}_aligned.rcproj`],
            description: "Saving the aligned project" 
          }
        ]
      },
      {
        name: "Mesh Creation",
        commands: [
          { command: "setReconstructionRegionAuto" },
          { 
            command: "calculateModel", 
            params: ["medium"],
            description: "Creating a medium-detail mesh" 
          },
          { command: "renameSelectedModel", params: [subject] },
          { command: "printProgress", params: ["Medium mesh created"] }
        ]
      },
      {
        name: "Mesh Cleanup",
        commands: [
          { command: "selectIsolatedRegions" },
          { command: "removeSelectedTriangles" },
          { command: "selectNonManifoldTriangles" },
          { command: "removeSelectedTriangles" },
          { command: "selectByColor", params: ["0", "0", "0", "10"] }, // Select very dark triangles (background remnants)
          { command: "removeSelectedTriangles" },
          { command: "printProgress", params: ["Mesh cleaned"] }
        ]
      },
      {
        name: "Texturing",
        commands: [
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
        ]
      },
      {
        name: "Optimization",
        commands: [
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
        ]
      },
      {
        name: "Render Views",
        commands: [
          { 
            command: "renderTurntable", 
            params: ["6", "1920", "1080", `${projectFolder}/Output/Renders/view_`],
            description: "Rendering 6 views around the object" 
          },
          { command: "printProgress", params: ["Renders completed"] }
        ]
      },
      {
        name: "Export",
        commands: [
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
        ]
      },
      {
        name: "Upload to Sketchfab",
        commands: [
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
        ]
      }
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
