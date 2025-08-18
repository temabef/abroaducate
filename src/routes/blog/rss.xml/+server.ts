import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
  const supabase = locals.supabase;
  const origin = url.origin;

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title, slug, excerpt, published_at')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (posts || []).map((p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${origin}/blog/${p.slug}</link>
      <guid>${origin}/blog/${p.slug}</guid>
      <pubDate>${p.published_at ? new Date(p.published_at).toUTCString() : ''}</pubDate>
      <description><![CDATA[${p.excerpt || ''}]]></description>
    </item>
  `).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Abroaducate Blog</title>
    <link>${origin}/blog</link>
    <description>Guides and insights on study abroad, scholarships, IELTS prep, and applications.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600'
    }
  });
};

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}



