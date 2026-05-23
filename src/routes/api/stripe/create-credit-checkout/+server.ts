import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { CREDIT_PACKS } from '$lib/stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20' as any
});

export const POST: RequestHandler = async ({ request, locals: { getSession }, url }) => {
    try {
        if (!STRIPE_SECRET_KEY) {
            console.error('❌ STRIPE_SECRET_KEY is not set');
            return json({ error: 'Stripe configuration error' }, { status: 500 });
        }

        const { packId } = await request.json();
        
        const session = await getSession();
        if (!session?.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Validate pack type
        if (!packId || !(packId in CREDIT_PACKS)) {
            return json({ error: 'Invalid credit pack type.' }, { status: 400 });
        }

        const pack = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
        const priceId = pack.priceId;
        const origin = url.origin;

        // Create Stripe checkout session for one-time payment
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment', // ONE-TIME PAYMENT (Not subscription)
            success_url: `${origin}/dashboard?payment=success&pack=${packId}`,
            cancel_url: `${origin}/pricing?payment=cancelled`,
            customer_email: session.user.email,
            metadata: {
                user_id: session.user.id,
                pack_type: packId,
                credits_to_add: pack.credits.toString()
            },
            billing_address_collection: 'required',
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic'
                }
            }
        });

        console.log('✅ Stripe credit checkout session created successfully:', checkoutSession.id);

        return json({
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id
        });

    } catch (err: any) {
        console.error('Credit checkout session error:', err);
        return json({ 
            error: err.message || 'Failed to create checkout session'
        }, { status: 500 });
    }
};
