import vision from "@google-cloud/vision";
import { resolve } from "path";

export async function googleVisionOCR(file: File): Promise<string> {
  const client = new vision.ImageAnnotatorClient({
    keyFilename: resolve("google-vision-credentials.json")
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