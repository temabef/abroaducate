import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export interface DocxExportRequest {
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

export class DocxExporter {
  
  /**
   * Generate a professional DOCX document
   */
  async generateDocx(request: DocxExportRequest): Promise<Buffer> {
    const { content, title, type, metadata } = request;
    
    // Document sections array
    const sections: Paragraph[] = [];
    
    // Add title
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32, // 16pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        heading: HeadingLevel.TITLE,
      })
    );
    
    // Add metadata if available
    if (metadata) {
      const metadataLines: string[] = [];
      
      if (metadata.author) metadataLines.push(`By: ${metadata.author}`);
      if (metadata.institution && metadata.program) {
        metadataLines.push(`${metadata.institution} - ${metadata.program}`);
      } else if (metadata.company) {
        metadataLines.push(`Application to: ${metadata.company}`);
      }
      if (metadata.date) metadataLines.push(`Date: ${metadata.date}`);
      
      if (metadataLines.length > 0) {
        metadataLines.forEach(line => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 20, // 10pt
                  color: "666666",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            })
          );
        });
        
        // Add spacing after metadata
        sections.push(
          new Paragraph({
            children: [new TextRun("")],
            spacing: { after: 400 },
          })
        );
      }
    }
    
    // Process content paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    paragraphs.forEach((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      if (trimmedParagraph) {
        // Apply different formatting based on document type
        const paragraphFormatting = this.getParagraphFormatting(type, index === 0);
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedParagraph,
                size: paragraphFormatting.fontSize,
              }),
            ],
            alignment: paragraphFormatting.alignment,
            spacing: {
              after: paragraphFormatting.spacingAfter,
              before: index === 0 ? 0 : paragraphFormatting.spacingBefore,
            },
            indent: paragraphFormatting.indent,
          })
        );
      }
    });
    
    // Add footer
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `\nDocument prepared on ${new Date().toLocaleDateString()}`,
            size: 18, // 9pt
            color: "999999",
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
      })
    );
    
    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: sections,
        },
      ],
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
              size: 24, // 12pt
            },
            paragraph: {
              spacing: {
                line: 360, // 1.5 line spacing
              },
            },
          },
        },
      },
    });
    
    // Generate and return the buffer
    return await Packer.toBuffer(doc);
  }
  
  /**
   * Get formatting settings based on document type
   */
  private getParagraphFormatting(type: string, isFirstParagraph: boolean) {
    const baseFormatting = {
      fontSize: 24, // 12pt
      alignment: AlignmentType.JUSTIFIED,
      spacingAfter: 240, // 12pt spacing after
      spacingBefore: 0,
      indent: { firstLine: 0 },
    };
    
    switch (type) {
      case 'sop':
      case 'personal_statement':
        return {
          ...baseFormatting,
          indent: { firstLine: isFirstParagraph ? 0 : 720 }, // 0.5 inch first line indent except first paragraph
        };
        
      case 'cover_letter':
        return {
          ...baseFormatting,
          alignment: AlignmentType.LEFT,
          spacingAfter: 360, // 18pt spacing for cover letters
          indent: { firstLine: 0 }, // No first line indent for cover letters
        };
        
      case 'cv':
        return {
          ...baseFormatting,
          alignment: AlignmentType.LEFT,
          spacingAfter: 180, // Tighter spacing for CVs
          indent: { firstLine: 0 },
        };
        
      default:
        return baseFormatting;
    }
  }
  
  /**
   * Get appropriate filename for the document
   */
  static getFilename(title: string, type: string): string {
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    
    return `${sanitizedTitle}_${timestamp}.docx`;
  }
} 