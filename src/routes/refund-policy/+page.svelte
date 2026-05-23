<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Refund Policy — Abroaducate</title>
	<meta name="description" content="Abroaducate Refund Policy — how refunds work for credit pack purchases on our platform." />
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
			<h1 class="page-title">Refund Policy</h1>
			<p class="page-date">Last updated: May 2026</p>
			<p class="page-intro">
				This Refund Policy explains when and how Abroaducate issues refunds for credit pack purchases made on our platform. By purchasing credits on Abroaducate, you agree to this policy.
			</p>
		</div>

		<!-- Body card -->
		<div class="body-card">

			<section>
				<h2>1. What We Sell</h2>
				<p>Abroaducate operates on a <strong>pay-as-you-go credit system</strong> — there are no monthly subscriptions. Credits are used to generate AI-powered application documents and run strategy tools.</p>
				<p>Available credit packs:</p>
				<ul>
					<li><strong>Starter Pack</strong> — 20 credits for $4.99</li>
					<li><strong>Standard Pack</strong> — 50 credits for $9.99</li>
					<li><strong>Pro Pack</strong> — 130 credits for $24.99</li>
				</ul>
				<p>Every new account also receives <strong>3 free lifetime credits</strong> on signup — no credit card required.</p>
			</section>

			<section>
				<h2>2. General Refund Policy</h2>
				<div class="callout-blue">
					<strong>Credit packs are eligible for a full refund within 14 days of purchase, no questions asked.</strong> If you purchased a credit pack and are not satisfied, contact us within 14 days and we will refund you in full.
				</div>
				<p>After 14 days, credit pack purchases are generally non-refundable. Credits do not expire — they remain in your account indefinitely until used.</p>
			</section>

			<section>
				<h2>3. When We Issue Refunds</h2>
				<p>We will issue a full refund in the following circumstances:</p>
				<ul>
					<li><strong>Within 14 days of purchase:</strong> Full refund, no questions asked.</li>
					<li><strong>Duplicate charge:</strong> If you were charged more than once for the same purchase due to a payment processing error, we will refund the duplicate charge in full.</li>
					<li><strong>Unauthorised transaction:</strong> If you believe a purchase was made on your account without your authorisation, contact us immediately. We will investigate and, if confirmed, issue a full refund.</li>
					<li><strong>Service unavailability:</strong> If a platform issue prevented you from using credits you purchased, we will consider a refund or credit restoration on a case-by-case basis.</li>
				</ul>
			</section>

			<section>
				<h2>4. How to Request a Refund</h2>
				<p>To request a refund, contact us as soon as possible after the purchase:</p>
				<div class="contact-box">
					<p><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></p>
					<p><strong>Contact form:</strong> <a href="/contact">abroaducate.com/contact</a></p>
				</div>
				<p>Please include your account email address, the date of the charge, and the reason for your refund request. We aim to respond within 2 business days.</p>
			</section>

			<section>
				<h2>5. Refund Processing</h2>
				<p>Approved refunds are processed within <strong>5–10 business days</strong> and returned to the original payment method. Processing times may vary depending on your bank or card issuer.</p>
				<p>Refunds are issued in the same currency as the original purchase. We are not responsible for any currency conversion fees charged by your bank.</p>
			</section>

			<section>
				<h2>6. Changes to This Policy</h2>
				<p>We may update this Refund Policy from time to time. Any changes will be posted on this page with an updated date. Continued use of the platform after changes constitutes acceptance of the revised policy.</p>
			</section>

			<section>
				<h2>7. Contact Us</h2>
				<p>If you have any questions about this Refund Policy, please contact us:</p>
				<div class="contact-box">
					<p><strong>Company:</strong> Abroaducate, Inc.</p>
					<p><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></p>
					<p><strong>Address:</strong> 111SB Governor Ave, Dover, Delaware, USA</p>
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
