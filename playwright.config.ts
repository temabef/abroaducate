import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Abroaducate pre-deploy QA.
 *
 * Before running tests:
 *   1. Start the dev server manually: npm run dev
 *   2. Run tests: npm run test:e2e
 *
 * To install browsers (first time):
 *   npx playwright install chromium
 */
export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [['html', { open: 'never' }], ['list']],
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:5173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
	// webServer is intentionally omitted — start `npm run dev` manually first
});
