import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { SUBSCRIPTION_PLANS } from '$lib/stripe';
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any
});

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession }, url }) => {
    try {
        // Debug: Check if Stripe is properly configured
        if (!STRIPE_SECRET_KEY) {
            console.error('❌ STRIPE_SECRET_KEY is not set');
            return json({ error: 'Stripe configuration error' }, { status: 500 });
        }
        console.log('✅ Stripe secret key is configured');

        const { planType, billingCycle = 'monthly', quantity, customerId, metadata } = await request.json();
        console.log('📝 Request data:', { planType, billingCycle });
        
        const session = await getSession();

        if (!session?.user) {
            console.log('❌ No user session found');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        console.log('✅ User session found:', session.user.id);

        // Validate plan type for production plans
        if (!planType || !(planType in SUBSCRIPTION_PLANS)) {
            console.log('❌ Invalid plan type:', planType);
            return json({ error: 'Invalid plan type. Please choose "professional" or "elite".' }, { status: 400 });
        }
        console.log('✅ Plan type validated:', planType);

        // Get plan configuration
        const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
        console.log('📋 Plan configuration:', plan);
        
        const priceId = plan.priceIds[billingCycle as 'monthly' | 'annual'];
        console.log('💰 Price ID selected:', priceId);
        
        const origin = url.origin;
        console.log('🌐 Origin:', origin);

        if (!priceId) {
            console.log('❌ No price ID found for billing cycle:', billingCycle);
            return json({ error: `Invalid billing cycle: ${billingCycle}` }, { status: 400 });
        }

        // Check if user already has an active subscription
        console.log('🔍 Checking for existing subscription...');
        const { data: existingSubscription, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .select('plan_type, status, stripe_subscription_id, admin_override')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .maybeSingle();

        console.log('📊 Subscription check result:', { existingSubscription, subscriptionError });

        // Only block if there's actually an active PAID subscription (no error and data exists and not free plan)
        if (!subscriptionError && existingSubscription && !existingSubscription.admin_override) {
            // Allow upgrades from free plan to paid plans
            if (existingSubscription.plan_type === 'free') {
                console.log('✅ User has free plan, allowing upgrade to paid plan');
            } else {
                console.log('❌ User already has active paid subscription:', existingSubscription.plan_type);
                return json({ 
                    error: 'You already have an active subscription. Please cancel your current plan before upgrading.' 
                }, { status: 400 });
            }
        } else {
            console.log('✅ No existing subscription found, proceeding...');
        }

        // Debug: Log the configuration being used
        console.log('Creating checkout with:', {
            planType,
            billingCycle,
            priceId,
            userId: session.user.id,
            email: session.user.email
        });

        // Test Stripe connection first
        try {
            await stripe.prices.retrieve(priceId);
            console.log('✅ Stripe price found successfully');
        } catch (priceError) {
            console.error('❌ Stripe price retrieval failed:', priceError);
            return json({ 
                error: `Invalid price ID: ${priceId}. Please check your Stripe configuration.` 
            }, { status: 400 });
        }

        // Create Stripe checkout session
        console.log('🚀 Creating Stripe checkout session...');
        console.log('📋 Session parameters:', {
            priceId,
            userEmail: session.user.email,
            userId: session.user.id,
            planType,
            billingCycle,
            successUrl: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
            cancelUrl: `${origin}/subscription/cancel`
        });

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}&billing_cycle=${billingCycle}`,
            cancel_url: `${origin}/subscription/cancel`,
            customer_email: session.user.email,
            metadata: {
                user_id: session.user.id,
                plan_type: planType,
                billing_cycle: billingCycle,
                ...metadata
            },
            subscription_data: {
                metadata: {
                    user_id: session.user.id,
                    plan_type: planType,
                    billing_cycle: billingCycle
                }
            },
            // Add billing address collection for tax compliance
            billing_address_collection: 'required',
            // Allow promotional codes
            allow_promotion_codes: true
        });

        console.log('✅ Stripe checkout session created successfully:', {
            sessionId: checkoutSession.id,
            url: checkoutSession.url
        });

        return json({
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id
        });

    } catch (err: any) {
        console.error('Checkout session error:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            type: err.type,
            statusCode: err.statusCode
        });
        return json({ 
            error: err.message || 'Failed to create checkout session',
            details: err.code || 'Unknown error'
        }, { status: 500 });
    }
}; 