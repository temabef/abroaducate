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
    try {
      console.log('got to the +server.ts google vision');
      console.log('Environment check:', {
        hasGoogleCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd()
      });
      
      const text = await googleVisionOCR(file);
      if (text && text.trim().length > 50) {
        return json({ text, provider: 'google-vision' });
      }
    } catch (error: any) {
      console.error('Google Vision failed with detailed error:', {
        message: error.message,
        stack: error.stack,
        hasGoogleCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        nodeEnv: process.env.NODE_ENV
      });
      console.warn('Google Vision failed, falling back to Tesseract:', error);
    }

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