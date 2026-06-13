# Turnstile Widget Race Condition Fix

## Problem Identified

The Turnstile widget was **inconsistently loading** due to a race condition:
- Sometimes the widget appeared, sometimes it didn't
- Issue occurred both locally and in production
- Problem: Script loading timing was unpredictable

### Root Causes
1. **Script load timing**: The widget div existed before the Turnstile API was ready
2. **No retry mechanism**: If timing was off, the widget simply didn't render
3. **Auto-render conflict**: Using `data-*` attributes with manual rendering caused conflicts
4. **Navigation caching**: SvelteKit's client-side routing kept old script references

## Solution Implemented

### 1. **Explicit Rendering with Retry Logic**
- Removed auto-render `data-*` attributes
- Switched to programmatic rendering using `turnstile.render()`
- Added retry mechanism (up to 3 attempts with delays)
- Widget now waits for API to be ready before rendering

### 2. **Better Script Management**
- Check if script already exists before adding
- Use `render=explicit` parameter to prevent auto-rendering
- Use `onload` callback to know when API is ready
- Add error handling for script load failures

### 3. **Improved State Tracking**
- Added `turnstileLoaded` state
- Track retry attempts with `turnstileRetries`
- Show helpful message when widget is loading
- Better console logging for debugging

### 4. **Robust Reset Logic**
- Clear widget HTML before re-rendering
- Catch reset errors and re-render if needed
- Use selector-based reset (`#turnstile-widget`)

## Key Changes Made

**File: `src/routes/contact/+page.svelte`**

### Before (Unreliable)
```svelte
<div 
  class="cf-turnstile" 
  data-sitekey={PUBLIC_TURNSTILE_SITE_KEY}
  data-callback="onTurnstileSuccess"
></div>

<script>
onMount(() => {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
  document.head.appendChild(script);
});
</script>
```

### After (Reliable)
```svelte
<div id="turnstile-widget" bind:this={turnstileDiv}></div>

<script>
function tryRenderTurnstile() {
  if ((window as any).turnstile && turnstileDiv) {
    turnstileDiv.innerHTML = '';
    (window as any).turnstile.render('#turnstile-widget', {
      sitekey: PUBLIC_TURNSTILE_SITE_KEY,
      callback: 'onTurnstileSuccess',
      theme: 'light'
    });
  } else {
    setTimeout(tryRenderTurnstile, 500); // Retry
  }
}

onMount(() => {
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
  
  (window as any).onTurnstileLoad = () => {
    setTimeout(tryRenderTurnstile, 100);
  };
  
  document.head.appendChild(script);
});
</script>
```

## Testing

### Local Testing
1. Restart dev server: `npm run dev`
2. Visit `/contact` multiple times
3. Try different browsers and incognito mode
4. Check browser console for logs:
   - "Turnstile script loaded"
   - "Turnstile widget rendered successfully"

### Production Testing
1. Deploy to production
2. Test on `https://abroaducate.com/contact`
3. Try multiple page loads and refreshes
4. Widget should appear every time within 1-2 seconds

## Expected Behavior

✅ **Widget loads consistently** every time  
✅ **Retry mechanism** handles slow connections  
✅ **Error messages** inform user if loading fails  
✅ **Console logs** help with debugging  
✅ **Submit button** only enables after widget loads  

## Troubleshooting

### If widget still doesn't appear:

1. **Check environment variables** in Vercel:
   - `PUBLIC_TURNSTILE_SITE_KEY` must be set
   - Must be in all environments (Production, Preview, Development)

2. **Check browser console** for errors:
   - Network errors loading script
   - API key validation errors
   - JavaScript errors

3. **Verify domain in Cloudflare**:
   - Go to Turnstile dashboard
   - Check widget settings
   - Ensure your domain is in the hostname list

4. **Check Cloudflare status**:
   - Visit https://www.cloudflarestatus.com/
   - Turnstile service might be down

### Debug Mode

To enable detailed logging, open browser console and run:
```javascript
localStorage.setItem('turnstile_debug', 'true');
```

Then refresh the page and check console for detailed Turnstile logs.

## Monitoring

Watch for these in production:
- **Email spam volume** — should drop to near-zero within 24 hours
- **Contact form submissions** — legitimate submissions should still work
- **User reports** — users having trouble submitting the form

If legitimate users report issues, you can temporarily:
1. Make the widget optional (comment out the `disabled={!turnstileToken}` check)
2. Add a bypass code for known users
3. Switch to "Non-interactive" mode in Cloudflare (invisible verification)

## Rollback Plan

If this causes major issues:

1. **Quick fix** — Remove Turnstile requirement:
   ```svelte
   <!-- Change: -->
   <button disabled={submitting || !turnstileToken}>
   <!-- To: -->
   <button disabled={submitting}>
   ```

2. **Full rollback** — Revert to previous commit:
   ```bash
   git revert HEAD
   git push origin master
   ```

3. **Alternative** — Use honeypot field instead (see `CONTACT_FORM_SPAM_SOLUTION.md`)
