export type ProgramDeadlineStatus =
	| 'verified'
	| 'estimated'
	| 'rolling'
	| 'not_published'
	| 'expired'
	| 'unknown';

export type ProgramDeadlineLifecycle = {
	status: ProgramDeadlineStatus;
	label: string;
	shortLabel: string;
	sortDate: string | null;
	cycleYear: number | null;
	nextRefreshDue: string | null;
	isExpired: boolean;
	isActionable: boolean;
};

type ProgramDeadlineInput = {
	application_close_date?: string | null;
	deadline_summary?: string | null;
	rubric_criteria?: any;
};

function dateOnly(date: Date) {
	return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
	const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
	return dateOnly(next);
}

function parseDateOnly(value: string | null | undefined) {
	if (!value) return null;
	const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!match) return null;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}

	return date;
}

function formatDate(value: Date) {
	return value.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

function hasUnpublishedDeadline(summary: string) {
	return /check official|not published|not yet|tbd|to be announced|varies|unknown/i.test(summary);
}

export function getProgramDeadlineLifecycle(
	program: ProgramDeadlineInput,
	today = new Date()
): ProgramDeadlineLifecycle {
	const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	const summary = String(program.deadline_summary || '').trim();
	const stored = program.rubric_criteria?.deadline_lifecycle || {};
	const closeDate = parseDateOnly(program.application_close_date);

	if (closeDate) {
		const closeDateOnly = dateOnly(closeDate);
		const cycleYear = closeDate.getUTCFullYear();
		const expired = closeDate < todayUtc;

		return {
			status: expired ? 'expired' : ((stored.status === 'estimated' ? 'estimated' : 'verified') as ProgramDeadlineStatus),
			label: expired
				? `Closed for ${cycleYear} intake. Next deadline not yet verified.`
				: formatDate(closeDate),
			shortLabel: expired ? `Closed ${cycleYear}` : formatDate(closeDate),
			sortDate: closeDateOnly,
			cycleYear,
			nextRefreshDue: expired ? dateOnly(todayUtc) : addMonths(closeDate, 1),
			isExpired: expired,
			isActionable: !expired
		};
	}

	if (/rolling/i.test(summary)) {
		return {
			status: 'rolling',
			label: 'Rolling admission. Confirm current availability on the official page.',
			shortLabel: 'Rolling',
			sortDate: null,
			cycleYear: null,
			nextRefreshDue: addMonths(todayUtc, 3),
			isExpired: false,
			isActionable: true
		};
	}

	if (!summary || hasUnpublishedDeadline(summary)) {
		return {
			status: 'not_published',
			label: 'Deadline not published yet. Check the official program page.',
			shortLabel: 'Not published',
			sortDate: null,
			cycleYear: null,
			nextRefreshDue: addMonths(todayUtc, 3),
			isExpired: false,
			isActionable: false
		};
	}

	return {
		status: stored.status === 'verified' ? 'verified' : 'estimated',
		label: summary,
		shortLabel: summary,
		sortDate: null,
		cycleYear: stored.cycle_year || null,
		nextRefreshDue: stored.next_refresh_due || addMonths(todayUtc, 6),
		isExpired: false,
		isActionable: true
	};
}

export function getProgramDeadlineSortValue(program: ProgramDeadlineInput) {
	const lifecycle = getProgramDeadlineLifecycle(program);
	if (lifecycle.status === 'expired') return Number.POSITIVE_INFINITY;
	if (!lifecycle.sortDate) return Number.MAX_SAFE_INTEGER - 1;
	return parseDateOnly(lifecycle.sortDate)?.getTime() ?? Number.MAX_SAFE_INTEGER - 1;
}
