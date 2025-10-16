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

        const { payment_method_id } = await request.json();

        if (!payment_method_id) {
            return json({ error: 'Payment method ID is required' }, { status: 400 });
        }

        console.log(`[PAYMENT_VALIDATION] Validating payment method: ${payment_method_id}`);

        // Retrieve the payment method
        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
        
        // Check if it's a test card in live mode
        const isTestCard = paymentMethod.card?.brand === 'visa' && 
                          paymentMethod.card?.last4 === '4242';
        
        if (isTestCard) {
            return json({
                success: false,
                error: 'Test cards cannot be used in production. Please use a real payment method.',
                is_test_card: true
            }, { status: 400 });
        }

        // Check card details
        const cardInfo = {
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            funding: paymentMethod.card?.funding
        };

        // Validate expiration
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        if (cardInfo.exp_year && cardInfo.exp_month) {
            if (cardInfo.exp_year < currentYear || 
                (cardInfo.exp_year === currentYear && cardInfo.exp_month < currentMonth)) {
                return json({
                    success: false,
                    error: 'This card has expired. Please use a valid payment method.',
                    is_expired: true
                }, { status: 400 });
            }
        }

        return json({
            success: true,
            message: 'Payment method is valid',
            card_info: cardInfo
        });

    } catch (error: any) {
        console.error('Error validating payment method:', error);
        return json({ 
            error: error.message || 'Failed to validate payment method' 
        }, { status: 500 });
    }
};
