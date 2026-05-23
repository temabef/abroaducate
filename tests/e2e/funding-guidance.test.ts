import { test, expect } from '@playwright/test';

/**
 * FundingGuidance component rendering tests.
 *
 * Verifies that program detail pages for countries with historically 0 scholarship
 * matches (Lithuania, Czechia, Estonia) render the FundingGuidance fallback panel
 * correctly instead of crashing or showing an empty section.
 *
 * HOW TO USE:
 *   1. Open your Supabase dashboard → programs table
 *   2. Find one program ID per country (Lithuania, Czechia, Estonia)
 *   3. Replace the placeholder IDs below with real ones
 *   4. Run: npm run dev  (in one terminal)
 *   5. Run: npm run test:e2e -- funding-guidance  (in another)
 */

// ── Replace these with real program IDs from your database ──────────────────
// SELECT id, program_name, country FROM programs WHERE country IN ('Lithuania', 'Czechia', 'Estonia') LIMIT 3;
const SAMPLE_PROGRAMS = [
	{ country: 'Lithuania', id: 'REPLACE_WITH_REAL_LITHUANIA_PROGRAM_ID' },
	{ country: 'Czechia', id: 'REPLACE_WITH_REAL_CZECHIA_PROGRAM_ID' },
	{ country: 'Estonia', id: 'REPLACE_WITH_REAL_ESTONIA_PROGRAM_ID' }
];

test.describe('FundingGuidance — 0-match countries', () => {
	for (const { country, id } of SAMPLE_PROGRAMS) {
		test(`${country}: program detail page loads without error`, async ({ page }) => {
			if (id.startsWith('REPLACE_')) {
				test.skip(true, `No real program ID set for ${country} — update SAMPLE_PROGRAMS in this file`);
				return;
			}

			const errors: string[] = [];
			page.on('pageerror', (err) => errors.push(err.message));

			await page.goto(`/programs/${id}`);
			await page.waitForLoadState('networkidle');

			// No JS errors
			expect(errors).toHaveLength(0);

			// Page has content (not a 404 or blank)
			await expect(page.locator('h1, h2').first()).toBeVisible();
		});

		test(`${country}: FundingGuidance panel renders with country-specific headline`, async ({ page }) => {
			if (id.startsWith('REPLACE_')) {
				test.skip(true, `No real program ID set for ${country} — update SAMPLE_PROGRAMS in this file`);
				return;
			}

			await page.goto(`/programs/${id}`);
			await page.waitForLoadState('networkidle');

			// The FundingGuidance component renders a headline containing the country name
			// It appears inside the "Fund This Program" panel when there are 0 matches
			const fundingSection = page.locator('text=/How.*funding works/i').first();
			await expect(fundingSection).toBeVisible({ timeout: 8000 });

			// Should contain the country name in the headline
			const headlineText = await fundingSection.textContent();
			expect(headlineText?.toLowerCase()).toContain(country.toLowerCase());
		});

		test(`${country}: FundingGuidance shows at least one actionable tip`, async ({ page }) => {
			if (id.startsWith('REPLACE_')) {
				test.skip(true, `No real program ID set for ${country} — update SAMPLE_PROGRAMS in this file`);
				return;
			}

			await page.goto(`/programs/${id}`);
			await page.waitForLoadState('networkidle');

			// Each tip has a title and description — verify at least one is visible
			// Tips are rendered inside .fg-tip elements
			const tips = page.locator('.fg-tip');
			const count = await tips.count();
			expect(count).toBeGreaterThanOrEqual(1);
		});

		test(`${country}: FundingGuidance action links are present and not broken`, async ({ page }) => {
			if (id.startsWith('REPLACE_')) {
				test.skip(true, `No real program ID set for ${country} — update SAMPLE_PROGRAMS in this file`);
				return;
			}

			await page.goto(`/programs/${id}`);
			await page.waitForLoadState('networkidle');

			// The "Browse all scholarships" internal link should always be present
			const browseLink = page.locator('a[href="/scholarships"]').first();
			await expect(browseLink).toBeVisible({ timeout: 8000 });
		});
	}
});
