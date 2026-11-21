import { writable } from 'svelte/store';

/**
 * Abroaducate is 100% free. The only limit left is a daily cap on AI tools
 * (see DAILY_AI_LIMIT in comprehensive-usage-limits.server.ts). When an API
 * returns `upgradeRequired: true` (403), components call handleUpgradeRequired,
 * which shows a friendly "daily limit reached" notice instead of a paywall.
 */
export const dailyLimitNotice = writable<{ show: boolean; message: string }>({
	show: false,
	message: ''
});

export function handleUpgradeRequired(errorData?: { message?: string; [key: string]: unknown } | null): boolean {
	dailyLimitNotice.set({
		show: true,
		message:
			errorData?.message ||
			"You've reached today's free AI limit. It resets within 24 hours. Everything else on Abroaducate stays free."
	});
	return true;
}

export function dismissDailyLimitNotice(): void {
	dailyLimitNotice.set({ show: false, message: '' });
}

/** Kept for existing callers; no longer needed. */
export function markUserInteraction(): void {}
