import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ request }: RequestEvent) {
  console.log('OCR Test endpoint called');
  
  const environmentInfo = {
    nodeEnv: process.env.NODE_ENV,
    hasGoogleCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Not set',
    platform: process.platform,
    cwd: process.cwd(),
    filesInCwd: []
  };
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Check if credentials file exists in different locations
    const possiblePaths = [
      'google-vision-credentials.json',
      './google-vision-credentials.json',
      path.resolve('google-vision-credentials.json'),
      path.join(process.cwd(), 'google-vision-credentials.json')
    ];
    
    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          environmentInfo.filesInCwd.push(`✅ Found: ${filePath}`);
        } else {
          environmentInfo.filesInCwd.push(`❌ Missing: ${filePath}`);
        }
      } catch (error) {
        environmentInfo.filesInCwd.push(`❌ Error checking ${filePath}: ${error}`);
      }
    }
    
    // List files in current directory
    try {
      const files = fs.readdirSync(process.cwd());
      environmentInfo.filesInCwd.push(`📁 Files in ${process.cwd()}: ${files.slice(0, 10).join(', ')}...`);
    } catch (error) {
      environmentInfo.filesInCwd.push(`❌ Error reading directory: ${error}`);
    }
    
  } catch (error) {
    environmentInfo.filesInCwd.push(`❌ File system error: ${error}`);
  }
  
  return json(environmentInfo);
}
