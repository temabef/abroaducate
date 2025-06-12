/**
 * Academic Profile Data Extractor
 * Extracts and structures academic data from GPA converter localStorage
 */

interface Course {
  name: string;
  code?: string;
  grade: string;
  credits: number;
  usGPA: number;
  year?: string;
  semester?: string;
}

interface GPAConverterData {
  studentName?: string;
  universityName?: string;
  programOfStudy?: string;
  selectedCountry?: string;
  selectedGradingSystem?: string;
  courses?: Course[];
}

interface StudentInfo {
  studentName: string;
  universityName: string;
  programOfStudy: string;
}

interface GradingSystem {
  country?: string;
  system?: string;
}

interface YearData {
  courses: Course[];
  gpa: string;
  totalCredits: number;
  courseCount: number;
}

interface SubjectData {
  courses: Course[];
  gpa: string;
  totalCredits: number;
  courseCount: number;
}

interface GradeDistribution {
  byGrade: Record<string, number>;
  byGPARange: Record<string, number>;
  totalCourses: number;
}

interface CreditHours {
  total: number;
  average: number;
  courseCount: number;
}

interface AcademicProfile {
  hasData: boolean;
  message?: string;
  totalGPA: number;
  totalCourses: number;
  studentInfo: StudentInfo;
  coursesByYear: Record<string, YearData>;
  coursesBySubject: Record<string, SubjectData>;
  gradeDistribution: GradeDistribution;
  creditHours: CreditHours;
  gradingSystem: GradingSystem;
  extractedAt: string;
}

/**
 * Extract academic profile data from localStorage
 * @returns {AcademicProfile} Structured academic profile data
 */
export function extractAcademicProfile(): AcademicProfile | { hasData: false; message: string } {
  try {
    // Extract core data from GPA converter localStorage
    const courses = getCourses();
    const gradingSystem = getGradingSystem();
    const totalGPA = getTotalGPA();
    
    if (!courses || courses.length === 0) {
      return {
        hasData: false,
        message: "No GPA converter data found. Please convert your transcript first."
      };
    }

    // Structure the data for analysis
    const studentInfo = getStudentInfo();
    const profile: AcademicProfile = {
      hasData: true,
      totalGPA: totalGPA,
      totalCourses: courses.length,
      studentInfo: studentInfo,
      coursesByYear: groupCoursesByYear(courses),
      coursesBySubject: categorizeBySubject(courses),
      gradeDistribution: analyzeGradeDistribution(courses),
      creditHours: calculateTotalCredits(courses),
      gradingSystem: gradingSystem,
      extractedAt: new Date().toISOString()
    };

    return profile;
  } catch (error) {
    console.error('Error extracting academic profile:', error);
    return {
      hasData: false,
      message: "Error reading academic data. Please try refreshing the page."
    };
  }
}

/**
 * Get GPA converter data from localStorage
 * @returns {GPAConverterData | null} GPA converter data
 */
function getGPAConverterData(): GPAConverterData | null {
  if (typeof window === 'undefined') return null;
  const gpaData = localStorage.getItem('gpaConverterData');
  return gpaData ? JSON.parse(gpaData) : null;
}

/**
 * Get courses from localStorage
 * @returns {Course[]} Array of course objects
 */
function getCourses(): Course[] {
  const data = getGPAConverterData();
  return data?.courses || [];
}

/**
 * Get grading system from localStorage
 * @returns {GradingSystem} Grading system configuration
 */
function getGradingSystem(): GradingSystem {
  const data = getGPAConverterData();
  return {
    country: data?.selectedCountry,
    system: data?.selectedGradingSystem
  };
}

/**
 * Get basic student info from localStorage
 * @returns {StudentInfo} Student information
 */
function getStudentInfo(): StudentInfo {
  const data = getGPAConverterData();
  return {
    studentName: data?.studentName || '',
    universityName: data?.universityName || '',
    programOfStudy: data?.programOfStudy || ''
  };
}

/**
 * Calculate total GPA from courses
 * @returns {number} Total GPA value
 */
function getTotalGPA(): number {
  const courses = getCourses();
  if (courses.length === 0) return 0;
  
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
  const totalPoints = courses.reduce((sum, course) => sum + course.usGPA * course.credits, 0);
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

/**
 * Group courses by academic year
 * @param {Course[]} courses - Array of course objects
 * @returns {Record<string, YearData>} Courses grouped by year
 */
function groupCoursesByYear(courses: Course[]): Record<string, YearData> {
  const groupedByYear: Record<string, Course[]> = {};
  
  courses.forEach(course => {
    const year = course.year || 'Unknown Year';
    if (!groupedByYear[year]) {
      groupedByYear[year] = [];
    }
    groupedByYear[year].push(course);
  });

  // Calculate GPA for each year
  const result: Record<string, YearData> = {};
  Object.keys(groupedByYear).forEach(year => {
    const yearCourses = groupedByYear[year];
    const totalCredits = yearCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
    const totalGradePoints = yearCourses.reduce((sum, course) => sum + ((course.usGPA || 0) * (course.credits || 0)), 0);
    
    result[year] = {
      courses: yearCourses,
      gpa: totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00',
      totalCredits: totalCredits,
      courseCount: yearCourses.length
    };
  });

  return result;
}

/**
 * Categorize courses by subject area
 * @param {Course[]} courses - Array of course objects
 * @returns {Record<string, SubjectData>} Courses grouped by subject
 */
function categorizeBySubject(courses: Course[]): Record<string, SubjectData> {
  const subjectCategories: Record<string, string[]> = {
    'Science': ['chemistry', 'biology', 'physics', 'anatomy', 'physiology', 'biochemistry', 'microbiology'],
    'Mathematics': ['mathematics', 'math', 'calculus', 'statistics', 'algebra', 'geometry'],
    'Engineering': ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'computer'],
    'Business': ['business', 'management', 'economics', 'finance', 'accounting', 'marketing'],
    'Liberal Arts': ['english', 'literature', 'history', 'philosophy', 'art', 'music'],
    'Social Sciences': ['psychology', 'sociology', 'political', 'anthropology', 'geography'],
    'Language': ['language', 'foreign', 'spanish', 'french', 'german', 'chinese'],
    'Other': []
  };

  const categorizedCourses: Record<string, Course[]> = {};
  
  // Initialize categories
  Object.keys(subjectCategories).forEach(category => {
    categorizedCourses[category] = [];
  });

  courses.forEach(course => {
    const courseName = (course.name || '').toLowerCase();
    const courseCode = (course.code || '').toLowerCase();
    
    let categorized = false;
    
    // Try to categorize based on course name and code
    for (const [category, keywords] of Object.entries(subjectCategories)) {
      if (category === 'Other') continue;
      
      const isMatch = keywords.some(keyword => 
        courseName.includes(keyword) || courseCode.includes(keyword)
      );
      
      if (isMatch) {
        categorizedCourses[category].push(course);
        categorized = true;
        break;
      }
    }
    
    // If not categorized, put in 'Other'
    if (!categorized) {
      categorizedCourses['Other'].push(course);
    }
  });

  // Calculate GPA for each subject area
  const result: Record<string, SubjectData> = {};
  Object.keys(categorizedCourses).forEach(category => {
    const courses = categorizedCourses[category];
    if (courses.length > 0) {
      const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
      const totalGradePoints = courses.reduce((sum, course) => sum + ((course.usGPA || 0) * (course.credits || 0)), 0);
      
      result[category] = {
        courses: courses,
        gpa: totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00',
        totalCredits: totalCredits,
        courseCount: courses.length
      };
    } else {
      result[category] = {
        courses: [],
        gpa: '0.00',
        totalCredits: 0,
        courseCount: 0
      };
    }
  });

  return result;
}

/**
 * Analyze grade distribution
 * @param {Course[]} courses - Array of course objects
 * @returns {GradeDistribution} Grade distribution analysis
 */
function analyzeGradeDistribution(courses: Course[]): GradeDistribution {
  const gradeCount: Record<string, number> = {};
  const gpaRanges: Record<string, number> = {
    'A Range (3.7-4.0)': 0,
    'B Range (2.7-3.6)': 0,
    'C Range (1.7-2.6)': 0,
    'D Range (0.7-1.6)': 0,
    'F Range (0.0-0.6)': 0
  };

  courses.forEach(course => {
    const grade = course.grade;
    const gpa = course.usGPA || 0;
    
    // Count individual grades
    gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    
    // Count GPA ranges
    if (gpa >= 3.7) gpaRanges['A Range (3.7-4.0)']++;
    else if (gpa >= 2.7) gpaRanges['B Range (2.7-3.6)']++;
    else if (gpa >= 1.7) gpaRanges['C Range (1.7-2.6)']++;
    else if (gpa >= 0.7) gpaRanges['D Range (0.7-1.6)']++;
    else gpaRanges['F Range (0.0-0.6)']++;
  });

  return {
    byGrade: gradeCount,
    byGPARange: gpaRanges,
    totalCourses: courses.length
  };
}

/**
 * Calculate total credit hours
 * @param {Course[]} courses - Array of course objects
 * @returns {CreditHours} Credit hour analysis
 */
function calculateTotalCredits(courses: Course[]): CreditHours {
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const averageCreditsPerCourse = courses.length > 0 ? (totalCredits / courses.length) : 0;
  
  return {
    total: totalCredits,
    average: parseFloat(averageCreditsPerCourse.toFixed(1)),
    courseCount: courses.length
  };
}

/**
 * Check if user has academic data available
 * @returns {boolean} Whether academic data exists
 */
export function hasAcademicData(): boolean {
  const courses = getCourses();
  return courses && courses.length > 0;
}

/**
 * Get basic academic summary for quick display
 * @returns {Object | null} Basic academic metrics
 */
export function getBasicAcademicSummary(): { totalGPA: number; totalCourses: number; totalCredits: number; hasData: boolean } | null {
  if (!hasAcademicData()) {
    return null;
  }

  const courses = getCourses();
  const totalGPA = getTotalGPA();
  const totalCredits = courses.reduce((sum, course) => sum + (course.credits || 0), 0);

  return {
    totalGPA: totalGPA,
    totalCourses: courses.length,
    totalCredits: totalCredits,
    hasData: true
  };
} 