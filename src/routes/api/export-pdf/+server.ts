import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PDFExportRequest {
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
    const exportData: PDFExportRequest = await request.json();
    const { content, title, type, metadata } = exportData;

    if (!content || !title) {
      return json({ error: 'Content and title are required' }, { status: 400 });
    }

    // Generate professional HTML for PDF conversion
    const htmlContent = generateProfessionalHTML(content, title, type, metadata);
    
    // For now, return properly formatted HTML that browsers can convert to PDF
    // In production, you'd integrate with puppeteer, jsPDF, or similar
    
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
          action_type: 'exported_pdf',
          session_data: { 
            title: title,
            format: 'pdf',
            exported_at: new Date().toISOString()
          }
        });
    } catch (analyticsError) {
      console.warn('Analytics logging failed:', analyticsError);
      // Don't fail the export for analytics issues
    }

    // Return as HTML with instructions for PDF conversion
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${title.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase()}_preview.html"`,
        'X-PDF-Instructions': 'Use browser Print > Save as PDF for best results'
      }
    });

  } catch (error) {
    console.error('Error exporting PDF:', error);
    return json({ 
      error: 'PDF export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

function generateProfessionalHTML(
  content: string, 
  title: string, 
  type: string, 
  metadata?: any
): string {
  
  const typeDisplayNames = {
    sop: 'Statement of Purpose',
    cover_letter: 'Cover Letter',
    personal_statement: 'Personal Statement',
    cv: 'Curriculum Vitae'
  };
  
  const documentTitle = typeDisplayNames[type as keyof typeof typeDisplayNames] || title;
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        @page {
            margin: 1in;
            size: letter;
        }
        
        body {
            font-family: 'Times New Roman', 'Times', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 1px solid #ccc;
        }
        
        .header h1 {
            font-size: 16pt;
            margin: 0 0 0.5em 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header .subtitle {
            font-size: 12pt;
            color: #666;
            margin: 0;
        }
        
        .metadata {
            text-align: center;
            margin-bottom: 1.5em;
            font-size: 11pt;
            color: #666;
        }
        
        .content {
            text-align: justify;
            margin-bottom: 2em;
        }
        
        .content p {
            margin-bottom: 1em;
            text-indent: ${type === 'sop' || type === 'personal_statement' ? '0.5in' : '0'};
        }
        
        .content p:first-child {
            text-indent: 0;
        }
        
        .footer {
            position: fixed;
            bottom: 0.5in;
            left: 1in;
            right: 1in;
            text-align: center;
            font-size: 9pt;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 0.25in;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                font-size: 12pt;
            }
            .no-print {
                display: none !important;
            }
        }
        
        /* Special formatting for cover letters */
        ${type === 'cover_letter' ? `
        .content {
            text-align: left;
        }
        .content p {
            text-indent: 0;
            margin-bottom: 1.5em;
        }
        ` : ''}
        
        /* Special formatting for CVs */
        ${type === 'cv' ? `
        .content {
            text-align: left;
        }
        .content p {
            text-indent: 0;
            margin-bottom: 0.75em;
        }
        h2, h3, h4 {
            margin-top: 1.5em;
            margin-bottom: 0.75em;
            color: #333;
        }
        ` : ''}
    </style>
</head>
<body>
    <div class="no-print" style="background: #f0f9ff; padding: 1em; margin: -1in -1in 2em -1in; text-align: center; font-size: 12pt; color: #0369a1; border: 2px solid #0369a1; border-radius: 8px;">
        📄 <strong>PDF Export Instructions</strong><br>
        <span style="font-size: 10pt;">1. Review the document below<br>
        2. Press <strong>Ctrl+P</strong> (or Cmd+P on Mac)<br>
        3. Select "Save as PDF" as destination<br>
        4. Choose your filename and save location</span>
    </div>
    
    <div class="header">
        <h1>${title}</h1>
        <p class="subtitle">${documentTitle}</p>
    </div>
    
    ${metadata ? `
    <div class="metadata">
        ${metadata.author ? `<p><strong>Prepared by:</strong> ${metadata.author}</p>` : ''}
        ${metadata.institution ? `<p><strong>Institution:</strong> ${metadata.institution}</p>` : ''}
        ${metadata.program ? `<p><strong>Program:</strong> ${metadata.program}</p>` : ''}
        ${metadata.company ? `<p><strong>Company:</strong> ${metadata.company}</p>` : ''}
        ${metadata.date ? `<p><strong>Date:</strong> ${metadata.date}</p>` : `<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>`}
    </div>
    ` : ''}
    
    <div class="content">
        ${content.split('\n\n').map(paragraph => 
          paragraph.trim() ? `<p>${paragraph.replace(/\n/g, '<br>')}</p>` : ''
        ).join('')}
    </div>
    
    <div class="footer">
        <p>Document prepared on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
} 