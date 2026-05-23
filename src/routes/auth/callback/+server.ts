import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPostAuthRedirect } from '$lib/services/authRedirectService';
import { sendEmail } from '$lib/server/email.server';

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
        try { console.log('ANALYTICS: auth_oauth_failed', { error, error_description }); } catch {}
        throw redirect(303, `/auth/error?msg=${encodeURIComponent(error_description || error)}`);
    }

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const userId = data.session?.user?.id;
            const userEmail = data.session?.user?.email;

            // Detect new users — no user_profiles row yet
            if (userId && userEmail) {
                try {
                    const { data: existingProfile } = await supabase
                        .from('user_profiles')
                        .select('user_id')
                        .eq('user_id', userId)
                        .maybeSingle();

                    if (!existingProfile) {
                        // Brand new user — create profile with 3 credits and send welcome email

                        // Create user_profiles row with 3 free credits
                        await supabase
                            .from('user_profiles')
                            .insert({
                                user_id: userId,
                                credits: 3,
                                workspace_data: {}
                            })
                            .catch(e => console.error('[CALLBACK] Failed to create user_profiles:', e));

                        // Send welcome email (fire-and-forget)
                        sendEmail({
                            to: userEmail,
                            subject: 'Welcome to Abroaducate — your 3 free credits are ready',
                            html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}.wrap{max-width:600px;margin:0 auto;background:#f1f5f9;padding:32px 16px}.card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}.header{background:#0f172a;padding:28px 32px;text-align:center}.logo{color:#fff;font-size:22px;font-weight:800;letter-spacing:-.5px;margin:0}.sub{color:#94a3b8;font-size:13px;margin:4px 0 0}.body{padding:32px}.footer{padding:16px 32px;text-align:center}.footer a{color:#64748b;font-size:12px;text-decoration:none}h1{color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px}p{color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px}.divider{border:none;border-top:1px solid #e2e8f0;margin:24px 0}.btn{display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none}.feature-row{background:#f8fafc;border-radius:8px;padding:4px 16px;margin:24px 0}table{width:100%;border-collapse:collapse}td{padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top}.icon-cell{width:28px;padding-right:12px}.label{font-weight:700;color:#0f172a;font-size:14px}.desc{color:#64748b;font-size:13px}.badge{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px}.free{background:#f0fdf4;color:#16a34a}.credit{background:#f1f5f9;color:#64748b}</style>
</head><body><div class="wrap"><div class="card">
<div class="header"><p class="logo">Abroaducate</p><p class="sub">Your study abroad strategy platform</p></div>
<div class="body">
<h1>Welcome — you're all set</h1>
<p>You've joined 5,000+ students using Abroaducate to find low-tuition programs and scholarships across Europe. You have <strong>3 free credits</strong> to get started.</p>
<div class="feature-row"><table>
<tr><td class="icon-cell" style="color:#f97316;font-size:18px;">&#9679;</td><td><span class="label">Browse 2,500+ programs</span><br><span class="desc">Filter by country, field, and tuition.</span></td><td style="text-align:right"><span class="badge free">Free</span></td></tr>
<tr><td class="icon-cell" style="color:#f97316;font-size:18px;">&#9679;</td><td><span class="label">Scholarship matching</span><br><span class="desc">Every program shows matched scholarships automatically.</span></td><td style="text-align:right"><span class="badge free">Free</span></td></tr>
<tr><td class="icon-cell" style="color:#f97316;font-size:18px;">&#9679;</td><td><span class="label">Right-Fit AI Check</span><br><span class="desc">See how competitive you are for any program.</span></td><td style="text-align:right"><span class="badge credit">1 credit</span></td></tr>
<tr><td class="icon-cell" style="color:#f97316;font-size:18px;" style="border:none">&#9679;</td><td style="border:none"><span class="label">Generate documents</span><br><span class="desc">SOP, cover letter, personal statement, academic CV.</span></td><td style="text-align:right;border:none"><span class="badge credit">2 credits</span></td></tr>
</table></div>
<p style="color:#64748b;font-size:13px;">Credits are only spent on AI-powered features. Browsing programs and scholarships is always free.</p>
<hr class="divider">
<div style="text-align:center"><a href="https://abroaducate.com/programs" class="btn">Find your program</a></div>
</div>
<div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
<p style="color:#64748b;font-size:13px;margin:0">Questions? Reply to this email — we read every one.</p>
</div>
<div class="footer"><a href="https://abroaducate.com/settings">Manage email preferences</a> &middot; <a href="https://abroaducate.com">abroaducate.com</a></div>
</div></div></body></html>`,
                            text: `Welcome to Abroaducate!\n\nYou have 3 free credits to get started.\n\nWhat you can do:\n- Browse 2,500+ programs (free)\n- Scholarship matching (free)\n- Right-Fit AI Check (1 credit)\n- Generate documents (2 credits)\n\nGet started: https://abroaducate.com/programs\n\nQuestions? Reply to this email.`
                        }).catch(e => console.error('[WELCOME EMAIL] Failed:', e));
                    }
                } catch (e) {
                    // Non-fatal — don't block the redirect
                    console.error('[WELCOME EMAIL] Profile check failed:', e);
                }
            }

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

    console.log('Redirecting to auth error page');
    throw redirect(303, '/auth/error');
}; 