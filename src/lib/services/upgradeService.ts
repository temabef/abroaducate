import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { trackInteraction, shouldShowUpgrade } from '$lib/stores/upgradeStrategy';

// Global upgrade state
interface UpgradeState {
    showModal: boolean;
    showToast: boolean;
    modalData: {
        limitType: string;
        featureType: string;
        currentPlan: string;
        currentUsage: number;
        limit: number;
        message?: string;
    };
}

const defaultState: UpgradeState = {
    showModal: false,
    showToast: false,
    modalData: {
        limitType: 'documents',
        featureType: 'unknown',
        currentPlan: 'free',
        currentUsage: 0,
        limit: 0
    }
};

// Prevent automatic modal triggering on page load
let hasUserInteracted = false;

// Global store for upgrade state  
export const upgradeState = writable<UpgradeState>(defaultState);

// Function to reset upgrade state (useful for debugging)
export function resetUpgradeState(): void {
    upgradeState.set(defaultState);
    hasUserInteracted = false;
}

// Feature type mapping for better UX
const featureMapping = {
    // Document generation
    'sops_created': { limitType: 'documents', featureType: 'sop' },
    'cover_letters_created': { limitType: 'documents', featureType: 'cover_letter' },
    'personal_statements_created': { limitType: 'documents', featureType: 'personal_statement' },
    'academic_cvs_created': { limitType: 'documents', featureType: 'academic_cv' },
    
    // AI features
    'ai_improvements_used': { limitType: 'ai_features', featureType: 'reviews' },
    'ai_reviews': { limitType: 'ai_features', featureType: 'reviews' },
    'text_enhancements': { limitType: 'ai_features', featureType: 'text_enhancements' },
    'word_optimizations': { limitType: 'ai_features', featureType: 'word_optimizations' },
    'plagiarism_checks': { limitType: 'ai_features', featureType: 'plagiarism_checks' },
    
    // University features
    'university_searches': { limitType: 'university_matching', featureType: 'university_searches' },
    
    // Other features
    'visa_interviews': { limitType: 'visa_features', featureType: 'visa_interviews' },
    'cold_emails': { limitType: 'cold_email', featureType: 'cold_emails' },
    'analytics_generated': { limitType: 'analytics', featureType: 'analytics' },
    
    // Fallback for unknown types
    'unknown': { limitType: 'documents', featureType: 'unknown' }
};

/**
 * Universal upgrade handler - replaces ALL confirm() popups!
 * Call this instead of confirm() when you get upgradeRequired: true
 */
export function handleUpgradeRequired(errorData: {
    upgradeRequired: boolean;
    planType: string;
    currentUsage: number;
    limit: number;
    message: string;
    usageType?: string;
}): boolean {
    if (!errorData.upgradeRequired) {
        return false;
    }
    
    // Mark that user has interacted with the app
    hasUserInteracted = true;
    
    // Determine feature type from usage type or message
    const usageType = errorData.usageType || extractUsageTypeFromMessage(errorData.message);
    const featureInfo = featureMapping[usageType as keyof typeof featureMapping] || featureMapping.unknown;
    
    // Get optimal upgrade strategy
    const strategy = shouldShowUpgrade(featureInfo.limitType, featureInfo.featureType);
    
    // Only update global state with valid data
    if (errorData.limit > 0 && errorData.currentUsage >= 0) {
        upgradeState.update(state => ({
            ...state,
            showModal: strategy.strategy === 'modal',
            showToast: strategy.strategy === 'toast',
            modalData: {
                limitType: featureInfo.limitType,
                featureType: featureInfo.featureType,
                currentPlan: errorData.planType,
                currentUsage: errorData.currentUsage,
                limit: errorData.limit,
                message: errorData.message
            }
        }));
    } else {
        console.warn('Skipping upgrade modal for invalid data:', errorData);
        return false;
    }
    
    // Track the interaction
    trackInteraction(featureInfo.limitType, featureInfo.featureType, 'shown');
    
    return true; // Upgrade prompt shown
}

/**
 * Extract usage type from error message (fallback method)
 */
function extractUsageTypeFromMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Document types
    if (lowerMessage.includes('sop')) return 'sops_created';
    if (lowerMessage.includes('cover letter')) return 'cover_letters_created';
    if (lowerMessage.includes('personal statement')) return 'personal_statements_created';
    if (lowerMessage.includes('academic cv') || lowerMessage.includes('cv')) return 'academic_cvs_created';
    
    // AI features
    if (lowerMessage.includes('ai review') || lowerMessage.includes('review')) return 'ai_reviews';
    if (lowerMessage.includes('enhancement')) return 'text_enhancements';
    if (lowerMessage.includes('optimization')) return 'word_optimizations';
    if (lowerMessage.includes('plagiarism')) return 'plagiarism_checks';
    
    // Other features
    if (lowerMessage.includes('university') || lowerMessage.includes('search')) return 'university_searches';
    if (lowerMessage.includes('visa')) return 'visa_interviews';
    if (lowerMessage.includes('email')) return 'cold_emails';
    if (lowerMessage.includes('analytic')) return 'analytics_generated';
    
    return 'unknown';
}

/**
 * Handle upgrade button clicks
 */
export function handleUpgradeClick(planType: string) {
    const currentState = getCurrentState();
    
    // Track the upgrade action
    trackInteraction(
        currentState.modalData.limitType, 
        currentState.modalData.featureType, 
        'upgraded'
    );
    
    // Close modals
    upgradeState.update(state => ({
        ...state,
        showModal: false,
        showToast: false
    }));
    
    // Navigate to pricing page with optional plan selection
    if (planType === 'professional') {
        goto('/pricing?plan=professional');
    } else if (planType === 'elite') {
        goto('/pricing?plan=elite');
    } else {
        // Default to pricing page (including 'pricing' planType)
        goto('/pricing');
    }
}

/**
 * Handle modal/toast dismissal
 */
export function handleUpgradeDismiss() {
    const currentState = getCurrentState();
    
    // Track dismissal
    trackInteraction(
        currentState.modalData.limitType, 
        currentState.modalData.featureType, 
        'dismissed'
    );
    
    // Close modals
    upgradeState.update(state => ({
        ...state,
        showModal: false,
        showToast: false
    }));
}

/**
 * Get current upgrade state (helper function)
 */
function getCurrentState(): UpgradeState {
    let currentState = defaultState;
    upgradeState.subscribe(state => {
        currentState = state;
    })();
    return currentState;
}

/**
 * Check if user should see early upgrade warnings (80%+ usage)
 */
export function checkEarlyUpgradeWarning(
    currentUsage: number, 
    limit: number, 
    usageType: string
): boolean {
    // More strict validation
    if (limit <= 0 || currentUsage < 0 || !hasUserInteracted) return false;
    
    const percentageUsed = (currentUsage / limit) * 100;
    
    // Show warning at 80%+ usage (only after user has interacted)
    if (percentageUsed >= 80) {
        const featureInfo = featureMapping[usageType as keyof typeof featureMapping] || featureMapping.unknown;
        
        upgradeState.update(state => ({
            ...state,
            showToast: true,
            modalData: {
                limitType: featureInfo.limitType,
                featureType: featureInfo.featureType,
                currentPlan: 'free', // Assume free plan for warnings
                currentUsage,
                limit,
                message: `You've used ${Math.round(percentageUsed)}% of your monthly ${featureInfo.featureType} limit`
            }
        }));
        
        trackInteraction(featureInfo.limitType, featureInfo.featureType, 'reminded');
        return true;
    }
    
    return false;
}

/**
 * Mark that user has interacted (call this on first user action)
 */
export function markUserInteraction(): void {
    hasUserInteracted = true;
}

/**
 * Legacy support - automatically converts old confirm() calls
 * Replace: if (confirm(upgradeMessage)) goto('/pricing');
 * With: handleLegacyUpgrade(errorData);
 */
export function handleLegacyUpgrade(errorData: any): void {
    handleUpgradeRequired(errorData);
} 