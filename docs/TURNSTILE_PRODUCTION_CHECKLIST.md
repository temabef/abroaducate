# Turnstile Production Troubleshooting Checklist

## Issue: Widget works locally but not in production

### Step 1: Check Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Select your **abroaducate** project
3. Go to **Settings** → **Environment Variables**
4. Verify these two variables exist:

   ✅ `PUBLIC_TURNSTILE_SITE_KEY`
   - Value should be: `0x4AAAAAADkCMjugixsEMUM4`
   - Must be checked for: Production, Preview, Development
   
   ✅ `TURNSTILE_SECRET_KEY`
   - Value should be: `0x4AAAAAADkCMnxbDVYXLVCqs755sj_7I8o`
   - Must be checked for: Production, Preview, Development

**If missing or incorrect**: Update them and **redeploy**

### Step 2: Verify API Key Configuration

Once deployed, visit this diagnostic endpoint:

https://abroaducate.com/api/debug-turnstile

Expected response:
```json
{
  "hasPublicKey": true,
  "hasSecretKey": true,
  "publicKeyLength": 26,
  "secretKeyLength": 43,
  "publicKeyPrefix": "0x4AAAAAAA",
  "environment": "production",
  "timestamp": "2026-06-13T..."
}
```

**If `hasPublicKey: false`**: The environment variable isn't set in Vercel
**If `publicKeyPrefix` is wrong**: The wrong key was entered

### Step 3: Check Cloudflare Turnstile Domain Whitelist

1. Go to https://dash.cloudflare.com/?to=/:account/turnstile
2. Click on your "Abroaducate Contact Form" widget
3. Under **Domains**, verify these are listed:
   - `localhost`
   - `abroaducate.com`
   - `www.abroaducate.com`
   - `*.vercel.app` (for preview deployments)

**If domain is missing**: Click "Edit" and add it

### Step 4: Check Browser Console on Production

Visit https://abroaducate.com/contact and open browser console (F12)

**Look for these logs:**

✅ **Good signs:**
```
Turnstile script loaded
Attempting to render Turnstile, attempt: 1
PUBLIC_TURNSTILE_SITE_KEY: Present
Turnstile API available: true
Turnstile div exists: true
Rendering with sitekey: 0x4AAAAAAA...
Turnstile widget rendered successfully
```

❌ **Bad signs and solutions:**

**Error: "PUBLIC_TURNSTILE_SITE_KEY: MISSING"**
→ Environment variable not set in Vercel (see Step 1)

**Error: "Failed to load script"**
→ Network issue or Cloudflare Turnstile is down
→ Check https://www.cloudflarestatus.com/

**Error: "Invalid site key"**
→ Wrong key entered or domain not whitelisted (see Step 3)

**Error: "Turnstile API available: false"**
→ Script failed to load
→ Check Network tab for 404 or CORS errors

### Step 5: Check Network Tab

In browser console, go to **Network** tab and reload:

1. Look for request to `challenges.cloudflare.com/turnstile/v0/api.js`
2. Status should be **200 OK**
3. If **404**: Script URL might be wrong
4. If **CORS error**: Domain issue with Cloudflare

### Step 6: Test Widget Directly

Open browser console and run:
```javascript
// Check if environment variable is accessible
fetch('/api/debug-turnstile')
  .then(r => r.json())
  .then(console.log);

// Check if Turnstile API loaded
console.log('Turnstile loaded:', !!window.turnstile);

// Try manual render (if API is loaded)
if (window.turnstile) {
  window.turnstile.render('#turnstile-widget', {
    sitekey: '0x4AAAAAADkCMjugixsEMUM4',
    callback: (token) => console.log('Success:', token),
    'error-callback': (err) => console.error('Error:', err)
  });
}
```

## Common Solutions

### Solution 1: Environment Variables Not Set
```bash
# Via Vercel Dashboard
1. Go to Settings → Environment Variables
2. Add PUBLIC_TURNSTILE_SITE_KEY
3. Add TURNSTILE_SECRET_KEY
4. Select all environments (Production, Preview, Development)
5. Redeploy
```

### Solution 2: Domain Not Whitelisted
```
1. Go to Cloudflare Turnstile dashboard
2. Edit widget
3. Add domain: abroaducate.com
4. Add domain: www.abroaducate.com
5. Save
6. Wait 1-2 minutes for propagation
7. Clear browser cache and test
```

### Solution 3: Wrong API Keys
```
1. Go to Cloudflare Turnstile dashboard
2. Click your widget
3. Copy Site Key and Secret Key
4. Update in Vercel environment variables
5. Redeploy
```

### Solution 4: Clear Vercel Build Cache
```bash
# Sometimes Vercel caches old environment variables
1. Go to Vercel Deployments
2. Click "..." menu
3. Click "Redeploy"
4. Check "Use existing Build Cache" to be UNCHECKED
5. Redeploy
```

## Expected Timeline

After fixing:
- **Environment variables**: Takes effect immediately on next deployment
- **Domain whitelist**: Propagates in 1-2 minutes
- **New deployment**: Usually 2-3 minutes

## Fallback Plan

If widget still doesn't work after all troubleshooting, you can temporarily make it optional:

**File: `src/routes/contact/+page.svelte`**
```svelte
<!-- Change line: -->
<button type="submit" disabled={submitting || !turnstileToken}>

<!-- To: -->
<button type="submit" disabled={submitting}>

<!-- This allows form submissions without Turnstile verification -->
<!-- But spam protection is lost -->
```

Then implement alternative protection:
1. Honeypot field (see CONTACT_FORM_SPAM_SOLUTION.md)
2. Stricter rate limiting
3. Content analysis for gibberish detection

## Need More Help?

1. Share screenshot of `/api/debug-turnstile` response
2. Share browser console logs from production
3. Share Vercel environment variables screenshot (hide values)
4. Share Cloudflare Turnstile domain list screenshot
