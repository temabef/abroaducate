// Phase II: Hybrid University System
// Combines existing elite universities with College Scorecard API data
// Provides seamless scaling from 9 to 1000+ universities

import { universityDataManager, type EnhancedUniversity } from '$lib/database/university-integration';
import { ukUniversityDataManager } from '$lib/database/uk-university-integration';

// University interface that matches the main matching system
export interface MatchingUniversity {
    id: string;
    name: string;
    country: string;
    region: string;
    ranking: number;
    acceptance_rate: number;
    avg_gpa: number;
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
    living_cost: number;
    scholarships: boolean;
    scholarship_percentage: number;
    location_type: string;
    class_size: string;
    research_opportunities: string;
}

// Original 9 Elite Universities (from main system)
const ELITE_UNIVERSITIES = [
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
        strengths: ['research-excellence', 'diverse-community', 'affordable-excellence'],
        programs: {
            'computer-science': 88,
            'engineering': 87,
            'business': 85,
            'medicine': 90,
            'mathematics': 86,
            'physics': 87,
            'psychology': 83,
            'economics': 84,
            'political-science': 82
        },
        requirements: {
            min_gpa: 3.2,
            english_test: true,
            research_experience: 'optional'
        },
        cost: 35000,
        living_cost: 15000,
        scholarships: true,
        scholarship_percentage: 35,
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
        acceptance_rate: 30.0,
        avg_gpa: 3.5,
        strengths: ['research-excellence', 'multicultural-environment', 'global-perspective'],
        programs: {
            'business': 87,
            'engineering': 85,
            'medicine': 88,
            'computer-science': 82,
            'economics': 84,
            'psychology': 81,
            'law': 86,
            'education': 89
        },
        requirements: {
            min_gpa: 3.0,
            english_test: true,
            research_experience: 'optional'
        },
        cost: 30000,
        living_cost: 20000,
        scholarships: true,
        scholarship_percentage: 30,
        location_type: 'urban',
        class_size: 'large',
        research_opportunities: 'good'
    },
    {
        id: 'singapore',
        name: 'National University of Singapore',
        country: 'Singapore',
        region: 'Asia',
        ranking: 25,
        acceptance_rate: 5.0,
        avg_gpa: 3.8,
        strengths: ['technology-focus', 'innovation', 'strategic-location'],
        programs: {
            'computer-science': 92,
            'engineering': 90,
            'business': 89,
            'economics': 87,
            'mathematics': 88,
            'medicine': 85,
            'data-science': 91
        },
        requirements: {
            min_gpa: 3.5,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 25000,
        living_cost: 18000,
        scholarships: true,
        scholarship_percentage: 25,
        location_type: 'urban',
        class_size: 'medium',
        research_opportunities: 'good'
    },
    {
        id: 'tokyo',
        name: 'University of Tokyo',
        country: 'Japan',
        region: 'Asia',
        ranking: 23,
        acceptance_rate: 36.0,
        avg_gpa: 3.7,
        strengths: ['research-excellence', 'innovation', 'cultural-immersion'],
        programs: {
            'engineering': 91,
            'computer-science': 88,
            'economics': 86,
            'physics': 90,
            'mathematics': 89,
            'business': 82,
            'medicine': 87
        },
        requirements: {
            min_gpa: 3.3,
            english_test: true,
            research_experience: 'preferred'
        },
        cost: 20000,
        living_cost: 15000,
        scholarships: true,
        scholarship_percentage: 20,
        location_type: 'urban',
        class_size: 'large',
        research_opportunities: 'extensive'
    }
];

export interface HybridUniversityOptions {
    includeElite?: boolean;
    includeAPI?: boolean;
    includeUK?: boolean;
    preferredCountries?: string[];
    maxResults?: number;
    minAcceptanceRate?: number;
    maxAcceptanceRate?: number;
    maxCost?: number;
    programs?: string[];
}

export class HybridUniversitySystem {
    private cache: Map<string, UniversityData[]> = new Map();
    private lastFetch: number = 0;
    private cacheTimeout: number = 1800000; // 30 minutes

    /**
     * Get hybrid university list combining elite and API universities
     */
    async getHybridUniversities(options: HybridUniversityOptions = {}): Promise<MatchingUniversity[]> {
        const {
            includeElite = true,
            includeAPI = true,
            includeUK = true,
            preferredCountries = [],
            maxResults = 100,
            minAcceptanceRate = 0,
            maxAcceptanceRate = 100,
            maxCost = Infinity,
            programs = []
        } = options;

        const cacheKey = JSON.stringify(options);
        
        // Check cache
        if (this.cache.has(cacheKey) && (Date.now() - this.lastFetch) < this.cacheTimeout) {
            return this.cache.get(cacheKey)!;
        }

        let allUniversities: MatchingUniversity[] = [];

        // Add elite universities
        if (includeElite) {
            allUniversities.push(...ELITE_UNIVERSITIES);
        }

        // Add API universities
        if (includeAPI) {
            try {
                const apiUniversities = await this.getAPIUniversities(options);
                allUniversities.push(...apiUniversities);
            } catch (error) {
                console.warn('Failed to fetch API universities, using elite only:', error);
            }
        }

        // Apply filters
        let filteredUniversities = allUniversities;

        // Country filter
        if (preferredCountries.length > 0) {
            filteredUniversities = filteredUniversities.filter(uni => 
                preferredCountries.includes(uni.country)
            );
        }

        // Acceptance rate filter
        filteredUniversities = filteredUniversities.filter(uni => 
            uni.acceptance_rate >= minAcceptanceRate && uni.acceptance_rate <= maxAcceptanceRate
        );

        // Cost filter
        filteredUniversities = filteredUniversities.filter(uni => 
            uni.cost <= maxCost
        );

        // Program filter
        if (programs.length > 0) {
            filteredUniversities = filteredUniversities.filter(uni =>
                programs.some(program => uni.programs[program] !== undefined)
            );
        }

        // Remove duplicates (prefer elite over API if same university)
        const uniqueUniversities = this.removeDuplicates(filteredUniversities);

        // Sort by ranking/quality
        uniqueUniversities.sort((a, b) => {
            const aScore = this.calculateOverallScore(a);
            const bScore = this.calculateOverallScore(b);
            return bScore - aScore;
        });

        // Limit results
        const result = uniqueUniversities.slice(0, maxResults);

        // Cache results
        this.cache.set(cacheKey, result);
        this.lastFetch = Date.now();

        return result;
    }

    /**
     * Convert Enhanced Universities from API to standard format
     */
    private async getAPIUniversities(options: HybridUniversityOptions, apiKey?: string): Promise<UniversityData[]> {
        try {
            const apiLimit = Math.min(options.maxResults || 50, 100);
            
            // Fetch from different sources based on countries
            let enhancedUniversities: EnhancedUniversity[] = [];

            if (!options.preferredCountries || options.preferredCountries.includes('United States')) {
                const usUniversities = await universityDataManager.fetchUSUniversities(undefined, apiLimit, apiKey);
                enhancedUniversities.push(...usUniversities);
            }

            // Convert Enhanced Universities to standard format
            return enhancedUniversities.map(uni => this.convertEnhancedToStandard(uni));

        } catch (error) {
            console.error('Error fetching API universities:', error);
            return [];
        }
    }

    /**
     * Convert EnhancedUniversity to standard UniversityData format
     */
    private convertEnhancedToStandard(enhanced: EnhancedUniversity): UniversityData {
        return {
            id: enhanced.id,
            name: enhanced.name,
            country: enhanced.country,
            region: enhanced.region,
            ranking: enhanced.global_ranking || enhanced.national_ranking || 999,
            acceptance_rate: enhanced.acceptance_rate || 50,
            avg_gpa: enhanced.avg_gpa || 3.0,
            strengths: enhanced.strengths,
            programs: enhanced.programs,
            requirements: enhanced.requirements,
            cost: enhanced.cost,
            living_cost: enhanced.living_cost || 15000,
            scholarships: enhanced.scholarships,
            scholarship_percentage: enhanced.scholarship_percentage || 30,
            location_type: enhanced.location_type,
            class_size: enhanced.class_size,
            research_opportunities: enhanced.research_opportunities
        };
    }

    /**
     * Remove duplicate universities (prefer elite over API)
     */
    private removeDuplicates(universities: UniversityData[]): UniversityData[] {
        const seen = new Set<string>();
        const result: UniversityData[] = [];

        // Sort to prioritize elite universities (those without 'mock-' or 'us-' prefix)
        const sorted = universities.sort((a, b) => {
            const aIsElite = !a.id.startsWith('mock-') && !a.id.startsWith('us-');
            const bIsElite = !b.id.startsWith('mock-') && !b.id.startsWith('us-');
            return aIsElite === bIsElite ? 0 : aIsElite ? -1 : 1;
        });

        for (const uni of sorted) {
            const key = this.generateUniversityKey(uni);
            if (!seen.has(key)) {
                seen.add(key);
                result.push(uni);
            }
        }

        return result;
    }

    /**
     * Generate a key for duplicate detection
     */
    private generateUniversityKey(uni: UniversityData): string {
        // Normalize university name for comparison
        const normalized = uni.name
            .toLowerCase()
            .replace(/university of |the |,.*$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        return `${normalized}-${uni.country}`;
    }

    /**
     * Calculate overall quality score for sorting
     */
    private calculateOverallScore(uni: UniversityData): number {
        let score = 0;

        // Ranking score (inverted - lower ranking is better)
        if (uni.ranking) {
            score += Math.max(0, 1000 - uni.ranking);
        }

        // Selectivity score (lower acceptance rate is better for prestige)
        score += Math.max(0, 100 - uni.acceptance_rate);

        // Program strength (average of all programs)
        const programScores = Object.values(uni.programs);
        if (programScores.length > 0) {
            score += programScores.reduce((sum, score) => sum + score, 0) / programScores.length;
        }

        // Research opportunities bonus
        if (uni.research_opportunities === 'extensive') score += 50;
        else if (uni.research_opportunities === 'good') score += 25;

        return score;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        this.lastFetch = 0;
    }

    /**
     * Get statistics about current hybrid system
     */
    async getSystemStats(): Promise<{
        elite_count: number;
        api_count: number;
        total_available: number;
        countries: string[];
        last_updated: string;
    }> {
        const apiUniversities = await this.getAPIUniversities({ maxResults: 1000 });
        
        return {
            elite_count: ELITE_UNIVERSITIES.length,
            api_count: apiUniversities.length,
            total_available: ELITE_UNIVERSITIES.length + apiUniversities.length,
            countries: Array.from(new Set([
                ...ELITE_UNIVERSITIES.map(u => u.country),
                ...apiUniversities.map(u => u.country)
            ])),
            last_updated: new Date().toISOString()
        };
    }
}

// Export singleton instance
export const hybridUniversitySystem = new HybridUniversitySystem(); 