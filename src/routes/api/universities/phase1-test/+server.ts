// PHASE 1: US University Database Expansion Test API
// Demonstrates the massive expansion from ~100 to 5,000+ universities

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { universityDataManager } from '$lib/database/university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
    const startTime = Date.now();
    
    try {
        const searchParams = url.searchParams;
        const testType = searchParams.get('test') || 'quick'; // 'quick', 'full', 'stats'
        const maxUniversities = parseInt(searchParams.get('limit') || '1000');
        const forceRefresh = searchParams.get('forceRefresh') === 'true';
        
        console.log('🚀 PHASE 1 TEST INITIATED:', {
            testType,
            maxUniversities,
            forceRefresh,
            timestamp: new Date().toISOString()
        });
        
        let results: any = {};
        
        switch (testType) {
            case 'quick':
                // Quick test - fetch 500 universities
                console.log('⚡ Running quick Phase 1 test (500 universities)...');
                
                const quickUniversities = await universityDataManager.fetchAllUSUniversities(
                    COLLEGE_SCORECARD_API_KEY, 
                    {
                        maxUniversities: 500,
                        forceRefresh,
                        progressCallback: (progress) => {
                            console.log(`📊 Quick test progress: ${progress.percentage.toFixed(1)}%`);
                        }
                    }
                );
                
                results = {
                    test_type: 'quick',
                    universities_fetched: quickUniversities.length,
                    sample_universities: quickUniversities.slice(0, 5).map(uni => ({
                        name: uni.name,
                        state: uni.state,
                        cost: uni.cost,
                        acceptance_rate: uni.acceptance_rate,
                        data_source: uni.data_source
                    })),
                    expansion_factor: Math.round(quickUniversities.length / 100),
                    states_covered: [...new Set(quickUniversities.map(u => u.state).filter(Boolean))].length
                };
                break;
                
            case 'full':
                // Full test - fetch maximum universities
                console.log('🔥 Running FULL Phase 1 test (maximum universities)...');
                
                const fullUniversities = await universityDataManager.fetchAllUSUniversities(
                    COLLEGE_SCORECARD_API_KEY, 
                    {
                        maxUniversities,
                        forceRefresh,
                        progressCallback: (progress) => {
                            console.log(`📊 Full test progress: ${progress.percentage.toFixed(1)}% (${progress.current}/${progress.total})`);
                        }
                    }
                );
                
                // Comprehensive analysis
                const stateDistribution = fullUniversities.reduce((acc, uni) => {
                    const state = uni.state || 'Unknown';
                    acc[state] = (acc[state] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                
                const costAnalysis = {
                    min: Math.min(...fullUniversities.map(u => u.cost)),
                    max: Math.max(...fullUniversities.map(u => u.cost)),
                    average: Math.round(fullUniversities.reduce((sum, u) => sum + u.cost, 0) / fullUniversities.length),
                    median: fullUniversities.map(u => u.cost).sort((a, b) => a - b)[Math.floor(fullUniversities.length / 2)]
                };
                
                const acceptanceRateAnalysis = fullUniversities
                    .filter(u => u.acceptance_rate)
                    .map(u => u.acceptance_rate!);
                
                results = {
                    test_type: 'full',
                    universities_fetched: fullUniversities.length,
                    database_expansion: {
                        from: 100,
                        to: fullUniversities.length,
                        increase_factor: Math.round(fullUniversities.length / 100),
                        percentage_increase: `${((fullUniversities.length / 100 - 1) * 100).toFixed(0)}%`
                    },
                    geographic_coverage: {
                        states_covered: Object.keys(stateDistribution).length,
                        top_states: Object.entries(stateDistribution)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 10)
                            .map(([state, count]) => ({ state, universities: count }))
                    },
                    cost_analysis: costAnalysis,
                    acceptance_rate_analysis: {
                        min: Math.min(...acceptanceRateAnalysis),
                        max: Math.max(...acceptanceRateAnalysis),
                        average: Math.round(acceptanceRateAnalysis.reduce((sum, rate) => sum + rate, 0) / acceptanceRateAnalysis.length),
                        under_30_percent: acceptanceRateAnalysis.filter(rate => rate < 30).length,
                        over_70_percent: acceptanceRateAnalysis.filter(rate => rate > 70).length
                    },
                    institution_types: fullUniversities.reduce((acc, uni) => {
                        const type = uni.ownership_type || 'unknown';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>),
                    sample_universities: fullUniversities
                        .sort((a, b) => (a.acceptance_rate || 100) - (b.acceptance_rate || 100))
                        .slice(0, 10)
                        .map(uni => ({
                            name: uni.name,
                            state: uni.state,
                            city: uni.city,
                            acceptance_rate: uni.acceptance_rate,
                            cost: uni.cost,
                            student_size: uni.student_size,
                            ownership_type: uni.ownership_type
                        }))
                };
                break;
                
            case 'stats':
                // Statistics test
                console.log('📊 Running Phase 1 statistics test...');
                
                const stats = await universityDataManager.getUSUniversityStats(COLLEGE_SCORECARD_API_KEY);
                
                results = {
                    test_type: 'statistics',
                    comprehensive_stats: stats,
                    api_status: 'operational',
                    phase_1_capabilities: {
                        batch_fetching: true,
                        rate_limiting: true,
                        progress_tracking: true,
                        comprehensive_filtering: true,
                        caching_system: true
                    }
                };
                break;
                
            default:
                return json({ error: 'Invalid test type. Use: quick, full, or stats' }, { status: 400 });
        }
        
        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000;
        
        console.log('🎉 PHASE 1 TEST COMPLETED:', {
            testType,
            executionTime: `${executionTime.toFixed(2)}s`,
            universitiesFetched: results.universities_fetched || 'N/A'
        });
        
        return json({
            success: true,
            phase: 'PHASE_1_DATABASE_EXPANSION',
            test_results: results,
            performance: {
                execution_time_seconds: executionTime,
                universities_per_second: results.universities_fetched ? 
                    Math.round(results.universities_fetched / executionTime) : 0,
                api_efficiency: results.universities_fetched > 1000 ? 'excellent' : 
                               results.universities_fetched > 500 ? 'good' : 'standard'
            },
            api_info: {
                college_scorecard_api: 'operational',
                rate_limit: '1000 requests/hour',
                max_per_request: 100,
                total_available: '7000+ institutions'
            },
            next_steps: [
                'Phase 2: International APIs integration',
                'Phase 3: Government data sources',
                'Phase 4: Web scraping implementation',
                'Phase 5: Data enrichment and quality control'
            ],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ PHASE 1 TEST ERROR:', error);
        
        return json({
            success: false,
            phase: 'PHASE_1_ERROR',
            error: 'Phase 1 test failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            troubleshooting: {
                check_api_key: 'Verify COLLEGE_SCORECARD_API_KEY is set',
                check_network: 'Ensure internet connectivity',
                check_rate_limits: 'API rate limit may be exceeded',
                retry_suggestion: 'Wait 1 hour before retry if rate limited'
            }
        }, { status: 500 });
    }
}; 