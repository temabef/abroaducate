import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { SUBSCRIPTION_PLANS } from '$lib/stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any
});

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession }, url }) => {
    try {
        const { session } = await safeGetSession();

        if (!session) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planType } = await request.json();
        
        // Type-safe plan validation
        if (!planType || !(planType in SUBSCRIPTION_PLANS)) {
            return json({ error: 'Invalid plan type' }, { status: 400 });
        }

        // Type-safe plan access
        const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
        const origin = url.origin;

        // Create Stripe checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
            cancel_url: `${origin}/subscription/cancel`,
            customer_email: session.user.email,
            metadata: {
                user_id: session.user.id,
                plan_type: planType
            },
            subscription_data: {
                metadata: {
                    user_id: session.user.id,
                    plan_type: planType
                }
            }
        });

        return json({ 
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id
        });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        return json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
}; 