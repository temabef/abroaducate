import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-06-20' as any
});

export const GET: RequestHandler = async ({ locals: { supabase, getSession } }) => {
	try {
		const session = await getSession();
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch user's subscription to get customer ID
		const { data: subscription, error: subError } = await supabase
			.from('user_subscriptions')
			.select('stripe_customer_id')
			.eq('user_id', session.user.id)
			.eq('status', 'active')
			.single();

		if (subError || !subscription) {
			return json({ invoices: [] }); // No active subscription, so no invoices
		}

		// Fetch invoices from Stripe
		const invoices = await stripe.invoices.list({
			customer: subscription.stripe_customer_id,
			limit: 50
		});

		return json({ invoices: invoices.data });
	} catch (error: any) {
		console.error('Error fetching billing history:', error);
		return json({ error: error.message }, { status: 500 });
	}
}; 