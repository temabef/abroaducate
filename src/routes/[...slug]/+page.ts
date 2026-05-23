import { redirect, error } from '@sveltejs/kit';

export async function load({ url }) {
  const path = url.pathname;

  // Handle old WordPress scholarship URLs
  if (path.startsWith('/scholarship/')) {
    const slug = path.replace('/scholarship/', '');
    throw redirect(307, `/scholarships/${slug}`);
  }

  // Handle old blog URLs
  if (path.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)$/)) {
    const slug = path.split('/').pop();
    throw redirect(307, `/blog/${slug}`);
  }

  // Handle old page URLs - only include routes that actually exist
  const pageRedirects: Record<string, string> = {
    '/about-us': '/',
    '/contact-us': '/contact',
    '/privacy-policy': '/privacy',
    '/terms-of-service': '/terms',
    '/statement-of-purpose': '/sop',
    '/cover-letter': '/cover-letters',
    '/personal-statement': '/personal-statements',
    '/academic-cv': '/academic-cv',
    '/ielts-practice': '/practice/ielts',
    '/visa-practice': '/visa-interview-practice',
    '/tools/gpa-converter': '/gpa-converter',
    '/tools/word-optimization': '/word-optimization'
  };
  
  if (pageRedirects[path]) {
    throw redirect(307, pageRedirects[path]);
  }

  // If no match, throw 404
  throw error(404, 'Page not found');
} 
