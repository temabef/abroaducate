import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { eventType, documentType, documentId } = await request.json();
    
    // For now, just log the analytics event
    // In production, you might want to store this in a database
    console.log('Analytics event:', {
      eventType,
      documentType,
      documentId,
      timestamp: new Date().toISOString(),
      userId: locals.session?.user?.id
    });
    
    return json({ 
      success: true,
      message: 'Analytics event recorded'
    });
    
  } catch (error) {
    console.error('Error recording analytics:', error);
    return json({ 
      error: 'Failed to record analytics event'
    }, { status: 500 });
  }
}; 