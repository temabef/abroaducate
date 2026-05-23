<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Terms of Service — Abroaducate</title>
	<meta name="description" content="Abroaducate Terms of Service — rules and agreements for using our study abroad platform." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<!-- Sticky topbar -->
<div class="topbar">
	<a href="/" class="topbar-back">
		<ChevronLeft size={16} />
		Back to Abroaducate
	</a>
</div>

<div class="page">
	<div class="container">

		<!-- Header (no card) -->
		<div class="page-header">
			<span class="eyebrow">Legal</span>
			<h1 class="page-title">Terms of Service</h1>
			<p class="page-date">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
			<p class="page-intro">
				These Terms of Service govern your use of Abroaducate, a study abroad platform that helps students find affordable programs, match with scholarships, and generate application documents.
			</p>
		</div>

		<!-- Body card -->
		<div class="body-card">

			<section>
				<h2>1. Acceptance of Terms</h2>
				<div class="callout-blue">
					<strong>By accessing or using Abroaducate, you agree to be bound by these Terms.</strong> If you do not agree, please do not use our services.
				</div>
				<p>These Terms constitute a legally binding agreement between you and Abroaducate, Inc. You must be at least 16 years old to use our services.</p>
			</section>

			<section>
				<h2>2. Description of Service</h2>
				<p>Abroaducate provides:</p>
				<ul>
					<li><strong>Program Discovery:</strong> Search and filter 2,500+ affordable university programs across Europe</li>
					<li><strong>Scholarship Matching:</strong> Automated matching of scholarships to your profile and chosen programs</li>
					<li><strong>AI Document Generation:</strong> AI-powered creation of SOPs, cover letters, and personal statements</li>
					<li><strong>Application Tracking:</strong> Dashboard to track programs, deadlines, and documents</li>
					<li><strong>Strategy Tools:</strong> Personalized application strategy and funding guidance</li>
				</ul>
			</section>

			<section>
				<h2>3. Account Registration and Security</h2>
				<p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and must notify us immediately of any unauthorized access. One account per person — sharing accounts is prohibited.</p>
				<p>You are solely responsible for all activities that occur under your account.</p>
			</section>

			<section>
				<h2>4. Credits and Payment</h2>
				<p>Abroaducate operates on a <strong>pay-as-you-go credit system</strong> — there are no monthly subscriptions.</p>
				<ul>
					<li><strong>Free Credits:</strong> 3 lifetime credits on signup — no credit card required</li>
					<li><strong>Starter Pack:</strong> 20 credits for $4.99</li>
					<li><strong>Standard Pack:</strong> 50 credits for $9.99</li>
					<li><strong>Pro Pack:</strong> 130 credits for $24.99</li>
				</ul>
				<p>Credits are lifetime — they do not expire and are not tied to a monthly subscription. Credits are consumed when generating AI documents or running strategy tools. All payments are processed securely through Stripe.</p>
				<p>For refund terms, see our <a href="/refund-policy">Refund Policy</a>.</p>
			</section>

			<section>
				<h2>5. Acceptable Use Policy</h2>
				<p>You may use Abroaducate to create original academic application documents for your own use, research universities and scholarships, and track your own application progress.</p>
				<p>You may <strong>not</strong> use our service to submit completely AI-generated content as your own original work without review, create documents for other people without disclosure, violate any university's academic integrity policies, share account credentials, circumvent usage limits, or use automated tools to scrape our data.</p>
			</section>

			<section>
				<h2>6. Academic Integrity and Responsible Use</h2>
				<div class="callout-blue">
					Abroaducate is designed to help you express your authentic self more effectively — not to replace your original thoughts and experiences.
				</div>
				<p>Use AI suggestions as starting points, always personalize generated content with your own experiences, ensure all statements are truthful, and comply with your target institution's AI usage policies.</p>
			</section>

			<section>
				<h2>7. Intellectual Property Rights</h2>
				<p>You retain ownership of all documents you create using our platform. You grant us a limited license to process your content solely to provide our services. We do not claim ownership of your personal experiences or achievements.</p>
				<p>The Abroaducate platform, features, and technology are our property. You may not copy, modify, or redistribute our platform.</p>
			</section>

			<section>
				<h2>8. Data Usage and Privacy</h2>
				<p>Your privacy is important to us. Please review our <a href="/privacy">Privacy Policy</a> for detailed information about how we collect, use, and protect your data. Your documents are processed securely and not used to train AI models. You can access, correct, or delete your data at any time.</p>
			</section>

			<section>
				<h2>9. Service Availability and Limitations</h2>
				<p>We strive for high uptime but cannot guarantee uninterrupted service. Our service relies on third-party providers including AI services, payment processors, and hosting infrastructure. We cannot control third-party availability.</p>
			</section>

			<section>
				<h2>10. Disclaimers</h2>
				<ul>
					<li><strong>No Admission Guarantees:</strong> We do not guarantee admission to any university or award of any scholarship.</li>
					<li><strong>AI Accuracy:</strong> AI-generated content may contain errors. You must review and verify all content before use.</li>
					<li><strong>University Information:</strong> Program data changes frequently. Always verify with official sources.</li>
					<li><strong>Service "As-Is":</strong> Our service is provided without warranties of any kind, express or implied.</li>
				</ul>
			</section>

			<section>
				<h2>11. Limitation of Liability</h2>
				<p>To the maximum extent permitted by law, our total liability to you is limited to the amount you paid in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages, failed applications, missed deadlines, or lost opportunities.</p>
			</section>

			<section>
				<h2>12. Indemnification</h2>
				<p>You agree to indemnify and hold harmless Abroaducate, Inc. from any claims, damages, or expenses arising from your use of our service, violation of these Terms, or infringement of any rights.</p>
			</section>

			<section>
				<h2>13. Termination</h2>
				<p>You may terminate your account at any time through your account settings or by contacting support. We may terminate or suspend your account for violation of these Terms, fraudulent activity, or extended inactivity with notice.</p>
			</section>

			<section>
				<h2>14. Governing Law and Disputes</h2>
				<p>These Terms are governed by applicable law. We encourage resolving disputes through direct communication with our support team before pursuing formal proceedings.</p>
			</section>

			<section>
				<h2>15. Changes to These Terms</h2>
				<p>We may update these Terms periodically. We will notify you via email and post a notice on our platform when material changes are made. Continued use after changes constitutes acceptance.</p>
			</section>

			<section>
				<h2>16. Contact Information</h2>
				<div class="contact-box">
					<p><strong>Company:</strong> Abroaducate, Inc.</p>
					<p><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></p>
					<p><strong>Address:</strong> 111SB Governor Ave, Dover, Delaware, USA</p>
					<p><strong>Response time:</strong> We aim to respond within 72 hours.</p>
				</div>
			</section>

		</div>

		<!-- Footer nav -->
		<div class="footer-nav">
			<a href="/privacy">Privacy Policy</a>
			<span class="sep">&middot;</span>
			<a href="/refund-policy">Refund Policy</a>
			<span class="sep">&middot;</span>
			<a href="/contact">Contact Support</a>
		</div>

	</div>
</div>

<style>
	/* Topbar */
	.topbar {
		position: sticky;
		top: 4rem;
		z-index: 10;
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 0.75rem 1.5rem;
	}
	.topbar-back {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #475569;
		text-decoration: none;
		transition: color 0.15s;
	}
	.topbar-back:hover {
		color: #0f172a;
	}

	/* Page */
	.page {
		background: #f8fafc;
		padding-top: 4rem;
		min-height: 100vh;
	}
	.container {
		max-width: 52rem;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
	}

	/* Header — no card */
	.page-header {
		margin-bottom: 2rem;
	}
	.eyebrow {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #f97316;
		margin-bottom: 0.75rem;
	}
	.page-title {
		font-family: 'Outfit', sans-serif;
		font-size: 2.5rem;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.03em;
		margin-bottom: 0.5rem;
		line-height: 1.1;
	}
	.page-date {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 1rem;
	}
	.page-intro {
		font-size: 1rem;
		line-height: 1.7;
		color: #475569;
	}

	/* Body card */
	.body-card {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1rem;
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	/* Sections */
	section h2 {
		font-family: 'Outfit', sans-serif;
		font-size: 1.125rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0.875rem;
	}
	section p {
		font-size: 0.9375rem;
		color: #475569;
		line-height: 1.75;
		margin-bottom: 0.75rem;
	}
	section p:last-child {
		margin-bottom: 0;
	}
	section ul {
		list-style: disc;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0.5rem 0;
	}
	section li {
		font-size: 0.9375rem;
		color: #475569;
		line-height: 1.7;
	}
	section a {
		color: #f97316;
		text-decoration: none;
		font-weight: 500;
	}
	section a:hover {
		text-decoration: underline;
	}

	/* Blue callout */
	.callout-blue {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		color: #1e40af;
		font-size: 0.9375rem;
		line-height: 1.7;
		margin-bottom: 0.75rem;
	}

	/* Contact box */
	.contact-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.contact-box p {
		margin-bottom: 0;
		font-size: 0.9rem;
	}
	.contact-box a {
		color: #f97316;
		text-decoration: none;
		font-weight: 500;
	}
	.contact-box a:hover {
		text-decoration: underline;
	}

	/* Footer nav */
	.footer-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}
	.footer-nav a {
		font-size: 0.875rem;
		color: #475569;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.15s;
	}
	.footer-nav a:hover {
		color: #f97316;
	}
	.sep {
		color: #cbd5e1;
		font-size: 0.875rem;
	}

	@media (max-width: 640px) {
		.page-title { font-size: 1.9rem; }
		.body-card { padding: 1.5rem; }
	}
</style>
