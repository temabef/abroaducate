import type { PageServerLoad } from './$types';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';
import { universityDataManager } from '$lib/database/university-integration';

export const load: PageServerLoad = async () => {
    try {
        // Fetch US universities on the server side using the private API key
        await universityDataManager.fetchTopUSUniversities(500, COLLEGE_SCORECARD_API_KEY);
        const usStats = universityDataManager.getUSStats();
        
        return {
            usStats: {
                total_universities: usStats.total_universities,
                ivyLeague: 8 // Hardcoded for now
            }
        };
    } catch (error) {
        console.error('Error fetching US university data:', error);
        return {
            usStats: {
                total_universities: 0,
                ivyLeague: 8
            }
        };
    }
}; 