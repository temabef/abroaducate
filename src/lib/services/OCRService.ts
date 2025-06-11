import Tesseract from 'tesseract.js';

export interface ExtractedCourse {
  courseName: string;
  courseCode?: string;
  grade: string;
  credits: number;
  confidence: number;
}

export interface OCRResult {
  extractedText: string;
  courses: ExtractedCourse[];
  totalCoursesFound: number;
  processingTime: number;
  confidence: number;
}

export class OCRService {
  private worker: Tesseract.Worker | null = null;

  async initializeWorker(): Promise<void> {
    if (this.worker) return;
    
    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: any) => console.log('OCR Progress:', m)
    });

    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-.,()/ ',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });
  }

  async processTranscript(file: File): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      let extractedText = '';
      
      // For now, process all files (PDFs and images) with Tesseract directly
      // This provides good results for most transcript formats
      extractedText = await this.processWithTesseract(file);

      const courses = this.extractCoursesFromText(extractedText);
      const processingTime = Date.now() - startTime;

      return {
        extractedText,
        courses,
        totalCoursesFound: courses.length,
        processingTime,
        confidence: this.calculateAverageConfidence(courses)
      };
    } catch (error) {
      console.error('OCR Processing Error:', error);
      throw new Error('Failed to process transcript. Please try again or enter courses manually.');
    }
  }

  private async processWithTesseract(file: File): Promise<string> {
    await this.initializeWorker();
    const result = await this.worker!.recognize(file);
    return result.data.text;
  }

  private extractCoursesFromText(text: string): ExtractedCourse[] {
    const courses: ExtractedCourse[] = [];

    // Common patterns for African transcripts
    const patterns = [
      // Pattern 1: Course Code | Course Name | Credits | Grade
      /([A-Z]{2,4}\s*\d{3,4})\s+(.{10,60}?)\s+(\d+(?:\.\d+)?)\s+([A-F][+-]?)/gi,
      
      // Pattern 2: Course Name | Grade | Credits
      /([A-Za-z\s]{10,50})\s+([A-F][+-]?)\s+(\d+(?:\.\d+)?)/gi,
      
      // Pattern 3: Nigerian/African pattern
      /([A-Z]{2,4}\s*\d{3,4})\s+(.{10,60}?)\s+(\d+)\s+([A-F])/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const extracted = this.parseMatch(match);
        if (extracted && this.isValidCourse(extracted)) {
          courses.push(extracted);
        }
      }
    }

    return this.removeDuplicateCourses(courses);
  }

  private parseMatch(match: RegExpExecArray): ExtractedCourse | null {
    try {
      if (match.length === 5) {
        // Pattern: Code | Name | Credits | Grade
        return {
          courseName: this.cleanCourseName(match[2]),
          courseCode: match[1].trim(),
          grade: this.normalizeGrade(match[4]),
          credits: parseFloat(match[3]),
          confidence: 0.8
        };
      } else if (match.length === 4) {
        // Pattern: Name | Grade | Credits
        return {
          courseName: this.cleanCourseName(match[1]),
          courseCode: '',
          grade: this.normalizeGrade(match[2]),
          credits: parseFloat(match[3]),
          confidence: 0.7
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing match:', error);
      return null;
    }
  }

  private cleanCourseName(name: string): string {
    return name
      .replace(/[^\w\s&-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private normalizeGrade(grade: string): string {
    const gradeMap: { [key: string]: string } = {
      'EXCELLENT': 'A',
      'VERY GOOD': 'B',
      'GOOD': 'C',
      'FAIR': 'D',
      'PASS': 'E',
      'FAIL': 'F'
    };

    const upperGrade = grade.toUpperCase();
    return gradeMap[upperGrade] || upperGrade;
  }

  private isValidCourse(course: ExtractedCourse): boolean {
    return (
      course.courseName.length >= 3 &&
      course.credits > 0 &&
      course.credits <= 20 &&
      /^[A-F][+-]?$/.test(course.grade)
    );
  }

  private removeDuplicateCourses(courses: ExtractedCourse[]): ExtractedCourse[] {
    const seen = new Set();
    return courses.filter(course => {
      const key = `${course.courseName}-${course.grade}-${course.credits}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateAverageConfidence(courses: ExtractedCourse[]): number {
    if (courses.length === 0) return 0;
    const total = courses.reduce((sum, course) => sum + course.confidence, 0);
    return total / courses.length;
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Utility method to suggest grade mappings for different systems
  suggestGradeMapping(grade: string, country: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      nigeria: {
        'A': ['A', '70-100'],
        'B': ['B', '60-69'],
        'C': ['C', '50-59'],
        'D': ['D', '45-49'],
        'E': ['E', '40-44'],
        'F': ['F', '0-39']
      },
      ghana: {
        'A': ['A', '80-100'],
        'B': ['B+', 'B', '70-79'],
        'C': ['C+', 'C', '60-69'],
        'D': ['D+', 'D', '50-59'],
        'F': ['F', '0-49']
      }
    };

    return suggestions[country.toLowerCase()]?.[grade] || [grade];
  }
} 