# 🔧 Supabase Email Configuration Fix

## **Issue:**
Email authentication links are pointing to production domain instead of localhost during development.

## **Solution:**

### **1. Update Supabase Project Settings**

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **URL Configuration**
2. Update the following settings:

#### **For Development:**
```
Site URL: http://localhost:5173
Redirect URLs: 
- http://localhost:5173/auth/callback
- http://localhost:5173/dashboard
- http://localhost:5173/submit-sop
- http://localhost:5173/submit-cover-letter
- http://localhost:5173/submit-personal-statement
```

#### **For Production:**
```
Site URL: https://abroaducate.com
Redirect URLs:
- https://abroaducate.com/auth/callback
- https://abroaducate.com/dashboard
- https://abroaducate.com/submit-sop
- https://abroaducate.com/submit-cover-letter
- https://abroaducate.com/submit-personal-statement
```

### **2. Email Template Configuration**

In **Authentication** → **Email Templates**:

#### **Confirm Signup Template:**
```
Subject: Confirm your signup
Content: 
Click the link below to confirm your signup:

{{ .ConfirmationURL }}

If you didn't sign up for this account, you can safely ignore this email.
```

#### **Magic Link Template:**
```
Subject: Your magic link
Content:
Click the link below to sign in:

{{ .ConfirmationURL }}

This link will expire in 24 hours.
```

### **3. Test the Fix**

1. **Clear browser cache and cookies**
2. **Try creating a new account** at `http://localhost:5173`
3. **Check your email** for the confirmation link
4. **Click the link** - it should redirect to `http://localhost:5173/auth/callback`
5. **Verify you're logged in** and redirected to the dashboard

### **4. Alternative: Use Magic Links**

If email confirmation is still problematic, you can temporarily use magic links:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Set **Enable email confirmations** to **OFF**
4. Set **Enable magic links** to **ON**

This will send magic links instead of confirmation emails, which are more reliable for development.

### **5. Environment Variables**

Make sure your `.env.local` file has the correct Supabase URL:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## **Quick Test:**

1. Go to `http://localhost:5173`
2. Try to sign up with a new email
3. Check if the email link points to `localhost:5173` instead of `abroaducate.com`
4. Click the link and verify successful login

## **If Still Not Working:**

1. **Check Supabase logs** in the dashboard
2. **Verify email is being sent** in the Authentication → Users section
3. **Test with a different email** (sometimes email providers block certain domains)
4. **Use magic links** as a temporary workaround 