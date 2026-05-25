import type { RequestHandler } from '@sveltejs/kit';

function escapeXml(str: string | null | undefined): string {
	if (!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function formatDeadline(deadline: string | null): string {
	if (!deadline) return 'No deadline';
	const d = new Date(deadline);
	if (isNaN(d.getTime())) return deadline;
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysLeft(deadline: string | null): string {
	if (!deadline) return '';
	const d = new Date(deadline);
	const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	if (diff < 0) return ' · Expired';
	if (diff === 0) return ' · Deadline today';
	return ` · ${diff} day${diff === 1 ? '' : 's'} left`;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const supabase = locals.supabaseServiceRole;
	const siteUrl = `${url.protocol}//${url.host}`;

	const { data: scholarships, error } = await supabase
		.from('scholarships')
		.select('id, title, provider, amount, deadline, location, field, level, description, created_at, website')
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(50);

	if (error) {
		return new Response('Failed to load scholarships', { status: 500 });
	}

	const items = (scholarships ?? [])
		.map((s) => {
			const link = s.website || `${siteUrl}/scholarships/${s.id}`;
			const pubDate = s.created_at ? new Date(s.created_at).toUTCString() : new Date().toUTCString();
			const amount = s.amount || 'Fully Funded';
			const deadline = formatDeadline(s.deadline);
			const urgency = daysLeft(s.deadline);
			const description = [
				s.description || '',
				`\n\n💰 Value: ${amount}`,
				`📍 Location: ${s.location || 'International'}`,
				`🎓 Level: ${s.level || 'All levels'}`,
				`📅 Deadline: ${deadline}${urgency}`,
				`\n🔗 Apply: ${link}`
			]
				.join('\n')
				.trim();

			return `
    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(`${siteUrl}/scholarships/${s.id}`)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(s.provider)}</author>
      <category>${escapeXml(s.field || 'All Fields')}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Abroaducate — Latest Scholarships</title>
    <link>${siteUrl}/scholarships</link>
    <description>The latest scholarships for international students — merit-based, need-based, and fully funded opportunities across Europe and beyond.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss/scholarships.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/favicon-192x192.svg</url>
      <title>Abroaducate</title>
      <link>${siteUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=300' // cache for 5 minutes
		}
	});
};
