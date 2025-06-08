import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const editPrompts = {
    concise: `Make this text more concise while maintaining its core meaning and impact. Remove unnecessary words and redundancy:`,
    detailed: `Expand this text with more specific details, examples, or explanations while maintaining the original tone and message:`,
    research: `Rewrite this text with a stronger research and academic focus, emphasizing scholarly approach and methodology:`,
    academic: `Adjust this text to have a more formal academic tone, using appropriate scholarly language and structure:`,
    technical: `Rewrite this text with more technical precision and professional terminology relevant to the field:`
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { text, editType, context } = await request.json();
        
        if (!text || !editType) {
            return json({ error: 'Missing required fields' }, { status: 400 });
        }
        
        if (!editPrompts[editType as keyof typeof editPrompts]) {
            return json({ error: 'Invalid edit type' }, { status: 400 });
        }
        
        const prompt = editPrompts[editType as keyof typeof editPrompts];
        
        // Create the editing prompt with context
        const systemMessage = `You are an expert SOP (Statement of Purpose) editor. Your task is to improve specific sections of academic statements while maintaining consistency with the overall document.

Guidelines:
- Maintain the original meaning and intent
- Keep the same person/voice (first person)
- Ensure the edited text flows naturally with the surrounding context
- Match the academic tone appropriate for graduate school applications
- Keep improvements relevant to the specific editing request
- Return ONLY the improved text, no explanations or additional content`;

        const userMessage = `${prompt}

Original text to edit:
"${text}"

${context ? `Context (surrounding SOP content for reference):\n"${context.substring(0, 500)}..."` : ''}

Please provide the improved version:`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        const editedText = completion.choices[0]?.message?.content?.trim();
        
        if (!editedText) {
            throw new Error('Failed to generate edited text');
        }

        return json({
            success: true,
            editedText,
            originalText: text,
            editType
        });

    } catch (error: any) {
        console.error('Text editing error:', error);
        
        return json({
            error: error.message || 'Failed to edit text',
            success: false
        }, { status: 500 });
    }
}; 