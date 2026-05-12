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
				our platform. By purchasing credits on Abroaducate, you agree to this policy.
			</p>
		</div>

		<!-- Sections -->
		<div class="rp-body">

			<section class="rp-section">
				<h2>1. What We Sell</h2>
				<p>
					Abroaducate sells <strong>prepaid credit packs</strong> — digital credits that are consumed
					when you use AI-powered features such as scholarship strategy generation and document
					creation. Credits are lifetime (they do not expire) and are tied to your account.
				</p>
				<p>Available credit packs:</p>
				<ul>
					<li><strong>20 credits</strong> — $4.99</li>
					<li><strong>50 credits</strong> — $9.99</li>
					<li><strong>130 credits</strong> — $24.99</li>
				</ul>
				<p>
					All new users also receive <strong>3 free credits</strong> on signup at no charge.
				</p>
			</section>

			<section class="rp-section">
				<h2>2. Refund Policy</h2>
				<div class="rp-callout">
					<strong>We offer a 14-day refund on all credit pack purchases.</strong> If you are not
					satisfied with your purchase for any reason, contact us within 14 days of the purchase
					date and we will issue a full refund — no questions asked.
				</div>
				<p>
					To request a refund, contact us within <strong>14 days</strong> of your purchase date.
					Refunds are processed within 5–10 business days to the original payment method.
				</p>
			</section>

			<section class="rp-section">
				<h2>3. How to Request a Refund</h2>
				<div class="rp-contact-box">
					<div><strong>Email:</strong> <a href="mailto:hello@abroaducate.com">hello@abroaducate.com</a></div>
					<div><strong>Contact form:</strong> <a href="/contact">abroaducate.com/contact</a></div>
				</div>
				<p>
					Please include your account email address and the date of purchase. We aim to respond
					within 2 business days.
				</p>
			</section>

			<section class="rp-section">
				<h2>4. Refund Processing</h2>
				<p>
					Approved refunds are processed within <strong>5–10 business days</strong> and returned to
					the original payment method. Refunds are issued in the same currency as the original
					purchase.
				</p>
			</section>

			<section class="rp-section">
				<h2>5. Free Credits</h2>
				<p>
					The 3 free credits provided to all new users upon signup are not redeemable for cash and
					are not subject to this refund policy. They are a complimentary allowance to explore the
					platform.
				</p>
			</section>

			<section class="rp-section">
				<h2>6. Changes to This Policy</h2>
				<p>
					We may update this Refund Policy from time to time. Any changes will be posted on this
					page with an updated date. Continued use of the platform after changes constitutes
					acceptance of the revised policy.
				</p>
			</section>

			<section class="rp-section">
				<h2>7. Contact Us</h2>
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
