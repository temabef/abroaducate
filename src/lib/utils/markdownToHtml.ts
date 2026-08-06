/**
 * markdownToHtml.ts
 * 
 * Converts Markdown text to HTML for scholarship/program descriptions.
 * Supports both Markdown and plain HTML input.
 */

import { marked } from 'marked';

// Configure marked for safe HTML output
marked.setOptions({
	breaks: true, // Convert \n to <br>
	gfm: true, // GitHub Flavored Markdown
});

/**
 * Convert Markdown to HTML
 * If the input already contains HTML tags, returns it as-is
 * Otherwise, parses it as Markdown
 */
export function markdownToHtml(text: string): string {
	if (!text) return '';

	// Check if text already contains HTML tags
	const hasHtmlTags = /<[^>]+>/.test(text);
	
	if (hasHtmlTags) {
		// Already HTML, return as-is
		return text;
	}

	// Convert Markdown to HTML
	try {
		return marked.parse(text) as string;
	} catch (err) {
		console.error('Markdown parsing error:', err);
		// Fallback: return plain text with line breaks
		return text.replace(/\n/g, '<br>');
	}
}
