# 🧪 Testing the New Onboarding Flow

## 🚨 **Quick Fix for Email Confirmation Issue**

The "Error sending confirmation email" is likely due to:
1. Device fingerprinting blocking temp emails
2. Supabase email configuration pointing to production
3. Registration rate limiting

## 🛠 **3 Quick Solutions (Choose One):**

### **Option 1: Bypass Email Confirmation (Fastest for Testing)**

Run this SQL in your **Supabase Dashboard** → **SQL Editor**:

```sql
-- Method 1: Disable email confirmation requirement globally (TESTING ONLY)
UPDATE auth.config 
SET value = 'false' 
WHERE parameter = 'ENABLE_EMAIL_CONFIRMATIONS';

-- Method 2: Or manually confirm any test accounts
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL 
AND email LIKE '%temp%' OR email LIKE '%test%';
```

### **Option 2: Switch to Magic Links (Recommended)**

In **Supabase Dashboard** → **Authentication** → **Providers** → **Email**:

1. ✅ **Turn OFF**: "Enable email confirmations"
2. ✅ **Turn ON**: "Enable magic links" 
3. ✅ **Turn ON**: "Enable automatic account creation"

This will:
- Send magic links instead of confirmation emails
- Auto-login users after registration
- Bypass the email confirmation step

### **Option 3: Fix URL Configuration**

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

```
Site URL: http://localhost:5173
Redirect URLs: 
- http://localhost:5173/auth/callback
- http://localhost:5173/onboarding
- http://localhost:5173/dashboard
```

## 🧪 **Testing the Complete Onboarding Flow**

### **Step 1: Test Registration**
1. Go to your local app: `http://localhost:5173`
2. Click "Start Your Journey" or any signup CTA
3. Use a real email (avoid temp emails for now)
4. Complete registration

### **Step 2: Test Onboarding Wizard**
After successful login, you should be redirected to `/onboarding`:

1. **Step 1**: Select target countries (e.g., Canada, US)
2. **Step 2**: Enter GPA (e.g., 3.7 on 4.0 scale)
   - Should show instant conversion message
3. **Step 3**: Select field (e.g., Computer Science) and degree level
4. **Discovery**: Should show personalized results
5. **Complete**: Should redirect to enhanced dashboard

### **Step 3: Test Enhanced Dashboard**
Check for new widgets:
- ✅ "New Matches This Week" widget
- ✅ "Application Tracker" widget  
- ✅ "Profile Completion" widget
- ✅ Enhanced quick actions

### **Step 4: Test Tools Hub**
1. Navigate to `/tools`
2. Should see categorized free vs premium tools
3. Check usage limits display
4. Test upgrade prompts for premium tools

## 🐛 **If Still Having Issues:**

### **Temporarily Disable Device Fingerprinting**

Edit `src/lib/components/AuthenticationFlow.svelte` and comment out the blocking check:

```javascript
// Comment out this section temporarily:
/*
try {
    const { data: shouldBlock } = await supabase.rpc('should_block_registration', {
        p_ip_address: '0.0.0.0',
        p_email_domain: domain,
        p_device_fingerprint: deviceFingerprint
    });
    
    if (shouldBlock) {
        error = 'Email rate limit exceeded...';
        return;
    }
} catch (blockCheckError) {
    // Continue with registration
}
*/
```

### **Use Admin Override**

Run this SQL to create a test user directly:

```sql
-- Create test user bypassing all checks
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', 
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test User"}'
);
```

## ✅ **Expected Test Results**

After fixing email confirmation:

1. **Registration**: Should work without email errors
2. **Auto-Redirect**: New users automatically sent to `/onboarding` 
3. **Onboarding**: 3-step wizard with GPA conversion
4. **Dashboard**: Enhanced with 3 new widgets (after onboarding)
5. **Tools Hub**: Clear free vs premium categorization
6. **Profile**: Auto-completion tracking

## 🔄 **Updated: Onboarding Flow Now Active!**

✅ **Redirect logic implemented**: All new users will automatically go to onboarding
✅ **Works for both email and Google OAuth**: Consistent experience 
✅ **Dashboard protection**: Existing flows redirect to onboarding if needed

## 🚀 **Ready to Test**

Pick **Option 2 (Magic Links)** for the easiest testing experience. This will let you immediately test the complete onboarding flow without email confirmation issues.

Once testing is complete, you can revert to email confirmations for production.
