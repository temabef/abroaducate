import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
});

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
    try {
        const { session } = await safeGetSession();

        if (!session) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subscriptionId } = await request.json();

        if (!subscriptionId) {
            return json({ error: 'Subscription ID required' }, { status: 400 });
        }

        // Cancel the subscription at period end
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });

        // Update the subscription in our database
        const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
                cancel_at_period_end: true,
                status: 'cancel_at_period_end'
            })
            .eq('stripe_subscription_id', subscriptionId)
            .eq('user_id', session.user.id);

        if (updateError) {
            console.error('Error updating subscription:', updateError);
            throw new Error('Failed to update subscription status');
        }

        return json({
            success: true,
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: subscription.current_period_end
            }
        });

    } catch (err: any) {
        console.error('Cancel subscription error:', err);
        return json({ error: err.message || 'Failed to cancel subscription' }, { status: 500 });
    }
}; 