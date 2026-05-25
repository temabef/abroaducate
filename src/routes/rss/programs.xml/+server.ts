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

function formatDate(dateStr: string | null): string {
	if (!dateStr) return 'Rolling admissions';
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const supabase = locals.supabaseServiceRole;
	const siteUrl = `${url.protocol}//${url.host}`;

	const { data: programs, error } = await supabase
		.from('programs')
		.select(
			'id, program_name, university_name, country, degree_level, field_of_study, tuition_per_semester, tuition_tier, application_close_date, language_of_instruction, created_at'
		)
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.order('id', { ascending: false })
		.limit(50);

	if (error) {
		return new Response('Failed to load programs', { status: 500 });
	}

	const items = (programs ?? [])
		.map((p) => {
			const link = `${siteUrl}/programs/${p.id}`;
			const pubDate = p.created_at ? new Date(p.created_at).toUTCString() : new Date().toUTCString();

			// Tuition display
			let tuitionDisplay = 'Free / Tuition-free';
			if (p.tuition_per_semester && p.tuition_per_semester > 0) {
				tuitionDisplay = `€${p.tuition_per_semester.toLocaleString()} / semester`;
			} else if (p.tuition_tier === 'free') {
				tuitionDisplay = 'Free';
			}

			const deadline = formatDate(p.application_close_date);
			const description = [
				`${p.degree_level || 'Degree'} program at ${p.university_name}`,
				`\n\n🌍 Country: ${p.country || 'Europe'}`,
				`📚 Field: ${p.field_of_study || 'Various'}`,
				`🎓 Level: ${p.degree_level || 'Not specified'}`,
				`💰 Tuition: ${tuitionDisplay}`,
				p.language_of_instruction ? `🗣️ Language: ${p.language_of_instruction}` : '',
				`📅 Application deadline: ${deadline}`,
				`\n🔗 View program: ${link}`
			]
				.filter(Boolean)
				.join('\n')
				.trim();

			const title = `${p.program_name} — ${p.university_name}, ${p.country}`;

			return `
    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(p.university_name)}</author>
      <category>${escapeXml(p.field_of_study || 'General')}</category>
      <category>${escapeXml(p.country || 'Europe')}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Abroaducate — Latest Programs</title>
    <link>${siteUrl}/programs</link>
    <description>Affordable and tuition-free university programs across Europe — Germany, France, Italy, Poland, and more. Updated regularly.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss/programs.xml" rel="self" type="application/rss+xml"/>
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
