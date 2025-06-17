import type { PageServerLoad } from './$types';
import { ukUniversityDataManager } from '$lib/database/uk-university-integration';
import { universityDataManager } from '$lib/database/university-integration';
import { australianUniversityManager } from '$lib/database/australia-university-integration';
import { canadianUniversityManager } from '$lib/database/canada-university-integration';
import { germanUniversityManager } from '$lib/database/germany-university-integration';
import { dutchUniversityManager } from '$lib/database/netherlands-university-integration';
import { japaneseUniversityManager } from '$lib/database/japan-university-integration';
import { frenchUniversityManager } from '$lib/database/france-university-integration';
import { italianUniversityManager } from '$lib/database/italy-university-integration';
import { COLLEGE_SCORECARD_API_KEY } from '$env/static/private';
import type { EnhancedUniversity } from '$lib/database/university-integration';

export const load = async ({ params, url }) => {
    const slug = params.slug;
    
    console.log(`🔍 Looking for university with slug: ${slug}`);
    
    // These problematic universities have been removed from the database
    
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
            
            // Check if it's a UK university domain that we don't have complete data for
            if (slug.includes('.ac.uk')) {
                console.log(`🇬🇧 UK university domain detected but not found: ${slug}`);
                return {
                    university: null,
                    error: `University not found. We searched for "${slug}" but couldn't find a matching university in our database.`,
                    isUkUniversity: true,
                    suggestedName: getCleanUniversityName(slug)
                };
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
        () => searchByPartialName(cleanSlug),
        () => searchByUKUniversityId(cleanSlug)
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
    
    // Special cases for UK universities have been removed as the problematic universities were deleted
    
    // Look for exact website URL matches
    for (const university of allUniversities) {
        if (university.website_url) {
            try {
                // Clean and standardize both URLs for comparison
                const websiteSlug = extractSlugFromUrl(university.website_url);
                
                // Debug logging for all UK universities to help diagnose issues
                if (university.country === 'United Kingdom') {
                    console.log(`🇬🇧 ${university.name}: URL="${university.website_url}", Slug="${websiteSlug}", ID="${university.id}"`);
                }
                
                // Compare slugs with various possible formats
                if (websiteSlug === slug || 
                    (websiteSlug === `www.${slug}`) || 
                    (slug === `www.${websiteSlug}`) ||
                    (slug.includes(websiteSlug.replace('www.', ''))) ||
                    (websiteSlug.includes(slug.replace('www.', '')))) {
                    console.log(`✅ Found match: ${university.name}`);
                    return university;
                }
            } catch (error) {
                console.error(`❌ Error processing website URL for ${university.name}: ${university.website_url}`, error);
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
 * Special search for UK universities by ID
 * This is a fallback method for UK universities that might have complex domain structures
 */
async function searchByUKUniversityId(slug: string): Promise<EnhancedUniversity | null> {
    console.log(`🇬🇧 Searching UK universities by ID for: ${slug}`);
    
    // Get all universities
    const allUniversities = await getAllUniversities();
    const ukUniversities = allUniversities.filter(uni => uni.country === 'United Kingdom');
    
    // Extract potential university name from the slug
    let potentialName = slug
        .replace(/^www\./, '')
        .replace(/\.ac\.uk$/, '')
        .replace(/[-_.]/g, ' ');
    
    console.log(`🔍 Extracted potential name: "${potentialName}"`);
    
    // First try direct ID match
    for (const uni of ukUniversities) {
        if (uni.id.toLowerCase() === potentialName.toLowerCase()) {
            console.log(`✅ Found exact ID match: ${uni.name} (ID: ${uni.id})`);
            return uni;
        }
    }
    
    // Then try fuzzy ID match
    for (const uni of ukUniversities) {
        // Try to match parts of the ID
        const idParts = uni.id.toLowerCase().split('-');
        const nameParts = potentialName.toLowerCase().split(' ');
        
        // Check for significant overlap
        const matchingParts = idParts.filter(part => 
            nameParts.some(namePart => 
                namePart.includes(part) || part.includes(namePart)
            )
        );
        
        if (matchingParts.length >= Math.min(1, idParts.length * 0.5)) {
            console.log(`✅ Found fuzzy ID match: ${uni.name} (ID: ${uni.id})`);
            return uni;
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
            dutchUniversityManager.fetchDutchUniversities(undefined, 100),
            		japaneseUniversityManager.fetchJapaneseUniversities(undefined, 100),
		frenchUniversityManager.fetchFrenchUniversities(undefined, 100),
		italianUniversityManager.fetchItalianUniversities(undefined, 100)
        ]);
        
        // Process results and add successful ones
        results.forEach((result, index) => {
            const sources = ['US', 'UK', 'Australia', 'Canada', 'Germany', 'Netherlands', 'Japan', 'France', 'Italy'];
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
        
        // Special handling for UK university URLs that often have complex subdomains
        const hostname = urlObj.hostname.toLowerCase();
        
        // Handle common UK university URL patterns
        if (hostname.endsWith('.ac.uk')) {
            // Extract the main part of the domain for .ac.uk domains
            const parts = hostname.split('.');
            if (parts.length >= 3) {
                // For URLs like www.bishopg.ac.uk, return bishopg.ac.uk
                if (parts[0] === 'www') {
                    return parts.slice(1).join('.');
                }
            }
        }
        
        return hostname;
    } catch (error) {
        // Log error for debugging
        console.error(`❌ Error extracting slug from URL: ${url}`, error);
        
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

/**
 * Extract clean university name from slug for display purposes
 */
function getCleanUniversityName(slug: string): string {
    // Special cases for UK universities have been removed
    
    // Remove www., .edu, .ac.uk, etc. and clean up
    return slug
      .replace(/^www\./, '')
      .replace(/\.(edu|ac\.uk|ca|nl|de)$/, '')
      .replace(/[-_]/g, ' ')
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
} 