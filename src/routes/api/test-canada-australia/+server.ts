import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canadianUniversityManager } from '$lib/database/canada-university-integration';
import { australianUniversityManager } from '$lib/database/australia-university-integration';

export const GET: RequestHandler = async () => {
    try {
        console.log('🧪 Testing Canadian and Australian University Integrations');

        // Test Canadian universities
        console.log('🍁 Testing Canadian universities...');
        const canadianUniversities = await canadianUniversityManager.fetchCanadianUniversities(undefined, 10);
        
        // Test Australian universities
        console.log('🇦🇺 Testing Australian universities...');
        const australianUniversities = await australianUniversityManager.fetchAustralianUniversities(undefined, 10);

        // Summary statistics
        const summary = {
            timestamp: new Date().toISOString(),
            canada: {
                total_fetched: canadianUniversities.length,
                sample_universities: canadianUniversities.slice(0, 3).map(uni => ({
                    id: uni.id,
                    name: uni.name,
                    city: uni.city,
                    province: uni.state,
                    acceptance_rate: uni.acceptance_rate,
                    cost_usd: uni.cost,
                    programs_count: Object.keys(uni.programs).length,
                    top_programs: Object.entries(uni.programs)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([program, score]) => ({ program, score }))
                })),
                provinces_represented: [...new Set(canadianUniversities.map(uni => uni.state))],
                average_acceptance_rate: Math.round(
                    canadianUniversities.reduce((sum, uni) => sum + (uni.acceptance_rate || 0), 0) / canadianUniversities.length
                ),
                cost_range: {
                    min: Math.min(...canadianUniversities.map(uni => uni.cost)),
                    max: Math.max(...canadianUniversities.map(uni => uni.cost)),
                    average: Math.round(canadianUniversities.reduce((sum, uni) => sum + uni.cost, 0) / canadianUniversities.length)
                }
            },
            australia: {
                total_fetched: australianUniversities.length,
                sample_universities: australianUniversities.slice(0, 3).map(uni => ({
                    id: uni.id,
                    name: uni.name,
                    city: uni.city,
                    state: uni.state,
                    acceptance_rate: uni.acceptance_rate,
                    cost_usd: uni.cost,
                    programs_count: Object.keys(uni.programs).length,
                    top_programs: Object.entries(uni.programs)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([program, score]) => ({ program, score }))
                })),
                states_represented: [...new Set(australianUniversities.map(uni => uni.state))],
                average_acceptance_rate: Math.round(
                    australianUniversities.reduce((sum, uni) => sum + (uni.acceptance_rate || 0), 0) / australianUniversities.length
                ),
                cost_range: {
                    min: Math.min(...australianUniversities.map(uni => uni.cost)),
                    max: Math.max(...australianUniversities.map(uni => uni.cost)),
                    average: Math.round(australianUniversities.reduce((sum, uni) => sum + uni.cost, 0) / australianUniversities.length)
                },
                go8_universities: australianUniversities.filter(uni => 
                    uni.strengths.includes('research-excellence') || 
                    uni.global_ranking && uni.global_ranking <= 100
                ).length
            }
        };

        console.log('✅ Integration test completed successfully');
        console.log(`🍁 Canadian universities: ${summary.canada.total_fetched} fetched`);
        console.log(`🇦🇺 Australian universities: ${summary.australia.total_fetched} fetched`);

        return json({
            success: true,
            message: 'Canadian and Australian university integrations working correctly',
            summary,
            detailed_data: {
                canadian_universities: canadianUniversities,
                australian_universities: australianUniversities
            }
        });

    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return json({
            success: false,
            error: 'Failed to test integrations',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}; 