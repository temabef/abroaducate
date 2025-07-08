# 🚀 WordPress to SvelteKit Migration Guide

Complete step-by-step guide for migrating your Abroaducate platform from WordPress to SvelteKit while maintaining SEO rankings and analytics.

## 📋 Pre-Migration Checklist

### 1. **Backup Current WordPress Site**
- [ ] Full database backup
- [ ] Files backup (wp-content, themes, plugins)
- [ ] Export analytics data
- [ ] Document current URL structure
- [ ] List all important pages and redirects needed

### 2. **Gather Current Analytics & Tracking IDs**
- [ ] Google Analytics tracking ID (GA4 Measurement ID)
- [ ] Google Search Console property verification
- [ ] Google Tag Manager container ID (if used)
- [ ] Facebook Pixel ID (if used)
- [ ] Other tracking codes (LinkedIn, Twitter, etc.)

---

## 🌐 DNS & Domain Setup

### Step 1: Prepare SvelteKit Deployment
```bash
# Build your SvelteKit app
npm run build

# Test locally first
npm run preview
```

### Step 2: DNS Configuration Options

#### Option A: Direct Domain Switch (Recommended)
1. **Deploy SvelteKit to hosting provider** (Vercel, Netlify, etc.)
2. **Update DNS A records:**
   ```
   Type: A
   Name: @
   Value: [Your hosting provider's IP]
   TTL: 300 (5 minutes for quick propagation)
   ```
3. **Update CNAME for www:**
   ```
   Type: CNAME
   Name: www
   Value: your-domain.com
   TTL: 300
   ```

#### Option B: Subdomain Testing First
1. **Create staging subdomain:**
   ```
   Type: CNAME
   Name: new
   Value: your-sveltekit-deployment.vercel.app
   TTL: 300
   ```
2. **Test at `new.yourdomain.com`**
3. **Switch main domain when ready**

### Step 3: SSL Certificate
- Most hosting providers (Vercel, Netlify) provide automatic SSL
- Verify HTTPS is working before DNS switch

---

## 📊 Google Analytics 4 Setup

### Step 1: Get Your GA4 Measurement ID
1. Go to [Google Analytics](https://analytics.google.com)
2. Navigate to Admin → Property → Data Streams
3. Copy your Measurement ID (format: `G-XXXXXXXXXX`)

### Step 2: Add Google Analytics to SvelteKit

#### Method A: Using gtag (Recommended)
Create `src/lib/analytics.ts`:
```typescript
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // Replace with your ID

// Initialize GA
export function initGA() {
  if (typeof window !== 'undefined') {
    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}
```

#### Method B: Add to `app.html` (Simpler)
Add to your `src/app.html` in the `<head>` section:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 3: Track Page Navigation in SvelteKit
Add to your `src/routes/+layout.svelte`:
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { initGA, trackPageView } from '$lib/analytics';

  onMount(() => {
    initGA();
  });

  // Track route changes
  $: if ($page.url.pathname) {
    trackPageView($page.url.pathname);
  }
</script>
```

---

## 🔍 Google Search Console Setup

### Step 1: Verify New Domain
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property for your domain
3. **Verification options:**
   - **HTML file upload** (add to `static/` folder)
   - **HTML meta tag** (add to `app.html`)
   - **DNS record** (recommended for domain-level verification)

### Step 2: DNS Verification (Recommended)
Add TXT record to your DNS:
```
Type: TXT
Name: @
Value: google-site-verification=YOUR-VERIFICATION-CODE
TTL: 300
```

### Step 3: Submit New Sitemap
1. Your SvelteKit sitemap is available at: `https://yourdomain.com/sitemap.xml`
2. In Search Console → Sitemaps → Add new sitemap
3. Submit: `sitemap.xml`

---

## 🔄 URL Redirects & SEO Preservation

### Step 1: Plan URL Structure Mapping
Document your WordPress → SvelteKit URL mapping:
```
WordPress URL              → SvelteKit URL
/blog/post-name/          → /blog/post-name (if keeping blog)
/page-name/               → /page-name
/category/something/      → /category/something
```

### Step 2: Implement Redirects

#### Option A: Server-Side Redirects (Best for SEO)
If using Vercel, create `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/old-wordpress-page",
      "destination": "/new-sveltekit-page",
      "permanent": true
    },
    {
      "source": "/blog/:slug",
      "destination": "/articles/:slug",
      "permanent": true
    }
  ]
}
```

#### Option B: Client-Side Redirects in SvelteKit
Create `src/routes/old-page/+page.svelte`:
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    goto('/new-page', { replaceState: true });
  });
</script>
```

### Step 3: WordPress .htaccess Backup
Before switching, save your WordPress `.htaccess` redirects and convert them to your new hosting platform's format.

---

## 🛠️ Additional Tracking Setup

### Google Tag Manager (Optional but Recommended)
1. **Create GTM container** at [tagmanager.google.com](https://tagmanager.google.com)
2. **Add GTM to `app.html`:**
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```
3. **Add noscript tag to `app.html` body:**
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### Facebook Pixel (If Used)
Add to `app.html`:
```html
<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR-PIXEL-ID');
fbq('track', 'PageView');
</script>
```

---

## 🕒 Migration Timeline

### Phase 1: Preparation (1-2 days)
- [ ] Backup WordPress site
- [ ] Set up SvelteKit on staging subdomain
- [ ] Configure analytics on staging
- [ ] Test all functionality

### Phase 2: DNS Switch (1 day)
- [ ] Update DNS records during low-traffic hours
- [ ] Monitor for 24 hours
- [ ] Verify analytics are tracking

### Phase 3: SEO Monitoring (1-2 weeks)
- [ ] Check Search Console for crawl errors
- [ ] Monitor traffic in GA4
- [ ] Fix any broken redirects
- [ ] Submit new sitemap

### Phase 4: Cleanup (1 week after)
- [ ] Remove old WordPress hosting
- [ ] Update all external links
- [ ] Confirm all tracking is working

---

## 🚨 Troubleshooting Common Issues

### DNS Propagation Issues
```bash
# Check DNS propagation
dig yourdomain.com
nslookup yourdomain.com

# Use online tools
# whatsmydns.net
# dnschecker.org
```

### Analytics Not Tracking
1. **Check browser console** for JavaScript errors
2. **Verify tracking ID** is correct
3. **Test with Analytics Debugger** browser extension
4. **Use GA4 Real-Time reports** to test

### Search Console Verification Failed
1. **Try different verification method**
2. **Check file accessibility** at yourdomain.com/verification-file.html
3. **Wait for DNS propagation** (up to 48 hours)

### SSL Certificate Issues
1. **Force HTTPS** in hosting settings
2. **Check mixed content** warnings
3. **Update all internal links** to HTTPS

---

## 📈 SEO Best Practices During Migration

### 1. **Maintain URL Structure** (when possible)
- Keep same permalinks if feasible
- Use 301 redirects for changed URLs
- Don't change too many URLs at once

### 2. **Monitor Search Rankings**
- Use tools like Google Search Console
- Set up rank tracking for key terms
- Watch for traffic drops

### 3. **Content Optimization**
- Ensure all meta titles/descriptions transfer
- Check structured data implementation
- Verify mobile responsiveness

### 4. **Technical SEO**
- ✅ Sitemap submitted and working
- ✅ Robots.txt properly configured
- ✅ Page load speeds optimized
- ✅ Schema markup implemented

---

## 🎯 Post-Migration Checklist

### Week 1
- [ ] All pages loading correctly
- [ ] Analytics tracking properly
- [ ] Search Console no major errors
- [ ] Core functionality working

### Week 2-4
- [ ] Traffic levels stabilized
- [ ] Search rankings maintained
- [ ] No crawl errors in GSC
- [ ] User feedback positive

### Month 2+
- [ ] SEO improvements implemented
- [ ] New features launched
- [ ] Performance optimizations
- [ ] Consider removing old redirects

---

## 🔧 Tools & Resources

### Essential Tools
- **DNS Checker:** [whatsmydns.net](https://whatsmydns.net)
- **GTmetrix:** [gtmetrix.com](https://gtmetrix.com)
- **Google PageSpeed:** [pagespeed.web.dev](https://pagespeed.web.dev)
- **Schema Validator:** [validator.schema.org](https://validator.schema.org)

### SvelteKit Analytics Libraries
```bash
# Analytics packages
npm install @vercel/analytics
npm install gtag

# SEO helpers
npm install svelte-meta-tags
npm install @googlibs/sveltekit-sitemap
```

### Monitoring Setup
1. **Set up uptime monitoring** (UptimeRobot, Pingdom)
2. **Configure error tracking** (Sentry)
3. **Monitor Core Web Vitals** (Google Search Console)

---

## 💡 Pro Tips

1. **Test everything on staging first** - Never change DNS without thorough testing
2. **Do migration during low traffic** - Typically weekends or late nights
3. **Keep WordPress backup accessible** - For emergency rollback
4. **Document everything** - Track all changes for troubleshooting
5. **Communicate with users** - If downtime expected, notify in advance

---

## 🆘 Emergency Rollback Plan

If something goes wrong:

1. **Revert DNS records** to point back to WordPress
2. **Check TTL settings** - Lower TTL = faster reversal
3. **Monitor for 30 minutes** - Ensure traffic returns to normal
4. **Fix issues on staging** - Don't attempt live fixes
5. **Try migration again** when issues resolved

---

**Remember:** Take your time, test thoroughly, and don't rush the migration. A successful migration preserves your SEO rankings and provides a better user experience! 🚀 