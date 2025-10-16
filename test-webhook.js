#!/usr/bin/env node

/**
 * Webhook Configuration Test Script
 * Run this to test if your webhook is properly configured
 */

const https = require('https');

const WEBHOOK_URL = 'https://abroaducate.com/api/stripe/webhook';
const TEST_EVENTS = [
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
];

console.log('🧪 Testing Webhook Configuration...\n');

// Test webhook endpoint accessibility
function testWebhookEndpoint() {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'test-signature'
            }
        };

        const req = https.request(WEBHOOK_URL, options, (res) => {
            console.log(`✅ Webhook endpoint is accessible (Status: ${res.statusCode})`);
            resolve(res.statusCode);
        });

        req.on('error', (error) => {
            console.log(`❌ Webhook endpoint error: ${error.message}`);
            reject(error);
        });

        req.write(JSON.stringify({ test: true }));
        req.end();
    });
}

// Check environment variables
function checkEnvironmentVariables() {
    console.log('🔍 Checking Environment Variables...');
    
    const requiredVars = [
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    let allPresent = true;
    
    requiredVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName} is set`);
        } else {
            console.log(`❌ ${varName} is missing`);
            allPresent = false;
        }
    });

    return allPresent;
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Webhook Configuration Tests\n');
    
    // Test 1: Environment Variables
    const envCheck = checkEnvironmentVariables();
    console.log('');
    
    // Test 2: Webhook Endpoint
    try {
        await testWebhookEndpoint();
    } catch (error) {
        console.log('❌ Webhook endpoint test failed');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Go to https://dashboard.stripe.com/webhooks');
    console.log('2. Create webhook endpoint: https://abroaducate.com/api/stripe/webhook');
    console.log('3. Select events: checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed');
    console.log('4. Copy webhook secret and add to environment variables');
    console.log('5. Redeploy your application');
    console.log('6. Test with a real payment using test card: 4242 4242 4242 4242');
    
    console.log('\n🎯 Expected Results:');
    console.log('- Webhook events should appear in server logs');
    console.log('- Payment data should show in admin dashboard');
    console.log('- Failed payments should be retried automatically');
    console.log('- Revenue should start flowing! 💰');
}

// Run the tests
runTests().catch(console.error);
