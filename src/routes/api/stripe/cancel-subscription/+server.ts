import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-06-20' as any
});

export const POST: RequestHandler = async ({ request, locals: { supabase, getSession } }) => {
	try {
		const session = await getSession();
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { subscription_id } = await request.json();

		if (!subscription_id) {
			return json({ error: 'Subscription ID is required' }, { status: 400 });
		}

		// Fetch the subscription to ensure it belongs to the user
		const subscription = await stripe.subscriptions.retrieve(subscription_id);

		// Get customer from Supabase profile
		const { data: profile } = await supabase
			.from('profiles')
			.select('stripe_customer_id')
			.eq('id', session.user.id)
			.single();

		if (subscription.customer.toString() !== profile?.stripe_customer_id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const canceledSubscription = await stripe.subscriptions.cancel(subscription_id);

		// Update the subscription status in the local database
		await supabase
			.from('user_subscriptions')
			.update({ status: 'canceled', current_period_end: new Date(canceledSubscription.canceled_at! * 1000) })
			.eq('stripe_subscription_id', subscription_id);

		return json({ success: true, canceled_at: canceledSubscription.canceled_at });
	} catch (error: any) {
		console.error('Error canceling subscription:', error);
		return json({ error: error.message }, { status: 500 });
	}
}; 