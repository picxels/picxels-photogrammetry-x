
/**
 * Parse gphoto2 --auto-detect output to get connected cameras
 */
export const parseGphoto2Output = (output: string): { model: string, port: string }[] => {
  console.log("Parsing gphoto2 output:", output);
  const cameras: { model: string, port: string }[] = [];
  const lines = output.split('\n');
  
  const headerIndex = lines.findIndex(line => 
    line.includes('Model') && line.includes('Port')
  );
  
  console.log(`Header index: ${headerIndex}`);
  
  if (headerIndex === -1 || headerIndex >= lines.length - 1) {
    console.log("No cameras found in gphoto2 output");
    return cameras;
  }
  
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    console.log(`Processing line: ${line}`);
    
    const match = line.match(/^(.+?)\s+usb:(.+?)$/);
    if (match) {
      const model = match[1].trim();
      const port = `usb:${match[2].trim()}`;
      console.log(`Found camera: ${model} at ${port}`);
      cameras.push({ model, port });
    } else {
      console.log(`Line doesn't match expected format: ${line}`);
    }
  }
  
  console.log(`Total cameras found: ${cameras.length}`);
  return cameras;
};
