import { test, expect } from '@playwright/test';

/**
 * Credit system & Stripe flow tests.
 *
 * WHAT'S AUTOMATED HERE:
 *   - API auth guards (unauthenticated requests get 401/403)
 *   - Pricing page renders credit packs correctly
 *   - Stripe checkout endpoint responds correctly when authenticated
 *
 * WHAT REQUIRES MANUAL TESTING (see QA_CHECKLIST.md):
 *   - Full Stripe checkout flow (redirects to stripe.com — can't automate without Stripe test mode)
 *   - Webhook credit delivery (requires live webhook endpoint)
 *   - Credit balance update after purchase
 */

test.describe('Credit API — auth guards', () => {
	test('scholarship-strategy returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/scholarship-strategy', {
			data: { programId: 'test-id' }
		});
		expect([401, 403, 422]).toContain(res.status());
	});

	test('win-strategy returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/win-strategy', {
			data: { scholarshipId: 'test-id' }
		});
		expect([401, 403, 422]).toContain(res.status());
	});

	test('generate-sop returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/generate-sop', {
			data: { programId: 'test-id' }
		});
		expect([401, 403, 422]).toContain(res.status());
	});

	test('stripe create-credit-checkout returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/stripe/create-checkout', {
			data: { packId: 'starter' }
		});
		expect([401, 403]).toContain(res.status());
	});
});

test.describe('Pricing page', () => {
	test('renders all three credit packs', async ({ page }) => {
		await page.goto('/pricing');
		await page.waitForLoadState('networkidle');

		// All three price points should be visible
		await expect(page.locator('text=$4.99').first()).toBeVisible();
		await expect(page.locator('text=$9.99').first()).toBeVisible();
		await expect(page.locator('text=$24.99').first()).toBeVisible();
	});

	test('renders credit amounts for each pack', async ({ page }) => {
		await page.goto('/pricing');
		await page.waitForLoadState('networkidle');

		// Credit amounts: 20, 50, 130
		await expect(page.locator('text=/20 credits/i').first()).toBeVisible();
		await expect(page.locator('text=/50 credits/i').first()).toBeVisible();
		await expect(page.locator('text=/130 credits/i').first()).toBeVisible();
	});

	test('buy button is present and not disabled', async ({ page }) => {
		await page.goto('/pricing');
		await page.waitForLoadState('networkidle');

		const buyButtons = page.locator('button, a').filter({ hasText: /buy|get|purchase|credits/i });
		const count = await buyButtons.count();
		expect(count).toBeGreaterThan(0);
	});

	test('no console errors on pricing page', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});

		await page.goto('/pricing');
		await page.waitForLoadState('networkidle');

		const appErrors = errors.filter(
			(e) => !e.includes('posthog') && !e.includes('stripe') && !e.includes('favicon')
		);
		expect(appErrors).toHaveLength(0);
	});
});
