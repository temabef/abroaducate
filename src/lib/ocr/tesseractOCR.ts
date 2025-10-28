// $lib/ocr/tesseractOCR.ts
import { createWorker } from 'tesseract.js';

export async function tesseractOCR(file: File): Promise<string> {
  console.log('Starting Tesseract OCR...');
  
  const startTime = Date.now();
  
  try {
    // Create worker with optimized settings
    const worker = await createWorker('eng', 1, {
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    console.log('Worker created in', Date.now() - startTime, 'ms');
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Buffer created, size:', buffer.length);
    
    // Recognize with optimizations
    const result = await worker.recognize(buffer, {
      rotateAuto: true,
    });
    
    console.log('Recognition complete in', Date.now() - startTime, 'ms');
    console.log('Text length:', result.data.text.length);
    
    await worker.terminate();
    
    if (!result.data.text || result.data.text.trim().length < 10) {
      throw new Error('Insufficient text extracted');
    }
    
    return result.data.text;
    
  } catch (error: any) {
    console.error('Tesseract error after', Date.now() - startTime, 'ms:', error);
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}