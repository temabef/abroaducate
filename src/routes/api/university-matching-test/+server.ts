import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { universityDataManager } from '$lib/database/university-integration';
import { ukUniversityDataManager } from '$lib/database/uk-university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';

// TEST-ONLY University Matching API (no authentication required)
// This is a simplified version for testing the university data integration

interface UserProfile {
    gpa: string;
    field: string;
    degree_level: string;
    qualities: string[];
    value_approach: string;
    research_interest: string;
    preferred_countries: string[];
    scholarship_priority: string;
    nationality?: string;
}

// Elite universities data (core set)
const ELITE_UNIVERSITIES = [
    {
        id: 'harvard',
        name: 'Harvard University',
        country: 'United States',
        region: 'North America',
        ranking: 1,
        acceptance_rate: 3.4,
        avg_gpa: 4.18,
        programs: {
            'computer-science': 95,
            'business': 98,
            'medicine': 99,
            'engineering': 88
        },
        cost: 79850,
        living_cost: 25000,
        scholarships: true,
        scholarship_percentage: 65,
        location_type: 'urban',
        class_size: 'small',
        research_opportunities: 'extensive'
    },
    {
        id: 'mit',
        name: 'MIT',
        country: 'United States',
        region: 'North America',
        ranking: 2,
        acceptance_rate: 4.1,
        avg_gpa: 4.17,
        programs: {
            'computer-science': 99,
            'engineering': 99,
            'data-science': 97,
            'artificial-intelligence': 99
        },
        cost: 77020,
        living_cost: 24000,
        scholarships: true,
        scholarship_percentage: 58,
        location_type: 'urban',
        class_size: 'small',
        research_opportunities: 'extensive'
    },
    {
        id: 'stanford',
        name: 'Stanford University',
        country: 'United States',
        region: 'North America',
        ranking: 3,
        acceptance_rate: 4.8,
        avg_gpa: 4.16,
        programs: {
            'computer-science': 97,
            'business': 96,
            'entrepreneurship': 99,
            'engineering': 95
        },
        cost: 74570,
        living_cost: 26000,
        scholarships: true,
        scholarship_percentage: 70,
        location_type: 'suburban',
        class_size: 'small',
        research_opportunities: 'extensive'
    }
];

async function getTestHybridUniversities(userProfile: UserProfile): Promise<any[]> {
    try {
        console.log('🔗 TEST: Getting hybrid university data...');
        
        // Get College Scorecard universities
        const apiUniversities = await universityDataManager.fetchUSUniversities('CA', 5, COLLEGE_SCORECARD_API_KEY);
        console.log(`📊 API Universities: ${apiUniversities.length}`);
        
        // Get UK universities if requested
        let ukUniversities: any[] = [];
        if (userProfile.preferred_countries.includes('United Kingdom')) {
            ukUniversities = await ukUniversityDataManager.fetchUKUniversities(3);
            console.log(`🇬🇧 UK Universities: ${ukUniversities.length}`);
        }
        
        // Combine all data sources
        const allUniversities = [
            ...ELITE_UNIVERSITIES,
            ...apiUniversities,
            ...ukUniversities
        ];
        
        console.log(`✅ Total hybrid universities: ${allUniversities.length} (${ELITE_UNIVERSITIES.length} elite + ${apiUniversities.length} API + ${ukUniversities.length} UK)`);
        return allUniversities;
        
    } catch (error) {
        console.error('❌ Error fetching hybrid universities:', error);
        // Fallback to elite universities only
        return ELITE_UNIVERSITIES;
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        console.log('🧪 TEST: University matching endpoint called');
        const userProfile = await request.json();
        
        // Get hybrid universities (elite + API + UK)
        const universities = await getTestHybridUniversities(userProfile);
        
        // Simple matching algorithm for testing
        const matches = universities.map(university => {
            const matchScore = calculateSimpleMatchScore(university, userProfile);
            
            return {
                university,
                match_score: matchScore,
                match_breakdown: {
                    academic_fit: calculateAcademicFit(university, userProfile),
                    program_strength: calculateProgramStrength(university, userProfile),
                    geographic_fit: calculateGeographicFit(university, userProfile),
                    financial_feasibility: calculateFinancialFeasibility(university, userProfile)
                },
                strengths: identifyStrengths(university, userProfile),
                concerns: identifyConcerns(university, userProfile),
                admission_probability: calculateAdmissionProbability(university, userProfile),
                estimated_cost_fit: calculateCostFit(university, userProfile)
            };
        });

        // Sort by match score
        matches.sort((a, b) => b.match_score - a.match_score);

        return json({
            success: true,
            total_universities: universities.length,
            matches: matches.slice(0, 10),
            data_sources: {
                elite_count: ELITE_UNIVERSITIES.length,
                api_count: universities.length - ELITE_UNIVERSITIES.length,
                sources_used: ['Elite Universities', 'College Scorecard API', 'UK Universities']
            },
            test_mode: true
        });

    } catch (error) {
        console.error('❌ TEST: University matching error:', error);
        return json({ 
            success: false,
            error: 'Failed to generate matches',
            details: error instanceof Error ? error.message : 'Unknown error',
            test_mode: true
        }, { status: 500 });
    }
};

// Simplified matching functions for testing
function calculateSimpleMatchScore(university: any, userProfile: UserProfile): number {
    const academic = calculateAcademicFit(university, userProfile);
    const program = calculateProgramStrength(university, userProfile);
    const geographic = calculateGeographicFit(university, userProfile);
    const financial = calculateFinancialFeasibility(university, userProfile);
    
    return Math.round((academic * 0.3 + program * 0.3 + geographic * 0.2 + financial * 0.2));
}

function calculateAcademicFit(university: any, userProfile: UserProfile): number {
    const userGpa = parseFloat(userProfile.gpa);
    const reqGpa = university.avg_gpa || 3.0;
    
    if (userGpa >= reqGpa) return 85;
    if (userGpa >= reqGpa - 0.3) return 70;
    if (userGpa >= reqGpa - 0.5) return 55;
    return 40;
}

function calculateProgramStrength(university: any, userProfile: UserProfile): number {
    if (!university.programs) return 50;
    
    const programScore = university.programs[userProfile.field] || 
                        university.programs['general-studies'] || 50;
    return programScore;
}

function calculateGeographicFit(university: any, userProfile: UserProfile): number {
    if (userProfile.preferred_countries.includes(university.country)) {
        return 90;
    }
    return 30;
}

function calculateFinancialFeasibility(university: any, userProfile: UserProfile): number {
    const cost = university.cost || 50000;
    
    // Simple cost-based scoring
    if (cost < 30000) return 90;
    if (cost < 50000) return 75;
    if (cost < 70000) return 60;
    return 40;
}

function identifyStrengths(university: any, userProfile: UserProfile): string[] {
    const strengths = [];
    
    if (university.ranking <= 10) strengths.push('Top global ranking');
    if (university.scholarship_percentage > 60) strengths.push('Excellent scholarship opportunities');
    if (university.research_opportunities === 'extensive') strengths.push('Strong research programs');
    if (university.cost < 40000) strengths.push('Affordable tuition');
    
    return strengths;
}

function identifyConcerns(university: any, userProfile: UserProfile): string[] {
    const concerns = [];
    
    if (university.acceptance_rate < 10) concerns.push('Highly competitive admission');
    if (university.cost > 70000) concerns.push('High tuition costs');
    
    const userGpa = parseFloat(userProfile.gpa);
    const reqGpa = university.avg_gpa || 3.0;
    if (userGpa < reqGpa - 0.2) concerns.push('GPA below typical admitted students');
    
    return concerns;
}

function calculateAdmissionProbability(university: any, userProfile: UserProfile): string {
    const userGpa = parseFloat(userProfile.gpa);
    const reqGpa = university.avg_gpa || 3.0;
    const acceptanceRate = university.acceptance_rate || 50;
    
    if (userGpa >= reqGpa && acceptanceRate > 30) return 'High';
    if (userGpa >= reqGpa - 0.2 && acceptanceRate > 15) return 'Moderate';
    if (userGpa >= reqGpa - 0.4) return 'Low';
    return 'Very Low';
}

function calculateCostFit(university: any, userProfile: UserProfile): string {
    const cost = university.cost || 50000;
    
    if (cost < 30000) return 'Excellent';
    if (cost < 50000) return 'Good';
    if (cost < 70000) return 'Fair';
    return 'Challenging';
} 