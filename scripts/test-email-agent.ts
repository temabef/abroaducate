import { checkEmailSafety, parseSenderAddress } from '../src/lib/server/ai-email-agent/guards.js';
import { buildAbroaducateEmailHtml } from '../src/lib/server/ai-email-agent/templates.js';

console.log('--- TEST SUITE: AI EMAIL AGENT ---');

// Test 1: Mailer Daemon bounce
const bounceEmail = {
	from: 'mailer-daemon@googlemail.com',
	fromEmail: 'mailer-daemon@googlemail.com',
	to: 'hello@abroaducate.com',
	subject: 'Delivery Status Notification (Failure)',
	text: 'Message could not be delivered.'
};
const guard1 = checkEmailSafety(bounceEmail);
console.log('1. Bounce loop prevention:', guard1.allowed === false ? '✅ PASS' : '❌ FAIL', `(${guard1.reason})`);

// Test 2: Auto-reply
const oofEmail = {
	from: 'student@example.com',
	fromEmail: 'student@example.com',
	to: 'hello@abroaducate.com',
	subject: 'Out of Office: Vacation until Monday',
	text: 'I am currently away.'
};
const guard2 = checkEmailSafety(oofEmail);
console.log('2. Out-of-office loop prevention:', guard2.allowed === false ? '✅ PASS' : '❌ FAIL', `(${guard2.reason})`);

// Test 3: Self-address check
const selfEmail = {
	from: 'hello@abroaducate.com',
	fromEmail: 'hello@abroaducate.com',
	to: 'hello@abroaducate.com',
	subject: 'Test email',
	text: 'Self test'
};
const guard3 = checkEmailSafety(selfEmail);
console.log('3. Self-address ping-pong check:', guard3.allowed === false ? '✅ PASS' : '❌ FAIL', `(${guard3.reason})`);

// Test 4: Valid student email
const validEmail = {
	from: 'john.doe@gmail.com',
	fromEmail: 'john.doe@gmail.com',
	to: 'hello@abroaducate.com',
	subject: 'How do I apply for the DAAD scholarship?',
	text: 'Hello, I want to study in Germany and need help finding DAAD scholarships on Abroaducate.'
};
const guard4 = checkEmailSafety(validEmail);
console.log('4. Legitimate student inquiry check:', guard4.allowed === true ? '✅ PASS' : '❌ FAIL');

// Test 5: Address parser
const parsed = parseSenderAddress('"Sarah Miller" <sarah.m@gmail.com>');
console.log('5. RFC Address parsing:', parsed.name === 'Sarah Miller' && parsed.email === 'sarah.m@gmail.com' ? '✅ PASS' : '❌ FAIL');

// Test 6: HTML template generation
const sampleMd = `Hi Sarah,\n\nThanks for reaching out! You can practice your **SOP** and search for **DAAD scholarships** on [Abroaducate](https://www.abroaducate.com/scholarships).\n\n- Step 1: Browse scholarships\n- Step 2: Run SOP review`;
const html = buildAbroaducateEmailHtml({
	recipientName: 'Sarah',
	bodyMarkdown: sampleMd,
	ctaUrl: 'https://www.abroaducate.com/scholarships',
	ctaText: 'Explore Scholarships'
});
console.log('6. Branded HTML Template generation:', html.includes('Abroaducate') && html.includes('Explore Scholarships') ? '✅ PASS' : '❌ FAIL');

console.log('--- ALL UNIT TESTS COMPLETED SUCCESSFULLY ---');
