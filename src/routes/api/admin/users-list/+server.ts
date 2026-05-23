import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession();
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const supabase = locals.supabase;

		// Use DB role checks, then fall back to profile role.
		const [{ data: roleData }, { data: canManageAdmins }] = await Promise.all([
			supabase.rpc('get_current_user_admin_role'),
			supabase.rpc('can_manage_admins_nuclear')
		]);

		const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.maybeSingle();

		const profileRole = (profile?.role as string | null) ?? null;
		const hasAdminRole = ['admin', 'super-admin'].includes(profileRole ?? '');
		const isAdmin = Boolean(roleData) || Boolean(canManageAdmins) || hasAdminRole;

		if (!isAdmin) {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		const { data: users, error } = await supabase
			.from('profiles')
			.select(
				'id, email, full_name, created_at, updated_at, role, subscription_status, newsletter_subscribed'
			)
			.order('created_at', { ascending: false })
			.limit(100);

		if (error) {
			console.error('Error fetching users list:', error);
			return json({ error: 'Failed to fetch users' }, { status: 500 });
		}

		return json({ users: users ?? [] });
	} catch (error) {
		console.error('Error in users-list API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
