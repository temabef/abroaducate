import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { StudentProfileContext } from './types';

/**
 * Static Abroaducate platform knowledge base for grounded responses.
 */
export const ABROADUCATE_KNOWLEDGE_BASE = `
# ABOUT ABROADUCATE
Abroaducate (https://www.abroaducate.com) is an AI-powered study abroad and scholarship platform. 
Our mission is to help international students secure admissions, visas, and fully-funded scholarships worldwide without paying thousands of dollars to private educational agents.

## PLATFORM TOOLS & DIRECT LINKS
1. **AI Statement of Purpose (SOP) & Personal Statement Builder**:
   - URL: https://www.abroaducate.com/dashboard/sop
   - Features: Analyzes SOP structure, academic tone, research alignment, detects generic cliches, and provides sentence-by-sentence rewrites tailored to top university rubrics.
2. **Global Scholarship Finder**:
   - URL: https://www.abroaducate.com/scholarships
   - Features: Curated database of 1,500+ verified scholarships (DAAD, Erasmus Mundus, Chevening, Fulbright, Swedish Institute, Swiss Government Excellence, Turkiye Burslari, and university-specific merit waivers).
3. **Scholarship Win-Strategy Calculator**:
   - URL: https://www.abroaducate.com/dashboard/scholarships
   - Features: Calculates your win probability based on GPA, research publications, work experience, and profile matching.
4. **Academic CV & Professor Cold Email Generator**:
   - URL: https://www.abroaducate.com/dashboard/cold-email
   - Features: Generates targeted cold emails to prospective PhD/Master's research supervisors with high reply rates.
5. **AI Visa Interview Simulator**:
   - URL: https://www.abroaducate.com/dashboard/visa-interview
   - Features: Interactive mock visa interview with real consular questions for USA (F-1), Germany (Student Visa), Canada (Study Permit), and UK (Student Visa) with real-time feedback on intent to return, financial sufficiency, and course justification.
6. **Cost of Living & Blocked Account Calculator**:
   - URL: https://www.abroaducate.com/calculator
   - Features: Accurate budget estimates for living costs across Germany, Austria, Portugal, Sweden, France, etc.

## STUDYING IN GERMANY & EUROPE (COMMON QUESTIONS)
- **Tuition-Free Universities**: Public universities in Germany, Austria, and parts of Europe charge €0 tuition (only a semester contribution of approx. €150–€350 including public transit).
- **German Blocked Account (Sperrkonto)**: For German student visa applications in 2026, students must deposit €11,904 into an approved blocked account (e.g. Expatrio, Coracle, or Fintiba).
- **Language Requirements**: Many master's programs are taught 100% in English (IELTS typically 6.5 or TOEFL 90). German proficiency is usually not mandatory for English-taught programs, though basic A1/A2 is helpful.
- **Application Portals**: Most German universities use Uni-Assist (https://www.uni-assist.de) or direct university portals.

## MEMBERSHIP PLANS & PRICING
- **100% Free Platform**: Abroaducate is completely free for all students worldwide. There are no credit limits, no subscription fees, and no paywalls.
- All core tools (AI SOP builder, scholarship database with 1,500+ programs, visa interview simulator, academic cold email generator, and cost calculators) are 100% accessible to any registered student at zero cost.

## SUPPORT & ESCALATION CONTACTS
- Official Support Email: hello@abroaducate.com
- Response Time: Within 24 hours.
`;

/**
 * Fetches the student's profile from Supabase using their email address.
 */
export async function getStudentProfileByEmail(email: string): Promise<StudentProfileContext> {
	if (!email || !PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		return { found: false };
	}

	try {
		const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
		const cleanEmail = email.toLowerCase().trim();

		// Check profiles table
		const { data: profile, error } = await supabase
			.from('profiles')
			.select('id, full_name, email, role, target_country, degree_level, field_of_study')
			.ilike('email', cleanEmail)
			.maybeSingle();

		if (error || !profile) {
			return { found: false };
		}

		// Check subscription status
		let subscriptionTier = 'Academic Starter';
		try {
			const { data: sub } = await supabase
				.from('user_subscriptions')
				.select('plan_id, status')
				.eq('user_id', profile.id)
				.eq('status', 'active')
				.maybeSingle();

			if (sub?.plan_id) {
				subscriptionTier = sub.plan_id.includes('pro') ? 'Academic Professional' : sub.plan_id;
			}
		} catch {
			// user_subscriptions may not exist or be empty
		}

		// Check quick profile details if available
		let targetCountry = profile.target_country;
		let studyLevel = profile.degree_level;
		let fieldOfStudy = profile.field_of_study;

		try {
			const { data: quickProfile } = await supabase
				.from('user_quick_profile')
				.select('target_country, study_level, field_of_study')
				.eq('user_id', profile.id)
				.maybeSingle();

			if (quickProfile) {
				targetCountry = quickProfile.target_country || targetCountry;
				studyLevel = quickProfile.study_level || studyLevel;
				fieldOfStudy = quickProfile.field_of_study || fieldOfStudy;
			}
		} catch {
			// Ignore if quick_profile table not used
		}

		return {
			found: true,
			userId: profile.id,
			fullName: profile.full_name || undefined,
			targetCountry: targetCountry || undefined,
			studyLevel: studyLevel || undefined,
			fieldOfStudy: fieldOfStudy || undefined,
			subscriptionTier
		};
	} catch (err) {
		console.warn('[AI_EMAIL_AGENT] Error fetching student profile:', err);
		return { found: false };
	}
}
