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
  // For development, use localhost:5173 (Vite default)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5173';
    }
  }
  return 'https://abroaducate.com';
}

// Get base URL for development vs production
export function getDevelopmentBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : 'https://abroaducate.com';
}

// Get email base URL (use current environment for email links)
export function getEmailBaseUrl(): string {
  return getBaseUrl(); // Use the same logic as getBaseUrl()
} 