/**
 * markdownToHtml.ts
 * 
 * Converts Markdown text to HTML for scholarship/program descriptions.
 * Simple parser without external dependencies.
 */

/**
 * Convert Markdown to HTML
 * Supports: headers (###), bullets (-), bold (**text**)
 */
export function markdownToHtml(text: string): string {
	if (!text) return '';

	// Check if text already contains HTML tags
	const hasHtmlTags = /<[^>]+>/.test(text);
	
	if (hasHtmlTags) {
		// Already HTML, return as-is
		return text;
	}

	// Convert Markdown to HTML using simple regex replacements
	let html = text;

	// Convert headers: ### Header -> <h3>Header</h3>
	html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
	html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
	html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

	// Convert bold: **text** -> <strong>text</strong>
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

	// Convert bullet points: - item -> <ul><li>item</li></ul>
	html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
	
	// Wrap consecutive <li> tags in <ul>
	html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
		return '<ul>' + match + '</ul>';
	});

	// Convert numbered lists: 1. item -> <ol><li>item</li></ol>
	html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
	
	// Wrap consecutive numbered <li> in <ol> (but not the ones already in <ul>)
	html = html.replace(/(?<!<ul>)(<li>.*?<\/li>\n?)+(?!<\/ul>)/gs, (match) => {
		if (!match.includes('<ul>')) {
			return '<ol>' + match + '</ol>';
		}
		return match;
	});

	// Convert line breaks to paragraphs
	const paragraphs = html.split(/\n\n+/);
	html = paragraphs.map(para => {
		para = para.trim();
		// Don't wrap if already wrapped in HTML tags
		if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol')) {
			return para;
		}
		return para ? `<p>${para}</p>` : '';
	}).join('\n');

	return html;
}
