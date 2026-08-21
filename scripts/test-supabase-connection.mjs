import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env file
config();

console.log('='.repeat(60));
console.log('🔍 Testing Supabase Connection');
console.log('='.repeat(60));
console.log();

// Check if env vars exist
const url = process.env.PUBLIC_SUPABASE_URL;
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Environment Variables Check:');
console.log('  PUBLIC_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
console.log('  PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅ Set' : '❌ Missing');
console.log();

if (!url || !anonKey) {
	console.error('❌ Missing required environment variables!');
	console.error('   Add them to your .env file:');
	console.error('   PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
	console.error('   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...');
	process.exit(1);
}

console.log('🔗 Supabase URL:', url);
console.log();

// Create client
const supabase = createClient(url, anonKey);

console.log('🧪 Test 1: Fetch programs table...');
try {
	const { data, error } = await supabase
		.from('programs')
		.select('id, program_name, country')
		.limit(3);

	if (error) {
		console.error('❌ Test 1 FAILED:', error.message);
		console.error('   Details:', error);
	} else {
		console.log('✅ Test 1 PASSED: Programs table accessible');
		console.log('   Sample data:', data);
	}
} catch (err) {
	console.error('❌ Test 1 FAILED with exception:', err.message);
	console.error('   This usually means:');
	console.error('   • Supabase project is paused (check dashboard)');
	console.error('   • Network connectivity issue (VPN/firewall)');
	console.error('   • Invalid Supabase URL');
}

console.log();

console.log('🧪 Test 2: Fetch universities table...');
try {
	const { data, error } = await supabase
		.from('universities')
		.select('id, name, country')
		.limit(3);

	if (error) {
		console.error('❌ Test 2 FAILED:', error.message);
	} else {
		console.log('✅ Test 2 PASSED: Universities table accessible');
		console.log('   Sample data:', data);
	}
} catch (err) {
	console.error('❌ Test 2 FAILED with exception:', err.message);
}

console.log();

console.log('🧪 Test 3: Fetch scholarships table...');
try {
	const { data, error } = await supabase
		.from('scholarships')
		.select('id, name, country')
		.limit(3);

	if (error) {
		console.error('❌ Test 3 FAILED:', error.message);
	} else {
		console.log('✅ Test 3 PASSED: Scholarships table accessible');
		console.log('   Sample data:', data);
	}
} catch (err) {
	console.error('❌ Test 3 FAILED with exception:', err.message);
}

console.log();

console.log('🧪 Test 4: Check auth status...');
try {
	const { data: { user }, error } = await supabase.auth.getUser();

	if (error) {
		// This is expected if not logged in
		console.log('ℹ️  Test 4: No user logged in (expected for test script)');
	} else {
		console.log('✅ Test 4 PASSED: Auth working, user:', user?.email || 'Anonymous');
	}
} catch (err) {
	console.error('❌ Test 4 FAILED with exception:', err.message);
}

console.log();
console.log('='.repeat(60));
console.log('📊 Summary');
console.log('='.repeat(60));
console.log();
console.log('If all tests passed:');
console.log('  ✅ Supabase connection is working');
console.log('  ✅ Your credentials are correct');
console.log('  ✅ Database tables are accessible');
console.log();
console.log('If tests failed:');
console.log('  1. Check Supabase Dashboard - is your project paused?');
console.log('  2. Verify .env file has correct URL and keys');
console.log('  3. Check network connectivity (VPN, firewall)');
console.log('  4. Visit: https://status.supabase.com');
console.log();
console.log('Next steps:');
console.log('  • If tests pass but dev server fails → restart dev server');
console.log('  • If tests fail → fix Supabase credentials/project status');
console.log('  • Run this test after any .env changes');
console.log();
