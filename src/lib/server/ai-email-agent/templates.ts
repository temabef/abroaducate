/**
 * Simple markdown-to-HTML converter for email clients (clean, inline styling).
 */
export function markdownToEmailHtml(markdown: string): string {
	if (!markdown) return '';

	// Normalize newlines
	let text = markdown.replace(/\r\n/g, '\n').trim();

	// Process bold: **text** or __text__
	text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

	// Process italics: *text* or _text_
	text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

	// Process links: [text](url)
	text = text.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" style="color: #2563eb; text-decoration: underline; font-weight: 500;">$1</a>'
	);

	// Convert any markdown headers (#, ##, ###) into clean bold headers
	text = text.replace(/^#{1,6}\s*(.+)$/gm, '<strong>$1</strong>');

	// Split by double newlines into blocks
	const blocks = text.split(/\n{2,}/);
	const htmlBlocks: string[] = [];

	for (const block of blocks) {
		const trimmed = block.trim();
		if (!trimmed) continue;

		// Headings
		if (trimmed.startsWith('### ')) {
			htmlBlocks.push(
				`<h4 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 18px 0 8px;">${trimmed.substring(4)}</h4>`
			);
			continue;
		}
		if (trimmed.startsWith('## ')) {
			htmlBlocks.push(
				`<h3 style="color: #0f172a; font-size: 18px; font-weight: 700; margin: 20px 0 10px;">${trimmed.substring(3)}</h3>`
			);
			continue;
		}
		if (trimmed.startsWith('# ')) {
			htmlBlocks.push(
				`<h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 22px 0 12px;">${trimmed.substring(2)}</h2>`
			);
			continue;
		}

		// Bulleted lists
		if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
			const lines = trimmed.split('\n');
			const isNumbered = /^\d+\.\s/.test(trimmed);
			const listTag = isNumbered ? 'ol' : 'ul';
			const listItems = lines
				.map((line) => {
					const clean = line.replace(/^[-*]\s+|\d+\.\s+/, '').trim();
					return `<li style="margin-bottom: 6px; line-height: 1.6; color: #334155;">${clean}</li>`;
				})
				.join('');

			htmlBlocks.push(
				`<${listTag} style="padding-left: 20px; margin: 12px 0; color: #334155;">${listItems}</${listTag}>`
			);
			continue;
		}

		// Regular paragraphs (replace single newlines with <br />)
		const paraContent = trimmed.replace(/\n/g, '<br />');
		htmlBlocks.push(
			`<p style="color: #334155; font-size: 15px; line-height: 1.65; margin: 0 0 14px;">${paraContent}</p>`
		);
	}

	return htmlBlocks.join('');
}

export interface BuildEmailHtmlOptions {
	recipientName?: string;
	bodyMarkdown: string;
	ctaUrl?: string;
	ctaText?: string;
	isEscalated?: boolean;
}

/**
 * Builds the complete branded Abroaducate responsive HTML email template.
 */
/**
 * Builds a natural, human-like HTML email reply without AI badges, dark banners, or marketing cards.
 */
export function buildAbroaducateEmailHtml(options: BuildEmailHtmlOptions): string {
	const bodyHtml = markdownToEmailHtml(options.bodyMarkdown);

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 650px; padding: 8px 0;">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

/**
 * Builds an admin escalation alert email when a student inquiry requires human intervention.
 */
export function buildEscalationAlertEmail(params: {
	studentEmail: string;
	studentName?: string;
	subject: string;
	incomingMessage: string;
	reason: string;
	category: string;
	urgency: string;
	aiDraftReply: string;
}): string {
	return `
<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ef4444; color: #ffffff; padding: 14px 20px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0; font-size: 17px; font-weight: 700;">🚨 AI Email Agent Escalation Alert</h2>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">A student email needs human attention.</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #ffffff;">
    <p style="margin: 0 0 16px; font-size: 14px;"><strong>Reason for escalation:</strong> <span style="color: #b91c1c;">${params.reason}</span></p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
      <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Sender:</td><td style="padding: 6px 0; font-weight: 600;">${params.studentName || 'Unknown'} &lt;${params.studentEmail}&gt;</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Subject:</td><td style="padding: 6px 0;">${params.subject}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Category / Urgency:</td><td style="padding: 6px 0;">${params.category} / <strong>${params.urgency.toUpperCase()}</strong></td></tr>
    </table>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Student's Message:</p>
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #0f172a; white-space: pre-wrap;">${params.incomingMessage}</p>
    </div>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700;">AI Autonomous Response Sent:</p>
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #14532d; white-space: pre-wrap;">${params.aiDraftReply}</p>
    </div>

    <p style="margin: 0; font-size: 12px; color: #64748b;">
      To take over or follow up with the student, reply to: <a href="mailto:${params.studentEmail}">${params.studentEmail}</a>
    </p>
  </div>
</div>
`;
}
