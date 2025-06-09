export interface UserProfile {
  field_of_study?: string;
  current_level?: string;
  target_level?: string;
  gpa?: number;
  ielts_score?: number;
  toefl_score?: number;
  age?: number;
  nationality?: string;
  preferred_countries?: string[];
  work_experience_years?: number;
  has_leadership_experience?: boolean;
  has_research_experience?: boolean;
  has_volunteer_experience?: boolean;
  career_goals?: string;
  research_interests?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  location: string;
  field: string;
  level: string;
  type: string;
  description: string;
  requirements: string[];
  website?: string;
  min_gpa?: number;
  min_ielts?: number;
  min_toefl?: number;
  age_limit?: number;
  nationality_restrictions?: string[];
}

/**
 * Calculate scholarship match percentage based on user profile
 * Returns a score from 0-100
 */
export function calculateScholarshipMatch(
  userProfile: UserProfile,
  scholarship: Scholarship
): number {
  let totalScore = 0;
  let maxPossibleScore = 0;

  // 1. Academic Field Match (25 points)
  maxPossibleScore += 25;
  if (userProfile.field_of_study && scholarship.field) {
    if (scholarship.field.toLowerCase().includes('all') || 
        scholarship.field.toLowerCase().includes('various')) {
      totalScore += 25; // Universal scholarships
    } else if (scholarship.field.toLowerCase().includes(userProfile.field_of_study.toLowerCase()) ||
               userProfile.field_of_study.toLowerCase().includes(scholarship.field.toLowerCase())) {
      totalScore += 25; // Perfect field match
    } else {
      // Partial field matching logic
      const userFieldWords = userProfile.field_of_study.toLowerCase().split(' ');
      const scholarshipFieldWords = scholarship.field.toLowerCase().split(' ');
      const commonWords = userFieldWords.filter(word => 
        scholarshipFieldWords.some(sWord => sWord.includes(word) || word.includes(sWord))
      );
      totalScore += Math.min(25, (commonWords.length / userFieldWords.length) * 25);
    }
  }

  // 2. Education Level Match (20 points)
  maxPossibleScore += 20;
  if (userProfile.target_level && scholarship.level) {
    if (scholarship.level.toLowerCase().includes(userProfile.target_level.toLowerCase()) ||
        userProfile.target_level.toLowerCase().includes(scholarship.level.toLowerCase())) {
      totalScore += 20;
    } else if (scholarship.level.toLowerCase().includes('graduate') && 
               (userProfile.target_level.toLowerCase().includes('master') || 
                userProfile.target_level.toLowerCase().includes('phd'))) {
      totalScore += 15; // Graduate includes Master's and PhD
    }
  }

  // 3. Geographic Preference (20 points)
  maxPossibleScore += 20;
  if (userProfile.preferred_countries && scholarship.location) {
    const isPreferredLocation = userProfile.preferred_countries.some(country =>
      scholarship.location.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(scholarship.location.toLowerCase())
    );
    if (isPreferredLocation) {
      totalScore += 20;
    } else {
      // Partial match for regions (EU, etc.)
      if (scholarship.location.toLowerCase().includes('eu') || 
          scholarship.location.toLowerCase().includes('europe')) {
        const europeanCountries = ['germany', 'france', 'netherlands', 'sweden', 'norway', 'denmark'];
        const hasEuropeanPreference = userProfile.preferred_countries.some(country =>
          europeanCountries.includes(country.toLowerCase())
        );
        if (hasEuropeanPreference) totalScore += 10;
      }
    }
  }

  // 4. Academic Requirements (15 points)
  maxPossibleScore += 15;
  if (userProfile.gpa && scholarship.min_gpa) {
    if (userProfile.gpa >= scholarship.min_gpa) {
      totalScore += 15;
    } else {
      // Partial score based on how close they are
      const gpaRatio = userProfile.gpa / scholarship.min_gpa;
      totalScore += Math.max(0, gpaRatio * 15);
    }
  } else if (!scholarship.min_gpa) {
    totalScore += 15; // No GPA requirement
  }

  // 5. Language Requirements (10 points)
  maxPossibleScore += 10;
  if (scholarship.min_ielts && userProfile.ielts_score) {
    if (userProfile.ielts_score >= scholarship.min_ielts) {
      totalScore += 10;
    } else {
      // Partial score based on how close they are
      const ieltsRatio = userProfile.ielts_score / scholarship.min_ielts;
      totalScore += Math.max(0, ieltsRatio * 10);
    }
  } else if (scholarship.min_toefl && userProfile.toefl_score) {
    if (userProfile.toefl_score >= scholarship.min_toefl) {
      totalScore += 10;
    } else {
      const toeflRatio = userProfile.toefl_score / scholarship.min_toefl;
      totalScore += Math.max(0, toeflRatio * 10);
    }
  } else if (!scholarship.min_ielts && !scholarship.min_toefl) {
    totalScore += 10; // No language requirement
  }

  // 6. Experience Match (10 points)
  maxPossibleScore += 10;
  const experienceScore = calculateExperienceMatch(userProfile, scholarship);
  totalScore += experienceScore;

  // Convert to percentage
  const percentage = Math.round((totalScore / maxPossibleScore) * 100);
  return Math.min(100, Math.max(0, percentage));
}

function calculateExperienceMatch(userProfile: UserProfile, scholarship: Scholarship): number {
  let experienceScore = 0;
  const requirements = scholarship.requirements.join(' ').toLowerCase();
  
  // Leadership experience
  if (requirements.includes('leadership') && userProfile.has_leadership_experience) {
    experienceScore += 4;
  }
  
  // Research experience
  if (requirements.includes('research') && userProfile.has_research_experience) {
    experienceScore += 3;
  }
  
  // Work experience
  if (requirements.includes('work') || requirements.includes('experience')) {
    if (userProfile.work_experience_years && userProfile.work_experience_years > 0) {
      experienceScore += Math.min(3, userProfile.work_experience_years);
    }
  }

  return Math.min(10, experienceScore);
}

/**
 * Get match color class based on score
 */
export function getMatchColorClass(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 80) return 'bg-blue-100 text-blue-800';
  if (score >= 70) return 'bg-yellow-100 text-yellow-800';
  if (score >= 60) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * Get deadline status and color
 */
export function getDeadlineStatus(deadline: string) {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { 
    status: 'expired', 
    text: 'Expired', 
    color: 'bg-red-100 text-red-800' 
  };
  if (diffDays <= 7) return { 
    status: 'urgent', 
    text: `${diffDays} days left`, 
    color: 'bg-red-100 text-red-800' 
  };
  if (diffDays <= 30) return { 
    status: 'soon', 
    text: `${diffDays} days left`, 
    color: 'bg-yellow-100 text-yellow-800' 
  };
  return { 
    status: 'normal', 
    text: `${diffDays} days left`, 
    color: 'bg-green-100 text-green-800' 
  };
}

/**
 * Sort scholarships by match score and other criteria
 */
export function sortScholarships(
  scholarships: (Scholarship & { match_score?: number })[],
  sortBy: 'match_score' | 'deadline' | 'title' = 'match_score'
) {
  return [...scholarships].sort((a, b) => {
    switch (sortBy) {
      case 'match_score':
        return (b.match_score || 0) - (a.match_score || 0);
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
} 