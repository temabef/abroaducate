export const siteConfig = {
  name: 'AbroadUcate',
  description: 'Your AI-powered study abroad companion',
  url: 'https://abroaducate.com',
  ogImage: 'https://abroaducate.com/og.jpg',
  links: {
    twitter: 'https://twitter.com/abroaducate',
    github: 'https://github.com/abroaducate'
  }
};

// Get base URL for authentication and email links
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    
    console.log('🔍 getBaseUrl debug:', { origin, hostname });
    
    // Explicit production check
    if (hostname === 'abroaducate.com' || hostname === 'www.abroaducate.com') {
      console.log('✅ Production domain detected, using production URL');
      return 'https://abroaducate.com';
    }
    
    // Explicit localhost check
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🏠 Localhost detected, using localhost URL');
      return origin;
    }
    
    // Default to origin but warn about unexpected hostnames
    console.warn('⚠️ Unexpected hostname:', hostname, 'using origin:', origin);
    return origin;
  }
  
  // Server-side fallback
  const envUrl = process.env.PUBLIC_SITE_URL;
  const fallbackUrl = envUrl || 'https://abroaducate.com';
  console.log('🖥️ Server-side getBaseUrl:', fallbackUrl);
  return fallbackUrl;
}

// Get base URL for development vs production
export function getDevelopmentBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://abroaducate.com');
}

// Get email base URL (use current environment for email links)
export function getEmailBaseUrl(): string {
  return getBaseUrl();
}