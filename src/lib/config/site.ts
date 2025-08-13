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
  // Always prefer the current origin in the browser (works for dev, staging, prod)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Server-side fallback: use environment or default
  return process.env.PUBLIC_SITE_URL || 'https://abroaducate.com';
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