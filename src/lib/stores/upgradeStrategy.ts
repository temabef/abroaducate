import { writable } from 'svelte/store';

// Track user upgrade interactions
export interface UpgradeInteraction {
    limitType: string;
    featureType: string;
    timestamp: number;
    action: 'shown' | 'dismissed' | 'upgraded' | 'reminded';
}

export interface UpgradeStrategy {
    interactions: UpgradeInteraction[];
    upgradeScore: number; // 0-100 based on user engagement
    lastUpgradePrompt: number;
    dismissCount: number;
    isHighIntent: boolean;
}

const defaultStrategy: UpgradeStrategy = {
    interactions: [],
    upgradeScore: 0,
    lastUpgradePrompt: 0,
    dismissCount: 0,
    isHighIntent: false
};

// Create writable store
export const upgradeStrategy = writable<UpgradeStrategy>(defaultStrategy);

// Helper functions
export function trackInteraction(limitType: string, featureType: string, action: 'shown' | 'dismissed' | 'upgraded' | 'reminded') {
    upgradeStrategy.update(strategy => {
        const interaction: UpgradeInteraction = {
            limitType,
            featureType,
            timestamp: Date.now(),
            action
        };
        
        return {
            ...strategy,
            interactions: [...strategy.interactions, interaction],
            lastUpgradePrompt: action === 'shown' ? Date.now() : strategy.lastUpgradePrompt,
            dismissCount: action === 'dismissed' ? strategy.dismissCount + 1 : strategy.dismissCount,
            upgradeScore: calculateUpgradeScore([...strategy.interactions, interaction]),
            isHighIntent: calculateHighIntent([...strategy.interactions, interaction])
        };
    });
}

function calculateUpgradeScore(interactions: UpgradeInteraction[]): number {
    let score = 0;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    interactions.forEach(interaction => {
        const daysAgo = (now - interaction.timestamp) / dayMs;
        const recencyWeight = Math.max(0, 1 - (daysAgo / 7)); // Decay over 7 days
        
        switch (interaction.action) {
            case 'shown':
                score += 10 * recencyWeight;
                break;
            case 'dismissed':
                score += 20 * recencyWeight; // Dismissal shows engagement
                break;
            case 'upgraded':
                score = 100; // Max score if upgraded
                break;
            case 'reminded':
                score += 15 * recencyWeight;
                break;
        }
    });
    
    return Math.min(100, score);
}

function calculateHighIntent(interactions: UpgradeInteraction[]): boolean {
    const recentInteractions = interactions.filter(i => 
        Date.now() - i.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    // High intent if:
    // 1. Multiple different features hit limits
    // 2. User has dismissed prompts (shows they're thinking about it)
    // 3. Multiple interactions in short time
    
    const uniqueFeatures = new Set(recentInteractions.map(i => i.featureType));
    const dismissals = recentInteractions.filter(i => i.action === 'dismissed').length;
    
    return uniqueFeatures.size >= 2 || dismissals >= 2 || recentInteractions.length >= 3;
}

export function shouldShowUpgrade(limitType: string, featureType: string): {
    show: boolean;
    strategy: 'modal' | 'toast' | 'banner';
    urgency: 'low' | 'medium' | 'high';
} {
    let currentStrategy: UpgradeStrategy = defaultStrategy;
    
    // Get current strategy value properly (without creating subscription leak)
    const unsubscribe = upgradeStrategy.subscribe(s => {
        currentStrategy = s;
    });
    unsubscribe(); // Clean up immediately
    
    const now = Date.now();
    const hoursSinceLastPrompt = (now - currentStrategy.lastUpgradePrompt) / (60 * 60 * 1000);
    
    // Don't show too frequently
    if (hoursSinceLastPrompt < 2) {
        return { show: false, strategy: 'toast', urgency: 'low' };
    }
    
    // Always show modal for hard limits
    if (limitType === 'documents') {
        return { 
            show: true, 
            strategy: 'modal', 
            urgency: currentStrategy.isHighIntent ? 'high' : 'medium' 
        };
    }
    
    // Progressive strategy for other limits
    if (currentStrategy.upgradeScore > 70) {
        return { show: true, strategy: 'modal', urgency: 'high' };
    } else if (currentStrategy.upgradeScore > 40) {
        return { show: true, strategy: 'banner', urgency: 'medium' };
    } else if (currentStrategy.upgradeScore > 20) {
        return { show: true, strategy: 'toast', urgency: 'low' };
    }
    
    return { show: false, strategy: 'toast', urgency: 'low' };
}

// Pricing psychology strategies
export function getOptimalPricing(userBehavior: 'hesitant' | 'engaged' | 'committed'): {
    emphasize: 'value' | 'savings' | 'features';
    showDiscount: boolean;
    highlightPlan: 'professional' | 'elite';
} {
    switch (userBehavior) {
        case 'hesitant':
            return {
                emphasize: 'value',
                showDiscount: true,
                highlightPlan: 'professional'
            };
        case 'engaged':
            return {
                emphasize: 'features',
                showDiscount: false,
                highlightPlan: 'professional'
            };
        case 'committed':
            return {
                emphasize: 'savings',
                showDiscount: false,
                highlightPlan: 'elite'
            };
        default:
            return {
                emphasize: 'value',
                showDiscount: false,
                highlightPlan: 'professional'
            };
    }
} 