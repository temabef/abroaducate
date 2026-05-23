/**
 * Academic Analysis Engine
 * Analyzes academic strengths, weaknesses, and generates insights
 */

export interface AcademicProfile {
  hasData: boolean;
  message?: string;
  totalGPA: number;
  totalCourses: number;
  creditHours: {
    total: number;
    average: number;
  };
  gradeDistribution: {
    byGPARange: { [key: string]: number };
  };
  coursesBySubject: Record<string, {
    courseCount: number;
    gpa: string;
  }>;
  coursesByYear: Record<string, {
    gpa: string;
    totalCredits: number;
  }>;
}

/**
 * Analyzes the complete academic profile of a user.
 * @param {AcademicProfile} academicProfile - The user's academic profile data.
 * @returns {Object} A comprehensive analysis object.
 */
export function analyzeAcademicProfile(academicProfile: AcademicProfile) {
  if (!academicProfile.hasData) {
    return {
      hasAnalysis: false,
      message: academicProfile.message
    };
  }

  const analysis = {
    hasAnalysis: true,
    overall: analyzeOverallPerformance(academicProfile),
    strengths: identifyAcademicStrengths(academicProfile),
    weaknesses: identifyAcademicWeaknesses(academicProfile),
    trends: analyzeAcademicTrends(academicProfile),
    recommendations: generateImprovementRecommendations(academicProfile),
    competitiveness: assessCompetitiveness(academicProfile),
    riskFactors: identifyRiskFactors(academicProfile),
    insights: generateKeyInsights(academicProfile)
  };

  return analysis;
}

/**
 * Analyze overall academic performance
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Object} Overall performance analysis
 */
function analyzeOverallPerformance(profile: AcademicProfile) {
  const gpa = profile.totalGPA;
  const totalCredits = profile.creditHours.total;
  
  // GPA Categories
  let gpaCategory, gpaDescription, gpaColor;
  if (gpa >= 3.7) {
    gpaCategory = 'Excellent';
    gpaDescription = 'Outstanding academic performance';
    gpaColor = 'green';
  } else if (gpa >= 3.3) {
    gpaCategory = 'Very Good';
    gpaDescription = 'Strong academic performance';
    gpaColor = 'blue';
  } else if (gpa >= 3.0) {
    gpaCategory = 'Good';
    gpaDescription = 'Solid academic performance';
    gpaColor = 'yellow';
  } else if (gpa >= 2.5) {
    gpaCategory = 'Fair';
    gpaDescription = 'Moderate academic performance';
    gpaColor = 'orange';
  } else {
    gpaCategory = 'Needs Improvement';
    gpaDescription = 'Academic performance below expectations';
    gpaColor = 'red';
  }

  // Credit Load Assessment
  let creditLoadAssessment = 'Normal';
  if (totalCredits >= 150) creditLoadAssessment = 'Heavy';
  else if (totalCredits >= 120) creditLoadAssessment = 'Full';
  else if (totalCredits >= 90) creditLoadAssessment = 'Moderate';
  else if (totalCredits < 60) creditLoadAssessment = 'Light';

  return {
    gpa: gpa,
    gpaCategory: gpaCategory,
    gpaDescription: gpaDescription,
    gpaColor: gpaColor,
    totalCredits: totalCredits,
    creditLoadAssessment: creditLoadAssessment,
    coursesCompleted: profile.totalCourses,
    averageCreditsPerCourse: profile.creditHours.average
  };
}

/**
 * Identify academic strengths
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Array<Object>} List of identified strengths
 */
function identifyAcademicStrengths(profile: AcademicProfile) {
  const strengths = [];
  const subjects = profile.coursesBySubject;
  const gpaDistribution = profile.gradeDistribution.byGPARange;

  // High GPA Strength
  if (profile.totalGPA >= 3.5) {
    strengths.push({
      category: 'Overall Performance',
      title: 'High Academic Achievement',
      description: `Excellent overall GPA of ${profile.totalGPA.toFixed(2)}`,
      impact: 'high',
      icon: '🏆'
    });
  }

  // Subject Area Strengths (GPA >= 3.5 in subject)
  Object.entries(subjects).forEach(([subject, data]) => {
    if (data.courseCount > 0 && parseFloat(data.gpa) >= 3.5) {
      strengths.push({
        category: 'Subject Mastery',
        title: `Strong in ${subject}`,
        description: `${data.gpa} GPA across ${data.courseCount} courses`,
        impact: 'medium',
        icon: '📚'
      });
    }
  });

  // High Percentage of A's
  const aPercentage = (gpaDistribution['A Range (3.7-4.0)'] / profile.totalCourses) * 100;
  if (aPercentage >= 50) {
    strengths.push({
      category: 'Grade Excellence',
      title: 'Consistent A-Level Performance',
      description: `${Math.round(aPercentage)}% of courses in A range`,
      impact: 'high',
      icon: '⭐'
    });
  }

  // Heavy Course Load Management
  if (profile.creditHours.total >= 140 && profile.totalGPA >= 3.0) {
    strengths.push({
      category: 'Academic Rigor',
      title: 'Heavy Course Load Management',
      description: `Successfully managed ${profile.creditHours.total} credit hours`,
      impact: 'medium',
      icon: '💪'
    });
  }

  // Academic Breadth
  const subjectsWithCourses = Object.values(subjects).filter(s => s.courseCount > 0).length;
  if (subjectsWithCourses >= 4) {
    strengths.push({
      category: 'Academic Breadth',
      title: 'Diverse Academic Background',
      description: `Strong performance across ${subjectsWithCourses} subject areas`,
      impact: 'medium',
      icon: '🌐'
    });
  }

  return strengths;
}

/**
 * Identify academic weaknesses
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Array<Object>} List of identified weaknesses
 */
function identifyAcademicWeaknesses(profile: AcademicProfile) {
  const weaknesses = [];
  const subjects = profile.coursesBySubject;
  const gpaDistribution = profile.gradeDistribution.byGPARange;

  // Low Overall GPA
  if (profile.totalGPA < 3.0) {
    weaknesses.push({
      category: 'Overall Performance',
      title: 'Below Average GPA',
      description: `Overall GPA of ${profile.totalGPA.toFixed(2)} may limit opportunities`,
      severity: 'high',
      icon: '⚠️'
    });
  }

  // Subject Area Weaknesses (GPA < 2.5 in subject)
  Object.entries(subjects).forEach(([subject, data]) => {
    if (data.courseCount > 0 && parseFloat(data.gpa) < 2.5) {
      weaknesses.push({
        category: 'Subject Difficulty',
        title: `Challenges in ${subject}`,
        description: `${data.gpa} GPA across ${data.courseCount} courses`,
        severity: 'medium',
        icon: '📉'
      });
    }
  });

  // High Percentage of Low Grades
  const lowGradePercentage = ((gpaDistribution['C Range (1.7-2.6)'] + gpaDistribution['D Range (0.7-1.6)'] + gpaDistribution['F Range (0.0-0.6)']) / profile.totalCourses) * 100;
  if (lowGradePercentage >= 25) {
    weaknesses.push({
      category: 'Grade Consistency',
      title: 'Inconsistent Academic Performance',
      description: `${Math.round(lowGradePercentage)}% of courses below B level`,
      severity: 'medium',
      icon: '📊'
    });
  }

  // Low Credit Hours
  if (profile.creditHours.total < 90 && profile.totalCourses >= 20) {
    weaknesses.push({
      category: 'Academic Load',
      title: 'Light Course Load',
      description: `Only ${profile.creditHours.total} credit hours completed`,
      severity: 'low',
      icon: '📝'
    });
  }

  // Limited Subject Diversity
  const subjectsWithCourses = Object.values(subjects).filter(s => s.courseCount > 0).length;
  if (subjectsWithCourses <= 2) {
    weaknesses.push({
      category: 'Academic Breadth',
      title: 'Limited Subject Diversity',
      description: `Courses concentrated in only ${subjectsWithCourses} subject areas`,
      severity: 'low',
      icon: '🎯'
    });
  }

  return weaknesses;
}

/**
 * Analyze academic trends
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Object} Trend analysis
 */
function analyzeAcademicTrends(profile: AcademicProfile) {
  const yearlyData = profile.coursesByYear;
  const years = Object.keys(yearlyData).filter(year => year !== 'Unknown Year' && year !== 'Other Courses').sort();
  
  if (years.length < 2) {
    return {
      hasEnoughData: false,
      message: 'Need at least 2 years of data to analyze trends'
    };
  }

  const gpaTrend: Array<{ year: string; gpa: number }> = [];
  const creditTrend: Array<{ year: string; credits: number }> = [];
  
  years.forEach(year => {
    gpaTrend.push({
      year: year,
      gpa: parseFloat(yearlyData[year].gpa)
    });
    creditTrend.push({
      year: year,
      credits: yearlyData[year].totalCredits
    });
  });

  // Calculate trend direction
  const firstYearGPA = gpaTrend[0].gpa;
  const lastYearGPA = gpaTrend[gpaTrend.length - 1].gpa;
  const gpaChange = lastYearGPA - firstYearGPA;
  
  let trendDirection, trendDescription;
  if (gpaChange > 0.2) {
    trendDirection = 'improving';
    trendDescription = 'Strong upward trend in academic performance';
  } else if (gpaChange < -0.2) {
    trendDirection = 'declining';
    trendDescription = 'Declining trend in academic performance';
  } else {
    trendDirection = 'stable';
    trendDescription = 'Consistent academic performance over time';
  }

  return {
    hasEnoughData: true,
    gpaTrend: gpaTrend,
    creditTrend: creditTrend,
    trendDirection: trendDirection,
    trendDescription: trendDescription,
    gpaChange: gpaChange.toFixed(2),
    yearsAnalyzed: years.length
  };
}

/**
 * Generate improvement recommendations
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Array<Object>} List of recommendations
 */
function generateImprovementRecommendations(profile: AcademicProfile) {
  const recommendations = [];
  const gpa = profile.totalGPA;
  const subjects = profile.coursesBySubject;

  // GPA-based recommendations
  if (gpa < 3.0) {
    recommendations.push({
      priority: 'high',
      category: 'Academic Performance',
      title: 'Focus on GPA Improvement',
      description: 'Consider retaking low-grade courses or taking additional courses to boost GPA',
      actionItems: [
        'Identify courses with grades below C and consider retaking',
        'Take additional courses in strong subject areas',
        'Seek academic support and tutoring'
      ]
    });
  }

  // Subject-specific recommendations
  Object.entries(subjects).forEach(([subject, data]) => {
    if (data.courseCount > 0 && parseFloat(data.gpa) < 2.5) {
      recommendations.push({
        priority: 'medium',
        category: 'Subject Improvement',
        title: `Strengthen ${subject} Performance`,
        description: `Focus on improving performance in ${subject} courses`,
        actionItems: [
          `Seek tutoring or additional support in ${subject}`,
          'Consider prerequisite review if struggling with advanced courses',
          'Form study groups with high-performing students'
        ]
      });
    }
  });

  // Credit hour recommendations
  if (profile.creditHours.total < 120) {
    recommendations.push({
      priority: 'medium',
      category: 'Academic Planning',
      title: 'Increase Credit Load',
      description: 'Consider taking additional courses to meet graduation requirements',
      actionItems: [
        'Plan course schedule to complete degree requirements',
        'Consider summer courses to accelerate progress',
        'Ensure meeting minimum credit requirements for target programs'
      ]
    });
  }

  return recommendations;
}

/**
 * Assess competitiveness for university admissions
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Object} Competitiveness assessment
 */
function assessCompetitiveness(profile: AcademicProfile) {
  const gpa = profile.totalGPA;
  
  let competitiveLevel, description, opportunities;
  
  if (gpa >= 3.7) {
    competitiveLevel = 'Highly Competitive';
    description = 'Competitive for top-tier universities and selective programs';
    opportunities = ['Top-tier universities', 'Selective graduate programs', 'Merit scholarships'];
  } else if (gpa >= 3.3) {
    competitiveLevel = 'Competitive';
    description = 'Good chances at most universities and many graduate programs';
    opportunities = ['Most universities', 'Graduate programs', 'Some merit scholarships'];
  } else if (gpa >= 3.0) {
    competitiveLevel = 'Moderately Competitive';
    description = 'Eligible for many universities, may need strong supplementary materials';
    opportunities = ['Many universities', 'Some graduate programs', 'Need-based aid'];
  } else {
    competitiveLevel = 'Limited Competitiveness';
    description = 'May face challenges with admissions, consider GPA improvement strategies';
    opportunities = ['Community colleges', 'Less selective universities', 'Bridge programs'];
  }

  return {
    level: competitiveLevel,
    description: description,
    opportunities: opportunities,
    gpaScore: gpa,
    percentile: calculateGPAPercentile(gpa)
  };
}

/**
 * Calculate GPA percentile (rough estimate)
 * @param {number} gpa - GPA value
 * @returns {number} Estimated percentile
 */
function calculateGPAPercentile(gpa: number) {
  if (gpa >= 3.8) return 95;
  if (gpa >= 3.5) return 85;
  if (gpa >= 3.2) return 70;
  if (gpa >= 3.0) return 55;
  if (gpa >= 2.7) return 40;
  if (gpa >= 2.5) return 25;
  return 10;
}

/**
 * Identify risk factors
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Array<Object>} List of risk factors
 */
function identifyRiskFactors(profile: AcademicProfile) {
  const risks = [];
  
  if (profile.totalGPA < 2.5) {
    risks.push({
      type: 'Academic Standing',
      description: 'GPA below 2.5 may affect academic standing',
      severity: 'high'
    });
  }

  if (profile.creditHours.total < 60 && profile.totalCourses > 25) {
    risks.push({
      type: 'Credit Efficiency',
      description: 'Low credit hours per course may indicate academic struggles',
      severity: 'medium'
    });
  }

  return risks;
}

/**
 * Generate key insights
 * @param {AcademicProfile} profile - Academic profile data
 * @returns {Array<Object>} List of key insights
 */
function generateKeyInsights(profile: AcademicProfile) {
  const insights = [];
  
  // Academic strengths insight
  const strongSubjects = Object.entries(profile.coursesBySubject)
    .filter(([_, data]) => data.courseCount > 0 && parseFloat(data.gpa) >= 3.5)
    .map(([subject, _]) => subject);
  
  if (strongSubjects.length > 0) {
    insights.push({
      type: 'strength',
      title: 'Academic Strengths Identified',
      description: `Strong performance in: ${strongSubjects.join(', ')}`
    });
  }

  // Credit distribution insight
  const totalCredits = profile.creditHours.total;
  if (totalCredits >= 120) {
    insights.push({
      type: 'achievement',
      title: 'Degree Requirements Met',
      description: `Completed ${totalCredits} credit hours, meeting most degree requirements`
    });
  }

  return insights;
} 
