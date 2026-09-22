<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Refund & Billing Policy — Abroaducate</title>
	<meta name="description" content="Abroaducate Billing Policy — Abroaducate is 100% free with no fees or subscriptions." />
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
			<h1 class="page-title">Billing & Refund Policy</h1>
			<p class="page-date">Last updated: September 2026</p>
			<p class="page-intro">
				Abroaducate is a 100% free platform for students worldwide. We do not charge subscription fees or sell credit packs. This policy outlines our free access model and handling of any historical billing.
			</p>
		</div>

		<!-- Body card -->
		<div class="body-card">

			<section>
				<h2>1. 100% Free Platform</h2>
				<p>Abroaducate provides all AI-powered document generators, scholarship strategy boards, and application tools completely free of charge. No credit card is required to register or use any of our features.</p>
			</section>

			<section>
				<h2>2. No Subscriptions or Software Fees</h2>
				<div class="callout-blue">
					<strong>You will never be charged for using Abroaducate core tools.</strong> We do not operate recurring monthly subscriptions, credit packs, or hidden fees.
				</div>
				<p>Because there are no charges or ongoing billing for software access, recurring refund requests are not applicable to current platform users.</p>
			</section>

			<section>
				<h2>3. Historical Purchases</h2>
				<p>If you previously purchased a credit pack prior to our pivot to a free model and have questions regarding your past transactions or require historical receipts, our support team will gladly assist you. Contact us at <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a> with your account details.</p>
			</section>

			<section>
				<h2>4. Third-Party Partner Services</h2>
				<p>Abroaducate may connect users to optional third-party service providers (such as blocked account providers, health insurance companies, or visa assistance services). Any financial transactions conducted directly with these partners are subject to the individual partner's refund policies and terms of service. Abroaducate does not process payments or manage refunds on behalf of third-party partners.</p>
			</section>

			<section>
				<h2>5. Contact Us</h2>
				<p>If you have any questions about this policy or your account, please reach out:</p>
				<div class="contact-box">
					<p><strong>Platform:</strong> Abroaducate</p>
					<p><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></p>
					<p><strong>Contact form:</strong> <a href="/contact">abroaducate.com/contact</a></p>
				</div>
			</section>

		</div>

		<!-- Footer nav -->
		<div class="footer-nav">
			<a href="/terms">Terms of Service</a>
			<span class="sep">&middot;</span>
			<a href="/privacy">Privacy Policy</a>
			<span class="sep">&middot;</span>
			<a href="/contact">Contact Us</a>
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
		margin: 0.75rem 0;
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
