import { AFFILIATE_PARTNERS } from '$lib/config/affiliates';

/**
 * Affiliate link detection + tagging.
 *
 * Google requires paid/affiliate links to carry rel="sponsored". We detect them by
 * hostname (every partner in AFFILIATE_PARTNERS plus a few extra networks used in
 * blog posts) and tag them so they open in a new tab and are tracked on click.
 */

function hostOf(url: string): string | null {
	try {
		return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
	} catch {
		return null;
	}
}

/** hostname -> partner id */
const PARTNER_HOSTS = new Map<string, string>();
for (const p of AFFILIATE_PARTNERS) {
	const h = hostOf(p.url);
	if (h) PARTNER_HOSTS.set(h, p.id);
}
// Extra hosts/networks used directly in blog posts.
const EXTRA_HOSTS: Record<string, string> = {
	'expatrio.com': 'expatrio',
	'fintiba.com': 'fintiba',
	'airalo.com': 'airalo',
	'amberstudent.com': 'amber',
	'grey.co': 'grey',
	'preply.com': 'preply'
};
for (const [h, id] of Object.entries(EXTRA_HOSTS)) {
	if (!PARTNER_HOSTS.has(h)) PARTNER_HOSTS.set(h, id);
}

/** Query params that only appear on referral links. */
const REFERRAL_PARAMS = ['ref', 'refid', 'referral', 'aff', 'affiliate', 'aff_id', 'partner'];

/** Returns a partner id if the URL is an affiliate link, otherwise null. */
export function getAffiliatePartner(url: string): string | null {
	const host = hostOf(url);
	if (!host) return null;

	for (const [h, id] of PARTNER_HOSTS) {
		if (host === h || host.endsWith('.' + h)) return id;
	}

	try {
		const params = new URL(url).searchParams;
		if (REFERRAL_PARAMS.some((k) => params.has(k))) return host;
	} catch {
		/* ignore */
	}
	return null;
}

function isExternal(url: string): boolean {
	const host = hostOf(url);
	return !!host && host !== 'abroaducate.com';
}

function stripAttr(attrs: string, name: string): string {
	return attrs.replace(new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, 'gi'), '');
}

/**
 * Rewrites <a> tags in rendered post HTML:
 *  - affiliate links: rel="sponsored nofollow noopener", target=_blank, data-affiliate=<partner>
 *  - other external links: rel="noopener", target=_blank
 * Returns the new HTML and whether any affiliate link was found.
 */
export function tagAffiliateLinks(html: string): { html: string; hasAffiliateLinks: boolean } {
	let hasAffiliateLinks = false;

	const out = html.replace(/<a\s([^>]*?)>/gi, (full, attrs: string) => {
		const hrefMatch = (' ' + attrs).match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
		const href = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? '') : '';
		if (!href) return full;
		const decoded = href.replace(/&amp;/g, '&');

		const partner = getAffiliatePartner(decoded);
		if (!partner && !isExternal(decoded)) return full;

		let clean = ' ' + attrs;
		clean = stripAttr(clean, 'rel');
		clean = stripAttr(clean, 'target');
		clean = stripAttr(clean, 'data-affiliate');
		clean = clean.trim();

		if (partner) {
			hasAffiliateLinks = true;
			return `<a ${clean} target="_blank" rel="sponsored nofollow noopener" data-affiliate="${partner}">`;
		}
		return `<a ${clean} target="_blank" rel="noopener">`;
	});

	return { html: out, hasAffiliateLinks };
}
