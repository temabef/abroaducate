import type { PageServerLoad } from './$types';
import { ukUniversityDataManager } from '$lib/database/uk-university-integration';
import { universityDataManager } from '$lib/database/university-integration';
import { australianUniversityManager } from '$lib/database/australia-university-integration';
import { canadianUniversityManager } from '$lib/database/canada-university-integration';
import { germanUniversityManager } from '$lib/database/germany-university-integration';
import { dutchUniversityManager } from '$lib/database/netherlands-university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';
import type { EnhancedUniversity } from '$lib/database/university-integration';

export const load = async ({ params }) => {
    const slug = params.slug;
    
    console.log(`🔍 Looking for university with slug: ${slug}`);
    
    try {
        // Search across ALL university databases
        const university = await findUniversityBySlug(slug);
        
        if (university) {
            console.log(`✅ Found university: ${university.name}`);
            return {
                university
            };
        } else {
            // Special case for Harvard - let's try to find it directly
            if (slug === 'www.harvard.edu' || slug === 'harvard.edu' || slug.includes('harvard')) {
                console.log(`🎓 Special Harvard search...`);
                const allUniversities = await getAllUniversities();
                const harvardUni = allUniversities.find(uni => 
                    uni.name.toLowerCase().includes('harvard') && 
                    uni.name.toLowerCase().includes('university')
                );
                if (harvardUni) {
                    console.log(`✅ Found Harvard via special search: ${harvardUni.name}`);
                    return {
                        university: harvardUni
                    };
                }
            }
            
            console.log(`❌ University not found for slug: ${slug}`);
            return {
                university: null,
                error: `University not found. We searched for "${slug}" but couldn't find a matching university in our database.`
            };
        }
        
    } catch (error) {
        console.error('❌ Error loading university:', error);
        return {
            university: null,
            error: 'An error occurred while loading the university profile.'
        };
    }
};

/**
 * Search for a university across all databases by slug
 */
async function findUniversityBySlug(slug: string): Promise<EnhancedUniversity | null> {
    // Clean the slug for better matching
    const cleanSlug = slug.toLowerCase();
    
    // Search strategies in order of preference
    const searchStrategies = [
        () => searchByWebsiteUrl(cleanSlug),
        () => searchByUniversityName(cleanSlug),
        () => searchByPartialName(cleanSlug)
    ];
    
    for (const strategy of searchStrategies) {
        const result = await strategy();
        if (result) {
            return result;
        }
    }
    
    return null;
}

/**
 * Search by website URL (most accurate)
 */
async function searchByWebsiteUrl(slug: string): Promise<EnhancedUniversity | null> {
    console.log(`🌐 Searching by website URL: ${slug}`);
    
    // Get all universities from all sources
    const allUniversities = await getAllUniversities();
    
    // Look for Harvard specifically first
    const harvardUniversities = allUniversities.filter(uni => 
        uni.name.toLowerCase().includes('harvard')
    );
    console.log(`🎓 Found ${harvardUniversities.length} Harvard universities:`);
    harvardUniversities.forEach(uni => {
        console.log(`  - ${uni.name}: ${uni.website_url}`);
        const websiteSlug = extractSlugFromUrl(uni.website_url || '');
        console.log(`    Slug: "${websiteSlug}" vs "${slug}"`);
    });
    
    // Look for exact website URL matches
    for (const university of allUniversities) {
        if (university.website_url) {
            const websiteSlug = extractSlugFromUrl(university.website_url);
            if (websiteSlug === slug) {
                console.log(`✅ Found match: ${university.name}`);
                return university;
            }
        }
    }
    
    return null;
}

/**
 * Search by university name (converted to slug format)
 */
async function searchByUniversityName(slug: string): Promise<EnhancedUniversity | null> {
    console.log(`🏫 Searching by university name: ${slug}`);
    
    const allUniversities = await getAllUniversities();
    
    // Convert university names to slug format and compare
    for (const university of allUniversities) {
        const nameSlug = convertNameToSlug(university.name);
        if (nameSlug === slug) {
            return university;
        }
    }
    
    return null;
}

/**
 * Search by partial name matching (fallback)
 */
async function searchByPartialName(slug: string): Promise<EnhancedUniversity | null> {
    console.log(`🔍 Searching by partial name: ${slug}`);
    
    const allUniversities = await getAllUniversities();
    
    // Clean slug for partial matching
    const searchTerms = slug
        .replace(/^www\./, '')
        .replace(/\.(edu|ac\.uk|ca|nl|de)$/, '')
        .replace(/[-_.]/g, ' ')
        .toLowerCase()
        .split(' ')
        .filter(term => term.length > 2); // Only meaningful terms
    
    console.log(`🔍 Search terms extracted from "${slug}": [${searchTerms.join(', ')}]`);
    
    // Find universities that contain most of the search terms
    for (const university of allUniversities) {
        const universityName = university.name.toLowerCase();
        const matchCount = searchTerms.filter(term => universityName.includes(term)).length;
        
        // Debug for Harvard specifically
        if (universityName.includes('harvard')) {
            console.log(`🎓 Harvard found: "${university.name}" - Match count: ${matchCount}/${searchTerms.length}`);
        }
        
        // If most terms match, consider it a match
        if (matchCount >= Math.ceil(searchTerms.length * 0.6)) {
            console.log(`✅ Partial match found: ${university.name} (${matchCount}/${searchTerms.length} terms matched)`);
            return university;
        }
    }
    
    return null;
}

/**
 * Get all universities from all sources
 */
async function getAllUniversities(): Promise<EnhancedUniversity[]> {
    const allUniversities: EnhancedUniversity[] = [];
    
    try {
        // Fetch from all sources in parallel, with fallbacks for errors
        const results = await Promise.allSettled([
            universityDataManager.fetchTopUSUniversities(500, COLLEGE_SCORECARD_API_KEY),
            ukUniversityDataManager.fetchUKUniversities(100),
            australianUniversityManager.fetchAustralianUniversities(undefined, 100),
            canadianUniversityManager.fetchCanadianUniversities(undefined, 100),
            germanUniversityManager.fetchGermanUniversities(undefined, 100),
            dutchUniversityManager.fetchDutchUniversities(undefined, 100)
        ]);
        
        // Process results and add successful ones
        results.forEach((result, index) => {
            const sources = ['US', 'UK', 'Australia', 'Canada', 'Germany', 'Netherlands'];
            if (result.status === 'fulfilled') {
                allUniversities.push(...result.value);
                console.log(`✅ Loaded ${result.value.length} universities from ${sources[index]}`);
            } else {
                console.log(`❌ Failed to load universities from ${sources[index]}:`, result.reason);
            }
        });
        
        console.log(`📊 Total universities loaded: ${allUniversities.length}`);
        
    } catch (error) {
        console.error('❌ Error fetching universities:', error);
    }
    
    return allUniversities;
}

/**
 * Extract slug from website URL
 */
function extractSlugFromUrl(url: string): string {
    try {
        // Clean the URL first
        let cleanUrl = url.trim();
        
        // Add protocol if missing
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        
        const urlObj = new URL(cleanUrl);
        return urlObj.hostname.toLowerCase();
    } catch {
        // Fallback: clean the URL manually
        return url
            .replace(/^https?:\/\//, '') // Remove protocol
            .replace(/\/$/, '') // Remove trailing slash
            .split('/')[0] // Take only the domain part
            .toLowerCase();
    }
}

/**
 * Convert university name to slug format
 */
function convertNameToSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
} 