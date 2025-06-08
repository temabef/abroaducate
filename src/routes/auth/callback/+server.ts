import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    const {
        url,
        locals: { supabase },
    } = event;
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next');

    console.log('=== AUTH CALLBACK DEBUG ===');
    console.log('Full callback URL:', url.toString());
    console.log('Code parameter:', code ? 'present' : 'missing');
    console.log('Next parameter:', next);

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // If a 'next' URL is provided (e.g., from the login modal), redirect there.
            // This is crucial for returning the user to the submit-sop page.
            if (next) {
                console.log('Redirecting to next URL:', next);
                throw redirect(303, next);
            }
            // For any other successful login, redirect to the dashboard.
            console.log('No next URL, redirecting to dashboard');
            throw redirect(303, '/dashboard');
        } else {
            console.log('Auth error:', error);
        }
    }

    // If there's an error or no code, redirect to an error page.
    console.log('Redirecting to auth error page');
    throw redirect(303, '/auth/error');
}; 