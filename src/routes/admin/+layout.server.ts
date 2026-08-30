import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/auth?next=${next}`);
	}

	const supabase = locals.supabase;

	// Check admin status directly from profiles table
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.maybeSingle();

	const profileRole = (profile?.role as string | null) ?? null;
	const hasAdminRole = ['admin', 'super-admin', 'scholarship-admin'].includes(profileRole ?? '');

	let isAdmin = hasAdminRole;

	// Fallback to RPC only if not already verified
	if (!isAdmin) {
		try {
			const { data: roleData } = await supabase.rpc('get_current_user_admin_role');
			if (roleData) {
				isAdmin = true;
			}
		} catch {
			// Ignore RPC error
		}
	}

	if (!isAdmin) {
		throw error(403, 'Admin access required');
	}

	return {
		adminRole: profileRole || 'admin'
	};
};
