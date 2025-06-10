import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { universityDataManager, type EnhancedUniversity } from '$lib/database/university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';

// Phase II: University Database Expansion API
// This endpoint fetches universities from free data sources (US College Scorecard API)

export const GET: RequestHandler = async ({ url }) => {
    try {
        const searchParams = url.searchParams;
        const source = searchParams.get('source') || 'us';
        const state = searchParams.get('state');
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type') || 'all'; // 'all', 'top', 'state'
        
        let universities: EnhancedUniversity[] = [];
        
        switch (source) {
            case 'us':
                if (type === 'top') {
                    universities = await universityDataManager.fetchTopUSUniversities(limit, COLLEGE_SCORECARD_API_KEY);
                } else {
                    universities = await universityDataManager.fetchUSUniversities(state || undefined, limit, COLLEGE_SCORECARD_API_KEY);
                }
                break;
                
            case 'international':
                // Placeholder for international APIs (future implementation)
                universities = [];
                break;
                
            default:
                return json({ error: 'Invalid source parameter' }, { status: 400 });
        }
        
        // Transform to match our existing university format for compatibility
        const transformedUniversities = universities.map(uni => ({
            id: uni.id,
            name: uni.name,
            country: uni.country,
            region: uni.region,
            ranking: uni.global_ranking || 999, // Default ranking for unranked
            acceptance_rate: uni.acceptance_rate || 50,
            avg_gpa: uni.avg_gpa || 3.0,
            strengths: uni.strengths,
            programs: uni.programs,
            requirements: uni.requirements,
            cost: uni.cost,
            living_cost: uni.living_cost || 15000,
            scholarships: uni.scholarships,
            scholarship_percentage: uni.scholarship_percentage || 30,
            location_type: uni.location_type,
            class_size: uni.class_size,
            research_opportunities: uni.research_opportunities,
            // Additional Phase II data
            state: uni.state,
            city: uni.city,
            student_size: uni.student_size,
            ownership_type: uni.ownership_type,
            median_debt: uni.median_debt,
            graduate_earnings: uni.graduate_earnings,
            website_url: uni.website_url,
            data_source: uni.data_source,
            last_updated: uni.last_updated
        }));
        
        return json({
            success: true,
            count: transformedUniversities.length,
            source: source,
            universities: transformedUniversities,
            metadata: {
                fetched_at: new Date().toISOString(),
                cache_status: 'fresh',
                api_source: source === 'us' ? 'College Scorecard API' : source,
                total_available: source === 'us' ? '7000+' : 'unknown'
            }
        });
        
    } catch (error) {
        console.error('Error fetching universities:', error);
        return json({ 
            success: false, 
            error: 'Failed to fetch universities',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};

// POST endpoint for fetching specific universities by criteria
export const POST: RequestHandler = async ({ request }) => {
    try {
        const criteria = await request.json();
        const { 
            states = [], 
            programs = [], 
            max_cost,
            min_acceptance_rate,
            max_acceptance_rate,
            ownership_types = [],
            limit = 100 
        } = criteria;
        
        let universities: EnhancedUniversity[] = [];
        
        // For now, focus on US universities from College Scorecard
        if (states.length > 0) {
            // Fetch from multiple states
            const promises = states.map((state: string) => 
                universityDataManager.fetchUSUniversities(state, Math.ceil(limit / states.length), COLLEGE_SCORECARD_API_KEY)
            );
            const results = await Promise.all(promises);
            universities = results.flat();
        } else {
            universities = await universityDataManager.fetchUSUniversities(undefined, limit, COLLEGE_SCORECARD_API_KEY);
        }
        
        // Apply additional filtering
        let filteredUniversities = universities;
        
        if (max_cost) {
            filteredUniversities = filteredUniversities.filter(uni => uni.cost <= max_cost);
        }
        
        if (min_acceptance_rate || max_acceptance_rate) {
            filteredUniversities = filteredUniversities.filter(uni => {
                if (!uni.acceptance_rate) return false;
                if (min_acceptance_rate && uni.acceptance_rate < min_acceptance_rate) return false;
                if (max_acceptance_rate && uni.acceptance_rate > max_acceptance_rate) return false;
                return true;
            });
        }
        
        if (ownership_types.length > 0) {
            filteredUniversities = filteredUniversities.filter(uni => 
                ownership_types.includes(uni.ownership_type)
            );
        }
        
        if (programs.length > 0) {
            filteredUniversities = filteredUniversities.filter(uni => 
                programs.some((program: string) => uni.programs[program])
            );
        }
        
        // Sort by relevance (combination of ranking and program strength)
        filteredUniversities.sort((a, b) => {
            const aScore = (a.global_ranking ? (1000 - a.global_ranking) : 0) + 
                           Object.values(a.programs).reduce((sum, score) => sum + score, 0);
            const bScore = (b.global_ranking ? (1000 - b.global_ranking) : 0) + 
                           Object.values(b.programs).reduce((sum, score) => sum + score, 0);
            return bScore - aScore;
        });
        
        return json({
            success: true,
            count: filteredUniversities.length,
            universities: filteredUniversities.slice(0, limit),
            applied_filters: {
                states,
                programs,
                max_cost,
                acceptance_rate_range: [min_acceptance_rate, max_acceptance_rate],
                ownership_types
            }
        });
        
    } catch (error) {
        console.error('Error with custom university search:', error);
        return json({ 
            success: false, 
            error: 'Failed to search universities',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}; 