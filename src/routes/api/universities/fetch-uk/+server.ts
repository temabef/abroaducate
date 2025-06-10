// UK Universities API Endpoint - Phase 2.2: International Expansion
// Handles fetching and processing UK university data

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ukUniversityDataManager } from '$lib/database/uk-university-integration';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 20;

        console.log(`🇬🇧 Phase 2.2: Fetching UK universities (limit: ${limit})`);

        // Fetch UK universities
        const ukUniversities = await ukUniversityDataManager.fetchUKUniversities(limit);
        
        // Get UK statistics
        const stats = ukUniversityDataManager.getUKStats();

        console.log(`✅ Successfully fetched ${ukUniversities.length} UK universities`);

        return json({
            success: true,
            data: {
                universities: ukUniversities,
                stats: {
                    total_fetched: ukUniversities.length,
                    source: 'uk_rankings_2025',
                    last_updated: new Date().toISOString(),
                    uk_stats: stats
                }
            },
            meta: {
                request_time: new Date().toISOString(),
                limit: limit,
                source: 'UK Rankings (Guardian 2025, Complete University Guide)',
                phase: '2.2-uk-expansion'
            }
        });

    } catch (error) {
        console.error('❌ Error fetching UK universities:', error);
        
        return json({
            success: false,
            error: {
                message: 'Failed to fetch UK universities',
                details: error instanceof Error ? error.message : 'Unknown error',
                phase: '2.2-uk-expansion'
            },
            data: {
                universities: [],
                stats: {
                    total_fetched: 0,
                    source: 'uk_rankings_2025',
                    last_updated: new Date().toISOString()
                }
            }
        }, { status: 500 });
    }
}; 