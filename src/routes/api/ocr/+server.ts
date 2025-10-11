// src/routes/api/ocr/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { googleVisionOCR } from '$lib/ocr/googleVisionOCR';
import { tesseractOCR } from '$lib/ocr/tesseractOCR';

export async function POST({ request }: RequestEvent) {
  console.log('got to the +server.ts');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file in request');
      return json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('File received:', file.name, file.type, file.size);

    //Google Vision
    // try {
    //   console.log('got to the +server.ts google vision');
    //   const text = await googleVisionOCR(file);
    //   if (text && text.trim().length > 50) {
    //     return json({ text, provider: 'google-vision' });
    //   }
    // } catch (error) {
    //   console.warn('Google Vision failed, falling back to Tesseract:', error);
    // }

    // Use Tesseract directly
    try {
      console.log('got to the +server.ts tesseract');
      const text = await tesseractOCR(file);
      
      if (!text || text.trim().length < 50) {
        return json({ 
          error: 'Insufficient text extracted. Please try a clearer image.' 
        }, { status: 422 });
      }
      
      return json({ text, provider: 'tesseract' });
      
    } catch (error: any) {
      console.error('Tesseract failed:', error);
      return json({ 
        error: `OCR processing failed: ${error.message}` 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('OCR endpoint error:', error);
    return json({ 
      error: `Internal server error: ${error.message}` 
    }, { status: 500 });
  }
}