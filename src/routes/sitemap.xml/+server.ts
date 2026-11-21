import type { RequestHandler } from './$types';
import { COUNTRY_HUBS, FIELD_HUBS } from '$lib/config/countryHubs';

// WordPress-era posts are served at /{slug}; newer posts at /blog/{slug}.
const WORDPRESS_MIGRATION_DATE = '2025-08-17T00:00:00Z';

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Supabase caps a single select at 1000 rows, so page through larger tables.
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>, max = 10000): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; from < max; from += size) {
    const { data } = await build(from, from + size - 1);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}

export const GET: RequestHandler = async ({ locals }) => {
  // Always the canonical apex domain, even if requested via www or a preview host.
  const baseUrl = 'https://abroaducate.com';
  const supabase = locals.supabase;
  
  // Static pages with their priorities and change frequencies
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/programs', priority: '1.0', changefreq: 'daily' },
    { url: '/toolkit', priority: '0.9', changefreq: 'daily' },
    { url: '/universities', priority: '0.9', changefreq: 'daily' },
    { url: '/scholarships', priority: '0.9', changefreq: 'daily' },
    { url: '/blog', priority: '0.9', changefreq: 'daily' },
    { url: '/programs/category/tuition-free', priority: '0.9', changefreq: 'daily' },
    { url: '/programs/category/english-taught-masters', priority: '0.9', changefreq: 'daily' },
    { url: '/sop', priority: '0.8', changefreq: 'weekly' },
    { url: '/cover-letters', priority: '0.8', changefreq: 'weekly' },
    { url: '/personal-statements', priority: '0.8', changefreq: 'weekly' },
    { url: '/academic-cv', priority: '0.8', changefreq: 'weekly' },
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
  const nowIso = new Date().toISOString();
  const posts = await fetchAll<{ slug: string; published_at: string | null; updated_at: string | null; created_at: string }>((from, to) =>
    supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at, created_at')
      .eq('status', 'published')
      .lte('published_at', nowIso)
      .order('published_at', { ascending: false })
      .range(from, to)
  );

  // 2. Fetch programs (index all active programs)
  const programs = await fetchAll<{ id: string; updated_at: string | null }>((from, to) =>
    supabase.from('programs').select('id, updated_at').order('id').range(from, to)
  );

  // 3. Fetch scholarships — detail pages are routed by id (/scholarships/{id})
  const scholarships = await fetchAll<{ id: string; updated_at: string | null }>((from, to) =>
    supabase.from('scholarships').select('id, updated_at').order('id').range(from, to)
  );

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

  const blogEntries = posts
    .map(
      (p) => `  <url>
    <loc>${baseUrl}${p.created_at < WORDPRESS_MIGRATION_DATE ? '' : '/blog'}/${xmlEscape(p.slug)}</loc>
    <lastmod>${new Date(p.updated_at || p.published_at || nowIso).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n');

  const programEntries = programs
    .map(
      (prg) => `  <url>
    <loc>${baseUrl}/programs/${prg.id}</loc>
    <lastmod>${prg.updated_at ? new Date(prg.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('\n');

  const scholarshipEntries = scholarships
    .map(
      (sch) => `  <url>
    <loc>${baseUrl}/scholarships/${sch.id}</loc>
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