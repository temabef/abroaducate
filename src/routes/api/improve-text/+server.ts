import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits.server';
import { getAIModelForUser } from '$lib/ai-models';

export const POST: RequestHandler = async ({ request, locals: { getSession, supabase } }) => {
    const session = await getSession();

    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define schema for validation
    const improveTextSchema = z.object({
        text: z.string().min(1).max(10000),
        improvementType: z.enum(['grammar', 'style', 'clarity', 'academic', 'professional']),
        context: z.string().max(1000).optional().default(''),
        documentType: z.enum(['sop', 'cover_letter', 'personal_statement', 'cv', 'general']).default('general')
    });

    try {
        const requestData = await request.json();

        // Validate and sanitize input
        const parsed = improveTextSchema.safeParse(requestData);
        if (!parsed.success) {
            return json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }
        const data = parsed.data;

        // Check usage limits
        const usageCheck = await checkComprehensiveUsageLimit(session.user.id, 'text_enhancements');
        
        if (!usageCheck.allowed) {
            return json({
                error: 'Usage limit exceeded',
                message: usageCheck.message || 'You have reached your monthly limit for text improvements.',
                planType: usageCheck.planType,
                currentUsage: usageCheck.currentUsage,
                limit: usageCheck.limit,
                upgradeRequired: true
            }, { status: 403 });
        }

        // Get appropriate AI model based on user's subscription tier
        const aiModel = await getAIModelForUser(supabase, session.user.id);

        // Generate improvement prompt based on type
        const improvementPrompt = generateImprovementPrompt(data.text, data.improvementType, data.context, data.documentType);

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: aiModel,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert editor specializing in ${data.documentType} documents. Provide clear, improved text that maintains the original meaning while applying the requested improvement.`
                    },
                    {
                        role: 'user',
                        content: improvementPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error:', errorData);
            return json({ error: 'Failed to improve text' }, { status: 500 });
        }

        const result = await response.json();
        const improvedText = result.choices[0].message.content.trim();

        // Increment usage after successful improvement
        await incrementComprehensiveUsage(session.user.id, 'text_enhancements');

        return json({
            success: true,
            improvedText,
            originalText: data.text,
            improvementType: data.improvementType,
            modelUsed: aiModel,
            usage: {
                current: usageCheck.currentUsage + 1,
                limit: usageCheck.limit,
                planType: usageCheck.planType
            }
        });

    } catch (error) {
        console.error('Error improving text:', error);
        return json({ error: 'Failed to improve text' }, { status: 500 });
    }
}; 