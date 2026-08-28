import type { RequestHandler } from './$types';
import { COUNTRY_HUBS, FIELD_HUBS } from '$lib/config/countryHubs';

export const GET: RequestHandler = async ({ url, locals }) => {
  const baseUrl = url.origin;
  const supabase = locals.supabase;
  
  // Static pages with their priorities and change frequencies
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/programs', priority: '1.0', changefreq: 'daily' },
    { url: '/toolkit', priority: '0.9', changefreq: 'daily' },
    { url: '/universities', priority: '0.9', changefreq: 'daily' },
    { url: '/scholarships', priority: '0.9', changefreq: 'daily' },
    { url: '/blog', priority: '0.9', changefreq: 'daily' },
    { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
    { url: '/programs/category/tuition-free', priority: '0.9', changefreq: 'daily' },
    { url: '/programs/category/english-taught-masters', priority: '0.9', changefreq: 'daily' },
    { url: '/sop', priority: '0.8', changefreq: 'weekly' },
    { url: '/cover-letters', priority: '0.8', changefreq: 'weekly' },
    { url: '/personal-statements', priority: '0.8', changefreq: 'weekly' },
    { url: '/academic-cv', priority: '0.8', changefreq: 'weekly' },
    { url: '/document-checklists', priority: '0.8', changefreq: 'weekly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' }
  ];

  // Programmatic Country & Field Hub URLs
  const hubPages: Array<{ url: string; priority: string; changefreq: string }> = [];
  const countries = Object.values(COUNTRY_HUBS);
  const fields = Object.values(FIELD_HUBS);

  for (const c of countries) {
    hubPages.push({ url: `/programs/country/${c.slug}`, priority: '0.9', changefreq: 'daily' });
    for (const f of fields) {
      hubPages.push({ url: `/programs/country/${c.slug}/${f.slug}`, priority: '0.85', changefreq: 'weekly' });
    }
  }

  // 1. Fetch published blog posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(200);

  // 2. Fetch programs (index all active programs)
  const { data: programs } = await supabase
    .from('programs')
    .select('id, updated_at')
    .limit(2500);

  // 3. Fetch scholarships
  const { data: scholarships } = await supabase
    .from('scholarships')
    .select('id, slug, updated_at')
    .limit(1000);

  const staticEntries = staticPages
    .map(
      (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const hubEntries = hubPages
    .map(
      (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const blogEntries = (posts || [])
    .map(
      (p) => `  <url>
    <loc>${baseUrl}/blog/${p.slug}</loc>
    <lastmod>${p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n');

  const programEntries = (programs || [])
    .map(
      (prg) => `  <url>
    <loc>${baseUrl}/programs/${prg.id}</loc>
    <lastmod>${prg.updated_at ? new Date(prg.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  const scholarshipEntries = (scholarships || [])
    .map(
      (sch) => `  <url>
    <loc>${baseUrl}/scholarships/${sch.slug || sch.id}</loc>
    <lastmod>${sch.updated_at ? new Date(sch.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${hubEntries}
${blogEntries}
${programEntries}
${scholarshipEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600' // Cache for 1 hour
    }
  });
};