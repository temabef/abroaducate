import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const baseUrl = url.origin;
  const supabase = locals.supabase;
  
  // Static pages with their priorities and change frequencies
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
    { url: '/universities', priority: '0.9', changefreq: 'daily' },
    { url: '/scholarships', priority: '0.9', changefreq: 'daily' },
    { url: '/sop', priority: '0.8', changefreq: 'weekly' },
    { url: '/cover-letters', priority: '0.8', changefreq: 'weekly' },
    { url: '/personal-statements', priority: '0.8', changefreq: 'weekly' },
    { url: '/academic-cv', priority: '0.8', changefreq: 'weekly' },
    { url: '/academic-analyzer', priority: '0.8', changefreq: 'weekly' },
    { url: '/document-checklists', priority: '0.8', changefreq: 'weekly' },
    { url: '/practice/ielts/reading', priority: '0.8', changefreq: 'weekly' },
    { url: '/gpa-converter', priority: '0.7', changefreq: 'monthly' },
    { url: '/visa-interview-practice', priority: '0.7', changefreq: 'weekly' },
    { url: '/word-optimization', priority: '0.6', changefreq: 'monthly' },
    { url: '/sop-review', priority: '0.6', changefreq: 'monthly' },
    { url: '/ai-features-demo', priority: '0.6', changefreq: 'monthly' },
    { url: '/cold-email-generator', priority: '0.6', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' }
  ];

  // Fetch latest published blog posts (limit to 100 for sitemap)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(100);

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

  const blogEntries = (posts || [])
    .map(
      (p) => `  <url>
    <loc>${baseUrl}/${p.slug}</loc>
    <lastmod>${p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n');

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticEntries}
${blogEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600' // Cache for 1 hour
    }
  });
}; 