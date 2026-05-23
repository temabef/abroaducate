import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();

	if (!session?.user) {
		const next = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/auth?next=${next}`);
	}

	const supabase = locals.supabase;

	const [{ data: roleData }, { data: canManageAdmins }, { data: profile }] = await Promise.all([
		supabase.rpc('get_current_user_admin_role'),
		supabase.rpc('can_manage_admins_nuclear'),
		supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
	]);

	const profileRole = (profile?.role as string | null) ?? null;
	const hasAdminRole = ['admin', 'super-admin', 'scholarship-admin'].includes(profileRole ?? '');
	const isAdmin = Boolean(roleData) || Boolean(canManageAdmins) || hasAdminRole;

	if (!isAdmin) {
		throw error(403, 'Admin access required');
	}

	return {};
};
