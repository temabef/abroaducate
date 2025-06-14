import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

const openAIEndpoint = 'https://api.openai.com/v1/chat/completions';

async function getCompletion(prompt: string, model = 'gpt-3.5-turbo') {
	const response = await fetch(openAIEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model,
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7
		})
	});

	const data = await response.json();
	return data.choices[0].message.content;
}

export const POST: RequestHandler = async ({ request, locals: { getSession } }) => {
	const session = await getSession();
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	try {
		const { originalText, selectedText, improvementType } = await request.json();

		if (!selectedText || !improvementType) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Create improvement prompt based on the type
		const improvementPrompts = {
			concise: 'Make this text more concise and to the point while preserving all important meaning.',
			detailed: 'Expand this text with more specific details and examples while maintaining the same tone.',
			research: 'Rewrite this text with a stronger research focus, adding more academic depth and scholarly language.',
			academic: 'Make this text more academic and formal in tone, using sophisticated vocabulary and structure.',
			technical: 'Enhance this text with more technical terminology and precise language appropriate for the field.'
		};

		const prompt = `You are helping improve a Statement of Purpose (SOP) for university application. 

TASK: ${improvementPrompts[improvementType as keyof typeof improvementPrompts] || improvementPrompts.concise}

SELECTED TEXT TO IMPROVE:
"${selectedText}"

CONTEXT (surrounding text for reference):
"${originalText}"

REQUIREMENTS:
1. Only return the improved version of the SELECTED TEXT, not the entire document
2. Maintain the same meaning and intent
3. Keep the improvement focused and relevant to the SOP context
4. Ensure the improved text flows naturally with the surrounding content
5. Do not add quotation marks around your response

Improved text:`;

		const improvedText = await getCompletion(prompt);

		return json({ 
			success: true, 
			improvedText,
			originalText: selectedText,
			improvementType
		});

	} catch (error: any) {
		console.error('Error in text improvement endpoint:', error);
		return json({ error: error.message || 'Internal server error' }, { status: 500 });
	}
}; 