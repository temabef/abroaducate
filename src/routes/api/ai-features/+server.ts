import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleAIFeatureRequest, type AIFeatureRequest } from '$lib/services/aiFeatureService';
import { checkComprehensiveUsageLimit, incrementComprehensiveUsage } from '$lib/comprehensive-usage-limits';

export const POST: RequestHandler = async ({ request, locals: { getSession } }) => {
	const session = await getSession();

	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const requestData = await request.json();
		
		// Validate required fields
		if (!requestData.type || !requestData.content) {
			return json({ 
				error: 'Missing required fields: type and content' 
			}, { status: 400 });
		}
		
		// Create AI feature request
		const aiRequest: AIFeatureRequest = {
			type: requestData.type,
			userId: session.user.id,
			content: requestData.content,
			options: requestData.options || {}
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

		const canonicalSubtype = canonicalMap[requestData.type] || requestData.type;

		// First, check if the user is within their usage limits for this specific AI feature.
		// The new simplified function only needs the user ID and the specific feature subtype.
		const usageCheck = await checkComprehensiveUsageLimit(
			session.user.id,
			canonicalSubtype
		);

		// If usage limit is reached, return the appropriate error response immediately
		if (!usageCheck.allowed) {
			return json({
				success: false,
				error: usageCheck.message || 'Usage limit reached',
				upgradeRequired: true,
				usageData: {
					type: requestData.type,
					currentUsage: usageCheck.currentUsage,
					limit: usageCheck.limit,
					remainingUsage: usageCheck.limit ? usageCheck.limit - usageCheck.currentUsage : null,
					planType: usageCheck.planType
				}
			}, { status: 403 });
		}

		// If usage is allowed, now we can process the request
		const response = await handleAIFeatureRequest(aiRequest);
		
		if (!response.success) {
			return json({ 
				error: response.error || 'AI processing failed' 
			}, { status: 500 });
		}
		
		// After successful processing, increment usage for the precise feature subtype
		const incrementSuccess = await incrementComprehensiveUsage(
			session.user.id,
			canonicalSubtype
		);

		if (!incrementSuccess) {
			// Log this issue internally, but don't fail the user's request,
			// as they have already received the AI output.
			console.error(`CRITICAL: Failed to increment usage for user ${session.user.id} and feature ${canonicalSubtype}, but the AI request was successful.`);
		}
		
		return json({
			success: true,
			result: response.result,
			usageData: {
				type: requestData.type,
				currentUsage: usageCheck.currentUsage + 1, // Add 1 to reflect the current usage
				limit: usageCheck.limit,
				remainingUsage: usageCheck.limit ? usageCheck.limit - (usageCheck.currentUsage + 1) : null,
				planType: usageCheck.planType
			}
		});
		
	} catch (error: any) {
		console.error('AI Feature API Error:', error);
		return json({ 
			error: error.message || 'Internal server error' 
		}, { status: 500 });
	}
}; 