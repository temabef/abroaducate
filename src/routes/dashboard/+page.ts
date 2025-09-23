import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
    const { supabase, session } = await parent();
    
    // Allow users to access dashboard regardless of onboarding status
    // ProfileCompletionWidget will guide them to complete missing fields
    
    return {
        supabase,
        session
    };
}) satisfies PageLoad; 