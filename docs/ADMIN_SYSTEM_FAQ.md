# Admin System FAQ

## What's the difference between Standard Admin and Scholarship Admin?

**Standard Admin (role = 'admin')**
- Can manage scholarships
- Can manage other content (university data, application templates, etc.)
- Can view analytics and statistics
- **Cannot** manage other admin users (this is restricted to super-admins)

**Scholarship Admin (role = 'scholarship-admin')**
- **Only** has access to scholarship management
- Cannot access analytics, content management, or other admin features
- Designed for team members who only need to manage scholarships

## Is the Standard Admin role necessary?

Yes, the Standard Admin role serves an important purpose in the permission hierarchy:

1. **Super-Admin**: Full system access including managing other admins
2. **Admin**: Content managers who need broad access but shouldn't manage other admins
3. **Scholarship-Admin**: Limited to scholarship management only

The Standard Admin is useful for team members who need to manage multiple aspects of the site (not just scholarships) but shouldn't have the ability to add/remove other admins.

## What content can Standard Admins manage besides scholarships?

Standard Admins can manage:
- University data and information
- Application templates
- Content pages
- System settings (except admin user management)
- Analytics and reporting

## Why can Standard Admins still see the Admin Users page?

This is a bug that we've fixed in the latest update. Standard Admins should not be able to see the "Remove" button or manage other admins. The updated settings page now checks for the `can_manage_admins()` permission before showing these options.

## What does the "Total Users" counter show?

The "Total Users" counter on the admin dashboard shows the total number of registered users in the system (from the `profiles` table). It counts all users who have created accounts, not just those who have visited specific pages.

If you're seeing zero users, there might be one of these issues:
1. The query is looking at the wrong table
2. The permission to view this data is missing
3. There genuinely are no users in the system yet

## Why aren't users showing up when clicking on the users section?

The user list view may not be properly implemented yet. The dashboard shows the count from the database, but the detailed user list view might need additional development. This is a feature that could be added in a future update.

## Do I need to run migrations locally if I'm already running them in Supabase?

No, you don't need to run migrations locally if you've already applied them directly in the Supabase dashboard. The migrations are just SQL scripts that need to be executed once in your database.

You have two options:
1. Run migrations through the Supabase dashboard (SQL Editor)
2. Run migrations locally using the Supabase CLI

Either approach works, but don't do both as it would try to apply the same changes twice.

## What files can I safely delete?

You can safely delete:

1. **Duplicate SQL files**: Keep only the most recent version of each migration
   - For example, if you have `fix_admin_system.sql`, `fix_admin_system_updated.sql`, and `fix_admin_system_final.sql`, you only need to keep the final version

2. **Debug pages**: Most of the pages in `/admin-debug/` except for `/admin-debug/auth-check/` which is useful for troubleshooting

3. **Test files**: Any files with "test" in their name that were created for testing purposes

4. **Old migration scripts**: Once migrations have been applied to your production database, the local script files are no longer needed 