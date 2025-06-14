import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY, COLLEGE_SCORECARD_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { universityDataManager } from '$lib/database/university-integration';
import { ukUniversityDataManager } from '$lib/database/uk-university-integration';
import { canadianUniversityManager } from '$lib/database/canada-university-integration';
import { australianUniversityManager } from '$lib/database/australia-university-integration';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';

// Enhanced University database with detailed information + scholarship connections
// Now integrated with Phase II hybrid system for 1000+ universities
const UNIVERSITIES = [
    {
        id: 'harvard',
        name: 'Harvard University',
        country: 'United States',
        region: 'North America',
        ranking: 1,
        acceptance_rate: 3.4,
        avg_gpa: 4.18,
        strengths: ['research-excellence', 'prestigious-faculty', 'global-network', 'innovation'],
        programs: {
            'computer-science': 95,
            'software-engineering': 93,
            'data-science': 96,
            'artificial-intelligence': 97,
            'business': 98,
            'mba': 99,
            'finance': 97,
            'marketing': 95,
            'medicine': 99,
            'pre-med': 98,
            'law': 97,
            'engineering': 88,
            'bioengineering': 94,
            'psychology': 92,
            'economics': 96,
            'political-science': 94,
            'international-relations': 95
        },
        requirements: {
            min_gpa: 3.7,
            english_test: true,
            research_experience: 'highly-preferred'
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
        strengths: ['research-excellence', 'innovation', 'industry-connections', 'technology-focus'],
        programs: {
            'computer-science': 99,
            'software-engineering': 98,
            'data-science': 97,
            'artificial-intelligence': 99,
            'engineering': 99,
            'electrical-engineering': 99,
            'mechanical-engineering': 98,
            'bioengineering': 97,
            'business': 94,
            'mba': 96,
            'physics': 98,
            'mathematics': 97,
            'robotics': 99,
            'cybersecurity': 96
        },
        requirements: {
            min_gpa: 3.65,
            english_test: true,
            research_experience: 'highly-preferred'
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
        strengths: ['innovation', 'entrepreneurship', 'research-excellence', 'industry-connections'],
        programs: {
            'computer-science': 97,
            'software-engineering': 96,
            'data-science': 98,
            'artificial-intelligence': 98,
            'business': 96,
            'mba': 98,
            'entrepreneurship': 99,
            'engineering': 95,
            'electrical-engineering': 96,
            'medicine': 93,
            'psychology': 94,
            'economics': 95,
            'design': 97
        },
        requirements: {
            min_gpa: 3.6,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 74570,
        living_cost: 26000,
        scholarships: true,
        scholarship_percentage: 70,
        location_type: 'suburban',
        class_size: 'small',
        research_opportunities: 'extensive'
    },
    {
        id: 'oxford',
        name: 'University of Oxford',
        country: 'United Kingdom',
        region: 'Europe',
        ranking: 4,
        acceptance_rate: 15.0,
        avg_gpa: 3.9,
        strengths: ['academic-tradition', 'research-excellence', 'global-reputation'],
        programs: {
            'philosophy': 99,
            'politics': 97,
            'international-relations': 98,
            'medicine': 95,
            'law': 96,
            'economics': 94,
            'history': 98,
            'english-literature': 97,
            'computer-science': 89,
            'engineering': 88,
            'business': 92,
            'mba': 94
        },
        requirements: {
            min_gpa: 3.7,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 35000,
        living_cost: 18000,
        scholarships: true,
        scholarship_percentage: 45,
        location_type: 'historic-town',
        class_size: 'small',
        research_opportunities: 'extensive'
    },
    {
        id: 'cambridge',
        name: 'University of Cambridge',
        country: 'United Kingdom',
        region: 'Europe',
        ranking: 5,
        acceptance_rate: 18.0,
        avg_gpa: 3.85,
        strengths: ['research-excellence', 'academic-tradition', 'innovation'],
        programs: {
            'mathematics': 99,
            'physics': 98,
            'computer-science': 95,
            'engineering': 96,
            'natural-sciences': 97,
            'medicine': 94,
            'law': 95,
            'economics': 93,
            'philosophy': 96,
            'history': 97,
            'english-literature': 96
        },
        requirements: {
            min_gpa: 3.65,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 33000,
        living_cost: 16000,
        scholarships: true,
        scholarship_percentage: 40,
        location_type: 'historic-town',
        class_size: 'small',
        research_opportunities: 'extensive'
    },
    {
        id: 'toronto',
        name: 'University of Toronto',
        country: 'Canada',
        region: 'North America',
        ranking: 21,
        acceptance_rate: 43.0,
        avg_gpa: 3.6,
        strengths: ['research-excellence', 'diversity', 'affordable-quality', 'industry-connections'],
        programs: {
            'computer-science': 88,
            'software-engineering': 86,
            'data-science': 87,
            'engineering': 85,
            'medicine': 92,
            'business': 83,
            'mba': 87,
            'psychology': 86,
            'economics': 84,
            'political-science': 85,
            'international-relations': 84,
            'finance': 86
        },
        requirements: {
            min_gpa: 3.3,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 28000,
        living_cost: 15000,
        scholarships: true,
        scholarship_percentage: 55,
        location_type: 'urban',
        class_size: 'large',
        research_opportunities: 'good'
    },
    {
        id: 'melbourne',
        name: 'University of Melbourne',
        country: 'Australia',
        region: 'Oceania',
        ranking: 33,
        acceptance_rate: 70.0,
        avg_gpa: 3.4,
        strengths: ['research-excellence', 'international-focus', 'industry-connections', 'innovation'],
        programs: {
            'business': 90,
            'mba': 91,
            'engineering': 85,
            'computer-science': 82,
            'medicine': 88,
            'law': 86,
            'psychology': 84,
            'economics': 83,
            'international-relations': 85,
            'design': 88
        },
        requirements: {
            min_gpa: 3.0,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 25000,
        living_cost: 20000,
        scholarships: true,
        scholarship_percentage: 35,
        location_type: 'urban',
        class_size: 'large',
        research_opportunities: 'good'
    },
    {
        id: 'eth-zurich',
        name: 'ETH Zurich',
        country: 'Switzerland',
        region: 'Europe',
        ranking: 11,
        acceptance_rate: 27.0,
        avg_gpa: 3.8,
        strengths: ['research-excellence', 'innovation', 'technology-focus', 'industry-connections'],
        programs: {
            'engineering': 98,
            'computer-science': 96,
            'software-engineering': 95,
            'data-science': 94,
            'physics': 95,
            'mathematics': 94,
            'robotics': 97,
            'artificial-intelligence': 95,
            'cybersecurity': 93
        },
        requirements: {
            min_gpa: 3.5,
            english_test: true,
            research_experience: 'highly-preferred'
        },
        cost: 1500,
        living_cost: 25000,
        scholarships: true,
        scholarship_percentage: 25,
        location_type: 'urban',
        class_size: 'medium',
        research_opportunities: 'extensive'
    },
    {
        id: 'nus',
        name: 'National University of Singapore',
        country: 'Singapore',
        region: 'Asia',
        ranking: 25,
        acceptance_rate: 5.0,
        avg_gpa: 3.7,
        strengths: ['innovation', 'industry-connections', 'global-network', 'research-excellence'],
        programs: {
            'computer-science': 92,
            'software-engineering': 90,
            'data-science': 91,
            'engineering': 90,
            'business': 88,
            'mba': 89,
            'finance': 90,
            'law': 85,
            'medicine': 87,
            'economics': 86
        },
        requirements: {
            min_gpa: 3.4,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 20000,
        living_cost: 12000,
        scholarships: true,
        scholarship_percentage: 50,
        location_type: 'urban',
        class_size: 'medium',
        research_opportunities: 'good'
    }
];

// Enhanced field mapping with 50+ specializations and fuzzy matching
const FIELD_MAPPINGS: { [key: string]: string[] } = {
    'computer-science': ['computer science', 'cs', 'computing', 'informatics', 'computational science', 'cse'],
    'software-engineering': ['software engineering', 'software development', 'software eng', 'se', 'software dev'],
    'data-science': ['data science', 'data analytics', 'big data', 'data mining', 'analytics', 'data analysis'],
    'artificial-intelligence': ['artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural networks'],
    'cybersecurity': ['cybersecurity', 'information security', 'cyber security', 'security', 'infosec', 'cyber'],
    'robotics': ['robotics', 'robot', 'automation', 'mechatronics', 'autonomous systems'],
    'business': ['business', 'business administration', 'management', 'commerce', 'bba', 'business studies'],
    'mba': ['mba', 'master of business administration', 'masters in business', 'business masters'],
    'finance': ['finance', 'financial', 'banking', 'investment', 'fintech', 'financial engineering'],
    'marketing': ['marketing', 'digital marketing', 'advertising', 'brand management', 'sales'],
    'entrepreneurship': ['entrepreneurship', 'startup', 'innovation management', 'venture capital', 'innovation'],
    'engineering': ['engineering', 'general engineering', 'applied engineering'],
    'electrical-engineering': ['electrical engineering', 'ee', 'electronics', 'power systems', 'electrical'],
    'mechanical-engineering': ['mechanical engineering', 'me', 'mechanical', 'manufacturing', 'aerospace'],
    'bioengineering': ['bioengineering', 'biomedical engineering', 'biotechnology', 'biomed', 'bio engineering'],
    'medicine': ['medicine', 'medical', 'healthcare', 'md', 'medical school', 'clinical medicine'],
    'pre-med': ['pre-med', 'pre-medical', 'premed', 'pre medicine', 'medical preparation'],
    'law': ['law', 'legal studies', 'jurisprudence', 'jd', 'legal', 'law school'],
    'psychology': ['psychology', 'psych', 'behavioral science', 'cognitive science', 'mental health'],
    'economics': ['economics', 'econ', 'economic studies', 'econometrics', 'applied economics'],
    'political-science': ['political science', 'politics', 'government', 'public policy', 'political studies'],
    'international-relations': ['international relations', 'ir', 'international studies', 'global studies', 'diplomacy'],
    'philosophy': ['philosophy', 'phil', 'ethics', 'moral philosophy', 'critical thinking'],
    'history': ['history', 'historical studies', 'heritage studies', 'archival studies'],
    'english-literature': ['english literature', 'literature', 'english', 'creative writing', 'literary studies'],
    'mathematics': ['mathematics', 'math', 'pure math', 'applied math', 'statistics', 'mathematical sciences'],
    'physics': ['physics', 'physical sciences', 'theoretical physics', 'applied physics', 'astrophysics'],
    'natural-sciences': ['natural sciences', 'sciences', 'life sciences', 'biological sciences', 'environmental science'],
    'design': ['design', 'graphic design', 'industrial design', 'ux design', 'ui design', 'product design'],
    'chemistry': ['chemistry', 'chemical sciences', 'biochemistry', 'organic chemistry', 'analytical chemistry'],
    'biology': ['biology', 'biological sciences', 'life sciences', 'molecular biology', 'cell biology'],
    'environmental-science': ['environmental science', 'environmental studies', 'sustainability', 'ecology'],
    'public-health': ['public health', 'health sciences', 'epidemiology', 'health policy', 'global health'],
    'social-work': ['social work', 'social services', 'community development', 'human services'],
    'education': ['education', 'teaching', 'pedagogy', 'educational studies', 'curriculum'],
    'journalism': ['journalism', 'media studies', 'communications', 'mass communication', 'broadcast'],
    'architecture': ['architecture', 'architectural studies', 'urban planning', 'landscape architecture'],
    'nursing': ['nursing', 'nursing science', 'healthcare nursing', 'clinical nursing'],
    'pharmacy': ['pharmacy', 'pharmaceutical sciences', 'pharmacology', 'clinical pharmacy']
};

interface UserProfile {
    gpa: string;
    field: string;
    degree_level: string;
    qualities: string[];
    value_approach: string;  // NEW: Replace budget_preference
    research_interest: string;
    preferred_countries: string[];
    scholarship_priority: string; // NEW: How important are scholarships?
    nationality?: string; // Optional field for scholarship filtering
}

interface UniversityMatch {
    university: any;
    match_score: number;
    match_breakdown: {
        academic_fit: number;
        program_strength: number;
        preference_alignment: number;
        geographic_fit: number;
        financial_feasibility: number;
        scholarship_opportunities: number; // NEW: Scholarship potential score
    };
    strengths: string[];
    concerns: string[];
    improvement_suggestions: string[];
    admission_probability: string;
    estimated_cost_fit: string;
    // NEW: Scholarship intelligence fields
    relevant_scholarships: ScholarshipMatch[];
    funding_analysis: FundingAnalysis;
    cost_after_aid: number;
}

interface ScholarshipMatch {
    id: string;
    title: string;
    provider: string;
    amount: string;
    match_score: number;
    deadline: string;
    type: string;
    why_relevant: string;
}

interface FundingAnalysis {
    original_cost: number;
    potential_aid: number;
    estimated_final_cost: number;
    affordability_rating: 'Excellent' | 'Good' | 'Fair' | 'Challenging';
    funding_strategy: string;
}

// NEW: Scholarship Amount Intelligence System

interface StandardizedScholarshipAmount {
    annual_value: number; // Always in USD per year
    coverage_type: 'full_funding' | 'tuition_only' | 'living_expenses' | 'partial' | 'stipend';
    confidence_level: 'high' | 'medium' | 'low' | 'estimated';
    original_text: string;
    includes_living: boolean;
    includes_tuition: boolean;
}

function parseScholarshipAmount(scholarshipAmount: string, scholarshipType: string, country: string): StandardizedScholarshipAmount {
    const amount = scholarshipAmount.toLowerCase().trim();
    
    // 1. DIRECT AMOUNT PARSING
    if (amount.includes('$')) {
        const numericValue = extractNumericValue(amount);
        if (numericValue > 0) {
            const annualValue = normalizeToAnnual(numericValue, amount);
            return {
                annual_value: annualValue,
                coverage_type: determineCoverageType(amount),
                confidence_level: 'high',
                original_text: scholarshipAmount,
                includes_living: amount.includes('living') || amount.includes('stipend'),
                includes_tuition: amount.includes('tuition') || amount.includes('full')
            };
        }
    }
    
    // 2. CURRENCY CONVERSION
    if (amount.includes('€') || amount.includes('eur')) {
        const numericValue = extractNumericValue(amount);
        const usdValue = convertToUSD(numericValue, 'EUR') * (amount.includes('month') ? 12 : 1);
        return {
            annual_value: usdValue,
            coverage_type: determineCoverageType(amount),
            confidence_level: 'high',
            original_text: scholarshipAmount,
            includes_living: amount.includes('living') || amount.includes('allowance'),
            includes_tuition: amount.includes('tuition') || amount.includes('fees')
        };
    }
    
    // 3. QUALITATIVE ANALYSIS
    if (amount.includes('full') && (amount.includes('fund') || amount.includes('cover'))) {
        const estimatedValue = estimateFullFunding(country, scholarshipType);
        return {
            annual_value: estimatedValue,
            coverage_type: 'full_funding',
            confidence_level: 'medium',
            original_text: scholarshipAmount,
            includes_living: true,
            includes_tuition: true
        };
    }
    
    // 4. PARTIAL COVERAGE ESTIMATION
    if (amount.includes('tuition') && !amount.includes('living')) {
        const tuitionEstimate = estimateTuitionCoverage(country, scholarshipType);
        return {
            annual_value: tuitionEstimate,
            coverage_type: 'tuition_only',
            confidence_level: 'medium',
            original_text: scholarshipAmount,
            includes_living: false,
            includes_tuition: true
        };
    }
    
    // 5. CONTEXT-BASED ESTIMATION
    return estimateByContext(scholarshipType, country, scholarshipAmount);
}

function extractNumericValue(text: string): number {
    // Extract numbers from text like "$50,000", "€1,200", "45k"
    const matches = text.match(/[\d,]+\.?\d*/g);
    if (!matches) return 0;
    
    let value = parseFloat(matches[0].replace(/,/g, ''));
    
    // Handle k/K notation
    if (text.includes('k') || text.includes('K')) {
        value *= 1000;
    }
    
    return value;
}

function normalizeToAnnual(value: number, text: string): number {
    if (text.includes('month')) return value * 12;
    if (text.includes('semester')) return value * 2;
    if (text.includes('year') || text.includes('annual')) return value;
    
    // Default assumption: if > 100k, likely total program; if < 100k, likely annual
    return value > 100000 && !text.includes('year') ? value / 2 : value;
}

function estimateFullFunding(country: string, scholarshipType: string): number {
    // Evidence-based estimates for "full funding" by country
    const countryEstimates: { [key: string]: number } = {
        'United States': 65000,  // Average grad school total cost
        'United Kingdom': 45000, // UK international student costs
        'Canada': 35000,         // Canadian graduate costs
        'Australia': 42000,      // Australian international costs
        'Germany': 25000,        // Lower tuition + living costs
        'France': 22000,         // EU costs with living
        'Netherlands': 35000,    // Dutch graduate costs
        'Switzerland': 55000,    // High living costs
        'Singapore': 40000,      // Asian hub costs
        'Sweden': 30000          // Scandinavian average
    };
    
    const baseEstimate = countryEstimates[country] || 35000;
    
    // Adjust by scholarship prestige
    if (scholarshipType?.includes('government') || scholarshipType?.includes('national')) {
        return baseEstimate * 1.2; // Government scholarships tend to be more generous
    }
    
    return baseEstimate;
}

function estimateTuitionCoverage(country: string, scholarshipType: string): number {
    // Tuition-only estimates
    const tuitionEstimates: { [key: string]: number } = {
        'United States': 45000,
        'United Kingdom': 30000,
        'Canada': 20000,
        'Australia': 28000,
        'Germany': 2000,     // Low tuition fees
        'France': 3000,
        'Netherlands': 15000,
        'Switzerland': 1500,
        'Singapore': 25000,
        'Sweden': 0          // No tuition for EU students
    };
    
    return tuitionEstimates[country] || 25000;
}

function estimateByContext(scholarshipType: string, country: string, originalText: string): StandardizedScholarshipAmount {
    // Context-based estimation for unclear amounts
    let estimatedValue = 25000; // Conservative default
    let coverageType: StandardizedScholarshipAmount['coverage_type'] = 'partial';
    let confidenceLevel: StandardizedScholarshipAmount['confidence_level'] = 'low';
    
    // Type-based adjustments
    if (scholarshipType?.includes('Merit-based')) {
        estimatedValue = 35000;
        coverageType = 'tuition_only';
    } else if (scholarshipType?.includes('Research-based')) {
        estimatedValue = 45000;
        coverageType = 'full_funding';
        confidenceLevel = 'medium';
    }
    
    // Provider-based adjustments  
    if (originalText.includes('government') || originalText.includes('national')) {
        estimatedValue *= 1.3;
        confidenceLevel = 'medium';
    }
    
    return {
        annual_value: estimatedValue,
        coverage_type: coverageType,
        confidence_level: confidenceLevel,
        original_text: originalText,
        includes_living: coverageType === 'full_funding',
        includes_tuition: true
    };
}

function determineCoverageType(text: string): StandardizedScholarshipAmount['coverage_type'] {
    if (text.includes('full') && (text.includes('fund') || text.includes('stipend'))) {
        return 'full_funding';
    } else if (text.includes('tuition') && !text.includes('living')) {
        return 'tuition_only';
    } else if (text.includes('living') || text.includes('stipend')) {
        return text.includes('tuition') ? 'full_funding' : 'living_expenses';
    }
    return 'partial';
}

function convertToUSD(amount: number, fromCurrency: string): number {
    // Simplified conversion rates (in production, use real-time API)
    const rates: { [key: string]: number } = {
        'EUR': 1.08,
        'GBP': 1.25,
        'CAD': 0.74,
        'AUD': 0.65,
        'CHF': 1.12,
        'SGD': 0.74,
        'SEK': 0.092
    };
    
    return amount * (rates[fromCurrency] || 1);
}

// Function to get hybrid universities (elite + API)
async function getHybridUniversities(userProfile: UserProfile): Promise<any[]> {
    console.log("Fetching hybrid university data based on user profile:", userProfile);

    const { preferred_countries, degree_level } = userProfile;
    let combinedUniversities: any[] = [];

    // --- Country-Specific Fetching ---
    console.log(`Preferred countries: ${preferred_countries.join(', ')}`);

    const promises = [];

    // Fetch US universities (API-based)
    if (preferred_countries.includes('United States')) {
        promises.push(
            (async () => {
                try {
                    const usUniversities =
                        degree_level === 'phd' || degree_level === 'masters'
                            ? await universityDataManager.fetchTopUSUniversities(
                                  200,
                                  COLLEGE_SCORECARD_API_KEY
                              )
                            : await universityDataManager.fetchUSUniversities(
                                  undefined,
                                  1000,
                                  COLLEGE_SCORECARD_API_KEY
                              );
                    console.log(`✅ Fetched ${usUniversities.length} US universities.`);
                    return usUniversities;
                } catch (error) {
                    console.error('Error fetching US universities:', error);
                    return [];
                }
            })()
        );
    }

    // Fetch UK universities (Hardcoded JSON)
    if (preferred_countries.includes('United Kingdom')) {
        promises.push(
            (async () => {
                try {
                    const ukUniversities = await ukUniversityDataManager.fetchUKUniversities(100);
                    console.log(`✅ Fetched ${ukUniversities.length} UK universities.`);
                    return ukUniversities;
                } catch (error) {
                    console.error('Error fetching UK universities:', error);
                    return [];
                }
            })()
        );
    }

    // Fetch Canadian universities (Hardcoded JSON)
    if (preferred_countries.includes('Canada')) {
        promises.push(
            (async () => {
                try {
                    const canadianUniversities = await canadianUniversityManager.fetchCanadianUniversities(
                        undefined,
                        100
                    );
                    console.log(`✅ Fetched ${canadianUniversities.length} Canadian universities.`);
                    return canadianUniversities;
                } catch (error) {
                    console.error('Error fetching Canadian universities:', error);
                    return [];
                }
            })()
        );
    }

    // Fetch Australian universities (Hardcoded JSON)
    if (preferred_countries.includes('Australia')) {
        promises.push(
            (async () => {
                try {
                    const australianUniversities =
                        await australianUniversityManager.fetchAustralianUniversities(undefined, 100);
                    console.log(`✅ Fetched ${australianUniversities.length} Australian universities.`);
                    return australianUniversities;
                } catch (error) {
                    console.error('Error fetching Australian universities:', error);
                    return [];
                }
            })()
        );
    }

    // Fetch German universities (Hardcoded JSON)
    if (preferred_countries.includes('Germany')) {
        promises.push(
            (async () => {
                try {
                    const germanUniversities = await universityDataManager.fetchGermanUniversities(undefined, 100);
                    console.log(`✅ Fetched ${germanUniversities.length} German universities.`);
                    return germanUniversities;
                } catch (error) {
                    console.error('Error fetching German universities:', error);
                    return [];
                }
            })()
        );
    }

    // Fetch Dutch universities (Hardcoded JSON)
    if (preferred_countries.includes('Netherlands')) {
        promises.push(
            (async () => {
                try {
                    const dutchUniversities = await universityDataManager.fetchDutchUniversities(undefined, 100);
                    console.log(`✅ Fetched ${dutchUniversities.length} Dutch universities.`);
                    return dutchUniversities;
                } catch (error) {
                    console.error('Error fetching Dutch universities:', error);
                    return [];
                }
            })()
        );
    }

    try {
        const results = await Promise.all(promises);
        combinedUniversities = results.flat();
    } catch (error) {
        console.error('Error fetching one or more university sources:', error);
    }

    // Add elite hardcoded universities if they match the country preference
    const eliteUniversities = UNIVERSITIES.filter((uni) =>
        preferred_countries.includes(uni.country)
    );
    combinedUniversities.push(...eliteUniversities);

    // Remove duplicates
    const uniqueUniversities = Array.from(new Map(combinedUniversities.map(item => [item.id, item])).values());
    
    console.log(`📊 Total unique university pool for matching: ${uniqueUniversities.length}`);

    return uniqueUniversities;
}

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
	const session = await getSession();
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userProfile = await request.json();
		
		// Get hybrid universities (elite + API) for comprehensive matching
		console.log('🔗 Phase 2.1: Using hybrid university system (Elite + Phase II API data)');
		const universities = await getHybridUniversities(userProfile);
		console.log(`📊 Total universities available: ${universities.length} (${UNIVERSITIES.length} elite + ${universities.length - UNIVERSITIES.length} API)`);
		
		const matches = await Promise.all(universities.map(async university => {
			const matchScore = calculateEnhancedMatchScore(university, userProfile);
			const matchBreakdown = calculateMatchBreakdown(university, userProfile);
			const scholarshipData = await calculateScholarshipIntelligence(university, userProfile, supabase);
			
			return {
				university,
				match_score: matchScore,
				match_breakdown: matchBreakdown,
				strengths: identifyEnhancedStrengths(university, userProfile),
				concerns: identifyEnhancedConcerns(university, userProfile),
				improvement_suggestions: generateImprovementSuggestions(university, userProfile),
				admission_probability: calculateEnhancedAdmissionProbability(university, userProfile),
				estimated_cost_fit: calculateCostFit(university, userProfile),
				// NEW: Scholarship intelligence
				relevant_scholarships: scholarshipData.relevant_scholarships,
				funding_analysis: scholarshipData.funding_analysis,
				cost_after_aid: scholarshipData.cost_after_aid
			};
		}));

		// Sort by match score
		matches.sort((a, b) => b.match_score - a.match_score);

		return json({
			matches: matches.slice(0, 10),
			recommendations: generateEnhancedRecommendations(matches, userProfile)
		});

	} catch (error) {
		console.error('University matching error:', error);
		return json({ error: 'Failed to generate matches' }, { status: 500 });
	}
};

function calculateEnhancedMatchScore(university: any, userProfile: UserProfile): number {
	const breakdown = calculateMatchBreakdown(university, userProfile);
	
	// Dynamic weighting based on degree level and user priorities
	const weights = getDynamicWeights(userProfile);
	
	const score = (
		breakdown.academic_fit * weights.academic +
		breakdown.program_strength * weights.program +
		breakdown.preference_alignment * weights.preference +
		breakdown.geographic_fit * weights.geographic +
		breakdown.financial_feasibility * weights.financial +
		breakdown.scholarship_opportunities * weights.scholarship
	);
	
	// Apply degree level bonus/penalty
	const degreeLevelModifier = calculateDegreeLevelModifier(university, userProfile);
	
	return Math.round(Math.min(100, score + degreeLevelModifier));
}

function getDynamicWeights(userProfile: UserProfile): any {
	// Base weights (scholarship-aware by default)
	let weights = {
		academic: 0.22,
		program: 0.20,
		preference: 0.18,
		geographic: 0.12,
		financial: 0.13,
		scholarship: 0.15  // Higher base weight for scholarships
	};

	// Adjust weights based on degree level
	switch (userProfile.degree_level) {
		case 'phd':
			// PhD prioritizes research and funding opportunities
			weights.program = 0.30;
			weights.academic = 0.25;
			weights.scholarship = 0.20; // Higher for PhD funding
			weights.preference = 0.12;
			weights.geographic = 0.08;
			weights.financial = 0.05;
			break;
		case 'masters':
			// Masters balances all factors with strong scholarship focus
			weights.academic = 0.25;
			weights.program = 0.22;
			weights.scholarship = 0.18;
			weights.preference = 0.15;
			weights.geographic = 0.12;
			weights.financial = 0.08;
			break;
		case 'undergraduate':
			// Undergrad considers broader fit with moderate scholarship focus
			weights.academic = 0.22;
			weights.program = 0.18;
			weights.scholarship = 0.15;
			weights.preference = 0.20;
			weights.geographic = 0.15;
			weights.financial = 0.10;
			break;
	}

	// Adjust based on VALUE APPROACH (new system)
	switch (userProfile.value_approach) {
		case 'maximum_savings':
			// Maximize scholarship and financial factors
			weights.scholarship += 0.10;
			weights.financial += 0.05;
			weights.program -= 0.08;
			weights.preference -= 0.07;
			break;
		case 'scholarship_hunter':
			// Aggressively prioritize scholarship opportunities
			weights.scholarship += 0.15;
			weights.financial += 0.03;
			weights.academic -= 0.05;
			weights.program -= 0.08;
			weights.preference -= 0.05;
			break;
		case 'value_for_money':
			// Balanced approach with slight scholarship boost
			weights.scholarship += 0.05;
			weights.program += 0.03;
			weights.financial += 0.02;
			weights.preference -= 0.05;
			weights.geographic -= 0.05;
			break;
		case 'investment_focused':
			// Focus on program quality and career outcomes
			weights.program += 0.10;
			weights.academic += 0.05;
			weights.scholarship += 0.02; // Still want some savings
			weights.preference -= 0.08;
			weights.geographic -= 0.04;
			weights.financial -= 0.05;
			break;
	}

	// Adjust based on SCHOLARSHIP PRIORITY
	switch (userProfile.scholarship_priority) {
		case 'essential':
			// Cannot attend without significant aid
			weights.scholarship += 0.15;
			weights.financial += 0.10;
			weights.program -= 0.10;
			weights.preference -= 0.10;
			weights.geographic -= 0.05;
			break;
		case 'high':
			// Actively seeking to minimize costs
			weights.scholarship += 0.08;
			weights.financial += 0.05;
			weights.program -= 0.05;
			weights.preference -= 0.05;
			weights.geographic -= 0.03;
			break;
		case 'moderate':
			// Open to scholarships but not dependent
			// Keep current weights (no adjustment)
			break;
		case 'low':
			// Scholarships are bonus, focus on fit
			weights.scholarship -= 0.05;
			weights.financial -= 0.03;
			weights.program += 0.05;
			weights.academic += 0.03;
			break;
	}

	// Ensure weights sum to 1.0
	const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
	Object.keys(weights).forEach(key => {
		(weights as any)[key] = (weights as any)[key] / totalWeight;
	});

	return weights;
}

function calculateDegreeLevelModifier(university: any, userProfile: UserProfile): number {
	let modifier = 0;
	
	// Research university bonus for PhD
	if (userProfile.degree_level === 'phd' && university.research_opportunities === 'extensive') {
		modifier += 5;
	}
	
	// Top ranking bonus varies by degree level
	if (university.ranking <= 10) {
		switch (userProfile.degree_level) {
			case 'phd': modifier += 3; break;
			case 'masters': modifier += 2; break;
			case 'undergraduate': modifier += 1; break;
		}
	}
	
	// Class size preference by degree level
	if (userProfile.degree_level === 'phd' && university.class_size === 'small') {
		modifier += 2;
	} else if (userProfile.degree_level === 'undergraduate' && university.class_size === 'large') {
		modifier += 1; // More social opportunities
	}
	
	return modifier;
}

function calculateMatchBreakdown(university: any, userProfile: UserProfile) {
	return {
		academic_fit: calculateAcademicFit(university, userProfile),
		program_strength: calculateProgramStrength(university, userProfile),
		preference_alignment: calculatePreferenceAlignment(university, userProfile),
		geographic_fit: calculateGeographicFit(university, userProfile),
		financial_feasibility: calculateFinancialFeasibility(university, userProfile),
		scholarship_opportunities: calculateScholarshipOpportunities(university, userProfile)
	};
}

function calculateAcademicFit(university: any, userProfile: UserProfile): number {
	const gpa = parseFloat(userProfile.gpa) || 3.0;
	let score = 0;
	
	// GPA comparison with more nuanced scoring
	if (gpa >= university.avg_gpa + 0.1) {
		score = 100; // Exceeds average
	} else if (gpa >= university.avg_gpa) {
		score = 90; // Meets average
	} else if (gpa >= university.requirements.min_gpa + 0.2) {
		score = 80; // Above minimum with buffer
	} else if (gpa >= university.requirements.min_gpa) {
		score = 60; // Meets minimum
	} else if (gpa >= university.requirements.min_gpa - 0.2) {
		score = 40; // Slightly below minimum
	} else {
		score = 20; // Well below requirements
	}
	
	// Bonus for research experience alignment
	if (userProfile.research_interest && university.research_opportunities === 'extensive') {
		score = Math.min(100, score + 10);
	}
	
	return score;
}

function calculateProgramStrength(university: any, userProfile: UserProfile): number {
	const normalizedField = normalizeEnhancedField(userProfile.field);
	
	if (normalizedField && university.programs[normalizedField]) {
		return university.programs[normalizedField];
	}
	
	// Try related fields
	const relatedFields = findRelatedFields(userProfile.field);
	let bestScore = 0;
	
	for (const field of relatedFields) {
		if (university.programs[field]) {
			bestScore = Math.max(bestScore, university.programs[field] * 0.8); // 80% for related fields
		}
	}
	
	return bestScore || 60; // Default moderate score if no match
}

function calculatePreferenceAlignment(university: any, userProfile: UserProfile): number {
	if (!userProfile.qualities || userProfile.qualities.length === 0) {
		return 75; // Default neutral score
	}
	
	const alignedQualities = userProfile.qualities.filter((quality: string) => 
		university.strengths.some((strength: string) => 
			strength.includes(quality) || quality.includes(strength)
		)
	);
	
	const alignmentPercentage = alignedQualities.length / userProfile.qualities.length;
	return Math.round(alignmentPercentage * 100);
}

function calculateGeographicFit(university: any, userProfile: UserProfile): number {
	if (!userProfile.preferred_countries || userProfile.preferred_countries.length === 0) {
		return 75; // Neutral score if no preference specified
	}
	
	// Direct country match
	if (userProfile.preferred_countries.includes(university.country)) {
		return 100;
	}
	
	// Regional match (partial score)
	const preferredRegions = getRegionsForCountries(userProfile.preferred_countries);
	if (preferredRegions.includes(university.region)) {
		return 70;
	}
	
	return 30; // Low score for non-preferred locations
}

function calculateFinancialFeasibility(university: any, userProfile: UserProfile): number {
	const totalCost = university.cost + (university.living_cost || 0);
	
	// Budget preference mapping
	const budgetRanges = {
		'low': 30000,
		'moderate': 60000,
		'high': 100000,
		'unlimited': Infinity
	};
	
	const maxBudget = budgetRanges[userProfile.value_approach as keyof typeof budgetRanges] || budgetRanges.moderate;
	
	if (totalCost <= maxBudget * 0.7) {
		return 100; // Well within budget
	} else if (totalCost <= maxBudget) {
		return 80; // Within budget
	} else if (totalCost <= maxBudget * 1.3) {
		// Consider scholarship opportunities
		const scholarshipAdjustedCost = totalCost * (1 - (university.scholarship_percentage || 0) / 100);
		if (scholarshipAdjustedCost <= maxBudget) {
			return 60; // Feasible with scholarships
		}
		return 40; // Slightly over budget
	} else {
		return 20; // Significantly over budget
	}
}

function normalizeEnhancedField(field: string): string | null {
	const normalized = field.toLowerCase().trim();
	
	for (const [key, variations] of Object.entries(FIELD_MAPPINGS)) {
		if (variations.some(variation => 
			normalized.includes(variation) || variation.includes(normalized)
		)) {
			return key;
		}
	}
	
	return null;
}

function findRelatedFields(field: string): string[] {
	const normalizedField = normalizeEnhancedField(field);
	if (!normalizedField) return [];
	
	// Enhanced field relationships with comprehensive cross-mapping
	const fieldRelationships: { [key: string]: string[] } = {
		'computer-science': ['software-engineering', 'data-science', 'artificial-intelligence', 'cybersecurity', 'mathematics', 'robotics'],
		'software-engineering': ['computer-science', 'data-science', 'cybersecurity', 'artificial-intelligence'],
		'data-science': ['computer-science', 'artificial-intelligence', 'mathematics', 'economics', 'business'],
		'artificial-intelligence': ['computer-science', 'data-science', 'robotics', 'mathematics', 'cybersecurity'],
		'cybersecurity': ['computer-science', 'software-engineering', 'artificial-intelligence'],
		'robotics': ['artificial-intelligence', 'computer-science', 'mechanical-engineering', 'electrical-engineering'],
		'business': ['mba', 'finance', 'marketing', 'entrepreneurship', 'economics', 'management'],
		'mba': ['business', 'finance', 'marketing', 'entrepreneurship', 'economics'],
		'finance': ['business', 'mba', 'economics', 'mathematics', 'entrepreneurship'],
		'marketing': ['business', 'mba', 'entrepreneurship', 'psychology'],
		'entrepreneurship': ['business', 'mba', 'finance', 'marketing', 'innovation'],
		'engineering': ['electrical-engineering', 'mechanical-engineering', 'bioengineering', 'computer-science'],
		'electrical-engineering': ['engineering', 'computer-science', 'physics', 'robotics'],
		'mechanical-engineering': ['engineering', 'physics', 'robotics', 'design'],
		'bioengineering': ['engineering', 'medicine', 'biology', 'chemistry', 'pre-med'],
		'medicine': ['pre-med', 'bioengineering', 'psychology', 'biology', 'chemistry', 'public-health'],
		'pre-med': ['medicine', 'biology', 'chemistry', 'psychology', 'bioengineering'],
		'law': ['political-science', 'international-relations', 'economics', 'philosophy'],
		'psychology': ['medicine', 'education', 'social-work', 'philosophy', 'biology'],
		'economics': ['finance', 'business', 'political-science', 'mathematics', 'data-science'],
		'political-science': ['law', 'international-relations', 'economics', 'history', 'philosophy'],
		'international-relations': ['political-science', 'law', 'economics', 'history', 'journalism'],
		'philosophy': ['law', 'psychology', 'political-science', 'history', 'english-literature'],
		'history': ['political-science', 'international-relations', 'philosophy', 'english-literature'],
		'english-literature': ['history', 'philosophy', 'journalism', 'education'],
		'mathematics': ['computer-science', 'data-science', 'physics', 'economics', 'finance'],
		'physics': ['mathematics', 'engineering', 'electrical-engineering', 'mechanical-engineering'],
		'chemistry': ['medicine', 'bioengineering', 'biology', 'pharmacy', 'environmental-science'],
		'biology': ['medicine', 'pre-med', 'chemistry', 'bioengineering', 'environmental-science'],
		'environmental-science': ['biology', 'chemistry', 'public-health', 'engineering'],
		'public-health': ['medicine', 'environmental-science', 'social-work', 'biology'],
		'social-work': ['psychology', 'public-health', 'education', 'political-science'],
		'education': ['psychology', 'social-work', 'english-literature', 'history'],
		'journalism': ['international-relations', 'political-science', 'english-literature', 'marketing'],
		'architecture': ['design', 'engineering', 'environmental-science'],
		'design': ['architecture', 'marketing', 'psychology', 'mechanical-engineering'],
		'nursing': ['medicine', 'public-health', 'psychology', 'biology'],
		'pharmacy': ['chemistry', 'medicine', 'biology', 'public-health']
	};
	
	return fieldRelationships[normalizedField] || [];
}

function getRegionsForCountries(countries: string[]): string[] {
	const countryToRegion: { [key: string]: string } = {
		'United States': 'North America',
		'Canada': 'North America',
		'United Kingdom': 'Europe',
		'Germany': 'Europe',
		'France': 'Europe',
		'Switzerland': 'Europe',
		'Australia': 'Oceania',
		'Singapore': 'Asia'
	};
	
	return countries.map(country => countryToRegion[country]).filter(Boolean);
}

function identifyEnhancedStrengths(university: any, userProfile: UserProfile): string[] {
	const strengths = [];
	const gpa = parseFloat(userProfile.gpa) || 3.0;
	
	// Academic strengths
	if (gpa >= university.avg_gpa) {
		strengths.push('Strong academic match - Your GPA exceeds university average');
	} else if (gpa >= university.requirements.min_gpa + 0.2) {
		strengths.push('Good academic match - Well above minimum requirements');
	}
	
	// Ranking and reputation
	if (university.ranking <= 5) {
		strengths.push('World-class institution - Top 5 global ranking');
	} else if (university.ranking <= 20) {
		strengths.push('Elite institution - Top 20 global ranking');
	} else if (university.ranking <= 50) {
		strengths.push('Highly ranked institution - Top 50 globally');
	}
	
	// Program strength
	const normalizedField = normalizeEnhancedField(userProfile.field);
	if (normalizedField && university.programs[normalizedField]) {
		const programScore = university.programs[normalizedField];
		if (programScore >= 95) {
			strengths.push('Exceptional program strength - Top-tier in your field');
		} else if (programScore >= 85) {
			strengths.push('Strong program reputation - Well-regarded in your field');
		}
	}
	
	// Financial advantages
	if (university.cost < 40000) {
		strengths.push('Affordable tuition - Cost-effective option');
	}
	if (university.scholarship_percentage && university.scholarship_percentage > 60) {
		strengths.push('Excellent scholarship opportunities - High percentage of students receive aid');
	}
	
	// Research opportunities
	if (userProfile.research_interest && university.research_opportunities === 'extensive') {
		strengths.push('Outstanding research opportunities - Perfect for your research interests');
	}
	
	return strengths;
}

function identifyEnhancedConcerns(university: any, userProfile: UserProfile): string[] {
	const concerns = [];
	const gpa = parseFloat(userProfile.gpa) || 3.0;
	
	// Academic concerns
	if (gpa < university.requirements.min_gpa) {
		const gap = university.requirements.min_gpa - gpa;
		concerns.push(`GPA below minimum (${gap.toFixed(2)} points below required ${university.requirements.min_gpa})`);
	} else if (gpa < university.avg_gpa - 0.2) {
		concerns.push('GPA below typical admitted student average - Consider strengthening other application areas');
	}
	
	// Competitiveness concerns
	if (university.acceptance_rate < 5) {
		concerns.push('Extremely competitive admission (less than 5% acceptance rate)');
	} else if (university.acceptance_rate < 15) {
		concerns.push('Highly competitive admission - Ensure strong supporting materials');
	}
	
	// Financial concerns
	const totalCost = university.cost + (university.living_cost || 0);
	const budgetRanges = {
		'low': 30000,
		'moderate': 60000,
		'high': 100000
	};
	const maxBudget = budgetRanges[userProfile.value_approach as keyof typeof budgetRanges];
	
	if (maxBudget && totalCost > maxBudget * 1.2) {
		concerns.push(`High total cost (${formatCurrency(totalCost)}) may exceed your budget`);
	}
	
	// Geographic concerns
	if (userProfile.preferred_countries && 
		userProfile.preferred_countries.length > 0 && 
		!userProfile.preferred_countries.includes(university.country)) {
		concerns.push('Location outside your preferred countries');
	}
	
	return concerns;
}

function generateImprovementSuggestions(university: any, userProfile: UserProfile): string[] {
	const suggestions = [];
	const gpa = parseFloat(userProfile.gpa) || 3.0;
	
	// Academic improvements
	if (gpa < university.avg_gpa) {
		suggestions.push('Consider strengthening your academic profile with additional coursework or certifications');
	}
	
	// Research experience
	if (university.requirements.research_experience === 'highly-preferred' && !userProfile.research_interest) {
		suggestions.push('Gain research experience or highlight existing research work in your application');
	}
	
	// Program-specific improvements
	const normalizedField = normalizeEnhancedField(userProfile.field);
	if (normalizedField && university.programs[normalizedField] < 80) {
		suggestions.push('Consider if this university offers the best program strength for your field');
	}
	
	return suggestions;
}

function calculateEnhancedAdmissionProbability(university: any, userProfile: UserProfile): string {
	const gpa = parseFloat(userProfile.gpa) || 3.0;
	const breakdown = calculateMatchBreakdown(university, userProfile);
	
	// Weighted probability calculation
	let probabilityScore = 0;
	
	// Academic factor (40% weight)
	if (gpa >= university.avg_gpa) {
		probabilityScore += 40;
	} else if (gpa >= university.requirements.min_gpa + 0.1) {
		probabilityScore += 30;
	} else if (gpa >= university.requirements.min_gpa) {
		probabilityScore += 20;
	} else {
		probabilityScore += 5;
	}
	
	// Acceptance rate factor (30% weight)
	if (university.acceptance_rate > 50) {
		probabilityScore += 30;
	} else if (university.acceptance_rate > 20) {
		probabilityScore += 20;
	} else if (university.acceptance_rate > 10) {
		probabilityScore += 15;
	} else {
		probabilityScore += 5;
	}
	
	// Program fit factor (20% weight)
	probabilityScore += (breakdown.program_strength / 100) * 20;
	
	// Preference alignment factor (10% weight)
	probabilityScore += (breakdown.preference_alignment / 100) * 10;
	
	if (probabilityScore >= 70) {
		return 'High';
	} else if (probabilityScore >= 45) {
		return 'Moderate';
	} else if (probabilityScore >= 25) {
		return 'Low';
	} else {
		return 'Very Low';
	}
}

function calculateCostFit(university: any, userProfile: UserProfile): string {
	const totalCost = university.cost + (university.living_cost || 0);
	const budgetRanges = {
		'low': 30000,
		'moderate': 60000,
		'high': 100000,
		'unlimited': Infinity
	};
	
	const maxBudget = budgetRanges[userProfile.value_approach as keyof typeof budgetRanges] || budgetRanges.moderate;
	
	if (totalCost <= maxBudget * 0.7) {
		return 'Excellent';
	} else if (totalCost <= maxBudget) {
		return 'Good';
	} else if (totalCost <= maxBudget * 1.3) {
		return university.scholarship_percentage && university.scholarship_percentage > 40 ? 'Fair (with aid)' : 'Challenging';
	} else {
		return 'Poor fit';
	}
}

function generateEnhancedRecommendations(matches: UniversityMatch[], userProfile: UserProfile): string[] {
	const recommendations = [];
	
	if (matches.length === 0) {
		recommendations.push('Consider broadening your search criteria or improving your academic profile');
		return recommendations;
	}
	
	// Generate portfolio-based recommendations
	const portfolio = generateUniversityPortfolio(matches, userProfile);
	
	// Top choice recommendation with confidence
	const topMatch = matches[0];
	recommendations.push(`🎯 ${topMatch.university.name} is your strongest match (${topMatch.match_score}% compatibility)`);
	
	// Portfolio recommendations
	if (portfolio.safety.length > 0) {
		recommendations.push(`🛡️ Safety schools: Apply to ${portfolio.safety.slice(0, 2).map((m: UniversityMatch) => m.university.name).join(' and ')} (high acceptance probability)`);
	}
	
	if (portfolio.target.length > 0) {
		recommendations.push(`🎯 Target schools: ${portfolio.target.slice(0, 2).map((m: UniversityMatch) => m.university.name).join(' and ')} align well with your profile`);
	}
	
	if (portfolio.reach.length > 0) {
		recommendations.push(`🚀 Reach schools: Consider ${portfolio.reach[0].university.name} as a stretch goal - strengthen your ${getImprovementAreas(portfolio.reach[0], userProfile).join(' and ')}`);
	}
	
	// Budget-specific advice
	const budgetAdvice = generateBudgetAdvice(matches, userProfile);
	if (budgetAdvice) {
		recommendations.push(budgetAdvice);
	}
	
	// Degree-specific advice
	const degreeAdvice = generateDegreeSpecificAdvice(matches, userProfile);
	if (degreeAdvice) {
		recommendations.push(degreeAdvice);
	}
	
	// Geographic diversity recommendation
	const geoAdvice = generateGeographicAdvice(matches, userProfile);
	if (geoAdvice) {
		recommendations.push(geoAdvice);
	}
	
	// Application strategy
	const applicationCount = getRecommendedApplicationCount(userProfile);
	recommendations.push(`📝 Apply to ${applicationCount} universities for optimal acceptance chances`);
	
	return recommendations;
}

function generateUniversityPortfolio(matches: UniversityMatch[], userProfile: UserProfile): any {
	return {
		safety: matches.filter((m: UniversityMatch) => m.admission_probability === 'High' || m.admission_probability === 'Moderate'),
		target: matches.filter((m: UniversityMatch) => m.match_score >= 70 && (m.admission_probability === 'Moderate' || m.admission_probability === 'Low')),
		reach: matches.filter((m: UniversityMatch) => m.admission_probability === 'Low' || m.admission_probability === 'Very Low').slice(0, 3)
	};
}

function generateBudgetAdvice(matches: UniversityMatch[], userProfile: UserProfile): string | null {
	const affordableOptions = matches.filter((m: UniversityMatch) => m.estimated_cost_fit === 'Excellent' || m.estimated_cost_fit === 'Good');
	const scholarshipOptions = matches.filter((m: UniversityMatch) => m.university.scholarship_percentage > 50);
	
	if (userProfile.value_approach === 'maximum_savings' && affordableOptions.length > 0) {
		return `💰 Budget-friendly: ${affordableOptions[0].university.name} offers excellent value at ${formatCurrency(affordableOptions[0].university.cost + affordableOptions[0].university.living_cost)}`;
	}
	
	if (scholarshipOptions.length > 0) {
		return `🎓 Scholarship opportunities: ${scholarshipOptions[0].university.name} awards aid to ${scholarshipOptions[0].university.scholarship_percentage}% of students`;
	}
	
	return null;
}

function generateDegreeSpecificAdvice(matches: UniversityMatch[], userProfile: UserProfile): string | null {
	switch (userProfile.degree_level) {
		case 'phd':
			const researchIntensive = matches.filter((m: UniversityMatch) => m.university.research_opportunities === 'extensive');
			if (researchIntensive.length > 0) {
				return `🔬 Research focus: ${researchIntensive[0].university.name} offers extensive research opportunities ideal for PhD studies`;
			}
			break;
		case 'masters':
			const industryConnected = matches.filter((m: UniversityMatch) => m.university.strengths.includes('industry-connections'));
			if (industryConnected.length > 0) {
				return `🏢 Career prospects: ${industryConnected[0].university.name} has strong industry connections for post-graduation opportunities`;
			}
			break;
		case 'undergraduate':
			const wellRounded = matches.filter((m: UniversityMatch) => m.match_breakdown.preference_alignment > 80);
			if (wellRounded.length > 0) {
				return `🌟 Holistic fit: ${wellRounded[0].university.name} aligns perfectly with your interests and values`;
			}
			break;
	}
	return null;
}

function generateGeographicAdvice(matches: UniversityMatch[], userProfile: UserProfile): string | null {
	const countries = [...new Set(matches.slice(0, 5).map((m: UniversityMatch) => m.university.country))];
	
	if (countries.length > 2) {
		return `🌍 Geographic diversity: Consider applying across ${countries.slice(0, 3).join(', ')} for varied experiences`;
	}
	
	if (!userProfile.preferred_countries || userProfile.preferred_countries.length === 0) {
		const topCountry = countries[0];
		return `🗺️ Location focus: ${topCountry} offers multiple strong options for your field`;
	}
	
	return null;
}

function getImprovementAreas(match: UniversityMatch, userProfile: UserProfile): string[] {
	const areas = [];
	
	if (match.match_breakdown.academic_fit < 70) {
		areas.push('academic credentials');
	}
	if (match.match_breakdown.program_strength < 80) {
		areas.push('field-specific experience');
	}
	if (userProfile.research_interest === '' && match.university.research_opportunities === 'extensive') {
		areas.push('research experience');
	}
	
	return areas.length > 0 ? areas : ['application materials'];
}

function getRecommendedApplicationCount(userProfile: UserProfile): string {
	switch (userProfile.degree_level) {
		case 'phd': return '6-8';
		case 'masters': return '8-12';
		case 'undergraduate': return '10-15';
		default: return '8-12';
	}
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(amount);
}

// NEW: Scholarship Intelligence Functions

function calculateScholarshipOpportunities(university: any, userProfile: UserProfile): number {
	let score = 0;
	
	// Base scholarship availability score
	if (university.scholarship_percentage) {
		score += Math.min(50, university.scholarship_percentage);
	}
	
	// University-specific scholarship programs
	if (university.ranking <= 10) {
		score += 20; // Top universities often have better funding
	} else if (university.ranking <= 50) {
		score += 10;
	}
	
	// Field-specific funding opportunities
	const fieldBonus = calculateFieldScholarshipBonus(userProfile.field, university);
	score += fieldBonus;
	
	// International student considerations
	if (userProfile.nationality && userProfile.nationality !== university.country) {
		// International students often have specific scholarships
		score += 10;
	}
	
	// Research funding for PhD/Research programs
	if (userProfile.degree_level === 'phd' && university.research_opportunities === 'extensive') {
		score += 15;
	}
	
	return Math.min(100, score);
}

async function calculateScholarshipIntelligence(university: any, userProfile: UserProfile, supabase: any): Promise<{
	relevant_scholarships: ScholarshipMatch[];
	funding_analysis: FundingAnalysis;
	cost_after_aid: number;
}> {
	// Real database query to your scholarship table
	const relevantScholarships = await generateRelevantScholarships(university, userProfile, supabase);
	
	const originalCost = university.cost + (university.living_cost || 0);
	const potentialAid = calculatePotentialAid(university, userProfile, relevantScholarships);
	const finalCost = Math.max(0, originalCost - potentialAid);
	
	const fundingAnalysis: FundingAnalysis = {
		original_cost: originalCost,
		potential_aid: potentialAid,
		estimated_final_cost: finalCost,
		affordability_rating: calculateAffordabilityRating(finalCost, userProfile),
		funding_strategy: generateFundingStrategy(university, userProfile, relevantScholarships)
	};
	
	return {
		relevant_scholarships: relevantScholarships,
		funding_analysis: fundingAnalysis,
		cost_after_aid: finalCost
	};
}

function calculateFieldScholarshipBonus(field: string, university: any): number {
	const fieldBonuses: { [key: string]: number } = {
		'computer-science': 15,
		'engineering': 12,
		'medicine': 10,
		'business': 8,
		'research': 10
	};
	
	const normalizedField = normalizeEnhancedField(field);
	return fieldBonuses[normalizedField || ''] || 5;
}

async function generateRelevantScholarships(university: any, userProfile: UserProfile, supabase: any): Promise<ScholarshipMatch[]> {
	// Real database query to your scholarship table
	let query = supabase
		.from('scholarships')
		.select('*')
		.eq('is_active', true);
	
	// Location filtering for international students
	const universityCountry = university.country;
	if (universityCountry === 'United States') {
		query = query.or(`location.ilike.%United States%,location.ilike.%USA%,location.ilike.%Global%`);
	} else if (universityCountry === 'United Kingdom') {
		query = query.or(`location.ilike.%United Kingdom%,location.ilike.%UK%,location.ilike.%Global%`);
	} else {
		query = query.or(`location.ilike.%${universityCountry}%,location.ilike.%Global%,location.ilike.%International%`);
	}
	
	// Field matching (including cross-field relationships)
	const normalizedField = normalizeEnhancedField(userProfile.field);
	const relatedFields = normalizedField ? findRelatedFields(normalizedField) : [];
	const fieldFilters = [normalizedField || userProfile.field, ...relatedFields, 'All Fields'].join(',');
	query = query.in('field', fieldFilters.split(','));
	
	// Level filtering
	let levelFilters = [userProfile.degree_level];
	if (userProfile.degree_level === 'masters') {
		levelFilters.push('Graduate', 'Master\'s', 'Masters');
	} else if (userProfile.degree_level === 'phd') {
		levelFilters.push('PhD', 'Doctoral', 'Graduate', 'Research');
	}
	query = query.in('level', levelFilters);
	
	// GPA requirements
	const userGPA = parseFloat(userProfile.gpa) || 3.0;
	query = query.or(`min_gpa.is.null,min_gpa.lte.${userGPA}`);
	
	const { data: scholarships, error } = await query
		.order('deadline', { ascending: true })
		.limit(5);
	
	if (error || !scholarships) {
		console.error('Scholarship query error:', error);
		return [];
	}
	
	// Transform to match interface and calculate relevance
	return scholarships.map((scholarship: any) => ({
		id: scholarship.id,
		title: scholarship.title,
		provider: scholarship.provider,
		amount: scholarship.amount,
		match_score: calculateRealScholarshipMatch(userProfile, scholarship),
		deadline: scholarship.deadline,
		type: scholarship.funding_category || scholarship.type,
		why_relevant: generateRelevanceExplanation(userProfile, scholarship, university)
	})).sort((a: any, b: any) => b.match_score - a.match_score).slice(0, 3);
}

function calculateRealScholarshipMatch(userProfile: UserProfile, scholarship: any): number {
	let score = 50; // Base score
	
	// GPA matching
	const userGPA = parseFloat(userProfile.gpa) || 3.0;
	if (!scholarship.min_gpa || userGPA >= scholarship.min_gpa) {
		score += 20;
		if (userGPA >= 3.7) score += 10;
	}
	
	// Field relevance
	const normalizedField = normalizeEnhancedField(userProfile.field);
	if (scholarship.field.toLowerCase().includes(normalizedField) || 
		scholarship.field.toLowerCase() === 'all fields') {
		score += 15;
	}
	
	// Level match
	if (scholarship.level.toLowerCase().includes(userProfile.degree_level)) {
		score += 15;
	}
	
	// Research alignment for PhD
	if (userProfile.degree_level === 'phd' && 
		(scholarship.type.toLowerCase().includes('research') || 
		 scholarship.funding_category === 'Graduate Program Funding')) {
		score += 10;
	}
	
	// Position-specific bonus
	if (scholarship.funding_category === 'Advertised Position' && 
		scholarship.professor_name) {
		score += 15; // Direct position opportunities
	}
	
	return Math.min(100, score);
}

function generateRelevanceExplanation(userProfile: UserProfile, scholarship: any, university: any): string {
	if (scholarship.funding_category === 'Graduate Program Funding') {
		return `Perfect for ${userProfile.degree_level} students in ${userProfile.field}. Offers ${scholarship.funding_type} position at ${scholarship.university_name}.`;
	} else if (scholarship.funding_category === 'Advertised Position') {
		return `Direct research position with Prof. ${scholarship.professor_name}. Matches your ${userProfile.field} background and ${university.name} affiliation.`;
	} else {
		return `Excellent match for ${userProfile.field} students pursuing ${userProfile.degree_level} degree in ${university.country}.`;
	}
}

function calculatePotentialAid(university: any, userProfile: UserProfile, scholarships: ScholarshipMatch[]): number {
	let totalAid = 0;
	
	// University scholarships
	if (university.scholarship_percentage) {
		totalAid += (university.cost * university.scholarship_percentage / 100);
	}
	
	// External scholarships (estimate)
	const externalScholarshipValue = scholarships.reduce((sum, scholarship) => {
		const amount = parseFloat(scholarship.amount.replace(/[^0-9]/g, '')) || 0;
		return sum + Math.min(amount, 50000); // Cap at $50k per scholarship
	}, 0);
	
	totalAid += externalScholarshipValue * 0.3; // 30% chance of getting external scholarships
	
	return totalAid;
}

function calculateAffordabilityRating(finalCost: number, userProfile: UserProfile): 'Excellent' | 'Good' | 'Fair' | 'Challenging' {
	const budgetRanges = {
		'low': 30000,
		'moderate': 60000,
		'high': 100000,
		'unlimited': Infinity
	};
	
	const maxBudget = budgetRanges[userProfile.value_approach as keyof typeof budgetRanges] || budgetRanges.moderate;
	
	if (finalCost <= maxBudget * 0.7) return 'Excellent';
	if (finalCost <= maxBudget) return 'Good';
	if (finalCost <= maxBudget * 1.3) return 'Fair';
	return 'Challenging';
}

function generateFundingStrategy(university: any, userProfile: UserProfile, scholarships: ScholarshipMatch[]): string {
	const strategies = [];
	
	if (university.scholarship_percentage > 50) {
		strategies.push(`Apply for ${university.name} merit scholarships (${university.scholarship_percentage}% of students receive aid)`);
	}
	
	if (scholarships.length > 0) {
		strategies.push(`Target ${scholarships.length} external scholarships: ${scholarships[0].title}`);
	}
	
	if (userProfile.degree_level === 'phd') {
		strategies.push('Explore research assistantship and teaching assistant opportunities');
	}
	
	if (userProfile.nationality && userProfile.nationality !== university.country) {
		strategies.push('Look into country-specific exchange programs and bilateral scholarships');
	}
	
	return strategies.join(' • ');
} 