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
    value_approach: string;
    research_interest: string;
    preferred_countries: string[];
    scholarship_priority: string;
    page?: number; // Pagination control
    pageSize?: number; // Items per page
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

    // Fetch US universities (API-based) - Always fetch 1000 for any degree level
    if (preferred_countries.includes('United States')) {
        promises.push(
            (async () => {
                try {
                    // Always fetch 1000 universities regardless of degree level
                    const usUniversities = await universityDataManager.fetchUSUniversities(
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
                    // Increased limit to get more UK universities
                    const ukUniversities = await ukUniversityDataManager.fetchUKUniversities(150);
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
                    // Increased limit to get more Canadian universities
                    const canadianUniversities = await canadianUniversityManager.fetchCanadianUniversities(
                        undefined,
                        150
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
                    // Increased limit to get more Australian universities
                    const australianUniversities =
                        await australianUniversityManager.fetchAustralianUniversities(undefined, 150);
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
                    // Increased limit to get more German universities
                    const germanUniversities = await universityDataManager.fetchGermanUniversities(undefined, 150);
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
                    // Increased limit to get more Dutch universities
                    const dutchUniversities = await universityDataManager.fetchDutchUniversities(undefined, 150);
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
        console.log(`🔄 Waiting for ${promises.length} university data sources to complete...`);
        const results = await Promise.all(promises);
        
        // Log the results from each source
        results.forEach((universities, index) => {
            console.log(`📊 Source ${index + 1}: Fetched ${universities.length} universities`);
        });
        
        combinedUniversities = results.flat();
        console.log(`📊 Combined total before deduplication: ${combinedUniversities.length} universities`);
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
    
    // Count universities by country for detailed logging
    const countryCounts = uniqueUniversities.reduce((counts, uni) => {
        const country = uni.country || 'Unknown';
        counts[country] = (counts[country] || 0) + 1;
        return counts;
    }, {});
    
    console.log(`📊 Total unique university pool for matching: ${uniqueUniversities.length}`);
    console.log('📊 Universities by country:', JSON.stringify(countryCounts, null, 2));
    
    // Log if we're hitting the target numbers
    const usCount = countryCounts['United States'] || 0;
    const otherCount = uniqueUniversities.length - usCount;
    console.log(`📊 US Universities: ${usCount}/1000, Other Countries: ${otherCount}/500`);

    return uniqueUniversities;
}

// New function to enrich university match results based on user's plan
function enrichMatchResultsBasedOnPlan(match: any, planType: string): any {
    // Base match information available to all users
    const baseMatch: any = {
        university: match.university,
        match_score: match.match_score,
        admission_probability: match.admission_probability,
        estimated_cost_fit: match.estimated_cost_fit
    };

    // Scholarship data gating (soft wall)
    if (planType === 'free') {
        // Show scholarship titles only; hide amounts/deadlines/details
        baseMatch.relevant_scholarships = (match.relevant_scholarships || []).slice(0, 3).map((s: any) => ({
            title: s.title
        }));
        // Hide funding analysis and cost-after-aid on free
        baseMatch.funding_analysis = null;
        baseMatch.cost_after_aid = null;
    } else {
        // Paid tiers see full scholarship data
        baseMatch.relevant_scholarships = match.relevant_scholarships;
        baseMatch.funding_analysis = match.funding_analysis;
        baseMatch.cost_after_aid = match.cost_after_aid;
    }

    // Professional users get additional match information
    if (planType === 'professional' || planType === 'elite') {
        baseMatch.match_breakdown = match.match_breakdown;
        baseMatch.strengths = match.strengths;
        baseMatch.concerns = match.concerns;
    }

    // Elite users get the full analysis
    if (planType === 'elite') {
        baseMatch.improvement_suggestions = match.improvement_suggestions;
    }

    return baseMatch;
}

/**
 * Creates an index of universities for faster lookups
 */
function buildUniversityIndex(universities: any[]): Record<string, any> {
    const index: Record<string, any> = {};
    
    universities.forEach(uni => {
        if (uni.id) {
            index[uni.id] = uni;
        }
    });
    
    return index;
}

// Modify the POST handler to use the index when generating recommendations

export const POST: RequestHandler = async ({ request, locals }) => {
    const { getSession, supabase } = locals;
    try {
        // Get the user's session
        const session = await getSession();
        const userId = session?.user?.id;

        // Block unauthenticated users: require login to attribute usage and apply plan gating
        if (!userId) {
            return json({ error: 'Login required' }, { status: 401 });
        }

        // Defaults (will be adjusted based on plan)
        let userPlanLimit = 25; // Free base limit
        let userPlanType = 'free';

        // Check user's subscription tier if logged in
        if (userId) {
            const usageCheck = await checkComprehensiveUsageLimit(userId, 'university_matching');
            userPlanType = usageCheck.planType;
            
            // Set the university limit based on plan
            if (userPlanType === 'elite') {
                userPlanLimit = 500; // Reduced from 1500
            } else if (userPlanType === 'professional') {
                userPlanLimit = 200; // Reduced from 500
            } else {
                userPlanLimit = 25; // Reduced from 50 (Free tier)
            }
            
            // Track this usage
            await incrementComprehensiveUsage(userId, 'university_matching');
        }

        // Parse the user profile from the request
        const userProfile: UserProfile = await request.json();
        
        console.log("🔍 DEBUG: Received user profile:", JSON.stringify(userProfile));
        
        // Pagination control - default to first page with 10 items per page
        // Make sure page is a number, not an object
        let page = 1;
        if (userProfile.page !== undefined) {
            if (typeof userProfile.page === 'number') {
                page = userProfile.page;
            } else if (typeof userProfile.page === 'string') {
                // Try to parse as number
                const parsedPage = parseInt(userProfile.page, 10);
                if (!isNaN(parsedPage)) {
                    page = parsedPage;
                }
            } else {
                console.log("🔍 DEBUG: Invalid page parameter:", userProfile.page);
            }
        }
        
        const pageSize = userProfile.pageSize || 10;
        
        // OPTIMIZATION: Use two-phase loading approach
        // Phase 1: Fast count query to get total available universities
        const allUniversities = await getHybridUniversities(userProfile);
        
        console.log(`🔍 DEBUG: Total universities fetched: ${allUniversities.length}`);
        
        // Build an index for faster lookups
        const universityIndex = buildUniversityIndex(allUniversities);
        
        const totalAvailable = allUniversities.length;
        
        // Apply plan limit to determine how many universities the user can access
        const effectiveTotalMatches = Math.min(totalAvailable, userPlanLimit);
        const totalPages = Math.max(1, Math.ceil(effectiveTotalMatches / pageSize));
        
        console.log(`🔍 DEBUG: Pagination info - Total: ${totalAvailable}, Effective: ${effectiveTotalMatches}, Pages: ${totalPages}, Current: ${page}`);
        
        // Phase 2: Only process the universities needed for the current page
        // This is much more efficient than processing everything
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, effectiveTotalMatches);
        
        // Determine which universities to process for the current page
        const universitiesForCurrentPage = allUniversities.length > 0 ? 
            allUniversities
                .slice(0, userPlanLimit) // First apply plan limit
                .slice(startIndex, endIndex) // Then get only the current page
            : [];
        
        console.log(`🔍 DEBUG: Universities for current page: ${universitiesForCurrentPage.length}`);
        console.log(`🔍 DEBUG: First university on page: ${universitiesForCurrentPage.length > 0 ? universitiesForCurrentPage[0].name : 'None'}`);
        
        // If minimal profile missing, return matches with match_score null and flag needs_profile
        const minimalProfileMissing = !userProfile.gpa || !userProfile.field || !userProfile.degree_level;
        if (minimalProfileMissing) {
            const minimalMatches = (allUniversities.slice(0, Math.min(10, effectiveTotalMatches)) || []).map((university: any) => ({
                university,
                match_score: null,
                admission_probability: 'Moderate',
                estimated_cost_fit: 'Fair',
                relevant_scholarships: [],
                funding_analysis: null,
                cost_after_aid: null
            }));
            return json({
                matches: minimalMatches,
                needs_profile: true,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalMatches: minimalMatches.length,
                    totalAvailable: totalAvailable,
                    planLimit: userPlanLimit,
                    planType: userPlanType
                },
                recommendations: []
            });
        }

        // Only calculate detailed matches for the current page universities
        const pageMatches = await Promise.all(universitiesForCurrentPage.map(async (university) => {
            try {
                // Calculate core matching metrics
			const matchScore = calculateEnhancedMatchScore(university, userProfile);
			const matchBreakdown = calculateMatchBreakdown(university, userProfile);
                
                                // Get scholarship intelligence data with fallback for testing
                let scholarshipData;
                try {
                    scholarshipData = await calculateScholarshipIntelligence(university, userProfile, supabase);
                } catch (error) {
                    // Fallback with empty scholarship data if there's an error
                    scholarshipData = {
                        relevant_scholarships: [],
                        funding_analysis: {
                            original_cost: university.cost || 25000,
                            potential_aid: 0,
                            estimated_final_cost: university.cost || 25000,
                            affordability_rating: 'Fair',
                            funding_strategy: 'Consider applying for external scholarships and financial aid.'
                        },
                        cost_after_aid: university.cost || 25000
                    };
                }
			
                const match = {
                    university: university,
				match_score: matchScore,
				match_breakdown: matchBreakdown,
				strengths: identifyEnhancedStrengths(university, userProfile),
				concerns: identifyEnhancedConcerns(university, userProfile),
				improvement_suggestions: generateImprovementSuggestions(university, userProfile),
				admission_probability: calculateEnhancedAdmissionProbability(university, userProfile),
				estimated_cost_fit: calculateCostFit(university, userProfile),
                    // Add scholarship data
				relevant_scholarships: scholarshipData.relevant_scholarships,
				funding_analysis: scholarshipData.funding_analysis,
				cost_after_aid: scholarshipData.cost_after_aid
			};
                
                // Enrich based on plan (only include data appropriate for the user's plan)
                return enrichMatchResultsBasedOnPlan(match, userPlanType);
            } catch (error) {
                console.error(`🔍 DEBUG: Error processing university ${university.name || 'unknown'}:`, error);
                return null;
            }
        }));
        
        // Filter out any null matches that might have occurred due to errors
        const validPageMatches = pageMatches.filter(match => match !== null);
        
        console.log(`🔍 DEBUG: Valid matches after processing: ${validPageMatches.length}`);
        
        // Sort the page matches by score (in case the enrichment affected order)
        validPageMatches.sort((a, b) => b.match_score - a.match_score);
        
        // Generate recommendations based on the top matches across all pages
        // For recommendations, we'll use the top 20 matches regardless of pagination
        const topMatchesForRecommendations = allUniversities.length > 0 ? 
            allUniversities
                .slice(0, Math.min(20, userPlanLimit))
                .map(university => {
                    try {
                        const matchScore = calculateEnhancedMatchScore(university, userProfile);
                        return {
                            university,
                            match_score: matchScore
                        };
                    } catch (error) {
                        console.error(`🔍 DEBUG: Error calculating score for ${university.name || 'unknown'}:`, error);
                        return null;
                    }
                })
                .filter(match => match !== null)
                .sort((a, b) => b.match_score - a.match_score) 
            : [];
        
        console.log(`🔍 DEBUG: Recommendation matches: ${topMatchesForRecommendations.length}`);
            
        const recommendations = generateEnhancedRecommendations(
            topMatchesForRecommendations, 
            userProfile
        );
        
        console.log(`🔍 DEBUG: Generated ${recommendations.length} recommendations`);
        
        // Return the paginated results with pagination metadata
        const response = {
            matches: validPageMatches,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalMatches: effectiveTotalMatches,
                totalAvailable: totalAvailable,
                planLimit: userPlanLimit,
                planType: userPlanType
            },
            recommendations: recommendations,
            // Add cache control headers
            headers: {
                'Cache-Control': 'private, max-age=300' // Cache for 5 minutes for the same user
            }
        };
        
        console.log(`🔍 DEBUG: Final response - Matches: ${validPageMatches.length}, Recommendations: ${recommendations.length}`);
        
        return json(response);

	} catch (error) {
		console.error('University matching error:', error);
        return json({ error: 'Failed to match universities' }, { status: 500 });
    }
};

// Function to ensure university objects have all required properties
function prepareUniversityData(university: any): any {
    // Make a copy to avoid modifying the original
    const prepared = { ...university };
    
    // Add missing properties with reasonable defaults
    if (!prepared.avg_gpa) prepared.avg_gpa = 3.5;
    if (!prepared.requirements) {
        prepared.requirements = {
            min_gpa: 3.0,
            english_test: true,
            research_experience: 'preferred'
        };
    } else if (!prepared.requirements.min_gpa) {
        prepared.requirements.min_gpa = 3.0;
    }
    
    if (!prepared.strengths) prepared.strengths = [];
    if (!prepared.programs) prepared.programs = {};
    if (!prepared.research_opportunities) prepared.research_opportunities = 'good';
    if (!prepared.class_size) prepared.class_size = 'medium';
    if (!prepared.scholarship_percentage) prepared.scholarship_percentage = 30;
    if (!prepared.living_cost) prepared.living_cost = 15000;
    if (!prepared.cost) prepared.cost = 25000;
    if (!prepared.ranking) prepared.ranking = 200;
    if (!prepared.acceptance_rate) prepared.acceptance_rate = 50;
    
    return prepared;
}

function calculateEnhancedMatchScore(university: any, userProfile: UserProfile): number {
    // Ensure university has all required properties
    university = prepareUniversityData(university);
    
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
	// Ensure university has all required properties
	university = prepareUniversityData(university);
	
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
    try {
        // Get real scholarships from database - no fallbacks by default
        let relevantScholarships: ScholarshipMatch[] = [];
        
        try {
            // Get scholarships from database
            relevantScholarships = await generateRelevantScholarships(university, userProfile, supabase);
            console.log(`Found ${relevantScholarships.length} scholarships for ${university.name}`);
        } catch (error) {
            console.error('Error getting scholarships:', error);
            relevantScholarships = []; // Initialize as empty array if error occurs
        }
        
        // Calculate funding analysis
        const funding_analysis = analyzeFunding(relevantScholarships, university);
        
        // Calculate cost after aid
        const cost_after_aid = calculateCostAfterAid(university, funding_analysis);
        
        return {
            relevant_scholarships: relevantScholarships,
            funding_analysis,
            cost_after_aid
        };
    } catch (error) {
        console.error('Error in calculateScholarshipIntelligence:', error);
        return {
            relevant_scholarships: [],
            funding_analysis: {
                total_funding: 0,
                max_single_scholarship: 0,
                min_single_scholarship: 0,
                average_scholarship: 0,
                total_scholarships: 0,
                funding_types: []
            },
            cost_after_aid: 0
        };
    }
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
    try {
        // Check if supabase client is available
        if (!supabase || !supabase.from) {
            console.warn('Supabase client not available for scholarship queries');
            return [];
        }
        
        const universityCountry = university.country;
        const universityName = university.name;

        const userGPA = parseFloat(userProfile.gpa) || 3.0;

        const baseFilters = (q: any) => q
            .eq('is_active', true)
            .or(`level.eq.${userProfile.degree_level},levels.cs.{${userProfile.degree_level}}`)
            .or(`min_gpa.is.null,min_gpa.lte.${userGPA}`);

        let results: any[] = [];

        // 1) Exact university scholarships
        if (universityName) {
            const { data: uniSpecific } = await baseFilters(
                supabase.from('scholarships').select('*')
            ).or(`university_name.eq.${universityName},location.ilike.%${universityName}%`)
             .order('deadline', { ascending: true })
             .limit(6);
            if (uniSpecific) results.push(...uniSpecific);
        }

        // 2) Country-level scholarships if we still have fewer than 3
        if (results.length < 3 && universityCountry) {
            const { data: countrySpecific } = await baseFilters(
                supabase.from('scholarships').select('*')
            ).or(`location.ilike.%${universityCountry}%`)
             .order('deadline', { ascending: true })
             .limit(6);
            if (countrySpecific) {
                // Avoid duplicates
                const existingIds = new Set(results.map(r => r.id));
                results.push(...countrySpecific.filter((r: any) => !existingIds.has(r.id)));
            }
        }

        // 3) Global if still needed
        if (results.length < 3) {
            const { data: global } = await baseFilters(
                supabase.from('scholarships').select('*')
            ).or(`location.ilike.%Global%,location.ilike.%International%`)
             .order('deadline', { ascending: true })
             .limit(6);
            if (global) {
                const existingIds = new Set(results.map(r => r.id));
                results.push(...global.filter((r: any) => !existingIds.has(r.id)));
            }
        }

        if (!results.length) return [];

        const mappedScholarships = results.map((scholarship: any) => ({
            id: scholarship.id,
            title: scholarship.title,
            provider: scholarship.provider,
            amount: scholarship.amount,
            match_score: calculateRealScholarshipMatch(userProfile, scholarship),
            deadline: scholarship.deadline,
            type: scholarship.funding_category || scholarship.type,
            why_relevant: generateRelevanceExplanation(userProfile, scholarship, university)
        }))
        .sort((a: any, b: any) => b.match_score - a.match_score)
        .slice(0, 3);

        return mappedScholarships;
    } catch (error) {
        console.error('Error in scholarship query:', error);
        return [];
    }
}

// Add a fallback scholarship generator to ensure we always have recommendations
function generateFallbackScholarships(university: any, userProfile: UserProfile): ScholarshipMatch[] {
    const result: ScholarshipMatch[] = [];
    const universityCountry = university.country || 'United States';
    
    // Try to generate country-specific scholarships
    if (universityCountry === 'United States') {
        result.push({
            id: 'general-us-scholarship',
            title: 'U.S. International Graduate Scholarship',
            provider: 'International Education Foundation',
            amount: '$15,000',
            match_score: 78,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString(),
            type: 'Merit-based',
            why_relevant: `Available to international students in ${userProfile.field} at U.S. universities including ${university.name}.`
        });
    } else if (universityCountry === 'United Kingdom') {
        result.push({
            id: 'general-uk-scholarship',
            title: 'UK Excellence Scholarship',
            provider: 'British Council',
            amount: '£10,000',
            match_score: 76,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 5)).toISOString(),
            type: 'Merit-based',
            why_relevant: `Offered to international students with strong academic profiles studying ${userProfile.field} in the UK.`
        });
    } else if (universityCountry === 'Canada') {
        result.push({
            id: 'general-canada-scholarship',
            title: 'Canada Graduate Scholarship',
            provider: 'Canadian Bureau for International Education',
            amount: 'CAD 17,500',
            match_score: 75,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
            type: 'Merit-based',
            why_relevant: `For international students pursuing ${userProfile.field} at Canadian universities.`
        });
    } else if (universityCountry === 'Australia') {
        result.push({
            id: 'general-australia-scholarship',
            title: 'Australia Future Leaders Scholarship',
            provider: 'Australian Education International',
            amount: 'AUD 20,000',
            match_score: 74,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
            type: 'Merit-based',
            why_relevant: `For international students with strong academic records in ${userProfile.field}.`
        });
    } else if (universityCountry === 'Germany') {
        result.push({
            id: 'general-germany-scholarship',
            title: 'DAAD Graduate Scholarship',
            provider: 'German Academic Exchange Service',
            amount: '€12,000',
            match_score: 78,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 7)).toISOString(),
            type: 'Merit-based',
            why_relevant: `For international ${userProfile.degree_level} students studying ${userProfile.field} in Germany.`
        });
    }
    
    // Add university-specific scholarship
    result.push({
        id: `${university.name.toLowerCase().replace(/\s+/g, '-')}-merit-scholarship`,
        title: `${university.name} International Merit Award`,
        provider: university.name,
        amount: `$${Math.floor(Math.random() * 10 + 5) * 1000}`,
        match_score: 85,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        type: 'Merit-based',
        why_relevant: `Specifically for international students at ${university.name} with strong academic profiles in ${userProfile.field}.`
    });
    
    // Add field-specific scholarship
    result.push({
        id: `${userProfile.field.toLowerCase().replace(/\s+/g, '-')}-excellence-scholarship`,
        title: `${userProfile.field} Excellence Scholarship`,
        provider: 'International Academic Foundation',
        amount: '$10,000',
        match_score: 82,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 5)).toISOString(),
        type: 'Field-specific',
        why_relevant: `Specifically designed for students in ${userProfile.field} with strong academic credentials.`
    });
    
    // Add famous scholarship programs for specific countries
    if (universityCountry === 'United States' || universityCountry === 'United Kingdom') {
        const fulbrightOrChevening = universityCountry === 'United States' 
            ? getFullbrightScholarship(university, userProfile)
            : getCheveningScholarship(university, userProfile);
        
        if (fulbrightOrChevening) {
            result.push(fulbrightOrChevening);
        }
    }
    
    return result.slice(0, 3); // Return only top 3
}

// Helper functions for special case scholarships (real scholarships)
function getFullbrightScholarship(university: any, userProfile: UserProfile): ScholarshipMatch | null {
    // Only return Fulbright for US universities
    if (university.country !== 'United States') return null;
    
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 6); // Set deadline 6 months from now
    
    return {
        id: 'fulbright-scholarship',
        title: 'Fulbright Foreign Student Program',
        provider: 'U.S. Department of State',
        amount: 'Full funding',
        match_score: 85,
        deadline: deadline.toISOString(),
        type: 'Government',
        why_relevant: `Available to international students for study at ${university.name} in the United States. Covers tuition, living expenses, and other benefits.`
    };
}

function getCheveningScholarship(university: any, userProfile: UserProfile): ScholarshipMatch | null {
    // Only return Chevening for UK universities
    if (university.country !== 'United Kingdom') return null;
    
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 5); // Set deadline 5 months from now
    
    return {
        id: 'chevening-scholarship',
        title: 'Chevening Scholarship',
        provider: 'UK Foreign, Commonwealth and Development Office',
        amount: 'Full funding',
        match_score: 82,
        deadline: deadline.toISOString(),
        type: 'Government',
        why_relevant: `Prestigious award for international students studying at ${university.name} in the United Kingdom. Covers tuition, living expenses, and travel.`
    };
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
	
	// University scholarships (only if they actually exist)
	if (university.scholarship_percentage && scholarships.length > 0) {
		totalAid += (university.cost * university.scholarship_percentage / 100);
	}
	
	// External scholarships (estimate)
	const externalScholarshipValue = scholarships.reduce((sum, scholarship) => {
		// Check if amount contains a number
		const amount = extractScholarshipAmount(scholarship.amount);
		return sum + Math.min(amount, 50000); // Cap at $50k per scholarship
	}, 0);
	
	// Only add external aid if scholarships are actually available
	if (scholarships.length > 0) {
	totalAid += externalScholarshipValue * 0.3; // 30% chance of getting external scholarships
	}
	
	return totalAid;
}

// Helper function to extract scholarship amounts
function extractScholarshipAmount(amountText: string): number {
    // Handle full funding case
    if (amountText.toLowerCase().includes('full') || amountText.toLowerCase().includes('tuition')) {
        return 30000; // Estimate for full funding
    }
    
    // Try to extract numeric value
    const matches = amountText.match(/\$?(\d{1,3}(,\d{3})*(\.\d+)?)/);
    if (matches && matches[1]) {
        return parseFloat(matches[1].replace(/,/g, ''));
    }
    
    // Default value if no amount can be determined
    return 5000;
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

// Add this function implementation after the generateRelevantScholarships function
function analyzeFunding(scholarships: ScholarshipMatch[], university: any): FundingAnalysis {
    const universityInitialCost = university.cost || 25000; // Default cost if not provided
    let potentialAid = 0;
    
    // Calculate potential aid based on available scholarships
    if (scholarships && scholarships.length > 0) {
        // Get amounts from scholarships
        const amounts = scholarships.map(s => {
            const amountText = s.amount || '';
            // Check if this is a full funding scholarship
            if (amountText.toLowerCase().includes('full') || 
                amountText.toLowerCase().includes('tuition waiver') ||
                amountText.toLowerCase().includes('100%')) {
                return estimateFullFunding(university.country || 'United States', s.type || '');
            }
            
            // Otherwise extract amount from text
            return extractScholarshipAmount(amountText);
        });
        
        // Use largest potential aid as most likely scenario
        // In reality, students might get multiple smaller scholarships, but we simplify here
        potentialAid = Math.max(...amounts, 0);
    }
    
    // Estimate final cost after potential aid
    const estimatedFinalCost = Math.max(0, universityInitialCost - potentialAid);
    
    // Calculate affordability rating
    let affordabilityRating: 'Excellent' | 'Good' | 'Fair' | 'Challenging';
    const costReduction = potentialAid / universityInitialCost;
    
    if (costReduction >= 0.75) {
        affordabilityRating = 'Excellent';
    } else if (costReduction >= 0.5) {
        affordabilityRating = 'Good';
    } else if (costReduction >= 0.25) {
        affordabilityRating = 'Fair';
    } else {
        affordabilityRating = 'Challenging';
    }
    
    // Generate funding strategy based on available scholarships
    const fundingStrategy = scholarships.length > 0 
        ? `Apply for ${scholarships.length} scholarships matching your profile, potentially reducing costs by ${Math.round(costReduction * 100)}%.`
        : 'Consider applying for external scholarships and financial aid.';
    
    return {
        original_cost: universityInitialCost,
        potential_aid: potentialAid,
        estimated_final_cost: estimatedFinalCost,
        affordability_rating: affordabilityRating,
        funding_strategy: fundingStrategy
    };
}

// Calculate cost after aid
function calculateCostAfterAid(university: any, fundingAnalysis: FundingAnalysis): number {
    return fundingAnalysis.estimated_final_cost;
} 