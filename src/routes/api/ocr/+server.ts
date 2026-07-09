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
    
    // Try Tesseract first (better at extracting course codes and structured data)
    // with a timeout to prevent hanging
    // try {
    //   console.log('got to the +server.ts tesseract (primary)');
      
    //   const timeoutMs = 60000; // 60 second timeout
    //   const tesseractPromise = tesseractOCR(file);
    //   const timeoutPromise = new Promise((_, reject) => 
    //     setTimeout(() => reject(new Error('Tesseract timeout')), timeoutMs)
    //   );
      
    //   const text = await Promise.race([tesseractPromise, timeoutPromise]) as string;
     
    //   if (text && text.trim().length >= 50) {
    //     return json({ text, provider: 'tesseract' });
    //   }
      
    //   console.warn('Tesseract returned insufficient text, falling back to Google Vision');
    // } catch (error: any) {
    //   console.warn('Tesseract failed, falling back to Google Vision:', error.message);
    // }
    
    // Fallback to Google Vision if Tesseract fails or times out
    try {
      console.log('got to the +server.ts google vision (fallback)');
      console.log('Environment check:', {
        hasGoogleCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd()
      });
     
      const text = await googleVisionOCR(file);
      if (text && text.trim().length >= 50) {
        return json({ text, provider: 'google-vision' });
      }
     
      // If Google Vision also didn't get enough text
      return json({
        error: 'Insufficient text extracted. Please try a clearer image.'
      }, { status: 422 });
     
    } catch (error: any) {
      console.error('Google Vision also failed:', {
        message: error.message,
        stack: error.stack
      });
     
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