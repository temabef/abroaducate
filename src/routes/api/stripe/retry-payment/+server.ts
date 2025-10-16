import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any
});

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
    try {
        const session = await getSession();
        if (!session?.user) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subscription_id, payment_method_id } = await request.json();

        if (!subscription_id) {
            return json({ error: 'Subscription ID is required' }, { status: 400 });
        }

        console.log(`[RETRY_PAYMENT] Attempting to retry payment for subscription: ${subscription_id}`);

        // Get the subscription
        const subscription = await stripe.subscriptions.retrieve(subscription_id);
        
        // Verify the subscription belongs to the user
        const { data: userSubscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_subscription_id, stripe_customer_id')
            .eq('user_id', session.user.id)
            .eq('stripe_subscription_id', subscription_id)
            .single();

        if (!userSubscription) {
            return json({ error: 'Subscription not found or access denied' }, { status: 404 });
        }

        // Get the latest invoice
        const invoices = await stripe.invoices.list({
            subscription: subscription_id,
            limit: 1
        });

        if (invoices.data.length === 0) {
            return json({ error: 'No invoice found for this subscription' }, { status: 404 });
        }

        const latestInvoice = invoices.data[0];

        // If a new payment method is provided, update the customer
        if (payment_method_id) {
            console.log(`[RETRY_PAYMENT] Updating payment method for customer: ${subscription.customer}`);
            
            // Attach the payment method to the customer
            await stripe.paymentMethods.attach(payment_method_id, {
                customer: subscription.customer as string,
            });

            // Set as default payment method
            await stripe.customers.update(subscription.customer as string, {
                invoice_settings: {
                    default_payment_method: payment_method_id,
                },
            });
        }

        // Retry the payment
        console.log(`[RETRY_PAYMENT] Retrying payment for invoice: ${latestInvoice.id}`);
        const paidInvoice = await stripe.invoices.pay(latestInvoice.id);

        if (paidInvoice.status === 'paid') {
            console.log(`[RETRY_PAYMENT] ✅ Payment successful!`);
            
            // Update subscription status in database
            await supabaseAdmin
                .from('user_subscriptions')
                .update({
                    status: 'active',
                    last_payment_succeeded_at: new Date().toISOString()
                })
                .eq('stripe_subscription_id', subscription_id);

            return json({ 
                success: true, 
                message: 'Payment retry successful',
                invoice_id: paidInvoice.id,
                amount_paid: paidInvoice.amount_paid
            });
        } else {
            console.log(`[RETRY_PAYMENT] ❌ Payment retry failed: ${paidInvoice.status}`);
            return json({ 
                success: false, 
                error: 'Payment retry failed',
                status: paidInvoice.status
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error retrying payment:', error);
        return json({ 
            error: error.message || 'Failed to retry payment' 
        }, { status: 500 });
    }
};
