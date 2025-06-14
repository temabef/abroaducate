import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { universityDataManager, type EnhancedUniversity } from '$lib/database/university-integration';
import { ukUniversityDataManager, UK_UNIVERSITIES } from '$lib/database/uk-university-integration';
import { australianUniversityManager } from '$lib/database/australia-university-integration';
import { CanadianUniversityDataManager, CANADIAN_UNIVERSITIES } from '$lib/database/canada-university-integration';
import { japaneseUniversityManager } from '$lib/database/japan-university-integration';
import { frenchUniversityManager } from '$lib/database/france-university-integration';
import { italianUniversityManager } from '$lib/database/italy-university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';

// Create Canadian university manager instance
const canadianUniversityManager = new CanadianUniversityDataManager();

// Phase II: University Database Expansion API
// This endpoint fetches universities from free data sources (US College Scorecard API)
// ENHANCED for Phase 1: Batch fetching capabilities

export const GET: RequestHandler = async ({ url }) => {
    try {
        const searchParams = url.searchParams;
        const source = searchParams.get('source') || 'us';
        const state = searchParams.get('state');
        const limit = parseInt(searchParams.get('limit') || '50');
        const type = searchParams.get('type') || 'all'; // 'all', 'top', 'state', 'comprehensive'
        const forceRefresh = searchParams.get('forceRefresh') === 'true';
        
        // PHASE 1: Enhanced fetching modes
        const fetchMode = searchParams.get('mode') || 'standard'; // 'standard', 'batch', 'comprehensive'
        
        let universities: EnhancedUniversity[] = [];
        let metadata: any = {};
        
        switch (source) {
            case 'us':
                if (fetchMode === 'comprehensive' || fetchMode === 'batch') {
                    // PHASE 1: Use new comprehensive batch fetching
                    console.log('🚀 PHASE 1: Using comprehensive batch fetching mode');
                    console.log(`🔧 Limit requested: ${limit}, Max allowed: 1000`);
                    
                    const states = state && state.trim() ? [state.trim()] : undefined;
                    const maxUniversities = Math.min(limit, 1000); // Cap at 1000 for better performance
                    
                    universities = await universityDataManager.fetchAllUSUniversities(COLLEGE_SCORECARD_API_KEY, {
                        maxUniversities,
                        states,
                        forceRefresh,
                        progressCallback: (progress) => {
                            console.log(`📊 Progress: ${progress.current}/${progress.total} (${progress.percentage.toFixed(1)}%)`);
                        }
                    });
                    
                    metadata = {
                        fetching_mode: 'comprehensive_batch',
                        api_calls_estimated: Math.ceil(universities.length / 100),
                        rate_limited: true,
                        comprehensive_data: true,
                        requested_limit: limit,
                        actual_fetched: universities.length
                    };
                    
                } else if (type === 'top') {
                    universities = await universityDataManager.fetchTopUSUniversities(limit, COLLEGE_SCORECARD_API_KEY);
                    metadata = { fetching_mode: 'top_selective' };
                } else {
                    // Enhanced standard fetching - increase limit for better results
                    const enhancedLimit = Math.min(limit, 500); // Allow up to 500 in standard mode
                    const stateParam = state || undefined; // Handle null properly
                    universities = await universityDataManager.fetchUSUniversitiesEnhanced({
                        state: stateParam,
                        limit: enhancedLimit,
                        type: 'all',
                        apiKey: COLLEGE_SCORECARD_API_KEY
                    });
                    metadata = { 
                        fetching_mode: 'enhanced_standard',
                        requested_limit: limit,
                        actual_limit: enhancedLimit,
                        actual_fetched: universities.length
                    };
                }
                break;
                
            case 'uk':
                console.log('🇬🇧 Fetching UK Universities...');
                if (forceRefresh) {
                    ukUniversityDataManager.clearCache();
                }
                universities = await ukUniversityDataManager.fetchUKUniversities(Math.min(limit, 200));
                metadata = { 
                    fetching_mode: 'uk_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit,
                    total_available: UK_UNIVERSITIES.length
                };
                break;
                
            case 'australia':
                console.log('🇦🇺 Fetching Australian Universities...');
                universities = await australianUniversityManager.fetchAustralianUniversities(state || undefined, Math.min(limit, 100));
                metadata = { 
                    fetching_mode: 'australia_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit
                };
                break;
                
            case 'canada':
                console.log('🇨🇦 Fetching Canadian Universities...');
                if (forceRefresh) {
                    canadianUniversityManager.clearCache();
                }
                universities = await canadianUniversityManager.fetchCanadianUniversities(state || undefined, Math.min(limit, 100));
                metadata = { 
                    fetching_mode: 'canada_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit,
                    total_available: CANADIAN_UNIVERSITIES.length
                };
                break;
                
            case 'germany':
                console.log('🇩🇪 Fetching German Universities...');
                if (forceRefresh) {
                    universityDataManager.clearGermanCache();
                }
                universities = await universityDataManager.fetchGermanUniversities(state || undefined, Math.min(limit, 100));
                metadata = { 
                    fetching_mode: 'germany_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit,
                    stats: universityDataManager.getGermanStats(),
                    cache_status: forceRefresh ? 'refreshed' : 'using_cache_if_available'
                };
                break;
                
            case 'netherlands':
                console.log('🇳🇱 Fetching Dutch Universities...');
                universities = await universityDataManager.fetchDutchUniversities(state || undefined, Math.min(limit, 30));
                metadata = { 
                    fetching_mode: 'netherlands_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit,
                    stats: universityDataManager.getDutchStats()
                };
                break;
                
            case 'japan':
                console.log('🇯🇵 Fetching Japanese Universities...');
                universities = await japaneseUniversityManager.fetchJapaneseUniversities(state || undefined, Math.min(limit, 100));
                metadata = { 
                    fetching_mode: 'japan_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit
                };
                break;

            case 'france':
                console.log('🇫🇷 Fetching French Universities...');
                universities = await frenchUniversityManager.fetchFrenchUniversities(state || undefined, Math.min(limit, 100));
                metadata = { 
                    fetching_mode: 'france_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit
                };
                break;

            case 'italy':
                console.log('🇮🇹 Fetching Italian Universities...');
                universities = await italianUniversityManager.fetchItalianUniversities(state || undefined, Math.min(limit, 100));
                metadata = { 
                    fetching_mode: 'italy_comprehensive',
                    actual_fetched: universities.length,
                    requested_limit: limit
                };
                break;
                
            case 'international':
                // Placeholder for other international APIs (future implementation)
                universities = [];
                metadata = { fetching_mode: 'placeholder' };
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
        
        // PHASE 1: Enhanced response with comprehensive statistics
        const response = {
            success: true,
            count: transformedUniversities.length,
            source: source,
            phase: 'PHASE_1_ENHANCED',
            universities: transformedUniversities,
            metadata: {
                fetched_at: new Date().toISOString(),
                cache_status: forceRefresh ? 'fresh' : 'cached_or_fresh',
                api_source: source === 'us' ? 'College Scorecard API (Enhanced)' : source,
                total_available: source === 'us' ? '7000+' : 'unknown',
                fetching_method: metadata.fetching_mode || 'standard',
                database_expansion: transformedUniversities.length > 100 ? 
                    `${((transformedUniversities.length / 100) * 100).toFixed(0)}% increase from base` : 
                    'Base level',
                coverage: {
                    states: state ? [state] : [...new Set(transformedUniversities.map(u => u.state).filter(Boolean))],
                    institution_types: [...new Set(transformedUniversities.map(u => u.ownership_type).filter(Boolean))],
                    cost_range: {
                        min: Math.min(...transformedUniversities.map(u => u.cost)),
                        max: Math.max(...transformedUniversities.map(u => u.cost)),
                        average: Math.round(transformedUniversities.reduce((sum, u) => sum + u.cost, 0) / transformedUniversities.length)
                    }
                },
                ...metadata
            }
        };
        
        // Log Phase 1 success
        if (transformedUniversities.length > 500) {
            console.log('🎉 PHASE 1 SUCCESS: Massive database expansion achieved!');
            console.log(`📊 Universities fetched: ${transformedUniversities.length}`);
            console.log(`📈 Expansion rate: ${((transformedUniversities.length / 100) * 100).toFixed(0)}%`);
        }
        
        return json(response);
        
    } catch (error) {
        console.error('Error fetching universities:', error);
        return json({ 
            success: false, 
            error: 'Failed to fetch universities',
            details: error instanceof Error ? error.message : 'Unknown error',
            phase: 'PHASE_1_ERROR'
        }, { status: 500 });
    }
};

// PHASE 1: Enhanced POST endpoint with comprehensive search and statistics
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
            limit = 100,
            comprehensive = false, // PHASE 1: Enable comprehensive fetching
            include_stats = false
        } = criteria;
        
        let universities: EnhancedUniversity[] = [];
        
        if (comprehensive) {
            // PHASE 1: Use comprehensive batch fetching
            console.log('🚀 PHASE 1: Comprehensive POST search initiated');
            
            universities = await universityDataManager.fetchAllUSUniversities(COLLEGE_SCORECARD_API_KEY, {
                maxUniversities: Math.min(limit * 5, 1000), // Fetch more for better filtering, capped at 1000
                states: states.length > 0 ? states : undefined,
                progressCallback: (progress) => {
                    console.log(`📊 Comprehensive search progress: ${progress.percentage.toFixed(1)}%`);
                }
            });
        } else {
            // Standard fetching for backward compatibility
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
        }
        
        // Apply enhanced filtering
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
        
        const finalResults = filteredUniversities.slice(0, limit);
        
        // PHASE 1: Optional comprehensive statistics
        let stats = {};
        if (include_stats && COLLEGE_SCORECARD_API_KEY) {
            try {
                stats = await universityDataManager.getUSUniversityStats(COLLEGE_SCORECARD_API_KEY);
            } catch (error) {
                console.error('Error fetching stats:', error);
                stats = { error: 'Stats unavailable' };
            }
        }
        
        return json({
            success: true,
            count: finalResults.length,
            total_before_filtering: universities.length,
            universities: finalResults,
            applied_filters: {
                states,
                programs,
                max_cost,
                acceptance_rate_range: [min_acceptance_rate, max_acceptance_rate],
                ownership_types
            },
            phase_1_enhancements: {
                comprehensive_search: comprehensive,
                total_pool_size: universities.length,
                filter_efficiency: universities.length > 0 ? (finalResults.length / universities.length * 100).toFixed(1) + '%' : '0%',
                database_expansion: universities.length > 100 ? 
                    `${((universities.length / 100) * 100).toFixed(0)}% from base` : 
                    'Base level'
            },
            ...(include_stats && { comprehensive_stats: stats })
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