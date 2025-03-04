
/**
 * Parse gphoto2 --auto-detect output to get connected cameras
 */
export const parseGphoto2Output = (output: string): { model: string, port: string }[] => {
  console.log("Parsing gphoto2 output:", output);
  const cameras: { model: string, port: string }[] = [];
  
  if (!output || typeof output !== 'string') {
    console.log("No output provided or invalid output type");
    return [];
  }
  
  const lines = output.split('\n');
  
  // More flexible header detection - look for lines containing both "Model" and "Port"
  const headerIndex = lines.findIndex(line => 
    line.includes('Model') && line.includes('Port')
  );
  
  console.log(`Header index: ${headerIndex}`);
  
  if (headerIndex === -1 || headerIndex >= lines.length - 1) {
    console.log("No cameras found in gphoto2 output");
    return cameras;
  }
  
  // Look for separator line that often comes after the header
  const separatorIndex = lines.findIndex((line, i) => 
    i > headerIndex && line.includes('----')
  );
  
  // Determine where to start parsing camera entries
  const startParsingIndex = separatorIndex !== -1 ? separatorIndex + 1 : headerIndex + 1;
  
  // Parse each line that might contain camera information
  for (let i = startParsingIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    console.log(`Processing line: ${line}`);
    
    // Try more flexible parsing patterns
    // First pattern: Camera model followed by usb port in format "Model usb:XXX,YYY"
    const matchStandard = line.match(/^(.+?)\s+usb:(.+?)$/);
    if (matchStandard) {
      const model = matchStandard[1].trim();
      const port = `usb:${matchStandard[2].trim()}`;
      console.log(`Found camera: ${model} at ${port}`);
      cameras.push({ model, port });
      continue;
    }
    
    // Alternative pattern for different gphoto2 versions
    const matchAlternative = line.match(/^(.+?)\s+usb:/);
    if (matchAlternative) {
      const parts = line.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.startsWith('usb:')) {
        const model = parts.slice(0, -1).join(' ').trim();
        const port = lastPart.trim();
        console.log(`Found camera (alt pattern): ${model} at ${port}`);
        cameras.push({ model, port });
        continue;
      }
    }
    
    console.log(`Line doesn't match expected format: ${line}`);
  }
  
  console.log(`Total cameras found: ${cameras.length}`);
  return cameras;
};
