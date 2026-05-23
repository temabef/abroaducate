import { test, expect } from '@playwright/test';

/**
 * Scholarship match verification tests.
 *
 * Verifies that the scholarship matching system returns results for programs
 * across different countries, and that the UI surfaces them correctly.
 *
 * HOW TO USE:
 *   1. Run this SQL in Supabase to find good sample programs:
 *
 *      SELECT p.id, p.program_name, p.country, COUNT(m.id) as match_count
 *      FROM programs p
 *      LEFT JOIN program_scholarship_matches m ON m.program_id = p.id
 *      WHERE p.country IN ('Germany', 'France', 'Poland', 'Sweden', 'Austria')
 *      GROUP BY p.id, p.program_name, p.country
 *      HAVING COUNT(m.id) > 0
 *      ORDER BY p.country, match_count DESC
 *      LIMIT 5;
 *
 *   2. Replace the placeholder IDs below with real ones
 *   3. Run: npm run dev  (in one terminal)
 *   4. Run: npm run test:e2e -- scholarship-matches  (in another)
 */

// ── Replace these with real program IDs from your database ──────────────────
const SAMPLE_PROGRAMS_WITH_MATCHES = [
	{ country: 'Germany', id: 'REPLACE_WITH_REAL_GERMANY_PROGRAM_ID' },
	{ country: 'France', id: 'REPLACE_WITH_REAL_FRANCE_PROGRAM_ID' },
	{ country: 'Poland', id: 'REPLACE_WITH_REAL_POLAND_PROGRAM_ID' },
	{ country: 'Sweden', id: 'REPLACE_WITH_REAL_SWEDEN_PROGRAM_ID' },
	{ country: 'Austria', id: 'REPLACE_WITH_REAL_AUSTRIA_PROGRAM_ID' }
];

test.describe('Scholarship matches — program detail pages', () => {
	for (const { country, id } of SAMPLE_PROGRAMS_WITH_MATCHES) {
		test(`${country}: program detail page loads and shows scholarship section`, async ({ page }) => {
			if (id.startsWith('REPLACE_')) {
				test.skip(true, `No real program ID set for ${country} — update SAMPLE_PROGRAMS_WITH_MATCHES`);
				return;
			}

			await page.goto(`/programs/${id}`);
			await page.waitForLoadState('networkidle');

			// Page should load without errors
			await expect(page.locator('h1, h2').first()).toBeVisible();

			// The "Fund This Program" section should be present
			const fundSection = page.locator('text=/Fund This Program|scholarship/i').first();
			await expect(fundSection).toBeVisible({ timeout: 8000 });
		});

		test(`${country}: scholarship matches render (not empty, not error state)`, async ({ page }) => {
			if (id.startsWith('REPLACE_')) {
				test.skip(true, `No real program ID set for ${country} — update SAMPLE_PROGRAMS_WITH_MATCHES`);
				return;
			}

			await page.goto(`/programs/${id}`);
			await page.waitForLoadState('networkidle');

			// Should NOT show a "no matches" or error message
			const noMatchText = page.locator('text=/no scholarships found|no matches/i');
			await expect(noMatchText).not.toBeVisible();
		});
	}
});

test.describe('Scholarship matches — API layer', () => {
	test('public_program_scholarship_matches view is accessible', async ({ request }) => {
		// This hits the programs listing which uses the matches view server-side
		const res = await request.get('/programs');
		expect(res.status()).toBe(200);
	});

	test('programs listing page loads with tuition tier badges', async ({ page }) => {
		await page.goto('/programs');
		await page.waitForLoadState('networkidle');

		// Tuition tier badges should be visible (zero_tuition / low_tuition / scholarship_funded)
		// These only appear if the matching system is working
		const badges = page.locator('text=/zero tuition|low tuition|scholarship funded|free tuition/i');
		const count = await badges.count();
		expect(count).toBeGreaterThan(0);
	});
});
