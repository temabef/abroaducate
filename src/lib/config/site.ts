// Site configuration
export const SITE_CONFIG = {
    // Update this to your actual production domain
    PRODUCTION_URL: 'https://abroaducate.com', // Replace with your actual domain
    
    // Development URL (for local testing)
    DEVELOPMENT_URL: 'http://localhost:3000',
    
    // Site name
    SITE_NAME: 'Abroaducate',
    
    // Site description
    SITE_DESCRIPTION: 'Your academic application assistant',
    
    // Contact email
    CONTACT_EMAIL: 'support@abroaducate.com'
};

// Function to get the correct base URL based on environment
export function getBaseUrl(): string {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        
        // If it's localhost, use the production domain for email links
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return SITE_CONFIG.PRODUCTION_URL;
        }
        
        // If it's already a production domain, use it
        return window.location.origin;
    }
    
    // Fallback to production domain
    return SITE_CONFIG.PRODUCTION_URL;
} 