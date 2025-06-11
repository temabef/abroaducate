export interface AzureOCRConfig {
  endpoint: string;
  apiKey: string;
}

export interface OCRResult {
  text: string;
  courses: Array<{
    name: string;
    grade: string;
    credits: number;
  }>;
  confidence: number;
}

export class AzureOCRService {
  private config: AzureOCRConfig;

  constructor(config: AzureOCRConfig) {
    this.config = config;
  }

  async extractText(imageBlob: Blob): Promise<OCRResult> {
    try {
      // Convert blob to base64 for Azure API
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch(`${this.config.endpoint}/vision/v3.2/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': this.config.apiKey,
        },
        body: arrayBuffer
      });

      if (!response.ok) {
        throw new Error(`Azure OCR API error: ${response.status}`);
      }

      const result = await response.json();
      return this.parseAzureResponse(result);
    } catch (error) {
      console.error('Azure OCR Error:', error);
      throw error;
    }
  }

  private parseAzureResponse(azureResult: any): OCRResult {
    let fullText = '';
    let totalConfidence = 0;
    let wordCount = 0;

    // Extract text from Azure OCR response
    for (const region of azureResult.regions || []) {
      for (const line of region.lines || []) {
        let lineText = '';
        for (const word of line.words || []) {
          lineText += word.text + ' ';
          totalConfidence += parseFloat(word.confidence || '0');
          wordCount++;
        }
        fullText += lineText.trim() + '\n';
      }
    }

    const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;
    const extractedCourses = this.extractCoursesFromText(fullText);

    return {
      text: fullText.trim(),
      courses: extractedCourses,
      confidence: averageConfidence
    };
  }

  private extractCoursesFromText(text: string): Array<{ name: string; grade: string; credits: number }> {
    const courses: Array<{ name: string; grade: string; credits: number }> = [];
    
    // Enhanced patterns for African university transcripts
    const patterns = [
      // Nigerian/English format: Course Code + Name + Credits + Grade
      /([A-Z]{2,4}\s*\d{3,4})\s+(.{10,60}?)\s+(\d+(?:\.\d+)?)\s+([A-F][+-]?)/gi,
      
      // Francophone format: Course + Grade + Credits
      /([A-Za-z\s]{15,60})\s+(THF|TB|AB|B|CP|P|S|E)\s+(\d+(?:\.\d+)?)/gi,
      
      // Standard format with clear separation
      /([A-Za-z\s&-]{15,60})\s+([A-F][+-]?|THF|TB|AB|CP|E)\s+(\d+(?:\.\d+)?)/gi,
      
      // Credits first format
      /(\d+(?:\.\d+)?)\s+([A-Za-z\s&-]{15,60})\s+([A-F][+-]?|THF|TB|AB|CP)/gi,
      
      // Table format with separators
      /([A-Za-z\s&-]{15,60})\s*[\|\-\s]+\s*([A-F][+-]?|THF|TB|AB|CP|E)\s*[\|\-\s]+\s*(\d+(?:\.\d+)?)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let courseName = '';
        let grade = '';
        let credits = 0;

        // Handle different match patterns
        if (match.length === 4) {
          if (pattern.source.includes('THF|TB')) {
            // Francophone pattern
            courseName = this.cleanCourseName(match[1]);
            grade = match[2].trim().toUpperCase();
            credits = parseFloat(match[3]);
          } else if (/^\d/.test(match[1])) {
            // Credits first pattern
            credits = parseFloat(match[1]);
            courseName = this.cleanCourseName(match[2]);
            grade = match[3].trim().toUpperCase();
          } else {
            // Standard pattern
            courseName = this.cleanCourseName(match[1]);
            grade = match[2].trim().toUpperCase();
            credits = parseFloat(match[3]);
          }
        } else if (match.length === 5) {
          // Course code + name pattern
          courseName = this.cleanCourseName(match[2]);
          grade = match[4].trim().toUpperCase();
          credits = parseFloat(match[3]);
        }

        // Validate extracted data
        if (courseName && grade && credits > 0 && credits <= 20) {
          // Check if grade is valid
          const isValidGrade = /^[A-F][+-]?$/.test(grade) || 
                              /^(THF|TB|AB|CP|S|E|P)$/.test(grade) || 
                              /^[1-5]$/.test(grade);
          
          if (isValidGrade) {
            courses.push({
              name: courseName,
              grade: grade,
              credits: credits
            });
          }
        }
      }
    }

    // Remove duplicates
    const seen = new Set();
    return courses.filter(course => {
      const key = `${course.name}-${course.grade}-${course.credits}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private cleanCourseName(name: string): string {
    return name
      .replace(/[^\w\s&-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Fallback OCR service using a different approach
export class FallbackOCRService {
  async extractText(imageBlob: Blob): Promise<OCRResult> {
    // This could use a different API or approach
    // For now, return a basic structure
    return {
      text: '',
      courses: [],
      confidence: 0
    };
  }
} 