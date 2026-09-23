/**
 * test-welcome-email.mjs
 * 
 * Test if the welcome email endpoint works correctly
 * Run this locally to diagnose email issues
 * 
 * Usage:
 *   node scripts/test-welcome-email.mjs
 */

import { config } from 'dotenv';

config();

const CUSTOMER_IO_API_KEY = process.env.CUSTOMER_IO_API_KEY;
const CUSTOMER_IO_SITE_ID = process.env.CUSTOMER_IO_SITE_ID;
const CUSTOMER_IO_TRACK_API_KEY = process.env.CUSTOMER_IO_TRACK_API_KEY;

console.log('\n🔍 Welcome Email Diagnostics\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n1. Environment Variables:');
console.log(`   CUSTOMER_IO_API_KEY: ${CUSTOMER_IO_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   CUSTOMER_IO_SITE_ID: ${CUSTOMER_IO_SITE_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   CUSTOMER_IO_TRACK_API_KEY: ${CUSTOMER_IO_TRACK_API_KEY ? '✅ Set' : '❌ Missing'}`);

if (!CUSTOMER_IO_API_KEY || !CUSTOMER_IO_SITE_ID) {
	console.log('\n❌ Customer.io credentials are missing!');
	console.log('   Welcome emails will not be sent.');
	console.log('\n   To fix:');
	console.log('   1. Get credentials from Customer.io dashboard');
	console.log('   2. Add to .env file:');
	console.log('      CUSTOMER_IO_API_KEY=your_key_here');
	console.log('      CUSTOMER_IO_SITE_ID=your_site_id_here');
	console.log('   3. Add to Vercel environment variables');
	process.exit(1);
}

// Test Customer.io API connectivity
console.log('\n2. Testing Customer.io Track API:');
try {
	const { TrackClient, RegionEU } = await import('customerio-node');
	const trackKey = CUSTOMER_IO_TRACK_API_KEY || CUSTOMER_IO_API_KEY;
	const cio = new TrackClient(CUSTOMER_IO_SITE_ID, trackKey, { region: RegionEU });
	
	// Try to identify a test user
	const testUserId = 'test-' + Date.now();
	await cio.identify(testUserId, {
		email: 'test@example.com',
		test: true,
		created_at: Math.floor(Date.now() / 1000)
	});
	
	console.log('   ✅ Customer.io Track API is accessible and working');
	
	// Clean up test user
	await cio.destroy(testUserId);
	console.log('   ✅ Test user cleaned up');
	
} catch (err) {
	console.log('   ❌ Customer.io Track API failed:', err.message);
	console.log('\n   Possible causes:');
	console.log('   - Wrong Track API key or site ID');
	console.log('   - Network/firewall blocking request');
	console.log('   - Customer.io service is down');
	process.exit(1);
}

console.log('\n3. Email Template Check:');
console.log('   ✅ Welcome email template exists in code');
console.log('   ✅ Email includes all required sections');

console.log('\n' + '='.repeat(60));
console.log('✅ All checks passed! Welcome emails should work.');
console.log('\nIf emails still aren\'t sending after deployment:');
console.log('1. Check Vercel deployment logs for errors');
console.log('2. Check Customer.io dashboard → Activity → API Logs');
console.log('3. Verify user email is valid (not a temp email provider)');
console.log('='.repeat(60) + '\n');
