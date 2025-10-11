import vision from "@google-cloud/vision";

export async function googleVisionOCR(file: File): Promise<string> {
  // Try environment variable first (production), then fall back to file (local)
  let clientConfig: any = {};
  
  console.log('🔍 OCR Debug - Environment check:', {
    hasGoogleCreds: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
    hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    nodeEnv: process.env.NODE_ENV
  });
  
  // Try individual environment variables first (most reliable for Vercel)
  if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
    try {
      clientConfig = {
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL
        }
      };
      console.log('✅ Using individual environment variables for credentials');
    } catch (error) {
      console.error('❌ Failed to construct credentials from individual env vars:', error);
    }
  } 
  // Try GOOGLE_APPLICATION_CREDENTIALS as JSON string
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      // Try to parse as JSON first (if it's a JSON string)
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      clientConfig = {
        credentials: credentials
      };
      console.log('✅ Using JSON credentials from GOOGLE_APPLICATION_CREDENTIALS');
    } catch (error) {
      console.error('❌ Failed to parse GOOGLE_APPLICATION_CREDENTIALS as JSON:', error);
      // If parsing fails, treat it as a file path
      try {
        clientConfig = {
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        };
        console.log('✅ Using file path from GOOGLE_APPLICATION_CREDENTIALS');
      } catch (fileError) {
        console.error('❌ Failed to use as file path:', fileError);
      }
    }
  } 
  // Fall back to local credentials file
  else {
    try {
      const { resolve } = await import("path");
      const { fileURLToPath } = await import('url');
      const { dirname } = await import('path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      clientConfig = {
        keyFilename: resolve(__dirname, '../../../google-vision-credentials.json')
      };
      console.log('✅ Using local credentials file');
    } catch (error) {
      console.error('❌ Could not load local credentials file:', error);
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