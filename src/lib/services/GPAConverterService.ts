import type { Course, ConversionResult, GradingSystem } from '../data/gradingSystems';
import { getGradingSystem } from '../data/gradingSystems';
import { supabase } from '../supabase';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '../comprehensive-usage-limits';

export interface GPAConversionData {
  userId: string;
  courses: Course[];
  fromCountry: string;
  fromSystem: string;
  toSystem: 'us' | 'uk' | 'canadian';
  notes?: string;
}

export class GPAConverterService {
  
  /**
   * Convert courses from one grading system to US 4.0 GPA
   */
  async convertToUSGPA(
    courses: Course[], 
    fromCountry: string, 
    fromSystemName: string
  ): Promise<ConversionResult> {
    
    const gradingSystem = getGradingSystem(fromCountry, fromSystemName);
    if (!gradingSystem) {
      throw new Error(`Grading system not found: ${fromCountry} - ${fromSystemName}`);
    }

    let totalGradePoints = 0;
    let totalCredits = 0;
    const convertedCourses: Course[] = [];

    for (const course of courses) {
      const gradeInfo = gradingSystem.grades[course.grade];
      if (!gradeInfo) {
        throw new Error(`Grade '${course.grade}' not found in ${gradingSystem.description}`);
      }

      const convertedGPA = gradeInfo.usGPA;
      const gradePoints = convertedGPA * course.credits;
      
      totalGradePoints += gradePoints;
      totalCredits += course.credits;

      convertedCourses.push({
        ...course,
        convertedGPA
      });
    }

    const finalGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    return {
      originalGPA: this.calculateOriginalGPA(courses, gradingSystem),
      convertedGPA: Math.round(finalGPA * 100) / 100, // Round to 2 decimal places
      totalCredits,
      courses: convertedCourses,
      gradingSystem,
      timestamp: new Date()
    };
  }

  /**
   * Calculate the original GPA in the source system
   */
  private calculateOriginalGPA(courses: Course[], gradingSystem: GradingSystem): number {
    // For systems that use numeric grades, calculate weighted average
    if (gradingSystem.gradeScale === '4.0' || gradingSystem.gradeScale === '5.0' || 
        gradingSystem.gradeScale === '7.0' || gradingSystem.gradeScale === '10.0') {
      
      let totalPoints = 0;
      let totalCredits = 0;
      
      for (const course of courses) {
        const gradeInfo = gradingSystem.grades[course.grade];
        if (gradeInfo) {
          // Extract numeric value from score range (e.g., "70-100" -> 85)
          const scoreRange = gradeInfo.scoreRange;
          const midpoint = this.getMidpointFromRange(scoreRange);
          
          totalPoints += midpoint * course.credits;
          totalCredits += course.credits;
        }
      }
      
      return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
    }
    
    // For percentage systems, return percentage average
    if (gradingSystem.gradeScale === 'percentage' || gradingSystem.gradeScale === '100') {
      let totalPercentage = 0;
      let totalCredits = 0;
      
      for (const course of courses) {
        const gradeInfo = gradingSystem.grades[course.grade];
        if (gradeInfo) {
          const midpoint = this.getMidpointFromRange(gradeInfo.scoreRange);
          totalPercentage += midpoint * course.credits;
          totalCredits += course.credits;
        }
      }
      
      return totalCredits > 0 ? Math.round((totalPercentage / totalCredits) * 100) / 100 : 0;
    }
    
    return 0; // Default fallback
  }

  /**
   * Extract midpoint from score range string
   */
  private getMidpointFromRange(range: string): number {
    const match = range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      return (min + max) / 2;
    }
    
    // Handle single values
    const singleMatch = range.match(/(\d+\.?\d*)/);
    if (singleMatch) {
      return parseFloat(singleMatch[1]);
    }
    
    return 0;
  }

  /**
   * Save conversion result to database (Professional tier and above)
   */
  async saveConversion(
    userId: string, 
    conversionResult: ConversionResult,
    userTier: string
  ): Promise<string | null> {
    
    // Check if user can save conversions
    if (userTier === 'free') {
      return null; // Free users cannot save conversion history
    }

    // Check usage limits for Professional tier using new comprehensive system
    if (userTier === 'professional') {
      const usageCheck = await checkComprehensiveUsageLimit(userId, 'text_enhancements'); // Use text_enhancements for GPA conversion saves
      if (!usageCheck.allowed) {
        throw new Error('Monthly GPA conversion save limit reached. Upgrade to Elite for unlimited saves.');
      }
    }

    try {
      const { data, error } = await supabase
        .from('gpa_conversions')
        .insert({
          user_id: userId,
          country: conversionResult.gradingSystem.country,
          grading_system: conversionResult.gradingSystem.systemName,
          original_gpa: conversionResult.originalGPA,
          converted_gpa: conversionResult.convertedGPA,
          total_credits: conversionResult.totalCredits,
          courses: conversionResult.courses,
          notes: conversionResult.notes,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      // Increment usage for Professional tier
      if (userTier === 'professional') {
        await incrementComprehensiveUsage(userId, 'text_enhancements');
      }

      return data.id;
    } catch (error) {
      console.error('Error saving GPA conversion:', error);
      throw new Error('Failed to save conversion. Please try again.');
    }
  }

  /**
   * Get user's conversion history
   */
  async getConversionHistory(userId: string, limit = 20): Promise<ConversionResult[]> {
    try {
      const { data, error } = await supabase
        .from('gpa_conversions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(item => ({
        originalGPA: item.original_gpa,
        convertedGPA: item.converted_gpa,
        totalCredits: item.total_credits,
        courses: item.courses || [],
        gradingSystem: {
          country: item.country,
          systemName: item.grading_system,
          gradeScale: '4.0' as const, // Will be populated from lookup
          description: '',
          grades: {}
        },
        timestamp: new Date(item.created_at),
        notes: item.notes
      }));
    } catch (error) {
      console.error('Error fetching conversion history:', error);
      return [];
    }
  }

  /**
   * Generate official-looking PDF report (Elite tier feature)
   */
  async generatePDFReport(
    conversionResult: ConversionResult,
    userInfo: { name?: string; email: string },
    userTier: string
  ): Promise<Blob> {
    
    if (userTier !== 'elite') {
      throw new Error('PDF reports are available for Elite tier users only.');
    }

    // This would integrate with a PDF generation library like jsPDF
    // For now, return a simple implementation
    const pdfContent = this.generatePDFContent(conversionResult, userInfo);
    
    // Convert to blob (simplified implementation)
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return blob;
  }

  private generatePDFContent(
    result: ConversionResult, 
    userInfo: { name?: string; email: string }
  ): string {
    // Simplified PDF content generation
    // In production, use jsPDF or similar library
    return `
GPA CONVERSION REPORT
Generated: ${result.timestamp.toDateString()}

Student: ${userInfo.name || 'N/A'}
Email: ${userInfo.email}

CONVERSION SUMMARY
From: ${result.gradingSystem.description}
Original GPA: ${result.originalGPA}
Converted US GPA: ${result.convertedGPA}
Total Credits: ${result.totalCredits}

COURSE BREAKDOWN
${result.courses.map(course => 
  `${course.code}: ${course.title} - ${course.credits} credits - Grade: ${course.grade} (US: ${course.convertedGPA})`
).join('\n')}

This report is generated by SOP Generator Pro - Academic GPA Conversion Tool
    `;
  }

  /**
   * Validate course data before conversion
   */
  validateCourses(courses: Course[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!courses || courses.length === 0) {
      errors.push('At least one course is required for conversion.');
      return { isValid: false, errors };
    }

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      
      if (!course.code?.trim()) {
        errors.push(`Course ${i + 1}: Course code is required.`);
      }
      
      if (!course.title?.trim()) {
        errors.push(`Course ${i + 1}: Course title is required.`);
      }
      
      if (!course.credits || course.credits <= 0) {
        errors.push(`Course ${i + 1}: Credits must be greater than 0.`);
      }
      
      if (!course.grade?.trim()) {
        errors.push(`Course ${i + 1}: Grade is required.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const gpaConverterService = new GPAConverterService(); 