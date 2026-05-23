import { test, expect } from '@playwright/test';

/**
 * Credit system & payment flow tests.
 *
 * NOTE: Stripe checkout tests require a running dev server with valid Stripe test keys.
 * Set STRIPE_TEST_MODE=true in .env to use Stripe test mode.
 *
 * These tests verify the UI surfaces correctly — not actual payment processing.
 */

test.describe('Pricing page', () => {
	test('pricing page shows credit packs', async ({ page }) => {
		await page.goto('/pricing');
		// Should show at least one credit pack option
		await expect(page.locator('text=/\\$4\\.99|\\$9\\.99|\\$24\\.99/').first()).toBeVisible();
	});

	test('pricing page has buy button', async ({ page }) => {
		await page.goto('/pricing');
		const buyButton = page.locator('button, a').filter({ hasText: /buy|get credits|purchase/i }).first();
		await expect(buyButton).toBeVisible();
	});
});

test.describe('Credit enforcement (unauthenticated)', () => {
	test('strategy endpoints return 401 without session', async ({ request }) => {
		const res = await request.post('/api/scholarship-strategy', {
			data: { programId: 'test' }
		});
		expect([401, 403, 422]).toContain(res.status());
	});

	test('win-strategy endpoint returns 401 without session', async ({ request }) => {
		const res = await request.post('/api/win-strategy', {
			data: { scholarshipId: 'test' }
		});
		expect([401, 403, 422]).toContain(res.status());
	});
});
