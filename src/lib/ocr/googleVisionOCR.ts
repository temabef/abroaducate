import vision from "@google-cloud/vision";
import { resolve } from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function googleVisionOCR(file: File): Promise<string> {
  const client = new vision.ImageAnnotatorClient({
    keyFilename: resolve(__dirname, '../../../google-vision-credentials.json')
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