import { browser } from '$app/environment';
import type { CopilotUsageSnapshot } from '$lib/copilot/types';

const DEFAULT_LIMIT = 3;

function periodKey(date = new Date()) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function storageKey(userId: string) {
	return `abroaducate_copilot_usage_v1_${userId}`;
}

export function loadUsage(userId: string): CopilotUsageSnapshot {
	const fallback: CopilotUsageSnapshot = {
		userId,
		periodKey: periodKey(),
		simulationsUsed: 0,
		updatedAt: new Date().toISOString()
	};

	if (!browser) return fallback;

	try {
		const raw = localStorage.getItem(storageKey(userId));
		if (!raw) return fallback;
		const parsed = JSON.parse(raw) as CopilotUsageSnapshot;

		if (parsed.periodKey !== fallback.periodKey) {
			return fallback;
		}

		return parsed;
	} catch {
		return fallback;
	}
}

export function saveUsage(snapshot: CopilotUsageSnapshot) {
	if (!browser) return;
	localStorage.setItem(storageKey(snapshot.userId), JSON.stringify(snapshot));
}

export function simulationLimit(isPaid: boolean) {
	return isPaid ? Number.POSITIVE_INFINITY : DEFAULT_LIMIT;
}

export function canRunSimulation(snapshot: CopilotUsageSnapshot, isPaid: boolean) {
	const limit = simulationLimit(isPaid);
	return snapshot.simulationsUsed < limit;
}

export function incrementSimulation(snapshot: CopilotUsageSnapshot): CopilotUsageSnapshot {
	return {
		...snapshot,
		simulationsUsed: snapshot.simulationsUsed + 1,
		updatedAt: new Date().toISOString()
	};
}
