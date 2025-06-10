// Phase II: Hybrid University System
// Combines existing elite universities with College Scorecard API data
// Provides seamless scaling from 9 to 1000+ universities

import { universityDataManager, type EnhancedUniversity } from '$lib/database/university-integration';

// Our existing elite universities (hardcoded with perfect data)
export const ELITE_UNIVERSITIES = [
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
        research_opportunities: 'extensive',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'extensive',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'extensive',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'extensive',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'extensive',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'good',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'good',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'extensive',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
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
        research_opportunities: 'good',
        data_source: 'hardcoded',
        last_updated: '2024-01-01'
    }
];

// Hybrid University Manager
export class HybridUniversityManager {
    private apiUniversities: EnhancedUniversity[] = [];
    private lastApiFetch: number = 0;
    private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 hours
    
    async getAllUniversities(options?: {
        includeAPI?: boolean;
        states?: string[];
        limit?: number;
        forceRefresh?: boolean;
    }): Promise<any[]> {
        const { 
            includeAPI = true, 
            states = [], 
            limit = 100,
            forceRefresh = false 
        } = options || {};
        
        let allUniversities = [...ELITE_UNIVERSITIES];
        
        if (includeAPI) {
            // Check if we need to fetch/refresh API data
            const needsRefresh = forceRefresh || 
                                 (Date.now() - this.lastApiFetch) > this.cacheExpiry ||
                                 this.apiUniversities.length === 0;
            
            if (needsRefresh) {
                try {
                    // Fetch API universities
                    if (states.length > 0) {
                        // Fetch from specific states
                        const promises = states.map(state => 
                            universityDataManager.fetchUSUniversities(state, Math.ceil(limit / states.length))
                        );
                        const results = await Promise.all(promises);
                        this.apiUniversities = results.flat();
                    } else {
                        // Fetch top US universities to complement our elite list
                        this.apiUniversities = await universityDataManager.fetchTopUSUniversities(limit);
                    }
                    
                    this.lastApiFetch = Date.now();
                } catch (error) {
                    console.error('Error fetching API universities:', error);
                    // Fall back to elite universities only
                }
            }
            
            // Filter out duplicates (prefer our hardcoded versions)
            const eliteNames = new Set(ELITE_UNIVERSITIES.map(uni => uni.name.toLowerCase()));
            const filteredApiUniversities = this.apiUniversities
                .filter(uni => !eliteNames.has(uni.name.toLowerCase()))
                .map(uni => this.convertToStandardFormat(uni));
            
            allUniversities = [...allUniversities, ...filteredApiUniversities];
        }
        
        return allUniversities;
    }
    
    async searchUniversities(criteria: {
        field?: string;
        country?: string;
        maxCost?: number;
        minAcceptanceRate?: number;
        maxAcceptanceRate?: number;
        degreeLevel?: string;
        limit?: number;
    }): Promise<any[]> {
        const universities = await this.getAllUniversities({ 
            includeAPI: true, 
            limit: criteria.limit || 100 
        });
        
        let filtered = universities;
        
        if (criteria.field) {
            filtered = filtered.filter(uni => 
                uni.programs[criteria.field] || 
                Object.keys(uni.programs).some(program => 
                    program.includes(criteria.field!) || criteria.field!.includes(program)
                )
            );
        }
        
        if (criteria.country) {
            filtered = filtered.filter(uni => 
                uni.country.toLowerCase() === criteria.country!.toLowerCase()
            );
        }
        
        if (criteria.maxCost) {
            filtered = filtered.filter(uni => 
                (uni.cost + (uni.living_cost || 0)) <= criteria.maxCost!
            );
        }
        
        if (criteria.minAcceptanceRate || criteria.maxAcceptanceRate) {
            filtered = filtered.filter(uni => {
                if (!uni.acceptance_rate) return false;
                if (criteria.minAcceptanceRate && uni.acceptance_rate < criteria.minAcceptanceRate) return false;
                if (criteria.maxAcceptanceRate && uni.acceptance_rate > criteria.maxAcceptanceRate) return false;
                return true;
            });
        }
        
        // Sort by a combination of ranking and program relevance
        filtered.sort((a, b) => {
            const aScore = (a.ranking ? (1000 - a.ranking) : 0) + 
                           (criteria.field && a.programs[criteria.field] ? a.programs[criteria.field] : 0);
            const bScore = (b.ranking ? (1000 - b.ranking) : 0) + 
                           (criteria.field && b.programs[criteria.field] ? b.programs[criteria.field] : 0);
            return bScore - aScore;
        });
        
        return filtered.slice(0, criteria.limit || 100);
    }
    
    private convertToStandardFormat(apiUni: EnhancedUniversity): any {
        return {
            id: apiUni.id,
            name: apiUni.name,
            country: apiUni.country,
            region: apiUni.region,
            ranking: apiUni.global_ranking || 999,
            acceptance_rate: apiUni.acceptance_rate || 50,
            avg_gpa: apiUni.avg_gpa || 3.0,
            strengths: apiUni.strengths,
            programs: apiUni.programs,
            requirements: apiUni.requirements,
            cost: apiUni.cost,
            living_cost: apiUni.living_cost || 15000,
            scholarships: apiUni.scholarships,
            scholarship_percentage: apiUni.scholarship_percentage || 30,
            location_type: apiUni.location_type,
            class_size: apiUni.class_size,
            research_opportunities: apiUni.research_opportunities,
            // Additional metadata
            state: apiUni.state,
            city: apiUni.city,
            student_size: apiUni.student_size,
            ownership_type: apiUni.ownership_type,
            median_debt: apiUni.median_debt,
            graduate_earnings: apiUni.graduate_earnings,
            website_url: apiUni.website_url,
            data_source: apiUni.data_source,
            last_updated: apiUni.last_updated
        };
    }
    
    // Get statistics about the hybrid database
    getDatasetStats(): {
        total_universities: number;
        elite_universities: number;
        api_universities: number;
        countries: string[];
        data_sources: string[];
        last_updated: string;
    } {
        return {
            total_universities: ELITE_UNIVERSITIES.length + this.apiUniversities.length,
            elite_universities: ELITE_UNIVERSITIES.length,
            api_universities: this.apiUniversities.length,
            countries: [...new Set([
                ...ELITE_UNIVERSITIES.map(uni => uni.country),
                ...this.apiUniversities.map(uni => uni.country)
            ])],
            data_sources: ['hardcoded', 'college_scorecard'],
            last_updated: new Date(this.lastApiFetch).toISOString()
        };
    }
    
    // Clear API cache
    clearCache(): void {
        this.apiUniversities = [];
        this.lastApiFetch = 0;
        universityDataManager.clearCache();
    }
}

// Export singleton instance
export const hybridUniversityManager = new HybridUniversityManager(); 