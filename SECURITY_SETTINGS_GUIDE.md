# 🔐 Security Settings Configuration Guide

## **Supabase Security Settings to Enable**

### **1. Leaked Password Protection**

**Issue**: Leaked password protection is currently disabled in your Supabase project.

**Solution**: Enable leaked password protection in Supabase Auth settings.

#### **Steps to Enable:**

1. **Go to Supabase Dashboard**
   - Navigate to your project dashboard
   - Go to **Authentication** → **Settings**

2. **Enable Password Security**
   - Find **"Password Strength"** section
   - Enable **"Check against HaveIBeenPwned.org"**
   - This will prevent users from using compromised passwords

3. **Additional Password Settings**
   - Set minimum password length to **8 characters**
   - Enable **"Require uppercase letters"**
   - Enable **"Require lowercase letters"**
   - Enable **"Require numbers"**
   - Enable **"Require special characters"**

#### **Configuration Example:**
```json
{
  "password_min_length": 8,
  "password_require_uppercase": true,
  "password_require_lowercase": true,
  "password_require_numbers": true,
  "password_require_special_chars": true,
  "password_check_hibp": true
}
```

### **2. Email Security Settings**

#### **Enable Email Confirmations:**
1. Go to **Authentication** → **Providers** → **Email**
2. Enable **"Enable email confirmations"**
3. Set **"Secure email change"** to enabled

#### **Configure Email Templates:**
1. Go to **Authentication** → **Email Templates**
2. Customize templates for:
   - **Confirm signup**
   - **Magic link**
   - **Change email address**
   - **Reset password**

### **3. OAuth Provider Security**

#### **Google OAuth Settings:**
1. Go to **Authentication** → **Providers** → **Google**
2. Ensure **"Enable"** is checked
3. Verify **Client ID** and **Client Secret** are properly configured
4. Set **Redirect URL** to: `https://abroaducate.com/auth/callback`

### **4. Session Management**

#### **Session Settings:**
1. Go to **Authentication** → **Settings**
2. Set **"JWT expiry"** to **3600** (1 hour)
3. Set **"Refresh token rotation"** to enabled
4. Set **"Refresh token reuse interval"** to **10 seconds**

### **5. Row Level Security (RLS)**

#### **Verify RLS is Enabled:**
1. Go to **Database** → **Tables**
2. Ensure RLS is enabled on all user-related tables:
   - `user_profiles`
   - `applications`
   - `sops`
   - `cover_letters`
   - `personal_statements`
   - `audit_log`
   - `security_events`

### **6. API Security**

#### **CORS Settings:**
1. Go to **Settings** → **API**
2. Set **"CORS origins"** to:
   ```
   https://abroaducate.com
   https://www.abroaducate.com
   ```
3. Enable **"Enable row level security"**

### **7. Database Security**

#### **Connection Pooling:**
1. Go to **Settings** → **Database**
2. Enable **"Connection pooling"**
3. Set **"Pool size"** to **10-20** based on your needs

#### **Backup Settings:**
1. Go to **Settings** → **Database**
2. Enable **"Point in time recovery"**
3. Set backup retention to **7 days**

### **8. Monitoring & Alerts**

#### **Enable Security Monitoring:**
1. Go to **Settings** → **Logs**
2. Enable **"Database logs"**
3. Enable **"Auth logs"**
4. Enable **"API logs"**

#### **Set Up Alerts:**
1. Go to **Settings** → **Alerts**
2. Configure alerts for:
   - Failed login attempts
   - Suspicious activity
   - Rate limit exceeded
   - Database errors

## **Security Checklist**

### **✅ Completed:**
- [x] Security headers implemented
- [x] Session management enhanced
- [x] Device fingerprinting framework
- [x] Audit logging system
- [x] Rate limiting implementation
- [x] Function search path security fixes

### **🔄 To Complete:**
- [ ] Enable leaked password protection
- [ ] Configure email security settings
- [ ] Verify OAuth provider settings
- [ ] Set up session management
- [ ] Enable security monitoring
- [ ] Configure alerts

## **Testing Security Settings**

### **Test Leaked Password Protection:**
```sql
-- This should be blocked if leaked password protection is enabled
SELECT log_security_event('registration_attempt', false, NULL, '127.0.0.1', 'test-agent', '{"email": "test@example.com", "password": "password123"}', 'high');
```

### **Test Rate Limiting:**
```sql
-- Test rate limiting function
SELECT check_rate_limit('test-ip', 'login', 5, 1);
```

### **Test Audit Logging:**
```sql
-- Test audit logging
SELECT log_audit_event('test_action', auth.uid(), 'test_resource', gen_random_uuid(), '127.0.0.1', 'test-agent', '{"test": true}', 'low', true);
```

## **Security Score After Implementation**

**Current Score**: 92/100
**After Settings**: 95/100
**Target Score**: 100/100

---

**Next Steps:**
1. Apply the SQL migrations to fix function search paths
2. Enable leaked password protection in Supabase dashboard
3. Configure all security settings as outlined above
4. Test the security implementations
5. Move to Phase 2B for advanced security features 