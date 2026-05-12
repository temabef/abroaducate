<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Refund Policy — Abroaducate</title>
	<meta name="description" content="Abroaducate Refund Policy — how refunds work for credit pack purchases on our platform." />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="rp-page">
	<!-- Top nav -->
	<div class="rp-topbar">
		<div class="rp-topbar-inner">
			<a href="/" class="rp-back">
				<ChevronLeft size={16} />
				Back to Abroaducate
			</a>
		</div>
	</div>

	<div class="rp-container">
		<!-- Header -->
		<div class="rp-header">
			<p class="rp-label">Legal</p>
			<h1 class="rp-title">Refund Policy</h1>
			<p class="rp-date">Last updated: May 2026</p>
			<p class="rp-intro">
				This Refund Policy explains when and how Abroaducate issues refunds for purchases made on
				our platform. By subscribing to a paid plan on Abroaducate, you agree to this policy.
			</p>
		</div>

		<!-- Sections -->
		<div class="rp-body">

			<section class="rp-section">
				<h2>1. What We Sell</h2>
				<p>
					Abroaducate offers <strong>monthly and annual subscription plans</strong> that give
					students access to AI-powered document generation, scholarship matching, university
					recommendations, and application tracking tools.
				</p>
				<p>Available plans:</p>
				<ul>
					<li><strong>Academic Starter</strong> — Free (no charge)</li>
					<li><strong>Academic Professional</strong> — $12/month (or $115.20/year, saving 20%)</li>
					<li><strong>Academic Elite</strong> — $29/month (or $278.40/year, saving 20%)</li>
				</ul>
				<p>
					Paid plans include a <strong>3-day free trial</strong>. You will not be charged until
					the trial period ends.
				</p>
			</section>

			<section class="rp-section">
				<h2>2. Refund Policy</h2>
				<div class="rp-callout">
					<strong>We offer a 14-day refund on all subscription purchases.</strong> If you are not
					satisfied with your subscription for any reason, contact us within 14 days of your first
					charge and we will issue a full refund — no questions asked.
				</div>
				<p>
					To request a refund, contact us within <strong>14 days</strong> of your payment date.
					Refunds are processed within 5–10 business days to the original payment method.
				</p>
			</section>

			<section class="rp-section">
				<h2>3. Free Trial</h2>
				<p>
					All paid plans begin with a <strong>3-day free trial</strong>. You may cancel at any
					time during the trial period without being charged. If you do not cancel before the
					trial ends, your subscription will begin and your payment method will be charged.
				</p>
			</section>

			<section class="rp-section">
				<h2>4. Cancellation</h2>
				<p>
					You may cancel your subscription at any time through your account settings or by
					contacting us. Cancellation stops future charges. Your access to paid features continues
					until the end of your current billing period.
				</p>
			</section>

			<section class="rp-section">
				<h2>5. How to Request a Refund</h2>
				<div class="rp-contact-box">
					<div><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></div>
					<div><strong>Contact form:</strong> <a href="/contact">abroaducate.com/contact</a></div>
				</div>
				<p>
					Please include your account email address and the date of the charge. We aim to respond
					within 2 business days.
				</p>
			</section>

			<section class="rp-section">
				<h2>6. Refund Processing</h2>
				<p>
					Approved refunds are processed within <strong>5–10 business days</strong> and returned to
					the original payment method. Refunds are issued in the same currency as the original
					purchase.
				</p>
			</section>

			<section class="rp-section">
				<h2>7. Changes to This Policy</h2>
				<p>
					We may update this Refund Policy from time to time. Any changes will be posted on this
					page with an updated date. Continued use of the platform after changes constitutes
					acceptance of the revised policy.
				</p>
			</section>

			<section class="rp-section">
				<h2>8. Contact Us</h2>
				<div class="rp-contact-box">
					<div><strong>Company:</strong> Abroaducate, Inc</div>
					<div><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></div>
					<div><strong>Website:</strong> <a href="https://abroaducate.com">abroaducate.com</a></div>
				</div>
			</section>

		</div>

		<!-- Footer nav -->
		<div class="rp-footer-nav">
			<a href="/terms">Terms of Service</a>
			<span>·</span>
			<a href="/privacy">Privacy Policy</a>
			<span>·</span>
			<a href="/contact">Contact Us</a>
		</div>
	</div>
</div>

<style>
	.rp-page {
		min-height: 100vh;
		background: #f8fafc;
		padding-top: 4rem;
	}

	.rp-topbar {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		position: sticky;
		top: 4rem;
		z-index: 10;
	}

	.rp-topbar-inner {
		max-width: 52rem;
		margin: 0 auto;
		padding: 0.75rem 1.5rem;
	}

	.rp-back {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		text-decoration: none;
		transition: color 0.15s;
	}

	.rp-back:hover { color: #0f172a; }

	.rp-container {
		max-width: 52rem;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
	}

	/* Header */
	.rp-header {
		margin-bottom: 2.5rem;
	}

	.rp-label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #f97316;
		margin-bottom: 0.5rem;
	}

	.rp-title {
		font-family: 'Outfit', sans-serif;
		font-size: 2.5rem;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 0.5rem;
		letter-spacing: -0.03em;
	}

	.rp-date {
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 1rem;
	}

	.rp-intro {
		font-size: 1rem;
		line-height: 1.7;
		color: #475569;
	}

	/* Body */
	.rp-body {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1rem;
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.rp-section h2 {
		font-family: 'Outfit', sans-serif;
		font-size: 1.125rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0.875rem;
	}

	.rp-section p {
		font-size: 0.9375rem;
		line-height: 1.7;
		color: #475569;
		margin-bottom: 0.75rem;
	}

	.rp-section p:last-child { margin-bottom: 0; }

	.rp-section ul {
		list-style: disc;
		padding-left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		margin: 0.75rem 0;
	}

	.rp-section li {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: #475569;
	}

	.rp-callout {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		font-size: 0.9375rem;
		line-height: 1.6;
		color: #1e40af;
		margin-bottom: 0.875rem;
	}

	.rp-contact-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		font-size: 0.9375rem;
		color: #475569;
		margin: 0.75rem 0;
	}

	.rp-contact-box a {
		color: #f97316;
		text-decoration: none;
	}

	.rp-contact-box a:hover { text-decoration: underline; }

	/* Footer nav */
	.rp-footer-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 2rem;
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.rp-footer-nav a {
		color: #64748b;
		text-decoration: none;
		transition: color 0.15s;
	}

	.rp-footer-nav a:hover { color: #0f172a; }
</style>
