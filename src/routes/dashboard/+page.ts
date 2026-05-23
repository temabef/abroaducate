// All data loading for the dashboard happens in +page.server.ts.
// We import supabase and session from the layout parent so
// the dashboard component can make client-side Supabase calls.
// IMPORTANT: We spread `data` to pass through ALL server-loaded data
// (profile, trackedProgramsData, savedScholarships, etc.)
import type { PageLoad } from './$types';

export const load = (async ({ parent, data }) => {
    const { supabase, session } = await parent();
    return { ...data, supabase, session };
}) satisfies PageLoad;