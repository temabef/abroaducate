import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();
	const supabase = locals.supabase;
	
	if (!session?.user?.id || !supabase) {
		throw redirect(303, `/auth?next=${encodeURIComponent(url.pathname)}`);
	}

	return {
		session
	};
};

export const actions: Actions = {
	submitFeedback: async ({ request, locals }) => {
		const session = await locals.getSession();
		const supabase = locals.supabase;
		
		if (!session?.user?.id) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const userName = formData.get('userName') as string;
		const usedSOP = formData.get('usedSOP') as string;
		const usedScholarshipRadar = formData.get('usedScholarshipRadar') as string;
		const rating = formData.get('rating') as string;
		const pricingFriction = formData.get('pricingFriction') as string;
		const confusingPart = formData.get('confusingPart') as string;
		const convincingFactor = formData.get('convincingFactor') as string;
		const wouldRecommend = formData.get('wouldRecommend') as string;
		const canFeatureTestimonial = formData.get('canFeatureTestimonial') === 'on';

		// Validation
		if (!rating || parseInt(rating) < 1 || parseInt(rating) > 5) {
			return fail(400, { error: 'Please provide a rating between 1 and 5 stars' });
		}

		// Store feedback
		const { error: insertError } = await supabase
			.from('early_user_feedback')
			.insert({
				user_id: session.user.id,
				user_email: session.user.email,
				user_name: userName || null,
				used_sop: usedSOP === 'yes',
				used_scholarship_radar: usedScholarshipRadar === 'yes',
				rating: parseInt(rating),
				pricing_friction: pricingFriction || null,
				confusing_part: confusingPart || null,
				convincing_factor: convincingFactor || null,
				would_recommend: wouldRecommend || null,
				can_feature_testimonial: canFeatureTestimonial,
				credits_awarded: true
			});

		if (insertError) {
			// Check if it's a duplicate submission (UNIQUE constraint violation)
			if (insertError.code === '23505') {
				return fail(400, { error: 'You have already submitted feedback. Thank you!' });
			}
			console.error('[FEEDBACK] Insert error:', insertError);
			return fail(500, { error: 'Failed to submit feedback. Please try again.' });
		}

		return { success: true };
	}
};
