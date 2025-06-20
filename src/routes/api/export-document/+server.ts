import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DocxExporter, type DocxExportRequest } from '$lib/services/DocxExporter';

interface ExportRequest {
  documentId: string;
  documentType: 'cover_letter' | 'personal_statement' | 'sop' | 'cv';
  format: 'pdf' | 'docx' | 'txt';
  content: string;
  title: string;
}

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exportData: ExportRequest = await request.json();
    const { documentId, documentType, format, content, title } = exportData;

    // For now, we'll implement text export and placeholder for PDF/DOCX
    // In production, you'd integrate with libraries like jsPDF, docx, etc.
    
    if (format === 'txt') {
      // Simple text export
      const textContent = content;
      const blob = new Blob([textContent], { type: 'text/plain' });
      
      // Log the export activity
      await supabase
        .from(`${documentType}_analytics`)
        .insert({
          user_id: session.user.id,
          [`${documentType}_id`]: documentId,
          action_type: 'downloaded',
          session_data: { format: 'txt' },
          created_at: new Date().toISOString()
        });

      return new Response(blob, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt"`
        }
      });
    }
    
    if (format === 'pdf') {
      // PDF export using HTML to PDF conversion
      // This is a simplified version - in production you'd use proper PDF libraries
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 1in;
              font-size: 12pt;
            }
            h1 {
              font-size: 16pt;
              margin-bottom: 20px;
              text-align: center;
            }
            p {
              margin-bottom: 12px;
              text-align: justify;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 20px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
          </div>
          
          <div class="content">
            ${content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
          </div>
          
          <div class="footer">
            <p>Document prepared on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `;
      
      // In production, you would use a proper HTML to PDF service
      // For now, return HTML that can be printed to PDF
      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html"`
        }
      });
    }
    
    if (format === 'docx') {
      // Create DocX export request
      const docxRequest: DocxExportRequest = {
        content,
        title,
        type: documentType,
        metadata: {
          author: session.user.email || undefined,
          date: new Date().toLocaleDateString()
        }
      };

      // Generate true DOCX using the DocxExporter service
      const docxExporter = new DocxExporter();
      const docxBuffer = await docxExporter.generateDocx(docxRequest);
      
      // Generate appropriate filename
      const filename = DocxExporter.getFilename(title, documentType);
      
      // Log the export activity
      try {
        await supabase
          .from(`${documentType}_analytics`)
          .insert({
            user_id: session.user.id,
            [`${documentType}_id`]: documentId,
            action_type: 'exported_docx',
            session_data: { 
              format: 'docx',
              file_size: docxBuffer.length,
              exported_at: new Date().toISOString()
            }
          });
      } catch (analyticsError) {
        console.warn('Analytics logging failed:', analyticsError);
      }

      // Return true DOCX file
      return new Response(docxBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    return json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error) {
    console.error('Error exporting document:', error);
    return json({ error: 'Export failed' }, { status: 500 });
  }
}; 