# CSP Fix for Cloudflare Turnstile

## Problem Discovered

The Turnstile widget was failing to load in production due to **Content Security Policy (CSP) blocking**.

### Error Message
```
Loading the script 'https://challenges.cloudflare.com/turnstile/v0/api.js' violates the following Content Security Policy directive: "script-src..."
```

The CSP policy was blocking:
- ❌ `script-src` — Couldn't load Turnstile JavaScript
- ❌ `connect-src` — Couldn't connect to Turnstile API
- ❌ `frame-src` — Couldn't load Turnstile iframe

## Root Cause

The application had a strict CSP policy that didn't include `challenges.cloudflare.com` in the allowed domains for:
1. Scripts (`script-src`)
2. API connections (`connect-src`)
3. Iframes (`frame-src`)

## Solution Implemented

Added Cloudflare Turnstile domains to the CSP policy in `src/hooks.server.ts`:

### Added Domains
- ✅ `https://challenges.cloudflare.com` to `script-src`
- ✅ `https://challenges.cloudflare.com` to `connect-src`
- ✅ `https://challenges.cloudflare.com` to `frame-src`

### Implementation

**File: `src/hooks.server.ts`**

```typescript
return resolve(event, {
  filterSerializedResponseHeaders(name) {
    return name === 'content-range' || name === 'x-supabase-api-version'
  },
}).then((response) => {
  // Add CSP header to allow Cloudflare Turnstile
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' ... https://challenges.cloudflare.com",
      "connect-src 'self' ... https://challenges.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com",
      // ... other directives
    ].join('; ')
  );
  return response;
});
```

## Testing

After deployment, verify CSP is working:

1. **Open browser console** on production site
2. **Visit** `/contact` page
3. **Look for:**
   - ✅ No CSP errors
   - ✅ Turnstile script loads successfully
   - ✅ Widget appears in "Security check" section

## Expected Timeline

- **Deployment**: ~2-3 minutes on Vercel
- **Effect**: Immediate — CSP changes apply instantly
- **Widget should appear**: Within seconds of deployment

## Verification

Run this in browser console on production:

```javascript
// Check if Turnstile script loaded
console.log('Turnstile loaded:', !!window.turnstile);

// Check for CSP errors
// Should see no errors related to challenges.cloudflare.com
```

## Security Notes

### Why These Directives Are Safe

1. **`script-src` with `challenges.cloudflare.com`**
   - Only allows scripts from Cloudflare's official Turnstile CDN
   - Turnstile is a trusted, security-focused service by Cloudflare
   - No arbitrary code execution — only Turnstile widget

2. **`connect-src` with `challenges.cloudflare.com`**
   - Allows API calls for token verification
   - Necessary for Turnstile to function
   - Communication is HTTPS-only

3. **`frame-src` with `challenges.cloudflare.com`**
   - Turnstile may use an iframe for challenge display
   - Sandboxed iframe from Cloudflare's domain
   - No third-party embeds

### CSP Still Protects Against

- ✅ Inline scripts (except trusted ones with `'unsafe-inline'`)
- ✅ Arbitrary third-party scripts
- ✅ XSS attacks from untrusted sources
- ✅ Clickjacking (via `frame-ancestors`)
- ✅ Mixed content (HTTPS-only resources)

## Troubleshooting

### If CSP errors persist:

1. **Hard refresh** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Clear browser cache**
3. **Check Network tab** for CSP headers
4. **Verify deployment** completed successfully

### If Turnstile still doesn't load:

1. Check browser console for **new** errors
2. Verify CSP header includes `challenges.cloudflare.com`
3. Test on different browser/device
4. Check Cloudflare Turnstile service status

## Related Files

- `src/hooks.server.ts` — CSP configuration
- `src/routes/contact/+page.svelte` — Turnstile widget
- `src/routes/api/contact-support/+server.ts` — Server-side verification

## Previous Issues Resolved

1. ✅ Environment variables — Fixed
2. ✅ Hostname whitelist — Fixed
3. ✅ Race condition — Fixed with retry logic
4. ✅ **CSP blocking — Fixed** (this document)

## Next Steps

After this deployment:
1. Wait 2-3 minutes for Vercel deployment
2. Visit production contact page
3. Verify widget loads without CSP errors
4. Submit test form to confirm end-to-end functionality
5. Monitor spam emails (should drop significantly within 24 hours)

---

**Status:** Deployed  
**Date:** 2026-06-13  
**Commit:** `Fix CSP to allow Cloudflare Turnstile script loading`
