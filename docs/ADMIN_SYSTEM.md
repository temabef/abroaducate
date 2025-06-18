# Admin System Documentation

## Overview

This document describes the centralized admin management system implemented for the Abroaducate platform. The system provides a secure, consistent way to manage admin users and their permissions across the application.

## Key Components

### 1. Database Structure

#### Admin Users Table
```sql
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

This table stores all users with admin privileges and their specific roles.

### 2. Admin Check Function

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  ) OR 
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@abroaducate.com' OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'solakolawole62@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function provides a centralized way to check if a user has admin privileges. It's used in RLS policies and can be called from the frontend.

### 3. Admin Management Functions

- `add_admin_user(email_to_add TEXT, admin_role TEXT)`: Adds a new admin user
- `remove_admin_user(email_to_remove TEXT)`: Removes admin privileges from a user

### 4. Frontend Utilities

The `adminHelper.js` file provides frontend utilities for working with the admin system:

- `isUserAdmin()`: Checks if the current user is an admin
- `addAdminUser(email, role)`: Adds a new admin user
- `removeAdminUser(email)`: Removes admin privileges from a user
- `getAdminUsers()`: Gets a list of all admin users

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

## Permission Functions

The system uses several database functions to check permissions:

- `can_manage_scholarships()`: Returns true for all admin roles
- `can_manage_admins()`: Returns true only for super-admin
- `can_access_analytics()`: Returns true for super-admin and admin
- `can_manage_content()`: Returns true for super-admin and admin
- `check_admin_access()`: General admin check (any admin role)

## Adding New Admins

Only super-admins can add new admin users. The process is:

1. Navigate to Admin > Settings
2. Enter the user's email address
3. Select the appropriate role
4. Click "Add Admin"

The user must already exist in the auth system before they can be added as an admin.

## Implementation Details

### Row Level Security (RLS) Policies

All tables with admin access use the `is_admin()` function in their RLS policies:

```sql
CREATE POLICY "Admin policy name"
  ON public.table_name
  FOR ALL
  USING (public.is_admin());
```

### Frontend Admin Check

Frontend components check admin status using the `isUserAdmin()` function:

```javascript
import { isUserAdmin } from '$lib/utils/adminHelper';

let isAdmin = false;

onMount(async () => {
  if (session?.user) {
    isAdmin = await isUserAdmin();
  }
});
```

## Admin Settings Page

The admin settings page (`/admin/settings`) provides a UI for managing admin users. It allows:

- Viewing all current admin users
- Adding new admin users with specific roles
- Removing admin privileges from users

## Migration Path

The system includes a transition period where both the new centralized admin check and legacy email-based checks are used. This ensures backward compatibility while moving to the new system.

## Security Considerations

- The `is_admin()` function uses `SECURITY DEFINER` to ensure it always runs with the privileges of the function creator
- RLS policies ensure that only super admins can manage the admin users table
- The system maintains the existing super admin emails as a fallback

## Future Enhancements

- Permission-based access control for more granular permissions
- Admin activity logging
- Role-specific admin dashboards

## Troubleshooting

If a user cannot access admin features:

1. Check if they exist in the `admin_users` table
2. Verify their role is set correctly
3. Use the debug page at `/admin-debug/auth-check` to see detailed permission information
4. Run the latest migration to ensure all permission functions are up to date 