import vision from "@google-cloud/vision";

export async function googleVisionOCR(file: File): Promise<string> {
  // Try environment variable first (production), then fall back to file (local)
  let clientConfig: any = {};
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Production: use environment variable
    clientConfig = {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    };
  } else {
    // Local development: use credentials file
    try {
      const { resolve } = await import("path");
      const { fileURLToPath } = await import('url');
      const { dirname } = await import('path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      clientConfig = {
        keyFilename: resolve(__dirname, '../../../google-vision-credentials.json')
      };
    } catch (error) {
      console.warn('Could not load local credentials file:', error);
      // If file loading fails, try without credentials (will use default auth)
    }
  }
  
  const client = new vision.ImageAnnotatorClient(clientConfig);
  
   console.log("got to the googleVision.ts")
  const buffer = Buffer.from(await file.arrayBuffer());
  const [result] = await client.textDetection({
    image: { content: buffer.toString("base64") }
  });
  
  const detections = result.textAnnotations;
  
  if (!detections || detections.length === 0) {
    throw new Error("No text detected by Google Vision");
  }
  
  return detections[0].description || "";
}