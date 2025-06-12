import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
});
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// For now, we'll use a placeholder - you'll need to add this to your .env file
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return json({ error: 'No signature provided' }, { status: 400 });
        }

        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );

        console.log('Stripe webhook event:', event.type);

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return json({ received: true });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return json({ error: 'Webhook handling failed' }, { status: 400 });
    }
};

async function handleCheckoutCompleted(session: any) {
    try {
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (!userId || !planType) {
            console.error('Missing metadata in checkout session');
            return;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        // Check if user has admin override
        const { data: existingSubscription } = await supabaseAdmin
            .from('user_subscriptions')
            .select('admin_override, plan_type')
            .eq('user_id', userId)
            .single();

        // If admin override is set, don't change plan_type
        const updateData: any = {
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: 'active',
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString()
        };

        // Only update plan_type if no admin override exists
        if (!existingSubscription?.admin_override) {
            updateData.plan_type = planType;
        }
        
        // Create or update subscription in database
        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .upsert(updateData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Database error:', error);
        } else {
            console.log(`Subscription created/updated for user ${userId}`);
            if (existingSubscription?.admin_override) {
                console.log(`Admin override preserved - plan_type remains: ${existingSubscription.plan_type}`);
            }
        }

    } catch (error) {
        console.error('Error handling checkout completed:', error);
    }
}

async function handleSubscriptionUpdated(subscription: any) {
    try {
        const userId = subscription.metadata?.user_id;
        
        if (!userId) {
            console.error('Missing user_id in subscription metadata');
            return;
        }

        // Check if user has admin override
        const { data: existingSubscription } = await supabaseAdmin
            .from('user_subscriptions')
            .select('admin_override, plan_type')
            .eq('stripe_subscription_id', subscription.id)
            .single();

        const updateData: any = {
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        };

        // If no admin override, we could potentially update plan_type based on subscription metadata
        // But typically subscription.updated doesn't change plan_type, so we'll leave it as is

        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .update(updateData)
            .eq('stripe_subscription_id', subscription.id);

        if (error) {
            console.error('Database error updating subscription:', error);
        } else if (existingSubscription?.admin_override) {
            console.log(`Admin override preserved during subscription update for user ${userId}`);
        }

    } catch (error) {
        console.error('Error handling subscription updated:', error);
    }
}

async function handleSubscriptionDeleted(subscription: any) {
    try {
        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

        if (error) {
            console.error('Database error cancelling subscription:', error);
        }

    } catch (error) {
        console.error('Error handling subscription deleted:', error);
    }
}

async function handlePaymentSucceeded(invoice: any) {
    try {
        // Update subscription status if needed
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        if ((subscription as any).metadata?.user_id) {
            const { error } = await supabaseAdmin
                .from('user_subscriptions')
                .update({
                    status: 'active',
                    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                })
                .eq('stripe_subscription_id', subscription.id);

            if (error) {
                console.error('Database error on payment succeeded:', error);
            }
        }

    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

async function handlePaymentFailed(invoice: any) {
    try {
        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
                status: 'past_due'
            })
            .eq('stripe_subscription_id', invoice.subscription);

        if (error) {
            console.error('Database error on payment failed:', error);
        }

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
} 