// Quick test to see if env vars are loading in Node
console.log('Testing environment variables in Node.js...\n');

console.log('PUBLIC_SUPABASE_URL:', process.env.PUBLIC_SUPABASE_URL || '❌ NOT SET');
console.log('PUBLIC_SUPABASE_ANON_KEY:', process.env.PUBLIC_SUPABASE_ANON_KEY ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET');

console.log('\n---');
console.log('If all show ❌ NOT SET, then Node is not loading .env file');
console.log('If they show ✅ SET, then the issue is with how SvelteKit/Vite loads them');
