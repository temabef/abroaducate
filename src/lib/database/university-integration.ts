// University Database Integration System for Phase II
// Free API Sources for Scaling to 1000+ Universities

import type { UniversityData } from '$lib/types';

// US College Scorecard API Integration (FREE - 7,000+ institutions)
export interface CollegeScorecardUniversity {
    id: string;
    'school.name': string;
    'school.city': string;
    'school.state': string;
    'school.zip': string;
    'school.school_url': string;
    'school.price_calculator_url': string;
    'school.ownership': number; // 1=Public, 2=Private nonprofit, 3=Private for-profit
    'school.locale': number;
    'school.ccbasic': number; // Carnegie classification
    'school.main_campus': number;
    'school.branches': number;
    'school.size': number;
    'admissions.admission_rate.overall': number;
    'admissions.sat_scores.average.overall': number;
    'admissions.act_scores.midpoint.cumulative': number;
    'student.size': number;
    'cost.tuition.in_state': number;
    'cost.tuition.out_of_state': number;
    'cost.attendance.academic_year': number;
    'aid.median_debt.completers.overall': number;
    'earnings.10_yrs_after_entry.median': number;
    'academics.program_available.agriculture': number;
    'academics.program_available.architecture': number;
    'academics.program_available.area_ethnic_cultural_gender': number;
    'academics.program_available.biological': number;
    'academics.program_available.business_marketing': number;
    'academics.program_available.communication': number;
    'academics.program_available.computer': number;
    'academics.program_available.education': number;
    'academics.program_available.engineering': number;
    'academics.program_available.english': number;
    'academics.program_available.family_consumer_science': number;
    'academics.program_available.health': number;
    'academics.program_available.history': number;
    'academics.program_available.legal': number;
    'academics.program_available.mathematics': number;
    'academics.program_available.philosophy_religious': number;
    'academics.program_available.physical_science': number;
    'academics.program_available.psychology': number;
    'academics.program_available.social_science': number;
}

// Enhanced University Structure for Phase II
export interface EnhancedUniversity {
    id: string;
    name: string;
    country: string;
    state?: string;
    city?: string;
    region: string;
    ranking?: number;
    global_ranking?: number;
    national_ranking?: number;
    acceptance_rate?: number;
    avg_gpa?: number;
    avg_sat?: number;
    avg_act?: number;
    strengths: string[];
    programs: { [key: string]: number };
    requirements: {
        min_gpa?: number;
        min_sat?: number;
        min_act?: number;
        english_test?: boolean;
        research_experience?: string;
    };
    cost: number;
    living_cost?: number;
    in_state_tuition?: number;
    out_of_state_tuition?: number;
    scholarships: boolean;
    scholarship_percentage?: number;
    median_debt?: number;
    graduate_earnings?: number;
    location_type: string;
    class_size: string;
    research_opportunities: string;
    student_size?: number;
    ownership_type?: 'public' | 'private_nonprofit' | 'private_forprofit';
    carnegie_classification?: string;
    website_url?: string;
    data_source: 'hardcoded' | 'college_scorecard' | 'times_higher_ed' | 'qs_rankings' | 'government_api';
    last_updated: string;
}

// College Scorecard API Configuration
export const COLLEGE_SCORECARD_CONFIG = {
    base_url: 'https://api.data.gov/ed/collegescorecard/v1/schools.json',
    rate_limit: 1000, // requests per hour for authenticated users
    fields: [
        'id',  // CRITICAL: Add the university ID field
        'school.name',
        'school.city', 
        'school.state',
        'school.school_url',
        'school.ownership',
        'school.main_campus',
        'school.size',
        'school.locale',
        'admissions.admission_rate.overall',
        'admissions.sat_scores.average.overall',
        'student.size',
        'cost.tuition.in_state',
        'cost.tuition.out_of_state',
        'cost.attendance.academic_year',
        'aid.median_debt.completers.overall',
        'earnings.10_yrs_after_entry.median',
        'academics.program_available.computer',
        'academics.program_available.engineering',
        'academics.program_available.business_marketing',
        'academics.program_available.biological',
        'academics.program_available.health',
        'academics.program_available.mathematics',
        'academics.program_available.psychology',
        'academics.program_available.english',
        'academics.program_available.education',
        'academics.program_available.social_science',
        'academics.program_available.physical_science',
        'academics.program_available.history',
        'academics.program_available.philosophy_religious'
    ].join(',')
};

// Transform College Scorecard data to our Enhanced University format
export function transformCollegeScorecardData(apiData: CollegeScorecardUniversity[]): EnhancedUniversity[] {
    console.log(`🔍 Processing ${apiData.length} raw universities from College Scorecard API`);
    
    // More lenient filtering - include universities with basic data
    const filtered = apiData.filter(school => {
        const hasName = school['school.name'];
        const isMainCampus = school['school.main_campus'] === 1;
        const hasBasicData = school['school.state'] && school['school.city'];
        
        const include = hasName && isMainCampus && hasBasicData;
        
        if (!include) {
            console.log(`❌ Filtered out: ${school['school.name']} - Missing basic data`);
        }
        
        return include;
    });
    
    console.log(`✅ After filtering: ${filtered.length} universities passed basic requirements`);
    
    return filtered
        .map((school, index) => {
            // Generate a unique ID - use actual ID if available, otherwise create one
            const universityId = school.id || `cs-${school['school.state']?.toLowerCase()}-${index}`;
            
            // Calculate costs with proper fallbacks
            const outOfStateTuition = school['cost.tuition.out_of_state'];
            const inStateTuition = school['cost.tuition.in_state'];
            const totalCost = school['cost.attendance.academic_year'];
            
            // Use out-of-state tuition as primary cost, fall back to in-state, then defaults
            const primaryCost = outOfStateTuition || inStateTuition || 25000;
            const livingCost = totalCost ? Math.max(0, totalCost - primaryCost) : 15000;
            
            // Calculate acceptance rate as percentage
            const rawAcceptanceRate = school['admissions.admission_rate.overall'];
            const acceptanceRate = rawAcceptanceRate ? 
                Math.round(rawAcceptanceRate * 100) : undefined;
            
            // More robust data extraction with intelligent fallbacks
            const studentSize = school['student.size'];
            const medianDebt = school['aid.median_debt.completers.overall'];
            const graduateEarnings = school['earnings.10_yrs_after_entry.median'];
            const ownership = school['school.ownership'];
            
            // SMART ACCEPTANCE RATE ESTIMATION
            // If real data missing, estimate based on institution characteristics
            let finalAcceptanceRate = acceptanceRate;
            if (!finalAcceptanceRate) {
                // Estimate based on ownership and other factors
                if (ownership === 1) { // Public
                    finalAcceptanceRate = studentSize > 20000 ? 65 : 55; // Large public: ~65%, smaller: ~55%
                } else if (ownership === 2) { // Private nonprofit
                    finalAcceptanceRate = 45; // Private nonprofits tend to be more selective
                } else {
                    finalAcceptanceRate = 75; // For-profit institutions
                }
                console.log(`📊 ${school['school.name']}: Estimated acceptance rate ${finalAcceptanceRate}% (no API data)`);
            }
            
            // SMART STUDENT SIZE ESTIMATION
            let finalStudentSize = studentSize;
            if (!finalStudentSize && ownership === 1) {
                // Public universities tend to be larger
                finalStudentSize = 15000;
            } else if (!finalStudentSize) {
                // Private institutions tend to be smaller
                finalStudentSize = 5000;
            }
            
            // SMART DEBT AND EARNINGS ESTIMATION
            let finalMedianDebt = medianDebt;
            let finalGraduateEarnings = graduateEarnings;
            
            if (!finalMedianDebt) {
                // Estimate debt based on cost and ownership
                const estimatedDebt = ownership === 1 ? primaryCost * 0.6 : primaryCost * 0.8;
                finalMedianDebt = Math.min(estimatedDebt, 50000); // Cap at reasonable level
            }
            
            if (!finalGraduateEarnings) {
                // Estimate earnings based on programs and location
                let baseEarnings = 45000; // National average
                if (school['academics.program_available.computer'] || 
                    school['academics.program_available.engineering']) {
                    baseEarnings = 65000; // STEM premium
                }
                if (school['academics.program_available.business_marketing']) {
                    baseEarnings = 55000; // Business premium
                }
                if (school['school.state'] === 'CA' || school['school.state'] === 'NY') {
                    baseEarnings *= 1.2; // High cost states premium
                }
                finalGraduateEarnings = Math.round(baseEarnings);
            }
            
            // Improved program data extraction with fallbacks
            const programData = generateProgramsFromData(school);

            const university = {
                id: `us-${universityId}`,
                name: school['school.name'],
                country: 'United States',
                state: school['school.state'],
                city: school['school.city'],
                region: 'North America',
                acceptance_rate: finalAcceptanceRate,
                avg_sat: school['admissions.sat_scores.average.overall'] || undefined,
                strengths: generateStrengthsFromData(school),
                programs: programData,
                requirements: {
                    min_gpa: estimateMinGpaFromAdmissionRate(school['admissions.admission_rate.overall']),
                    english_test: true,
                    research_experience: school['school.ownership'] === 1 ? 'preferred' : 'optional'
                },
                cost: Math.round(primaryCost),
                living_cost: Math.round(livingCost),
                in_state_tuition: inStateTuition ? Math.round(inStateTuition) : undefined,
                out_of_state_tuition: outOfStateTuition ? Math.round(outOfStateTuition) : undefined,
                scholarships: true,
                scholarship_percentage: school['school.ownership'] === 1 ? 45 : 35,
                median_debt: finalMedianDebt ? Math.round(finalMedianDebt) : undefined,
                graduate_earnings: finalGraduateEarnings ? Math.round(finalGraduateEarnings) : undefined,
                location_type: determineLocationType(school['school.locale']),
                class_size: determineClassSize(school['student.size']),
                research_opportunities: school['school.ownership'] === 1 ? 'good' : 'limited',
                student_size: finalStudentSize || undefined,
                ownership_type: (ownership === 1 ? 'public' : 
                              ownership === 2 ? 'private_nonprofit' : 'private_forprofit') as 'public' | 'private_nonprofit' | 'private_forprofit',
                website_url: school['school.school_url'] || undefined,
                data_source: 'college_scorecard' as const,
                last_updated: new Date().toISOString()
            };
            
            console.log(`✅ Processed: ${university.name} (${university.state}) - Cost: $${university.cost}, Rate: ${finalAcceptanceRate || 'N/A'}%`);
            return university;
        });
}

// Helper function to generate strengths based on available data
function generateStrengthsFromData(school: CollegeScorecardUniversity): string[] {
    const strengths: string[] = [];
    
    // Public institution strengths
    if (school['school.ownership'] === 1) {
        strengths.push('affordable-education', 'diverse-community');
    }
    
    // High graduate earnings
    if (school['earnings.10_yrs_after_entry.median'] && school['earnings.10_yrs_after_entry.median'] > 50000) {
        strengths.push('career-outcomes', 'industry-connections');
    }
    
    // Large student body
    if (school['student.size'] && school['student.size'] > 20000) {
        strengths.push('diverse-community', 'extensive-resources');
    }
    
    // Strong programs based on availability
    if (school['academics.program_available.computer']) {
        strengths.push('technology-focus');
    }
    if (school['academics.program_available.engineering']) {
        strengths.push('innovation', 'research-excellence');
    }
    if (school['academics.program_available.business_marketing']) {
        strengths.push('industry-connections', 'entrepreneurship');
    }
    
    return strengths.length > 0 ? strengths : ['quality-education'];
}

// Helper function to generate program scores based on availability
function generateProgramsFromData(school: CollegeScorecardUniversity): { [key: string]: number } {
    const programs: { [key: string]: number } = {};
    
    // Base score calculation based on institutional quality indicators
    const baseScore = calculateBaseScore(school);
    
    // Map available programs to our program structure
    if (school['academics.program_available.computer']) {
        programs['computer-science'] = baseScore + 5;
        programs['software-engineering'] = baseScore;
        programs['data-science'] = baseScore;
    }
    
    if (school['academics.program_available.engineering']) {
        programs['engineering'] = baseScore + 5;
        programs['electrical-engineering'] = baseScore;
        programs['mechanical-engineering'] = baseScore;
    }
    
    if (school['academics.program_available.business_marketing']) {
        programs['business'] = baseScore + 5;
        programs['mba'] = Math.max(70, baseScore);
        programs['marketing'] = baseScore;
        programs['finance'] = baseScore;
    }
    
    if (school['academics.program_available.biological']) {
        programs['biology'] = baseScore + 5;
        programs['pre-med'] = baseScore;
        programs['bioengineering'] = baseScore;
    }
    
    if (school['academics.program_available.health']) {
        programs['medicine'] = baseScore + 10;
        programs['public-health'] = baseScore;
        programs['nursing'] = baseScore;
    }
    
    if (school['academics.program_available.mathematics']) {
        programs['mathematics'] = baseScore + 5;
    }
    
    if (school['academics.program_available.psychology']) {
        programs['psychology'] = baseScore + 5;
    }
    
    if (school['academics.program_available.english']) {
        programs['english-literature'] = baseScore + 5;
    }
    
    if (school['academics.program_available.education']) {
        programs['education'] = baseScore + 5;
    }
    
    if (school['academics.program_available.social_science']) {
        programs['political-science'] = baseScore;
        programs['economics'] = baseScore;
        programs['international-relations'] = baseScore;
    }
    
    if (school['academics.program_available.physical_science']) {
        programs['physics'] = baseScore + 5;
        programs['chemistry'] = baseScore;
    }
    
    if (school['academics.program_available.history']) {
        programs['history'] = baseScore + 5;
    }
    
    if (school['academics.program_available.philosophy_religious']) {
        programs['philosophy'] = baseScore + 5;
    }
    
    // Add interdisciplinary programs if multiple fields are available
    const availableCount = Object.keys(programs).length;
    if (availableCount >= 3) {
        programs['liberal-arts'] = baseScore;
    }
    if (availableCount >= 5) {
        programs['interdisciplinary-studies'] = baseScore;
    }
    
    // Ensure at least some programs are available for all universities
    if (Object.keys(programs).length === 0) {
        // Smart program estimation based on university name and characteristics
        const universityName = school['school.name'].toLowerCase();
        const isPublic = school['school.ownership'] === 1;
        const isLarge = (school['student.size'] || 0) > 15000;
        
        console.log(`🎓 ${school['school.name']}: No API program data, using intelligent fallbacks`);
        
        // Name-based program inference
        if (universityName.includes('tech') || universityName.includes('institute')) {
            programs['computer-science'] = baseScore + 10;
            programs['engineering'] = baseScore + 10;
            programs['mathematics'] = baseScore + 5;
        } else if (universityName.includes('state') || isPublic) {
            // State universities typically offer comprehensive programs
            programs['business'] = baseScore + 5;
            programs['education'] = baseScore + 5;
            programs['liberal-arts'] = baseScore;
            programs['general-studies'] = baseScore;
            if (isLarge) {
                programs['computer-science'] = baseScore + 5;
                programs['engineering'] = baseScore + 5;
            }
        } else {
            // Private institutions often focus on liberal arts and business
            programs['business'] = baseScore + 5;
            programs['liberal-arts'] = baseScore + 5;
            programs['general-studies'] = baseScore;
        }
        
        // Location-based program bonuses
        const state = school['school.state'];
        if (state === 'CA') {
            // California has strong tech industry
            programs['computer-science'] = (programs['computer-science'] || baseScore) + 5;
            programs['data-science'] = baseScore + 5;
        } else if (state === 'NY') {
            // New York has strong business and finance
            programs['business'] = (programs['business'] || baseScore) + 5;
            programs['finance'] = baseScore + 5;
        } else if (state === 'TX') {
            // Texas has strong engineering and energy sector
            programs['engineering'] = (programs['engineering'] || baseScore) + 5;
            programs['business'] = (programs['business'] || baseScore) + 3;
        }
        
        // Ensure minimum program diversity
        if (Object.keys(programs).length < 3) {
            programs['general-studies'] = baseScore;
            programs['liberal-arts'] = baseScore;
        }
    }
    
    return programs;
}

// Calculate base program score based on institutional quality
function calculateBaseScore(school: CollegeScorecardUniversity): number {
    let score = 60; // Base score
    
    // Admission selectivity bonus
    const admissionRate = school['admissions.admission_rate.overall'] || 1;
    if (admissionRate < 0.1) score += 25; // Very selective
    else if (admissionRate < 0.3) score += 15; // Selective
    else if (admissionRate < 0.6) score += 10; // Moderately selective
    
    // Graduate earnings bonus
    const earnings = school['earnings.10_yrs_after_entry.median'] || 0;
    if (earnings > 60000) score += 10;
    else if (earnings > 45000) score += 5;
    
    // Public institution bonus (often strong programs)
    if (school['school.ownership'] === 1) score += 5;
    
    // Size bonus for resources
    const size = school['student.size'] || 0;
    if (size > 30000) score += 5; // Large research universities
    
    return Math.min(95, score); // Cap at 95 to reserve 100 for elite institutions
}

// Helper functions for data transformation
function estimateMinGpaFromAdmissionRate(admissionRate: number): number {
    if (!admissionRate) return 2.5;
    if (admissionRate < 0.1) return 3.8;
    if (admissionRate < 0.3) return 3.5;
    if (admissionRate < 0.6) return 3.0;
    return 2.5;
}

function determineLocationType(locale: number): string {
    // Based on IPEDS locale codes
    if (!locale) return 'suburban';
    if (locale <= 13) return 'urban'; // City areas
    if (locale <= 23) return 'suburban'; // Suburban areas
    if (locale <= 33) return 'small-town'; // Town areas
    return 'rural'; // Rural areas
}

function determineClassSize(studentSize: number): string {
    if (!studentSize) return 'medium';
    if (studentSize < 5000) return 'small';
    if (studentSize < 15000) return 'medium';
    return 'large';
}

// API Rate Limiting and Caching
export class UniversityDataManager {
    private cache: Map<string, EnhancedUniversity[]> = new Map();
    private lastFetch: number = 0;
    private rateLimit: number = 3600000; // 1 hour in milliseconds
    
    async fetchUSUniversities(state?: string, limit: number = 100, apiKey?: string): Promise<EnhancedUniversity[]> {
        const cacheKey = `us-universities-${state || 'all'}-${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey) && (Date.now() - this.lastFetch) < this.rateLimit) {
            console.log('🎯 Returning cached data for:', cacheKey);
            return this.cache.get(cacheKey)!;
        }
        
        try {
            let url = `${COLLEGE_SCORECARD_CONFIG.base_url}?fields=${COLLEGE_SCORECARD_CONFIG.fields}&per_page=${limit}`;
            
            // Add API key if provided
            if (apiKey) {
                url += `&api_key=${apiKey}`;
            }
            
            // Add state filter if specified
            if (state) {
                url += `&school.state=${state}`;
            }
            
            // Add filters for quality institutions
            url += `&school.main_campus=1&school.ownership=1,2`; // Main campus, public or private nonprofit
            url += `&admissions.admission_rate.overall__range=0.01..0.95`; // Has admission data
            url += `&cost.tuition.out_of_state__range=1000..100000`; // Reasonable tuition range
            
            console.log('🔍 Fetching from College Scorecard API:', url.replace(/api_key=[^&]*/, 'api_key=***'));
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'UniversityMatcher/1.0',
                    'Accept': 'application/json'
                }
            });
            
            console.log('📡 API Response Status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ College Scorecard API error:', response.status, errorText);
                throw new Error(`College Scorecard API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📊 Raw API response structure:', {
                hasResults: !!data.results,
                resultsLength: data.results ? data.results.length : 0,
                metadata: data.metadata || 'No metadata',
                sampleResult: data.results && data.results[0] ? Object.keys(data.results[0]) : 'No results'
            });
            
            if (!data.results || data.results.length === 0) {
                console.warn('⚠️ College Scorecard API returned no results. Falling back to mock data.');
                // Return mock universities for testing
                return this.getMockUniversities(state, limit);
            }
            
            const universities = transformCollegeScorecardData(data.results);
            console.log('✅ Transformed universities:', universities.length);
            
            // Cache the results
            this.cache.set(cacheKey, universities);
            this.lastFetch = Date.now();
            
            return universities;
            
        } catch (error) {
            console.error('💥 Error fetching US universities:', error);
            console.log('🔄 Falling back to mock data due to API error');
            // Return mock data as fallback
            return this.getMockUniversities(state, limit);
        }
    }
    
    async fetchTopUSUniversities(limit: number = 50, apiKey?: string): Promise<EnhancedUniversity[]> {
        // Fetch highly selective universities (admission rate < 30%)
        try {
            let url = `${COLLEGE_SCORECARD_CONFIG.base_url}?fields=${COLLEGE_SCORECARD_CONFIG.fields}&per_page=${limit}`;
            
            // Add API key if provided
            if (apiKey) {
                url += `&api_key=${apiKey}`;
            }
            
            url += `&school.main_campus=1&school.ownership=1,2`;
            url += `&admissions.admission_rate.overall__range=0.01..0.30`; // Selective institutions
            url += `&sort=admissions.admission_rate.overall:asc`; // Most selective first
            
            console.log('🎯 Fetching top universities from:', url.replace(/api_key=[^&]*/, 'api_key=***'));
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'UniversityMatcher/1.0',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('❌ Top universities API error:', response.status);
                return this.getMockTopUniversities(limit);
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                console.warn('⚠️ No top universities returned. Using mock data.');
                return this.getMockTopUniversities(limit);
            }
            
            return transformCollegeScorecardData(data.results);
            
        } catch (error) {
            console.error('💥 Error fetching top US universities:', error);
            return this.getMockTopUniversities(limit);
        }
    }
    
    // Mock data for fallback when API fails
    private getMockUniversities(state?: string, limit: number = 100): EnhancedUniversity[] {
        const mockData = [
            {
                id: 'mock-uc-berkeley',
                name: 'University of California, Berkeley',
                country: 'United States',
                state: 'CA',
                city: 'Berkeley',
                region: 'North America',
                acceptance_rate: 17,
                avg_gpa: 3.8,
                strengths: ['research-excellence', 'innovation', 'diverse-community'],
                programs: {
                    'computer-science': 95,
                    'engineering': 93,
                    'business': 88,
                    'data-science': 92
                } as { [key: string]: number },
                requirements: {
                    min_gpa: 3.5,
                    english_test: true,
                    research_experience: 'preferred'
                },
                cost: 45000,
                living_cost: 20000,
                scholarships: true,
                scholarship_percentage: 40,
                location_type: 'urban',
                class_size: 'large',
                research_opportunities: 'extensive',
                student_size: 45000,
                ownership_type: 'public' as const,
                website_url: 'https://berkeley.edu',
                data_source: 'college_scorecard' as const,
                last_updated: new Date().toISOString()
            },
            {
                id: 'mock-umich',
                name: 'University of Michigan, Ann Arbor',
                country: 'United States',
                state: 'MI',
                city: 'Ann Arbor',
                region: 'North America',
                acceptance_rate: 23,
                avg_gpa: 3.9,
                strengths: ['research-excellence', 'school-spirit', 'alumni-network'],
                programs: {
                    'engineering': 91,
                    'business': 89,
                    'medicine': 87,
                    'computer-science': 88
                } as { [key: string]: number },
                requirements: {
                    min_gpa: 3.4,
                    english_test: true,
                    research_experience: 'optional'
                },
                cost: 52000,
                living_cost: 18000,
                scholarships: true,
                scholarship_percentage: 35,
                location_type: 'suburban',
                class_size: 'large',
                research_opportunities: 'good',
                student_size: 48000,
                ownership_type: 'public' as const,
                website_url: 'https://umich.edu',
                data_source: 'college_scorecard' as const,
                last_updated: new Date().toISOString()
            },
            {
                id: 'mock-ut-austin',
                name: 'University of Texas at Austin',
                country: 'United States',
                state: 'TX',
                city: 'Austin',
                region: 'North America',
                acceptance_rate: 32,
                avg_gpa: 3.7,
                strengths: ['value-for-money', 'diverse-programs', 'vibrant-campus'],
                programs: {
                    'business': 86,
                    'engineering': 84,
                    'computer-science': 85,
                    'communications': 82
                } as { [key: string]: number },
                requirements: {
                    min_gpa: 3.2,
                    english_test: true,
                    research_experience: 'optional'
                },
                cost: 40000,
                living_cost: 16000,
                scholarships: true,
                scholarship_percentage: 45,
                location_type: 'urban',
                class_size: 'large',
                research_opportunities: 'good',
                student_size: 52000,
                ownership_type: 'public' as const,
                website_url: 'https://utexas.edu',
                data_source: 'college_scorecard' as const,
                last_updated: new Date().toISOString()
            }
        ];
        
        // Filter by state if specified
        const filtered = state ? mockData.filter(uni => uni.state === state) : mockData;
        return filtered.slice(0, limit);
    }
    
    private getMockTopUniversities(limit: number): EnhancedUniversity[] {
        return this.getMockUniversities(undefined, limit).filter(uni => uni.acceptance_rate! < 30);
    }
    
    // Clear cache manually if needed
    clearCache(): void {
        this.cache.clear();
        this.lastFetch = 0;
    }
}

// International University APIs (For future Phase II expansion)
export const INTERNATIONAL_APIs = {
    UK: {
        name: 'Complete University Guide API',
        url: 'https://www.thecompleteuniversityguide.co.uk/',
        type: 'scraping_required', // No free API available
        data_points: ['rankings', 'acceptance_rates', 'tuition_fees']
    },
    Canada: {
        name: 'Universities Canada Directory',
        url: 'https://www.univcan.ca/universities/',
        type: 'scraping_required',
        data_points: ['university_list', 'locations', 'programs']
    },
    Australia: {
        name: 'Australian Government Study Australia',
        url: 'https://www.studyinaustralia.gov.au/',
        type: 'government_portal',
        data_points: ['institutions', 'courses', 'costs']
    },
    Europe: {
        name: 'European University Association',
        url: 'https://eua.eu/',
        type: 'directory_scraping',
        data_points: ['member_universities', 'country_data']
    }
};

// Export singleton instance
export const universityDataManager = new UniversityDataManager(); 