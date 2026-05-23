<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy — Abroaducate</title>
	<meta name="description" content="Abroaducate Privacy Policy — how we collect, use, and protect your personal information." />
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
			<h1 class="page-title">Privacy Policy</h1>
			<p class="page-date">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
			<p class="page-intro">
				At Abroaducate, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our study abroad platform.
			</p>
		</div>

		<!-- Body card -->
		<div class="body-card">

			<section>
				<h2>1. Information We Collect</h2>
				<p>When you create an account or use our services, we may collect:</p>
				<ul>
					<li>Name, email address, and contact information</li>
					<li>Academic information (GPA, test scores, degree level)</li>
					<li>Educational background, nationality, and career goals</li>
					<li>Documents you create or upload (SOPs, cover letters, personal statements)</li>
					<li>University preferences and application tracking data</li>
					<li>Payment information (processed securely through Stripe — we do not store card details)</li>
				</ul>
				<p>We also automatically collect device information (IP address, browser type), usage data (pages visited, features used), and analytics data via PostHog.</p>
			</section>

			<section>
				<h2>2. How We Use Your Information</h2>
				<p>We use the information we collect to:</p>
				<ul>
					<li><strong>Provide Services:</strong> Match programs and scholarships, generate documents, provide strategy tools</li>
					<li><strong>AI-Powered Features:</strong> Improve document quality and provide personalized recommendations</li>
					<li><strong>Communication:</strong> Send scholarship alerts, deadline reminders, and platform updates via Customer.io</li>
					<li><strong>Account Management:</strong> Maintain your account, process credit purchases, provide support</li>
					<li><strong>Platform Improvement:</strong> Analyze usage patterns and develop new features</li>
					<li><strong>Legal Compliance:</strong> Comply with applicable laws and protect against fraud</li>
				</ul>
			</section>

			<section>
				<h2>3. AI Processing and Document Handling</h2>
				<div class="callout-blue">
					We use OpenAI (gpt-4o-mini) to power document generation and the AI support chat. Your documents are processed securely and are <strong>not used to train AI models</strong>.
				</div>
				<ul>
					<li>Documents are encrypted during transmission and processing</li>
					<li>AI processing is used solely for providing services to you</li>
					<li>We maintain strict data handling agreements with AI service providers</li>
					<li>You retain full ownership of all documents you create</li>
				</ul>
			</section>

			<section>
				<h2>4. Information Sharing and Disclosure</h2>
				<p>We do not sell your personal information. We may share information with third-party service providers who help us operate the platform: Supabase (database and auth), OpenAI (AI processing), Stripe (payments), Customer.io (email), PostHog (analytics), and Vercel (hosting).</p>
				<p>We may also share information when required by law, court order, or government request, or in connection with a merger or acquisition (with user notification).</p>
			</section>

			<section>
				<h2>5. Data Security</h2>
				<p>We implement comprehensive security measures to protect your information:</p>
				<ul>
					<li>Industry-standard encryption for data in transit and at rest</li>
					<li>Secure authentication via Supabase (SOC 2 compliant infrastructure)</li>
					<li>Row Level Security (RLS) on all database tables</li>
					<li>PCI DSS compliant payment processing via Stripe</li>
					<li>Regular security reviews and access controls</li>
				</ul>
			</section>

			<section>
				<h2>6. Your Privacy Rights</h2>
				<p>You have the right to access, correct, or delete your personal data; export your documents; unsubscribe from marketing emails at any time; and object to processing for marketing purposes.</p>
				<div class="callout-blue">
					<strong>To exercise your rights:</strong> Contact us at <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a> or use your account settings.
				</div>
			</section>

			<section>
				<h2>7. Data Retention</h2>
				<ul>
					<li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
					<li><strong>Documents:</strong> Retained until you delete them or close your account</li>
					<li><strong>Payment Records:</strong> Retained for 7 years for tax and legal compliance</li>
					<li><strong>Analytics Data:</strong> Anonymized and retained for platform improvement</li>
					<li><strong>Email Communications:</strong> Retained until you unsubscribe or delete your account</li>
				</ul>
			</section>

			<section>
				<h2>8. International Data Transfers</h2>
				<p>Abroaducate operates globally. Your information may be transferred to and processed in countries outside your residence, including the United States. We ensure appropriate safeguards are in place through Standard Contractual Clauses (SCCs) and adequacy decisions by relevant data protection authorities.</p>
			</section>

			<section>
				<h2>9. Cookies and Tracking</h2>
				<p>We use cookies for authentication sessions, security, and basic functionality. We also use PostHog for analytics (anonymized where possible). You can control cookies through your browser settings — disabling essential cookies may impact platform functionality.</p>
			</section>

			<section>
				<h2>10. Children's Privacy</h2>
				<p>Our services are intended for users 16 years and older. We do not knowingly collect personal information from children under 16. If you believe we have collected information from a child under 16, please contact us immediately.</p>
			</section>

			<section>
				<h2>11. Changes to This Privacy Policy</h2>
				<p>We may update this Privacy Policy periodically. When we make material changes, we will update the "Last updated" date, notify you via email if you have an account, and post a notice on our platform.</p>
			</section>

			<section>
				<h2>12. Contact Us</h2>
				<div class="contact-box">
					<p><strong>Company:</strong> Abroaducate, Inc.</p>
					<p><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></p>
					<p><strong>Address:</strong> 111SB Governor Ave, Dover, Delaware, USA</p>
					<p><strong>Response time:</strong> We aim to respond within 72 hours.</p>
				</div>
				<p>For EU-related privacy inquiries, you may contact our designated representative at the same email address.</p>
			</section>

		</div>

		<!-- Footer nav -->
		<div class="footer-nav">
			<a href="/terms">Terms of Service</a>
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
	.callout-blue a {
		color: #1d4ed8;
		font-weight: 600;
	}

	/* Contact box */
	.contact-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin-bottom: 0.75rem;
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
