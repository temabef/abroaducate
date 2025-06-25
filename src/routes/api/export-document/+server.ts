import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DocxExporter, type DocxExportRequest } from '$lib/services/DocxExporter';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { documentId, documentType } = await request.json();

    if (!documentId || !documentType) {
      return json({ error: 'Document ID and type are required' }, { status: 400 });
    }

    // Fetch document data based on type
    let document, content, title, metadata;

    switch (documentType) {
      case 'sop':
        const { data: sopData, error: sopError } = await supabase
          .from('sops')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', session.user.id)
          .single();
        
        if (sopError || !sopData) {
          return json({ error: 'SOP not found' }, { status: 404 });
        }
        
        document = sopData;
        content = sopData.content;
        title = `${sopData.university_name} - ${sopData.program_name}`;
        metadata = {
          university: sopData.university_name,
          program: sopData.program_name,
          degreeLevel: sopData.degree_level
        };
        break;

      case 'cover_letter':
        const { data: clData, error: clError } = await supabase
          .from('cover_letters')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', session.user.id)
          .single();
        
        if (clError || !clData) {
          return json({ error: 'Cover letter not found' }, { status: 404 });
        }
        
        document = clData;
        content = clData.generated_content;
        title = `${clData.job_title} - ${clData.company_name}`;
        metadata = {
          company: clData.company_name,
          position: clData.job_title,
          positionType: clData.position_type
        };
        break;

      case 'personal_statement':
        const { data: psData, error: psError } = await supabase
          .from('personal_statements')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', session.user.id)
          .single();
        
        if (psError || !psData) {
          return json({ error: 'Personal statement not found' }, { status: 404 });
        }
        
        document = psData;
        content = psData.generated_content || psData.content;
        title = `${psData.program_name} Personal Statement`;
        metadata = {
          institution: psData.institution_name,
          program: psData.program_name,
          applicationType: psData.application_type
        };
        break;

      default:
        return json({ error: 'Invalid document type' }, { status: 400 });
    }

    if (!content) {
      return json({ error: 'Document content not found' }, { status: 404 });
    }

    // Create DocX export request
    const docxRequest: DocxExportRequest = {
      content,
      title,
      type: documentType as 'sop' | 'cover_letter' | 'personal_statement',
      metadata: {
        ...metadata,
        author: session.user.email || undefined,
        date: new Date().toLocaleDateString()
      }
    };

    // Generate DOCX using the DocxExporter service
    const docxExporter = new DocxExporter();
    const docxBuffer = await docxExporter.generateDocx(docxRequest);
    
    // Generate appropriate filename
    const filename = DocxExporter.getFilename(title, documentType);
    
    // Log the export activity
    try {
      const analyticsTable = documentType === 'personal_statement' ? 'personal_statement_analytics' : 
                           documentType === 'cover_letter' ? 'cover_letter_analytics' : 
                           'sop_analytics';
      
      await supabase
        .from(analyticsTable)
        .insert({
          user_id: session.user.id,
          [`${documentType}_id`]: documentId,
          action_type: 'exported_docx_from_dashboard',
          session_data: { 
            title: title,
            format: 'docx',
            exported_at: new Date().toISOString(),
            file_size: docxBuffer.length
          }
        });
    } catch (analyticsError) {
      console.warn('Analytics logging failed:', analyticsError);
    }

    // Return DOCX file
    return new Response(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error exporting document:', error);
    return json({ 
      error: 'Document export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}; 