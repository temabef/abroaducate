import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { handleAIFeatureRequest, type AIFeatureRequest } from '$lib/services/aiFeatureService';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits.server';

export const POST: RequestHandler = async ({ request, locals: { getSession } }) => {
	const session = await getSession();

	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Define schema for validation
	const aiFeatureSchema = z.object({
		type: z.string().min(1).max(50),
		content: z.string().min(1).max(10000),
		options: z.record(z.any()).optional().default({})
	});

	try {
		const requestData = await request.json();
		
		// Validate and sanitize input
		const parsed = aiFeatureSchema.safeParse(requestData);
		if (!parsed.success) {
			return json({ 
				error: 'Invalid input', 
				details: parsed.error.flatten() 
			}, { status: 400 });
		}
		const data = parsed.data;
		
		// Create AI feature request
		const aiRequest: AIFeatureRequest = {
			type: data.type.trim(),
			userId: session.user.id,
			content: data.content.trim(),
			options: data.options || {}
		};
		
		// Map incoming feature type to canonical subtype key used by the limits table
		const canonicalMap: Record<string, string> = {
			sop_review: 'reviews',
			review: 'reviews',
			text_enhancement: 'text_enhancements',
			word_optimization: 'word_optimizations',
			grammar_check: 'grammar_check',
			plagiarism_check: 'plagiarism_checks',
			tone_analysis: 'tone_analysis'
		};

		const canonicalSubtype = canonicalMap[data.type] || data.type;

		// First, check if the user is within their usage limits for this specific AI feature.
		// The new simplified function only needs the user ID and the specific feature subtype.
		const usageCheck = await checkComprehensiveUsageLimit(
			session.user.id,
			canonicalSubtype
		);

		if (!usageCheck.allowed) {
			return json({
				error: 'Usage limit exceeded',
				message: usageCheck.message || 'You have reached your monthly limit for this AI feature.',
				planType: usageCheck.planType,
				currentUsage: usageCheck.currentUsage,
				limit: usageCheck.limit,
				upgradeRequired: true
			}, { status: 403 });
		}

		// Process the AI feature request
		const result = await handleAIFeatureRequest(aiRequest);

		if (!result.success) {
			return json({
				error: 'AI feature processing failed',
				message: result.error || 'Failed to process AI feature request'
			}, { status: 500 });
		}

		// Increment usage after successful processing
		await incrementComprehensiveUsage(session.user.id, canonicalSubtype);

		return json({
			success: true,
			result: result.data,
			usage: {
				current: usageCheck.currentUsage + 1,
				limit: usageCheck.limit,
				planType: usageCheck.planType
			}
		});

	} catch (error: any) {
		console.error('Error in AI features endpoint:', error);
		return json({ 
			error: 'Internal server error',
			message: error.message || 'An unexpected error occurred'
		}, { status: 500 });
	}
}; 