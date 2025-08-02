# Analytics Diagnostic Guide

## 🔍 Issues Identified

### 1. Google Analytics Missing
- **Problem**: Google Analytics tracking code is completely missing from `app.html`
- **Solution**: Added Google Analytics code, but you need to replace `G-XXXXXXXXXX` with your actual tracking ID

### 2. PostHog Consent Management Issues
- **Problem**: PostHog might be blocked by Ezoic consent management
- **Solution**: Updated PostHog initialization to work with consent management

### 3. Analytics Conflicts
- **Problem**: Ezoic consent management might be blocking analytics tracking
- **Solution**: Created comprehensive analytics manager with consent handling

## 🛠️ Steps to Fix

### Step 1: Get Your Google Analytics Tracking ID

1. **Go to Google Analytics**:
   - Visit [analytics.google.com](https://analytics.google.com)
   - Sign in with your Google account
   - Select your Abroaducate property

2. **Find Your Tracking ID**:
   - Go to **Admin** (gear icon) → **Data Streams**
   - Click on your web stream
   - Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

3. **Update the Code**:
   - Replace `G-XXXXXXXXXX` in `src/app.html` with your actual tracking ID
   - Replace `G-XXXXXXXXXX` in `src/lib/utils/analytics.ts` with your actual tracking ID

### Step 2: Test Analytics

1. **Check Browser Console**:
   - Open browser developer tools (F12)
   - Look for analytics-related messages
   - Should see: "PostHog loaded successfully" and "Analytics initialized successfully"

2. **Test Google Analytics**:
   - Install Google Analytics Debugger extension
   - Check if events are being sent to GA

3. **Test PostHog**:
   - Go to your PostHog dashboard
   - Check if events are appearing in real-time

### Step 3: Verify Consent Management

1. **Check Ezoic Consent**:
   - Look for the consent banner on your site
   - Accept analytics consent
   - Check if analytics start working

2. **Test Without Consent**:
   - Temporarily disable Ezoic consent management
   - Check if analytics work without consent

## 🔧 Manual Testing

### Test Google Analytics:
```javascript
// In browser console
if (window.gtag) {
  console.log('Google Analytics is loaded');
  gtag('event', 'test_event', {
    event_category: 'test',
    event_label: 'analytics_test'
  });
} else {
  console.log('Google Analytics is NOT loaded');
}
```

### Test PostHog:
```javascript
// In browser console
if (window.posthog) {
  console.log('PostHog is loaded');
  posthog.capture('test_event', { test: true });
} else {
  console.log('PostHog is NOT loaded');
}
```

## 🚨 Common Issues

### 1. Consent Management Blocking Analytics
- **Symptom**: Analytics work in incognito mode but not normally
- **Solution**: Ensure users accept analytics consent

### 2. Ad Blockers
- **Symptom**: Analytics work for some users but not others
- **Solution**: Check if users have ad blockers enabled

### 3. Incorrect Tracking ID
- **Symptom**: Google Analytics shows no data
- **Solution**: Verify the tracking ID is correct

### 4. PostHog API Issues
- **Symptom**: PostHog dashboard shows no events
- **Solution**: Check PostHog project settings and API key

## 📊 Expected Results

After fixing:
- **Google Analytics**: Should show real-time users and page views
- **PostHog**: Should show recordings and events
- **Consent**: Should work with Ezoic consent management
- **Console**: Should show "Analytics initialized successfully"

## 🔄 Next Steps

1. **Replace tracking IDs** with your actual Google Analytics ID
2. **Test on staging** before deploying to production
3. **Monitor for 24-48 hours** to see if data starts flowing
4. **Check both analytics platforms** to ensure they're working

## 📞 If Still Not Working

1. **Check browser console** for errors
2. **Verify tracking IDs** are correct
3. **Test in incognito mode** to rule out ad blockers
4. **Check Ezoic settings** for analytics blocking
5. **Contact support** if issues persist 