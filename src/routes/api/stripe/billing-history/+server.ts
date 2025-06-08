import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20'
});

export const GET: RequestHandler = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        const { session } = await safeGetSession();

        if (!session) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's Stripe customer ID
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', session.user.id)
            .single();

        if (!subscription?.stripe_customer_id) {
            return json({ invoices: [] });
        }

        // Fetch invoices from Stripe
        const invoices = await stripe.invoices.list({
            customer: subscription.stripe_customer_id,
            limit: 50,
            expand: ['data.subscription']
        });

        // Format invoice data
        const formattedInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            number: invoice.number,
            amount_paid: invoice.amount_paid,
            amount_due: invoice.amount_due,
            currency: invoice.currency,
            status: invoice.status,
            created: invoice.created,
            due_date: invoice.due_date,
            description: invoice.lines.data[0]?.description || 'Subscription payment',
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
            period_start: invoice.period_start,
            period_end: invoice.period_end
        }));

        return json({
            invoices: formattedInvoices,
            total: invoices.data.length
        });

    } catch (err: any) {
        console.error('Billing history error:', err);
        return json({ error: err.message || 'Failed to fetch billing history' }, { status: 500 });
    }
}; 