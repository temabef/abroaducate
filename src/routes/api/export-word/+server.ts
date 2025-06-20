import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DocxExporter, type DocxExportRequest } from '$lib/services/DocxExporter';

interface WordExportRequest {
  content: string;
  title: string;
  type: 'personal_statement' | 'cover_letter' | 'sop' | 'cv';
  metadata?: {
    author?: string;
    date?: string;
    institution?: string;
    program?: string;
    company?: string;
  };
}

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exportData: WordExportRequest = await request.json();
    const { content, title, type, metadata } = exportData;

    if (!content || !title) {
      return json({ error: 'Content and title are required' }, { status: 400 });
    }

    // Create DocX export request
    const docxRequest: DocxExportRequest = {
      content,
      title,
      type,
      metadata: {
        ...metadata,
        author: session.user.email || undefined,
        date: new Date().toLocaleDateString()
      }
    };

    // Generate true DOCX using the DocxExporter service
    const docxExporter = new DocxExporter();
    const docxBuffer = await docxExporter.generateDocx(docxRequest);
    
    // Generate appropriate filename
    const filename = DocxExporter.getFilename(title, type);
    
    // Log the export activity
    try {
      const analyticsTable = type === 'personal_statement' ? 'personal_statement_analytics' : 
                           type === 'cover_letter' ? 'cover_letter_analytics' : 
                           type === 'cv' ? 'cv_analytics' : 
                           'sop_analytics';
      
      await supabase
        .from(analyticsTable)
        .insert({
          user_id: session.user.id,
          action_type: 'exported_docx',
          session_data: { 
            title: title,
            format: 'docx',
            exported_at: new Date().toISOString(),
            file_size: docxBuffer.length
          }
        });
    } catch (analyticsError) {
      console.warn('Analytics logging failed:', analyticsError);
      // Don't fail the export for analytics issues
    }

    // Return true DOCX file
    return new Response(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error exporting DOCX document:', error);
    return json({ 
      error: 'DOCX export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 