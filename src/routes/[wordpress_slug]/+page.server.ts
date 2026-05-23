import { supabase } from '$lib/supabaseClient';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const md = new MarkdownIt({
	html: true,
	linkify: false,  // Disable auto-linking to prevent aggressive link conversion
	typographer: true
});

// Configure HTML sanitization
const sanitizeOptions = {
	allowedTags: [
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'p', 'br', 'strong', 'em', 'u', 'strike',
		'ul', 'ol', 'li',
		'a', 'img',
		'blockquote', 'code', 'pre',
		'table', 'thead', 'tbody', 'tr', 'th', 'td'
	],
	allowedAttributes: {
		'a': ['href', 'title', 'target'],
		'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
		'*': ['class', 'id']
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	transformTags: {
		'img': function(tagName: string, attribs: Record<string, string>) {
			// Ensure images are responsive and properly styled
			const style = attribs.style || '';
			const newStyle = style + '; max-width: 100%; height: auto; display: block; margin: 1rem auto;';
			
			return {
				tagName: 'img',
				attribs: {
					...attribs,
					style: newStyle,
					loading: 'lazy'
				}
			};
		}
	}
};

function renderMarkdown(content: string): string {
	if (!content) return '';
	
	try {
		// Clean up the content to fix WordPress import issues
		let cleanContent = content
			// Fix list items with tabs and spaces
			.replace(/\r\n\s*\t-\s*/g, '\n- ')
			.replace(/\r\n\s+-\s*/g, '\n- ')
			.replace(/\n\s*\t-\s*/g, '\n- ')
			.replace(/\n\s+-\s*/g, '\n- ')
			// Fix numbered lists
			.replace(/\r\n\s*\t(\d+)\.\s*/g, '\n$1. ')
			.replace(/\r\n\s+(\d+)\.\s*/g, '\n$1. ')
			.replace(/\n\s*\t(\d+)\.\s*/g, '\n$1. ')
			.replace(/\n\s+(\d+)\.\s*/g, '\n$1. ')
			// Fix bold text formatting (WordPress asterisks to proper markdown)
			.replace(/\*\*([^*]+)\*\*/g, '**$1**')
			.replace(/\*([^*]+)\*/g, '*$1*')
			// Clean up extra line breaks
			.replace(/\r\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n')
			// Fix any extra-long lines that might cause horizontal scroll
			.split('\n')
			.map(line => {
				// If line is too long and doesn't start with list/header, add word breaks
				if (line.length > 120 && !line.match(/^[\s-]*[-*+]\s/) && !line.match(/^#+\s/)) {
					return line.replace(/(.{80,120})\s/g, '$1\n');
				}
				return line;
			})
			.join('\n');
		
		// Render markdown to HTML
		const html = md.render(cleanContent);
		
		// Sanitize the HTML
		const sanitized = sanitizeHtml(html, sanitizeOptions);
		
		return sanitized;
	} catch (error) {
		console.error('Error rendering markdown:', error);
		return content;
	}
}

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.wordpress_slug;
	
	try {
		// First, check if this slug exists in our blog_posts table
		const { data: post, error: postError } = await supabase
			.from('blog_posts')
			.select('*')
			.eq('slug', slug)
			.eq('status', 'published')
			.single();

		if (postError || !post) {
			// If not found in blog posts, check if it's a regular route
			// This prevents interference with existing routes like /scholarships, /dashboard, etc.
			const protectedRoutes = [
				'dashboard', 'admin', 'auth', 'api', 'scholarships', 
				'universities', 'jobs', 'test-prep', 'about', 'contact',
				'privacy', 'terms', 'blog', 'sitemap.xml', 'robots.txt'
			];
			
			if (protectedRoutes.includes(slug)) {
				throw error(404, 'Page not found');
			}
			
			// Check if it's a scholarship or other content type
			// If not found anywhere, 404
			throw error(404, 'Page not found');
		}

		// Render the markdown content
		const renderedContent = renderMarkdown(post.content);

		// Fetch related posts — other published posts, most recent 4
		const { data: relatedRows, error: relatedErr } = await supabase
			.from('blog_posts')
			.select('id, title, slug, excerpt, cover_image_url, published_at')
			.neq('id', post.id)
			.order('published_at', { ascending: false })
			.limit(4);

		console.log('[related posts]', relatedRows?.length ?? 0, relatedErr?.message ?? 'ok');
		const related = relatedRows ?? [];

		return {
			post: {
				...post,
				content: renderedContent
			},
			related,
			// SEO metadata
			seo: {
				title: post.title,
				description: post.excerpt || post.title,
				canonicalUrl: `https://abroaducate.com/${slug}`,
				type: 'article'
			}
		};
	} catch (err) {
		console.error('Error loading WordPress post:', err);
		throw error(404, 'Page not found');
	}
};
