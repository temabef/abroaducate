import { loadStripe } from '@stripe/stripe-js';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

// Client-side Stripe instance (safe for client use)
export const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

// COMPREHENSIVE production-ready subscription plans configuration
// Matches SQL configuration and pricing page exactly
export const SUBSCRIPTION_PLANS = {
    professional: {
        name: 'Academic Professional',
        prices: {
            monthly: 12.00,
            annual: 10.00
        },
        priceIds: {
            monthly: 'price_1Rkmj7C5OCrAkph8nUd67hTJ',
            annual: 'price_1RkmnsC5OCrAkph8OciObYhn'
        },
        
        // Document Generation - 50 total documents per month
        documents: {
            total_per_month: 50,
            allocation_type: 'flexible', // Any combination of document types
            export_formats: ['pdf', 'rtf', 'docx'],
            templates: 'premium'
        },
        
        // AI Features with specific limits - MATCHES SQL EXACTLY
        ai_features: {
            reviews: 15,
            text_enhancements: 25,
            word_optimizations: 15,
            plagiarism_checks: 10,
            model: 'gpt-4o-mini'
        },
        
        // University Matching - MATCHES SQL EXACTLY
        university_matching: {
            total_universities: 500,
            queries_per_month: 25,
            includes_international: true,
            priority_access: false
        },
        
        // Academic Analysis
        academic_analysis: {
            quick_assessment: true,
            comprehensive_transcript: true,
            unlimited_access: false
        },
        
        // Advanced Features
        advanced_features: {
            email_reminders: true,
            notifications: true,
            version_history: true,
            analytics_dashboard: true,
            cold_email_generator: 'basic',
            support_level: 'email_48h'
        },
        
        // Visa Interview - MATCHES SQL EXACTLY
        visa_interview: {
            questions_per_session: 50
        },
        
        // Cold Email - MATCHES SQL EXACTLY
        cold_email: {
            emails_per_month: 50
        },
        
        features: [
            '50 documents per month (any combination)',
            '15 AI Reviews, 25 Text Enhancements, 15 Word Optimizations',
            '500+ university recommendations (US + international)',
            'Comprehensive transcript analysis + Quick assessment',
            'All templates & PDF/RTF/DOCX export',
            'Advanced application tracking & analytics',
            'Email support (48h response)',
            'Email reminders & notifications',
            'Complete version history & document tracking',
            'GPT-4o-mini AI Engine',
            'Cold Email Generator - 50 emails per month',
            'Visa Interview Simulator - 50 practice questions per session'
        ]
    },
    
    elite: {
        name: 'Academic Elite',
        prices: {
            monthly: 29.00,
            annual: 24.00
        },
        priceIds: {
            monthly: 'price_1RkmpQC5OCrAkph8At9XJOnw',
            annual: 'price_1RkmqsC5OCrAkph8QfDUihYK'
        },
        
        // Document Generation - UNLIMITED - MATCHES SQL EXACTLY
        documents: {
            total_per_month: null, // Unlimited
            allocation_type: 'unlimited',
            export_formats: ['pdf', 'rtf', 'docx', 'latex', 'custom'],
            templates: 'premium_plus_custom'
        },
        
        // AI Features - UNLIMITED - MATCHES SQL EXACTLY
        ai_features: {
            reviews: null, // Unlimited
            text_enhancements: null, // Unlimited
            word_optimizations: null, // Unlimited
            plagiarism_checks: null, // Unlimited
            model: 'gpt-4o'
        },
        
        // University Matching - UNLIMITED queries - MATCHES SQL EXACTLY
        university_matching: {
            total_universities: 1500,
            queries_per_month: null, // Unlimited
            includes_international: true,
            priority_access: true,
            new_universities_first: true
        },
        
        // Academic Analysis
        academic_analysis: {
            quick_assessment: true,
            comprehensive_transcript: true,
            unlimited_access: true
        },
        
        // Advanced Features
        advanced_features: {
            email_reminders: true,
            notifications: true,
            version_history: true,
            analytics_dashboard: true,
            insights_dashboard: true,
            cold_email_generator: 'advanced',
            support_level: 'email_24h',
            early_access: true,
            custom_branding: true // coming soon
        },
        
        // Visa Interview - MATCHES SQL EXACTLY
        visa_interview: {
            questions_per_session: 80
        },
        
        // Cold Email - MATCHES SQL EXACTLY  
        cold_email: {
            emails_per_month: 500 // 500 per month as per pricing page
        },
        
        features: [
            'UNLIMITED document generation',
            'UNLIMITED AI reviews, enhancements, and optimizations',
            '1500+ universities worldwide + priority access + new universities first',
            'Comprehensive transcript analysis + Quick assessment',
            'All templates + custom template creation (coming soon)',
            'Enhanced export (PDF, RTF + more formats coming)',
            'Priority email support (24h response)',
            'Advanced analytics & insights dashboard',
            'Complete version history & document tracking',
            'Early access to new features',
            'GPT-4o AI Engine - Most advanced AI model available',
            'Advanced Cold Email Suite - 500 emails per month',
            'Visa Interview Simulator - All 80+ practice questions per session'
        ]
    }
};

// FREE plan configuration - MATCHES SQL EXACTLY
export const FREE_PLAN = {
    name: 'Academic Starter',
    price: 0,
    
    // Document Generation - MATCHES SQL EXACTLY
    documents: {
        sops_per_month: 2,
        cover_letters_per_month: 2,
        personal_statements_per_month: 1,
        academic_cvs_per_month: 1,
        total_documents: 6, // 2+2+1+1
        export_formats: ['pdf', 'rtf'],
        templates: 'basic'
    },
    
    // AI Features - MATCHES SQL EXACTLY
    ai_features: {
        reviews: 1, // CORRECTED to match SQL and pricing page
        text_enhancements: 1, // CORRECTED to match SQL and pricing page
        word_optimizations: 1, // CORRECTED to match SQL and pricing page
        plagiarism_checks: 1,
        model: 'gpt-3.5-turbo'
    },
    
    // University Matching - MATCHES SQL EXACTLY
    university_matching: {
        total_universities: 50,
        queries_per_month: 5,
        basic_matching: true,
        priority_access: false
    },
    
    // Academic Analysis
    academic_analysis: {
        quick_assessment: true,
        comprehensive_transcript: false
    },
    
    // Basic Features
    basic_features: {
        application_tracking: true,
        basic_reminders: true,
        version_history_cover_letters_only: true,
        support_level: 'community',
        templates_count: 6
    },
    
    // Visa Interview - MATCHES SQL EXACTLY
    visa_interview: {
        questions_per_session: 6 // CORRECTED to match SQL and pricing page
    },
    
    // Cold Email - MATCHES SQL EXACTLY
    cold_email: {
        emails_per_month: 5 // CORRECTED to match SQL and pricing page
    },
    
    features: [
        '6 Documents/Month: 2 SOPs, 2 Cover Letters, 1 Personal Statement, 1 Academic CV',
        'AI Features: 1 Review, 1 Text Enhancement, 1 Word Optimization per month',
        'University Matching: 50+ universities with basic matching',
        'Academic Analysis: Quick profile assessment only',
        'Basic templates & PDF/RTF export',
        'Application tracking & basic reminders',
        '6 basic templates per document type',
        'Version history (cover letters only)',
        'Visa Interview Simulator: 6 practice questions per session',
        'Cold Email Generator: 5 emails per month',
        'Community support',
        'GPT-3.5 AI Engine - Reliable and efficient AI'
    ]
};

// Helper function to get plan details by type
export function getPlanDetails(planType: string) {
    switch (planType) {
        case 'professional':
            return SUBSCRIPTION_PLANS.professional;
        case 'elite':
            return SUBSCRIPTION_PLANS.elite;
        case 'free':
        default:
            return FREE_PLAN;
    }
}

// Helper function to check if plan has unlimited access to a feature
export function hasUnlimitedAccess(planType: string, featureCategory: string, featureType?: string): boolean {
    const plan = getPlanDetails(planType);
    
    if (planType === 'elite') {
        // Elite has unlimited access to most features except cold_email (500 limit)
        if (featureCategory === 'documents') return true;
        if (featureCategory === 'ai_features') return true;
        if (featureCategory === 'university_matching' && featureType === 'queries') return true;
        // Cold email has a limit of 500 per month for elite, not unlimited
    }
    
    return false;
}

// Helper function to get feature limit
export function getFeatureLimit(planType: string, featureCategory: string, featureType: string): number | null {
    const plan = getPlanDetails(planType) as any; // Type assertion to handle different plan structures
    
    switch (featureCategory) {
        case 'documents':
            if (planType === 'professional') return plan.documents?.total_per_month || 50;
            if (planType === 'elite') return null; // unlimited
            // Free tier individual limits
            switch (featureType) {
                case 'sops': return plan.documents?.sops_per_month || 2;
                case 'cover_letters': return plan.documents?.cover_letters_per_month || 2;
                case 'personal_statements': return plan.documents?.personal_statements_per_month || 1;
                case 'academic_cvs': return plan.documents?.academic_cvs_per_month || 1;
                default: return 0;
            }
            
        case 'ai_features':
            const aiFeatures = plan.ai_features;
            if (!aiFeatures) return 0;
            switch (featureType) {
                case 'reviews': return aiFeatures.reviews;
                case 'text_enhancements': return aiFeatures.text_enhancements;
                case 'word_optimizations': return aiFeatures.word_optimizations;
                case 'plagiarism_checks': return aiFeatures.plagiarism_checks;
                default: return 0;
            }
            
        case 'university_matching':
            const universityFeatures = plan.university_matching;
            if (!universityFeatures) return 0;
            switch (featureType) {
                case 'queries': return universityFeatures.queries_per_month;
                case 'total_universities': return universityFeatures.total_universities;
                default: return 0;
            }
            
        case 'visa_interview':
            return plan.visa_interview?.questions_per_session || 0;
            
        case 'cold_email':
            return plan.cold_email?.emails_per_month || 0;
            
        default:
            return 0;
    }
}

// Feature access checker
export function hasFeatureAccess(planType: string, featureCategory: string, featureType?: string): boolean {
    const plan = getPlanDetails(planType);
    
    switch (featureCategory) {
        case 'cold_email':
            // All plans including free have cold email access (free gets 5 per month)
            return true;
            
        case 'academic_analysis':
            if (featureType === 'comprehensive_transcript') {
                return planType !== 'free';
            }
            return true; // Quick assessment available to all
            
        case 'advanced_features':
            switch (featureType) {
                case 'email_reminders':
                case 'notifications':
                case 'analytics_dashboard':
                    return planType !== 'free';
                case 'early_access':
                case 'custom_branding':
                    return planType === 'elite';
                default:
                    return planType !== 'free';
            }
            
        case 'version_control':
            if (featureType === 'complete_history') {
                return planType !== 'free';
            }
            return true; // Basic version control for all
            
        case 'templates':
            if (featureType === 'custom_creation') {
                return planType === 'elite';
            }
            if (featureType === 'premium') {
                return planType !== 'free';
            }
            return true; // Basic templates for all
            
        default:
            return true;
    }
}

// Get AI model for plan
export function getAIModel(planType: string): string {
    switch (planType) {
        case 'professional':
            return 'gpt-4o-mini';
        case 'elite':
            return 'gpt-4o';
        case 'free':
        default:
            return 'gpt-3.5-turbo';
    }
}

// Get support level for plan
export function getSupportLevel(planType: string): string {
    switch (planType) {
        case 'professional':
            return 'Email support (48h response)';
        case 'elite':
            return 'Priority email support (24h response)';
        case 'free':
        default:
            return 'Community support';
    }
}

// Plan upgrade suggestions with comprehensive messaging
export const UPGRADE_SUGGESTIONS = {
    free_to_professional: {
        trigger: 'Any limit reached',
        message: 'Upgrade to Academic Professional for enhanced limits and premium features.',
        benefits: [
            '50 documents/month (vs 6)',
            'Enhanced AI features',
            '500+ universities',
            'Premium templates',
            'Email reminders & notifications',
            'Complete version history',
            'Cold email generator',
            'Priority support'
        ]
    },
    professional_to_elite: {
        trigger: 'Monthly limit reached or advanced features needed',
        message: 'Upgrade to Academic Elite for unlimited access and exclusive features.',
        benefits: [
            'UNLIMITED documents',
            'UNLIMITED AI features',
            '1500+ universities with priority access',
            'Custom template creation',
            'Advanced analytics dashboard',
            'Early access to new features',
            'Best AI model (GPT-4o)',
            'Priority 24h support'
        ]
    }
};

// Export types for TypeScript
export type PlanType = 'free' | 'professional' | 'elite';
export type FeatureCategory = 'documents' | 'ai_features' | 'university_matching' | 'academic_analysis' | 'cold_email' | 'visa_interview' | 'advanced_features' | 'version_control' | 'templates';
export type SupportLevel = 'community' | 'email_48h' | 'email_24h' | 'priority'; 