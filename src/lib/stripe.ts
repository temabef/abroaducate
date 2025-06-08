import { loadStripe } from '@stripe/stripe-js';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

// Client-side Stripe instance (safe for client use)
export const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Subscription plans configuration (client-safe, no private keys)
export const SUBSCRIPTION_PLANS = {
    basic: {
        name: 'Basic Plan',
        price: 4.99,
        priceId: 'price_1RXXrUAg2hnCcpKh7Q7UaHxC',
        features: [
            '10 SOPs per month',
            '50 AI improvements',
            '10 analytics reports',
            '10 plagiarism checks',
            'Basic support'
        ],
        limits: {
            sops: 10,
            ai_improvements: 50,
            analytics: 10,
            plagiarism_checks: 10
        }
    },
    pro: {
        name: 'Pro Plan',
        price: 19.99,
        priceId: 'price_1RXXq9Ag2hnCcpKh4zMFMnAk',
        features: [
            'Unlimited SOPs',
            'Unlimited AI improvements',
            'Unlimited analytics',
            'Unlimited plagiarism checks',
            'Priority support',
            'Advanced features'
        ],
        limits: {
            sops: -1, // -1 means unlimited
            ai_improvements: -1,
            analytics: -1,
            plagiarism_checks: -1
        }
    }
};

export const FREE_PLAN = {
    name: 'Free Plan',
    price: 0,
    features: [
        '1 SOP',
        '3 AI improvements',
        '1 analytics report',
        '1 plagiarism check'
    ],
    limits: {
        sops: 1,
        ai_improvements: 3,
        analytics: 1,
        plagiarism_checks: 1
    }
}; 