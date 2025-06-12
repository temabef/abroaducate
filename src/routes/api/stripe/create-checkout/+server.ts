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
        
        // Validate plan type for production plans
        if (!planType || !(planType in SUBSCRIPTION_PLANS)) {
            return json({ error: 'Invalid plan type. Please choose "professional" or "elite".' }, { status: 400 });
        }

        // Get plan configuration
        const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
        const origin = url.origin;

        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabase
            .from('user_subscriptions')
            .select('plan_type, status, stripe_subscription_id')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .single();

        if (existingSubscription && !existingSubscription.admin_override) {
            return json({ 
                error: 'You already have an active subscription. Please cancel your current plan before upgrading.' 
            }, { status: 400 });
        }

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
            },
            // Add billing address collection for tax compliance
            billing_address_collection: 'required',
            // Allow promotional codes
            allow_promotion_codes: true
        });

        return json({
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id
        });

    } catch (err: any) {
        console.error('Checkout session error:', err);
        return json({ 
            error: err.message || 'Failed to create checkout session' 
        }, { status: 500 });
    }
}; 