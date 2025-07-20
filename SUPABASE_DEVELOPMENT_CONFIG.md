# 🔧 **Supabase Development Configuration**

## **Issue:**
- Email links pointing to production domain instead of localhost
- No auto-login after registration
- Account creation not working properly in development

## **Solution:**

### **1. Supabase Project Settings**

Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration**

#### **For Development (Temporary):**
```
Site URL: http://localhost:5173
Redirect URLs: 
- http://localhost:5173/auth/callback
- http://localhost:5173/dashboard
- http://localhost:5173/submit-sop
- http://localhost:5173/submit-cover-letter
- http://localhost:5173/submit-personal-statement
```

#### **For Production (Keep as is):**
```
Site URL: https://abroaducate.com
Redirect URLs:
- https://abroaducate.com/auth/callback
- https://abroaducate.com/dashboard
- https://abroaducate.com/submit-sop
- https://abroaducate.com/submit-cover-letter
- https://abroaducate.com/submit-personal-statement
```

### **2. Email Templates**

In **Authentication** → **Email Templates**:

#### **Confirm Signup Template:**
```
Subject: Confirm your signup
Content: 
Click the link below to confirm your signup:

{{ .ConfirmationURL }}

If you didn't sign up for this account, you can safely ignore this email.
```

### **3. Alternative: Use Magic Links (Recommended for Development)**

1. Go to **Authentication** → **Providers** → **Email**
2. **Turn OFF** "Enable email confirmations"
3. **Turn ON** "Enable magic links"

This will:
- ✅ **Enable auto-login** after registration
- ✅ **Send magic links** instead of confirmation emails
- ✅ **Work immediately** without email verification
- ✅ **Not affect production** (you can switch back later)

### **4. Test the Fix**

1. **Clear browser cache and cookies**
2. **Try creating a new account** at `http://localhost:5173`
3. **Check if auto-login works** (with magic links enabled)
4. **Verify email links** point to localhost (with email confirmations)

### **5. Production Safety**

**Important:** After testing, remember to:
1. **Switch back to production URLs** for deployment
2. **Re-enable email confirmations** for production security
3. **Test production deployment** to ensure everything works

## **Quick Test:**

1. Enable magic links in Supabase
2. Try account creation at `localhost:5173`
3. Should auto-login immediately
4. No email verification required for development

## **Why This Works:**

- **Magic links** bypass email confirmation
- **Auto-login** works immediately after registration
- **Development URLs** are used for local testing
- **Production remains unaffected** when you switch back 