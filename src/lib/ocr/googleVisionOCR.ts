import vision from "@google-cloud/vision";
import { GOOGLE_APPLICATION_CREDENTIALS } from '$env/static/private';

if (!GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS in .env");
}

export async function googleVisionOCR(file: File): Promise<string> {
  const client = new vision.ImageAnnotatorClient({
    keyFilename: GOOGLE_APPLICATION_CREDENTIALS
  });
  
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