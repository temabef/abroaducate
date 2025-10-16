import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
    try {
        console.log('🧪 Testing webhook configuration...');
        
        // Check environment variables
        const hasSecretKey = !!STRIPE_SECRET_KEY;
        const hasWebhookSecret = !!STRIPE_WEBHOOK_SECRET;
        
        console.log(`STRIPE_SECRET_KEY configured: ${hasSecretKey}`);
        console.log(`STRIPE_WEBHOOK_SECRET configured: ${hasWebhookSecret}`);
        
        if (hasWebhookSecret) {
            console.log(`Webhook secret starts with: ${STRIPE_WEBHOOK_SECRET.substring(0, 10)}...`);
        }
        
        return json({
            success: true,
            configuration: {
                has_secret_key: hasSecretKey,
                has_webhook_secret: hasWebhookSecret,
                webhook_secret_prefix: hasWebhookSecret ? STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...' : 'Not set'
            },
            message: 'Webhook configuration test completed'
        });
        
    } catch (error: any) {
        console.error('Webhook test error:', error);
        return json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
};
