# Admin System Summary

## Admin Roles and Permissions

The admin system has three distinct roles with different permission levels:

### 1. Super-Admin
- **Full access** to all admin features
- Can add/remove other admins
- Can manage system settings
- Can manage scholarships and content
- Can view analytics
- Function check: `can_manage_admins()`

### 2. Admin
- Can manage scholarships and content
- Can view analytics
- **Cannot** manage other admins
- Function check: `can_manage_content()` and `can_access_analytics()`

### 3. Scholarship-Admin
- **Limited access** to scholarship management only
- Cannot access other admin features
- Function check: `can_manage_scholarships()`

## Key Components

1. **Admin Dashboard** (`/admin/+page.svelte`)
   - Shows stats (users, scholarships, applications)
   - Explains admin roles
   - Shows quick actions based on permissions

2. **Admin Settings** (`/admin/settings/+page.svelte`)
   - Manage admin users (add/remove/change roles)
   - Only super-admins can manage other admins

3. **Scholarships Management** (`/admin/scholarships/+page.svelte`)
   - Add/edit/delete scholarships
   - Now includes pagination
   - Text-based entry alongside CSV import

4. **Permission Functions** (SQL)
   - `can_manage_scholarships()`
   - `can_manage_admins()`
   - `can_access_analytics()`
   - `can_manage_content()`

## Required SQL Migrations

To complete the setup, run these SQL migrations in your Supabase dashboard:

1. **Admin Role Permissions** (`20240626000000_admin_role_permissions.sql`)
   ```sql
   -- Enforce proper role-based permissions for admin users
   
   -- First, update the can_manage_scholarships function to allow all admin roles to manage scholarships
   CREATE OR REPLACE FUNCTION public.can_manage_scholarships()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.admin_users
       WHERE user_id = auth.uid()
       AND (role = 'super-admin' OR role = 'admin' OR role = 'scholarship-admin')
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   -- Create a function to check if user can manage other admins (super-admin only)
   CREATE OR REPLACE FUNCTION public.can_manage_admins()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.admin_users
       WHERE user_id = auth.uid()
       AND role = 'super-admin'
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   -- Create a function to check if user can access analytics (super-admin and admin)
   CREATE OR REPLACE FUNCTION public.can_access_analytics()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.admin_users
       WHERE user_id = auth.uid()
       AND (role = 'super-admin' OR role = 'admin')
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   -- Create a function to check if user can manage content (super-admin and admin)
   CREATE OR REPLACE FUNCTION public.can_manage_content()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.admin_users
       WHERE user_id = auth.uid()
       AND (role = 'super-admin' OR role = 'admin')
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

## Debug Pages

For troubleshooting, we've created:

- `/admin-debug/auth-check/+page.svelte`: Verifies admin permissions

## Next Steps

1. Run the SQL migrations in your Supabase dashboard
2. Test each admin role to ensure proper permissions:
   - Super-admin should see all options
   - Admin should see everything except admin management
   - Scholarship-admin should only see scholarship management

## Cleanup (Optional)

You can safely delete these files if not needed:
- Various debug pages in `/admin-debug/` (except auth-check)
- Old SQL migration files that were superseded by newer ones
- Temporary test files

## Adding New Admins

Use the admin settings page to add new admins. You no longer need to run SQL scripts directly for this purpose. 