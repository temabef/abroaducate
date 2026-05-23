import { getPathwayRule, type PathwayType } from './pathwayRules';

// Diagnostic Data Interface
export interface DiagnosticData {
  currentCountry: string;
  gpaValue: number;
  gpaScale: string;
  englishTest: string;
  englishScore?: number;
  budget: string;
  targetCountries: string[];
  fieldOfStudy: string;
  degreeLevel: string;
  // Pathway fields
  currentEducationLevel?: string;
  pathwayPreference?: string;
  hasMastersTranscript?: boolean;
  gpaRange?: string;
}

// Country Assessment Interface
export interface CountryAssessment {
  country: string;
  score: number;
  reason: string;
  fundingPotential: 'excellent' | 'good' | 'moderate' | 'limited';
  scholarshipTypes: string[];
  requirements: string[];
  outOfPocketCosts: string;
}

// Pathway Information
export interface PathwayInfo {
  type: PathwayType;
  explanation: string;
  documentRequirements: {
    required: string[];
    optional: string[];
    transcriptInfo: {
      bachelor: boolean;
      master: boolean;
      masterReason?: string;
    };
  };
  timeline: string;
}

// Eligibility Result Interface
export interface EligibilityResult {
  overallScore: number;
  competitive: CountryAssessment[];
  needsWork: CountryAssessment[];
  unrealistic: CountryAssessment[];
  pathway?: PathwayInfo;
  recommendations: string[];
}

// Assess eligibility based on diagnostic data
export async function assessEligibility(data: DiagnosticData): Promise<EligibilityResult> {
  const assessments: CountryAssessment[] = [];
  
  // Convert GPA to 4.0 scale for comparison
  const standardizedGPA = convertToStandardGPA(data.gpaValue, data.gpaScale);
  
  // Assess each target country
  for (const country of data.targetCountries) {
    const assessment = assessCountry(country, standardizedGPA, data);
    assessments.push(assessment);
  }
  
  // Categorize countries
  const competitive = assessments.filter(a => a.score >= 70);
  const needsWork = assessments.filter(a => a.score >= 40 && a.score < 70);
  const unrealistic = assessments.filter(a => a.score < 40);
  
  // Calculate overall score
  const overallScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
    : 0;
  
  // Generate pathway information if degree level is set
  let pathway: PathwayInfo | undefined;
  if (data.degreeLevel && (data.degreeLevel === 'masters' || data.degreeLevel === 'phd')) {
    pathway = generatePathwayInfo(data);
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(data, competitive, needsWork, unrealistic);
  
  return {
    overallScore,
    competitive,
    needsWork,
    unrealistic,
    pathway,
    recommendations
  };
}

// Convert GPA to 4.0 scale
function convertToStandardGPA(value: number, scale: string): number {
  const scaleNum = parseFloat(scale);
  if (scaleNum === 4.0) return value;
  if (scaleNum === 5.0) return (value / 5.0) * 4.0;
  if (scaleNum === 7.0) return (value / 7.0) * 4.0;
  if (scaleNum === 10.0) return (value / 10.0) * 4.0;
  if (scaleNum === 100) return (value / 100) * 4.0;
  return value;
}

// Assess a specific country
function assessCountry(country: string, gpa: number, data: DiagnosticData): CountryAssessment {
  let score = 0;
  const requirements: string[] = [];
  const scholarshipTypes: string[] = [];
  
  // Base score from GPA
  if (gpa >= 3.5) score += 40;
  else if (gpa >= 3.0) score += 30;
  else if (gpa >= 2.5) score += 20;
  else score += 10;
  
  // English proficiency score
  if (data.englishTest === 'ielts' || data.englishTest === 'toefl' || data.englishTest === 'duolingo') {
    score += 20;
  } else if (data.englishTest === 'planning') {
    score += 10;
    requirements.push('Take and pass English proficiency test');
  } else {
    score += 5;
    requirements.push('Take English proficiency test (IELTS/TOEFL)');
  }
  
  // Field of study bonus
  if (data.fieldOfStudy && ['STEM', 'Engineering', 'Computer Science', 'Medicine'].some(f => 
      data.fieldOfStudy.toLowerCase().includes(f.toLowerCase()))) {
    score += 10;
    scholarshipTypes.push('STEM-specific scholarships');
  }
  
  // Country-specific assessment
  const countryBonus = getCountrySpecificScore(country, data);
  score += countryBonus.score;
  scholarshipTypes.push(...countryBonus.scholarships);
  requirements.push(...countryBonus.requirements);
  
  // Budget consideration
  score += 10; // Base score for having budget info
  
  // Determine funding potential
  let fundingPotential: 'excellent' | 'good' | 'moderate' | 'limited';
  if (score >= 80) fundingPotential = 'excellent';
  else if (score >= 65) fundingPotential = 'good';
  else if (score >= 45) fundingPotential = 'moderate';
  else fundingPotential = 'limited';
  
  // Determine reason
  const reason = generateReason(score, gpa, data, country);
  
  // Determine out-of-pocket costs
  const outOfPocketCosts = estimateOutOfPocketCosts(country, data.budget, fundingPotential);
  
  return {
    country,
    score: Math.min(100, score),
    reason,
    fundingPotential,
    scholarshipTypes,
    requirements,
    outOfPocketCosts
  };
}

// Get country-specific scores and scholarships
function getCountrySpecificScore(country: string, data: DiagnosticData): {
  score: number;
  scholarships: string[];
  requirements: string[];
} {
  const scholarships: string[] = [];
  const requirements: string[] = [];
  let score = 0;
  
  switch (country.toLowerCase()) {
    case 'germany':
    case 'norway':
    case 'finland':
      score += 20;
      scholarships.push('Tuition-free education', 'Living cost scholarships');
      break;
    case 'united states':
    case 'usa':
      score += 10;
      scholarships.push('Merit scholarships', 'Research assistantships', 'Teaching assistantships');
      requirements.push('Take GRE/GMAT if required');
      break;
    case 'canada':
      score += 15;
      scholarships.push('Provincial scholarships', 'University-specific funding');
      break;
    case 'united kingdom':
    case 'uk':
      score += 10;
      scholarships.push('Chevening Scholarship', 'Commonwealth Scholarship');
      break;
    default:
      score += 5;
      scholarships.push('University scholarships', 'Government funding programs');
  }
  
  return { score, scholarships, requirements };
}

// Generate reason for assessment
function generateReason(score: number, gpa: number, data: DiagnosticData, country: string): string {
  if (score >= 70) {
    return `Your ${gpa.toFixed(2)} GPA and profile make you competitive for funded programs in ${country}`;
  } else if (score >= 40) {
    return `You're close! Strengthen your English scores and research experience to improve funding chances in ${country}`;
  } else {
    return `Significant improvements needed in GPA and test scores for realistic funding in ${country}`;
  }
}

// Estimate out-of-pocket costs
function estimateOutOfPocketCosts(country: string, budget: string, funding: string): string {
  if (['germany', 'norway', 'finland'].some(c => country.toLowerCase().includes(c))) {
    return '$8,000-12,000/year (living costs only - tuition is free)';
  } else if (funding === 'excellent') {
    return '$5,000-10,000/year (minimal costs with full scholarship)';
  } else if (funding === 'good') {
    return '$10,000-15,000/year (with partial scholarship)';
  } else {
    return '$15,000-25,000/year (limited scholarship coverage)';
  }
}

// Generate pathway information
function generatePathwayInfo(data: DiagnosticData): PathwayInfo | undefined {
  if (!data.degreeLevel) return undefined;
  
  // Determine pathway type
  let pathwayType: PathwayType;
  if (data.degreeLevel === 'phd') {
    if (data.currentEducationLevel === 'bachelors' && data.pathwayPreference === 'direct') {
      pathwayType = 'BSc_to_PhD';
    } else if (data.currentEducationLevel === 'masters') {
      pathwayType = 'MSc_to_PhD';
    } else {
      pathwayType = 'BSc_to_MSc_to_PhD';
    }
  } else {
    pathwayType = 'BSc_to_MSc';
  }
  
  // Get pathway rule for first target country
  const targetCountry = data.targetCountries[0] || 'United States';
  const rule = getPathwayRule(pathwayType, targetCountry);
  
  if (!rule) {
    return {
      type: pathwayType,
      explanation: 'Standard pathway for your degree level',
      documentRequirements: {
        required: ['Bachelor\'s Transcript', 'Statement of Purpose', 'Recommendation Letters'],
        optional: ['Research Experience', 'Publications'],
        transcriptInfo: {
          bachelor: true,
          master: pathwayType.includes('MSc_to'),
          masterReason: undefined
        }
      },
      timeline: '2-3 years'
    };
  }
  
  return {
    type: pathwayType,
    explanation: rule.explanation,
    documentRequirements: {
      required: ['Bachelor\'s Transcript', 'Statement of Purpose', 'Recommendation Letters'],
      optional: ['Research Experience', 'Publications'],
      transcriptInfo: {
        bachelor: rule.conditions.transcript_bachelor_required,
        master: rule.conditions.transcript_master_required,
        masterReason: rule.conditions.transcript_master_reason
      }
    },
    timeline: `${Math.floor(rule.conditions.timeline_months / 12)} years`
  };
}

// Generate recommendations
function generateRecommendations(
  data: DiagnosticData,
  competitive: CountryAssessment[],
  needsWork: CountryAssessment[],
  unrealistic: CountryAssessment[]
): string[] {
  const recommendations: string[] = [];
  
  if (competitive.length > 0) {
    recommendations.push('Focus on crafting strong application materials for your competitive countries');
    recommendations.push('Apply early to maximize scholarship opportunities');
  }
  
  if (needsWork.length > 0) {
    recommendations.push('Improve English test scores to increase funding chances');
    recommendations.push('Consider gaining research or work experience in your field');
  }
  
  if (unrealistic.length > 0) {
    recommendations.push('Consider alternative pathways or additional preparation time');
  }
  
  if (data.budget === 'nothing' || data.budget === '$500-1.5k') {
    recommendations.push('Prioritize fully-funded programs and assistantships');
  }
  
  return recommendations;
}

// Get country examples
export function getCountryExamples(country: string): Array<{
  name: string;
  from: string;
  gpa: string;
  accepted: string;
  scholarship: string;
}> {
  const examples: Record<string, Array<{name: string; from: string; gpa: string; accepted: string; scholarship: string}>> = {
    'United States': [
      { name: 'Ahmed K.', from: 'Nigeria', gpa: '3.6/4.0', accepted: 'MIT', scholarship: 'Full tuition + stipend' },
      { name: 'Priya M.', from: 'India', gpa: '3.8/4.0', accepted: 'Stanford', scholarship: 'Full funding' }
    ],
    'Germany': [
      { name: 'Sarah L.', from: 'Egypt', gpa: '3.4/4.0', accepted: 'TU Munich', scholarship: 'Tuition-free + DAAD grant' },
      { name: 'James O.', from: 'Kenya', gpa: '3.5/4.0', accepted: 'Heidelberg', scholarship: 'Living cost scholarship' }
    ],
    'Canada': [
      { name: 'Chen W.', from: 'China', gpa: '3.7/4.0', accepted: 'UBC', scholarship: 'Partial tuition waiver' },
      { name: 'Maria S.', from: 'Brazil', gpa: '3.6/4.0', accepted: 'McGill', scholarship: 'Merit scholarship' }
    ],
    'United Kingdom': [
      { name: 'Oluwaseun A.', from: 'Nigeria', gpa: '3.5/4.0', accepted: 'Oxford', scholarship: 'Chevening Scholarship' },
      { name: 'Ananya P.', from: 'India', gpa: '3.8/4.0', accepted: 'Cambridge', scholarship: 'Gates Scholarship' }
    ]
  };
  
  return examples[country] || [
    { name: 'Student A', from: 'International', gpa: '3.5/4.0', accepted: 'Top University', scholarship: 'Merit-based funding' }
  ];
}
