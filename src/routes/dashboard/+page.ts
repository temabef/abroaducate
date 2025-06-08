import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ parent }) => {
    const { supabase, session } = await parent();
    
    return {
        supabase,
        session
    };
}) satisfies PageLoad; 