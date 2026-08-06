/**
 * markdownToHtml.ts
 * 
 * Converts Markdown text to HTML for scholarship/program descriptions.
 * Simple parser without external dependencies.
 */

/**
 * Convert Markdown to HTML
 * Supports: headers (###), bullets (-), numbered lists, bold (**text**)
 */
export function markdownToHtml(text: string): string {
	if (!text) return '';

	// Check if text already contains HTML tags
	const hasHtmlTags = /<[^>]+>/.test(text);
	
	if (hasHtmlTags) {
		// Already HTML, return as-is
		return text;
	}

	let html = text;

	// Convert headers: ### Header -> <h3>Header</h3>
	html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
	html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
	html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

	// Convert bold: **text** -> <strong>text</strong>
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

	// Process lists: we need to handle bullet and numbered lists separately
	// Split into lines to process lists properly
	const lines = html.split('\n');
	const processed: string[] = [];
	let inBulletList = false;
	let inNumberedList = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const isBullet = /^- (.+)$/.test(line);
		const isNumbered = /^\d+\. (.+)$/.test(line);

		if (isBullet) {
			if (!inBulletList) {
				processed.push('<ul>');
				inBulletList = true;
			}
			if (inNumberedList) {
				processed.push('</ol>');
				inNumberedList = false;
			}
			processed.push(line.replace(/^- (.+)$/, '<li>$1</li>'));
		} else if (isNumbered) {
			if (!inNumberedList) {
				processed.push('<ol>');
				inNumberedList = true;
			}
			if (inBulletList) {
				processed.push('</ul>');
				inBulletList = false;
			}
			processed.push(line.replace(/^\d+\. (.+)$/, '<li>$1</li>'));
		} else {
			// Not a list item - close any open lists
			if (inBulletList) {
				processed.push('</ul>');
				inBulletList = false;
			}
			if (inNumberedList) {
				processed.push('</ol>');
				inNumberedList = false;
			}
			processed.push(line);
		}
	}

	// Close any remaining open lists
	if (inBulletList) processed.push('</ul>');
	if (inNumberedList) processed.push('</ol>');

	html = processed.join('\n');

	// Convert double line breaks to paragraph breaks
	const paragraphs = html.split(/\n\n+/);
	html = paragraphs.map(para => {
		para = para.trim();
		// Don't wrap if already wrapped in HTML block tags
		if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || para.startsWith('<p') || para.startsWith('<li')) {
			return para;
		}
		return para ? `<p>${para}</p>` : '';
	}).join('\n\n');

	return html;
}
