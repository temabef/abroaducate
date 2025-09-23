import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPostAuthRedirect } from '$lib/services/authRedirectService';

export const GET: RequestHandler = async (event) => {
    const {
        url,
        locals: { supabase },
    } = event;
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next');
    const error = url.searchParams.get('error');
    const error_description = url.searchParams.get('error_description');

    console.log('=== AUTH CALLBACK DEBUG ===');
    console.log('Full callback URL:', url.toString());
    console.log('Code parameter:', code ? 'present' : 'missing');
    console.log('Next parameter:', next);

    if (error) {
        console.log('OAuth error from provider:', error, error_description);
        // Fire a lightweight server-side analytics log (console-based)
        try { console.log('ANALYTICS: auth_oauth_failed', { error, error_description }); } catch {}
        throw redirect(303, `/auth/error?msg=${encodeURIComponent(error_description || error)}`);
    }

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // Check if user needs onboarding first
            const redirectUrl = await getPostAuthRedirect(supabase, data.session, next || '/dashboard');
            
            console.log('Auth successful, redirecting to:', redirectUrl);
            try { console.log('ANALYTICS: auth_success', { next: redirectUrl }); } catch {}
            throw redirect(303, redirectUrl);
        } else {
            console.log('Auth error:', error);
            try { console.log('ANALYTICS: auth_exchange_failed', { message: error.message }); } catch {}
            throw redirect(303, `/auth/error?msg=${encodeURIComponent(error.message || 'Auth failed')}`);
        }
    }

    // If there's an error or no code, redirect to an error page.
    console.log('Redirecting to auth error page');
    throw redirect(303, '/auth/error');
}; 