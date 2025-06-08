import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
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

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 500,
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json();
            console.error('OpenAI API error:', errorData);
            return json({ error: 'Failed to improve text with AI.' }, { status: openaiResponse.status });
        }

        const openaiData = await openaiResponse.json();
        const improvedText = openaiData.choices[0].message.content.trim();

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