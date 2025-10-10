import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";
import { fileToBuffer } from "./fileUtils";

export async function azureOCR(file: File): Promise<string> {
  const buffer = await fileToBuffer(file);
  const key = process.env.AZURE_VISION_KEY!;
  const endpoint = process.env.AZURE_VISION_ENDPOINT!;

  const client = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
    endpoint
  );

  // Send image to Azure OCR
  const result = await client.readInStream(buffer);
  const operationId = result.operationLocation!.split("/").slice(-1)[0];

  // Poll for results
  let readResult;
  do {
    readResult = await client.getReadResult(operationId);
  } while (readResult.status === "running" || readResult.status === "notStarted");

  if (readResult.status === "succeeded") {
    const text = readResult.analyzeResult?.readResults
      ?.flatMap((r: any) => r.lines.map((l: any) => l.text))
      .join("\n");
    return text || "";
  }

  throw new Error("Azure OCR failed to extract text");
}
