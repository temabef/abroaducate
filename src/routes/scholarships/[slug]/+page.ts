import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
  const { slug } = params;
  
  // Handle old WordPress scholarship URL patterns
  const oldSlugPatterns = [
    'scholarship-',
    'funding-',
    'grant-',
    'fellowship-'
  ];
  
  // Check if this is an old URL pattern that needs redirecting
  for (const pattern of oldSlugPatterns) {
    if (slug.startsWith(pattern)) {
      // Extract the actual slug and redirect
      const newSlug = slug.replace(pattern, '');
      throw redirect(301, `/scholarships/${newSlug}`);
    }
  }
  
  // Continue with normal scholarship loading
  try {
    const response = await fetch(`/api/scholarships/${slug}`);
    if (!response.ok) {
      throw new Error('Scholarship not found');
    }
    
    const scholarship = await response.json();
    return { scholarship };
  } catch (error) {
    throw redirect(404, '/scholarships');
  }
}; 