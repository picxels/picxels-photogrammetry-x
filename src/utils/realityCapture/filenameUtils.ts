
import { CapturedImage, Pass } from '@/types';

/**
 * Generate an RC-compatible filename for an image
 * Following Reality Capture naming conventions
 */
export const generateRCFilename = (
  image: CapturedImage, 
  pass: Pass, 
  passIndex: number, 
  imageIndex: number,
  purpose: 'geometry' | 'texture' | 'mask'
): string => {
  // Extract camera identifier without spaces
  const camera = image.camera.replace(/\s+/g, '');
  
  // Format: Camera_PassX_AngleY_Z
  // Where X is pass number, Y is angle, Z is image index
  const angle = image.angle !== undefined ? Math.round(image.angle) : 0;
  const baseFilename = `${camera}_Pass${passIndex + 1}_Angle${angle}_${imageIndex + 1}`;
  
  switch (purpose) {
    case 'geometry':
      return `${baseFilename}.png`;
    case 'texture':
      return `${baseFilename}.tiff`;
    case 'mask':
      return `${baseFilename}_mask.png`;
    default:
      return `${baseFilename}.jpg`;
  }
};
