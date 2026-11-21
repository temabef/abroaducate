import type { PageServerLoad } from './$types';

// WordPress-era posts live at /{slug}; only link newer /blog/{slug} posts here.
const WORDPRESS_MIGRATION_DATE = '2025-08-17T00:00:00Z';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const today = new Date().toISOString().split('T')[0];

	const [scholarshipsRes, guidesRes] = await Promise.all([
		supabase
			.from('public_scholarships_decoded')
			.select('id, title, provider, deadline, location')
			.gte('deadline', today)
			.order('created_at', { ascending: false })
			.limit(4),
		supabase
			.from('blog_posts')
			.select('slug, title, excerpt, cover_image_url, content, published_at')
			.eq('status', 'published')
			.lte('published_at', new Date().toISOString())
			.gte('created_at', WORDPRESS_MIGRATION_DATE)
			.order('published_at', { ascending: false })
			.limit(6)
	]);

	const guides = (guidesRes.data ?? []).map((p: any) => ({
		slug: p.slug as string,
		title: p.title as string,
		excerpt: (p.excerpt as string | null) ?? null,
		cover_image_url: (p.cover_image_url as string | null) ?? null,
		reading_time: Math.max(1, Math.round(((p.content as string | null)?.split(/\s+/).length ?? 0) / 200))
	}));

	return {
		scholarships: (scholarshipsRes.data ?? []) as Array<{
			id: string;
			title: string;
			provider: string | null;
			deadline: string | null;
			location: string | null;
		}>,
		guides
	};
};
