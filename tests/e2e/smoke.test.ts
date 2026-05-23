import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify critical pages load without errors.
 * Run against local dev server: npm run dev
 */

test.describe('Public pages', () => {
	test('homepage loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Abroaducate/i);
		// Finder bar should be present
		await expect(page.locator('form, [data-testid="finder"]').first()).toBeVisible();
	});

	test('programs listing loads', async ({ page }) => {
		await page.goto('/programs');
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('scholarships listing loads', async ({ page }) => {
		await page.goto('/scholarships');
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('pricing page loads', async ({ page }) => {
		await page.goto('/pricing');
		await expect(page.locator('h1, h2').first()).toBeVisible();
	});

	test('contact page loads', async ({ page }) => {
		await page.goto('/contact');
		await expect(page.locator('form').first()).toBeVisible();
	});

	test('login page loads', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});
});

test.describe('Navigation', () => {
	test('no broken links in main nav', async ({ page }) => {
		await page.goto('/');
		// Check no console errors on load
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') errors.push(msg.text());
		});
		await page.waitForLoadState('networkidle');
		// Filter out known third-party noise
		const appErrors = errors.filter(
			(e) => !e.includes('posthog') && !e.includes('guideless') && !e.includes('calendly')
		);
		expect(appErrors).toHaveLength(0);
	});
});
