import Tesseract from 'tesseract.js';

export async function tesseractOCR(file: File): Promise<string> {
  console.log('got to the tesseract.ts');
  
  try {
    // Convert File to Buffer properly
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Buffer created, length:', buffer.length);
    
    const worker = await Tesseract.createWorker('eng');
    
    console.log('Tesseract worker created');
    
    // Use the buffer directly
    const result = await worker.recognize(buffer);
    
    console.log('Recognition complete, text length:', result.data.text.length);
    
    await worker.terminate();
    
    if (!result.data.text || result.data.text.trim().length < 10) {
      throw new Error('Insufficient text extracted');
    }
    
    return result.data.text;
    
  } catch (error: any) {
    console.error('Tesseract error:', error);
    throw new Error(`Tesseract OCR failed: ${error.message}`);
  }
}