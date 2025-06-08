import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

// University database with detailed information
const UNIVERSITIES = [
    {
        id: 'harvard',
        name: 'Harvard University',
        country: 'United States',
        ranking: 1,
        acceptance_rate: 3.4,
        avg_gpa: 4.18,
        strengths: ['research-excellence', 'prestigious-faculty', 'global-network', 'innovation'],
        programs: {
            'computer-science': 95,
            'business': 98,
            'medicine': 99,
            'law': 97,
            'engineering': 88
        },
        requirements: {
            min_gpa: 3.7,
            english_test: true,
            research_experience: 'highly-preferred'
        },
        cost: 79850,
        scholarships: true
    },
    {
        id: 'mit',
        name: 'MIT',
        country: 'United States',
        ranking: 2,
        acceptance_rate: 4.1,
        avg_gpa: 4.17,
        strengths: ['research-excellence', 'innovation', 'industry-connections', 'technology-focus'],
        programs: {
            'computer-science': 99,
            'engineering': 99,
            'business': 94,
            'physics': 98
        },
        requirements: {
            min_gpa: 3.65,
            english_test: true,
            research_experience: 'highly-preferred'
        },
        cost: 77020,
        scholarships: true
    },
    {
        id: 'stanford',
        name: 'Stanford University',
        country: 'United States',
        ranking: 3,
        acceptance_rate: 4.8,
        avg_gpa: 4.16,
        strengths: ['innovation', 'entrepreneurship', 'research-excellence', 'industry-connections'],
        programs: {
            'computer-science': 97,
            'business': 96,
            'engineering': 95,
            'medicine': 93
        },
        requirements: {
            min_gpa: 3.6,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 74570,
        scholarships: true
    },
    {
        id: 'oxford',
        name: 'University of Oxford',
        country: 'United Kingdom',
        ranking: 4,
        acceptance_rate: 15.0,
        avg_gpa: 3.9,
        strengths: ['academic-tradition', 'research-excellence', 'global-reputation'],
        programs: {
            'philosophy': 99,
            'politics': 97,
            'medicine': 95,
            'law': 96
        },
        requirements: {
            min_gpa: 3.7,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 35000,
        scholarships: true
    },
    {
        id: 'cambridge',
        name: 'University of Cambridge',
        country: 'United Kingdom',
        ranking: 5,
        acceptance_rate: 18.0,
        avg_gpa: 3.85,
        strengths: ['research-excellence', 'academic-tradition', 'innovation'],
        programs: {
            'mathematics': 99,
            'physics': 98,
            'computer-science': 95,
            'engineering': 96
        },
        requirements: {
            min_gpa: 3.65,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 33000,
        scholarships: true
    },
    {
        id: 'toronto',
        name: 'University of Toronto',
        country: 'Canada',
        ranking: 21,
        acceptance_rate: 43.0,
        avg_gpa: 3.6,
        strengths: ['research-excellence', 'diversity', 'affordable-quality', 'industry-connections'],
        programs: {
            'computer-science': 88,
            'engineering': 85,
            'medicine': 92,
            'business': 83,
            'psychology': 86
        },
        requirements: {
            min_gpa: 3.3,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 28000,
        scholarships: true
    },
    {
        id: 'melbourne',
        name: 'University of Melbourne',
        country: 'Australia',
        ranking: 33,
        acceptance_rate: 70.0,
        avg_gpa: 3.4,
        strengths: ['research-excellence', 'international-focus', 'industry-connections', 'innovation'],
        programs: {
            'business': 90,
            'engineering': 85,
            'medicine': 88,
            'law': 86,
            'computer-science': 82
        },
        requirements: {
            min_gpa: 3.0,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 25000,
        scholarships: true
    },
    {
        id: 'eth-zurich',
        name: 'ETH Zurich',
        country: 'Switzerland',
        ranking: 11,
        acceptance_rate: 27.0,
        avg_gpa: 3.8,
        strengths: ['research-excellence', 'innovation', 'technology-focus', 'industry-connections'],
        programs: {
            'engineering': 98,
            'computer-science': 96,
            'physics': 95,
            'mathematics': 94
        },
        requirements: {
            min_gpa: 3.5,
            english_test: true,
            research_experience: 'highly-preferred'
        },
        cost: 1500,
        scholarships: true
    },
    {
        id: 'nus',
        name: 'National University of Singapore',
        country: 'Singapore',
        ranking: 25,
        acceptance_rate: 5.0,
        avg_gpa: 3.7,
        strengths: ['innovation', 'industry-connections', 'global-network', 'research-excellence'],
        programs: {
            'computer-science': 92,
            'engineering': 90,
            'business': 88,
            'law': 85
        },
        requirements: {
            min_gpa: 3.4,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 20000,
        scholarships: true
    }
];

interface UserProfile {
    academic_background: {
        gpa: string;
        degree_type: string;
        field_of_study: string;
        university_name: string;
    };
    target_program: {
        field: string;
        level: string; // masters, phd, undergraduate
        preferred_countries: string[];
    };
    preferences: {
        university_qualities: string[];
        aspirations: string[];
        budget_range?: string;
        research_focus?: string;
    };
    experience: {
        work_experience: any[];
        research_experience?: any[];
        achievements: any[];
        skills?: string[];
    };
}

interface UniversityMatch {
    university: any;
    match_score: number;
    match_breakdown: {
        academic_fit: number;
        program_strength: number;
        preference_alignment: number;
        competitiveness: number;
        financial_feasibility: number;
    };
    strengths: string[];
    concerns: string[];
    improvement_suggestions: string[];
    admission_probability: string;
    estimated_cost_fit: string;
}

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userProfile = await request.json();
        
        const matches = UNIVERSITIES.map(university => {
            const matchScore = calculateMatchScore(university, userProfile);
            return {
                university,
                match_score: matchScore,
                strengths: identifyStrengths(university, userProfile),
                concerns: identifyConcerns(university, userProfile),
                admission_probability: calculateAdmissionProbability(university, userProfile)
            };
        });

        // Sort by match score
        matches.sort((a, b) => b.match_score - a.match_score);

        return json({
            matches: matches.slice(0, 10),
            recommendations: generateRecommendations(matches, userProfile)
        });

    } catch (error) {
        console.error('University matching error:', error);
        return json({ error: 'Failed to generate matches' }, { status: 500 });
    }
};

function calculateMatchScore(university: any, userProfile: any): number {
    let score = 0;
    
    // Academic fit (40% weight)
    const gpa = parseFloat(userProfile.gpa) || 3.0;
    if (gpa >= university.avg_gpa) {
        score += 40;
    } else if (gpa >= university.requirements.min_gpa) {
        score += 25;
    } else {
        score += 10;
    }
    
    // Program strength (30% weight)
    const targetField = normalizeField(userProfile.field);
    const programScore = university.programs[targetField] || 70;
    score += (programScore / 100) * 30;
    
    // Preference alignment (20% weight)
    const qualities = userProfile.qualities || [];
    const alignedQualities = qualities.filter((q: string) => 
        university.strengths.some((s: string) => s.includes(q) || q.includes(s))
    );
    score += (alignedQualities.length / Math.max(qualities.length, 1)) * 20;
    
    // Cost consideration (10% weight)
    if (university.cost < 40000) {
        score += 10;
    } else if (university.cost < 60000) {
        score += 7;
    } else {
        score += 3;
    }
    
    return Math.round(score);
}

function normalizeField(field: string): string {
    const normalized = field.toLowerCase().replace(/\s+/g, '-');
    const mappings: { [key: string]: string } = {
        'computer-science': 'computer-science',
        'cs': 'computer-science',
        'business': 'business',
        'mba': 'business',
        'engineering': 'engineering',
        'medicine': 'medicine',
        'law': 'law'
    };
    return mappings[normalized] || normalized;
}

function identifyStrengths(university: any, userProfile: any): string[] {
    const strengths = [];
    
    const gpa = parseFloat(userProfile.gpa) || 3.0;
    if (gpa >= university.avg_gpa) {
        strengths.push('Strong academic match');
    }
    
    if (university.ranking <= 10) {
        strengths.push('Top-tier global ranking');
    }
    
    if (university.scholarships) {
        strengths.push('Scholarship opportunities available');
    }
    
    return strengths;
}

function identifyConcerns(university: any, userProfile: any): string[] {
    const concerns = [];
    
    const gpa = parseFloat(userProfile.gpa) || 3.0;
    if (gpa < university.requirements.min_gpa) {
        concerns.push('GPA below minimum requirements');
    }
    
    if (university.acceptance_rate < 10) {
        concerns.push('Extremely competitive admission');
    }
    
    if (university.cost > 60000) {
        concerns.push('High tuition costs');
    }
    
    return concerns;
}

function calculateAdmissionProbability(university: any, userProfile: any): string {
    const gpa = parseFloat(userProfile.gpa) || 3.0;
    
    if (gpa >= university.avg_gpa && university.acceptance_rate > 20) {
        return 'High';
    } else if (gpa >= university.requirements.min_gpa) {
        return 'Moderate';
    } else {
        return 'Low';
    }
}

function generateRecommendations(matches: any[], userProfile: any): string[] {
    const recommendations = [];
    
    if (matches.length > 0) {
        recommendations.push(`Consider ${matches[0].university.name} as your top choice`);
    }
    
    const safetySchools = matches.filter(m => m.admission_probability === 'High');
    if (safetySchools.length > 0) {
        recommendations.push(`Include safety schools like ${safetySchools[0].university.name}`);
    }
    
    recommendations.push('Apply to 8-12 universities across different competitiveness levels');
    
    return recommendations;
} 