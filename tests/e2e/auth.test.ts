import { test, expect } from '@playwright/test';

/**
 * Auth flow tests.
 * These test the UI flow only — no real accounts are created.
 * For full end-to-end auth testing, use a dedicated test Supabase project.
 */

test.describe('Auth pages', () => {
	test('login page has email and password fields', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('register page is accessible', async ({ page }) => {
		await page.goto('/register');
		await expect(page.locator('input[type="email"]')).toBeVisible();
	});

	test('unauthenticated access to dashboard redirects', async ({ page }) => {
		await page.goto('/dashboard');
		// Should redirect to login or onboarding — not stay on /dashboard
		await page.waitForURL((url) => !url.pathname.startsWith('/dashboard'), { timeout: 5000 });
		const path = new URL(page.url()).pathname;
		expect(['/login', '/auth', '/onboarding', '/']).toContain(path);
	});

	test('unauthenticated access to admin redirects', async ({ page }) => {
		await page.goto('/admin');
		await page.waitForURL((url) => !url.pathname.startsWith('/admin'), { timeout: 5000 });
	});
});
