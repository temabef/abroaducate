import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil'
});
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { analytics } from '$lib/utils/posthog';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
    let webhookEventId = '';
    
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        console.log('[WEBHOOK] Received Stripe webhook request');

        // Check if webhook secret is configured
        if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET === 'whsec_placeholder') {
            console.error('[WEBHOOK] ❌ STRIPE_WEBHOOK_SECRET not configured! Set this in your environment variables.');
            // Still return 200 to avoid webhook failures, but log the issue
            return json({ 
                received: true, 
                warning: 'Webhook secret not configured - signature verification skipped' 
            }, { status: 200 });
        }

        if (!signature) {
            console.error('[WEBHOOK] ❌ Missing stripe-signature header');
            return json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
            webhookEventId = event.id;
            console.log(`[WEBHOOK] ✅ Signature verified for event: ${event.type} (${event.id})`);
        } catch (signatureError) {
            console.error('[WEBHOOK] ❌ Signature verification failed:', signatureError);
            return json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Process the event
        console.log(`[WEBHOOK] Processing event: ${event.type}`);
        
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutCompleted(event.data.object);
                    console.log(`[WEBHOOK] ✅ Successfully processed checkout.session.completed`);
                    break;

                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await handleSubscriptionUpdated(event.data.object);
                    console.log(`[WEBHOOK] ✅ Successfully processed ${event.type}`);
                    break;

                case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(event.data.object);
                    console.log(`[WEBHOOK] ✅ Successfully processed customer.subscription.deleted`);
                    break;

                case 'invoice.payment_succeeded':
                    await handlePaymentSucceeded(event.data.object);
                    console.log(`[WEBHOOK] ✅ Successfully processed invoice.payment_succeeded`);
                    break;

                case 'invoice.payment_failed':
                    await handlePaymentFailed(event.data.object);
                    console.log(`[WEBHOOK] ✅ Successfully processed invoice.payment_failed`);
                    break;

                case 'checkout.session.async_payment_failed':
                    console.log(`[WEBHOOK] ℹ️  Async payment failed for session`);
                    break;

                default:
                    console.log(`[WEBHOOK] ℹ️  Unhandled event type: ${event.type}`);
            }

            // ALWAYS return 200 for successful webhook processing
            return json({ 
                received: true, 
                event_type: event.type,
                event_id: event.id 
            }, { status: 200 });

        } catch (processingError) {
            // Log the error but still return 200 to prevent webhook retries
            console.error(`[WEBHOOK] ⚠️  Error processing ${event.type}:`, processingError);
            
            return json({ 
                received: true, 
                event_type: event.type,
                event_id: event.id,
                processing_error: 'Event received but processing failed - check server logs'
            }, { status: 200 });
        }

    } catch (error: any) {
        console.error(`[WEBHOOK] ❌ Critical webhook error (Event: ${webhookEventId}):`, error);
        
        // For critical errors (like malformed request), return 400
        // This will cause Stripe to retry the webhook
        return json({ 
            error: 'Webhook processing failed', 
            event_id: webhookEventId 
        }, { status: 400 });
    }
};

async function handleCheckoutCompleted(session: any) {
    try {
        console.log(`[CHECKOUT] Processing checkout completion for session: ${session.id}`);
        
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (session.mode === 'payment' && session.metadata?.pack_type) {
            return handleCreditCheckoutCompleted(session);
        }

        if (!userId || !planType) {
            console.error(`[CHECKOUT] ❌ Missing metadata - userId: ${userId}, planType: ${planType}`);
            throw new Error('Missing required metadata in checkout session');
        }

        console.log(`[CHECKOUT] Processing for user: ${userId}, plan: ${planType}`);

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
            status: (subscription as any).status || 'active',
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
            console.error(`[CHECKOUT] ❌ Database error:`, error);
            throw error;
        } else {
            console.log(`[CHECKOUT] ✅ Subscription created/updated for user ${userId}`);
            if (existingSubscription?.admin_override) {
                console.log(`[CHECKOUT] ℹ️  Admin override preserved - plan_type remains: ${existingSubscription.plan_type}`);
            }
            // Track subscription activation (client will capture identify)
            try {
                const status = (subscription as any).status;
                if (status === 'trialing') {
                    analytics.trackEvent('trial_started', { user_id: userId, plan: planType });
                } else {
                    analytics.trackEvent('subscription_activated', { user_id: userId, plan: planType });
                }
            } catch (analyticsError) {
                console.warn(`[CHECKOUT] ⚠️  Analytics tracking failed:`, analyticsError);
            }
        }

    } catch (error) {
        console.error(`[CHECKOUT] ❌ Error handling checkout completed:`, error);
        throw error; // Re-throw to be handled by main webhook handler
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
            const userId = (subscription as any).metadata.user_id;
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
            } else {
                try { analytics.trackEvent('invoice_payment_succeeded', { user_id: userId }); } catch {}
            }

            // Top up 500 credits on every successful subscription renewal.
            // This is the "grandfather" treatment for legacy subscribers who
            // are still being charged monthly on the old plan.
            // When they register on the new platform their balance gets topped
            // up automatically each billing cycle.
            const SUBSCRIPTION_RENEWAL_CREDITS = 500;
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('credits')
                .eq('user_id', userId)
                .maybeSingle();

            if (profile !== null) {
                // User exists on new platform — top up their credits
                const newCredits = (profile?.credits ?? 0) + SUBSCRIPTION_RENEWAL_CREDITS;
                const { error: creditErr } = await supabaseAdmin
                    .from('user_profiles')
                    .update({ credits: newCredits })
                    .eq('user_id', userId);

                if (!creditErr) {
                    // Log the top-up in credit_transactions for audit trail
                    await supabaseAdmin.from('credit_transactions').insert({
                        user_id: userId,
                        amount: SUBSCRIPTION_RENEWAL_CREDITS,
                        action_type: 'SUBSCRIPTION_RENEWAL_TOPUP'
                    });
                    console.log(`[PAYMENT_SUCCEEDED] ✅ Topped up ${SUBSCRIPTION_RENEWAL_CREDITS} credits for subscriber ${userId}. New balance: ${newCredits}`);
                } else {
                    console.error('[PAYMENT_SUCCEEDED] ❌ Failed to top up credits:', creditErr);
                }
            } else {
                // User hasn't registered on the new platform yet — nothing to do.
                // When they sign up, they'll get 3 free credits. Their next renewal
                // will trigger this handler and top them up to 503.
                console.log(`[PAYMENT_SUCCEEDED] ℹ️  Subscriber ${userId} not yet on new platform — skipping credit top-up.`);
            }
        }

    } catch (error) {
        console.error('Error handling payment succeeded:', error);
    }
}

async function handlePaymentFailed(invoice: any) {
    try {
        console.log(`[PAYMENT_FAILED] Processing failed payment for subscription: ${invoice.subscription}`);
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const customerId = subscription.customer as string;
        
        // Update subscription status to past_due
        const { error } = await supabaseAdmin
            .from('user_subscriptions')
            .update({
                status: 'past_due',
                last_payment_failed_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', invoice.subscription);

        if (error) {
            console.error('Database error on payment failed:', error);
        } else {
            console.log(`[PAYMENT_FAILED] ✅ Updated subscription status to past_due`);
            
            // Track analytics
            try { 
                analytics.trackEvent('invoice_payment_failed', { 
                    subscription_id: invoice.subscription,
                    customer_id: customerId,
                    failure_reason: invoice.last_payment_error?.code || 'unknown'
                }); 
            } catch {}
            
            // Send notification email to user about failed payment
            await sendPaymentFailedNotification(customerId, invoice);
        }

    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
}

// New function to send payment failed notification
async function sendPaymentFailedNotification(customerId: string, invoice: any) {
    try {
        // Get customer details
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;
        
        if (email) {
            console.log(`[NOTIFICATION] Sending payment failed email to: ${email}`);
            
            // Here you would integrate with your email service (SendGrid, etc.)
            // For now, we'll just log it
            console.log(`[EMAIL] Payment failed notification for ${email}:`);
            console.log(`- Amount: $${(invoice.amount_due / 100).toFixed(2)}`);
            console.log(`- Failure reason: ${invoice.last_payment_error?.message || 'Payment method declined'}`);
            console.log(`- Next retry: ${invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : 'No retry scheduled'}`);
        }
    } catch (error) {
        console.error('Error sending payment failed notification:', error);
    }
}

/**
 * Handle a completed one-time credit pack purchase via Stripe.
 * Mirrors the Paystack credit flow exactly:
 *   1. Re-verify the payment with Stripe (replay-attack protection)
 *   2. Read credits_to_add from session metadata
 *   3. Add credits to user_profiles.credits
 */
async function handleCreditCheckoutCompleted(session: any) {
    try {
        const userId = session.metadata?.user_id;
        const creditsToAdd = parseInt(session.metadata?.credits_to_add ?? '0', 10);
        const packType = session.metadata?.pack_type;

        if (!userId || !creditsToAdd || isNaN(creditsToAdd)) {
            console.error('[STRIPE CREDITS] ❌ Missing or invalid metadata — userId:', userId, 'credits:', creditsToAdd);
            return;
        }

        // Re-verify the payment status directly with Stripe (prevents replay attacks)
        const verifiedSession = await stripe.checkout.sessions.retrieve(session.id);
        if (verifiedSession.payment_status !== 'paid') {
            console.error('[STRIPE CREDITS] ❌ Payment not confirmed for session:', session.id, 'status:', verifiedSession.payment_status);
            return;
        }

        console.log(`[STRIPE CREDITS] ✅ Payment verified. Adding ${creditsToAdd} credits (pack: ${packType}) to user ${userId}`);

        // Fetch current credits
        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('user_profiles')
            .select('credits')
            .eq('user_id', userId)
            .single();

        if (profileErr) {
            console.error('[STRIPE CREDITS] ❌ Error fetching user profile:', profileErr);
            throw profileErr;
        }

        const currentCredits = profile?.credits ?? 0;
        const newCredits = currentCredits + creditsToAdd;

        const { error: updateErr } = await supabaseAdmin
            .from('user_profiles')
            .update({ credits: newCredits })
            .eq('user_id', userId);

        if (updateErr) {
            console.error('[STRIPE CREDITS] ❌ Error updating credits:', updateErr);
            throw updateErr;
        }

        console.log(`[STRIPE CREDITS] ✅ Credits updated: ${currentCredits} → ${newCredits} for user ${userId}`);

        try {
            analytics.trackEvent('credit_pack_purchased', {
                user_id: userId,
                pack_type: packType,
                credits_added: creditsToAdd,
                new_balance: newCredits,
                payment_provider: 'stripe'
            });
        } catch {}

    } catch (error) {
        console.error('[STRIPE CREDITS] ❌ Error handling credit checkout:', error);
        throw error;
    }
}