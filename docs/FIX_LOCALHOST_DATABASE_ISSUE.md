# Fix: Database Loading on Localhost

**Issue:** Database loads on production (abroaducate.com) but not on localhost  
**Error:** `TypeError: fetch failed` when fetching programs/universities  
**Root Cause:** Environment variables in `.env` file are not being loaded by dev server

---

## 🧪 Step 1: Test if Node Can See .env Variables

Run this in your terminal:

```bash
node scripts/test-env-vars.mjs
```

**Expected output:**
```
Testing environment variables in Node.js...

PUBLIC_SUPABASE_URL: ❌ NOT SET
PUBLIC_SUPABASE_ANON_KEY: ❌ NOT SET
SUPABASE_SERVICE_ROLE_KEY: ❌ NOT SET
OPENAI_API_KEY: ❌ NOT SET

If all show ❌ NOT SET, then Node is not loading .env file
```

**If they all show ❌ NOT SET:** Node.js doesn't automatically load `.env` files. You need `dotenv`.

---

## ✅ Solution: Install and Use `dotenv`

### Step 1: Install dotenv

```bash
npm install dotenv
```

### Step 2: Create a Dev Script That Loads .env

**Option A: Modify package.json (Recommended)**

Open `package.json` and find the `"scripts"` section.

**Change this:**
```json
"scripts": {
  "dev": "vite dev",
  ...
}
```

**To this:**
```json
"scripts": {
  "dev": "node -r dotenv/config node_modules/.bin/vite dev",
  ...
}
```

**What this does:** Forces Node to load `.env` before starting Vite.

---

### Step 3: Restart Dev Server

```bash
# Stop current dev server (Ctrl+C)

# Start again
npm run dev
```

---

## 🔍 Alternative: Check if .env is in the Right Place

The `.env` file **must** be in the project root (same folder as `package.json`).

**Verify:**
```bash
dir | findstr ".env"
```

**Should show:**
```
.env
.env.example
.env.restoration
```

**If `.env` is missing from root:** Move it there.

---

## 🚀 Alternative Solution: Use SvelteKit Env Mode

SvelteKit should load `.env` automatically, but sometimes it doesn't work in dev mode.

**Try this:**

1. Stop dev server (Ctrl+C)

2. Run with explicit mode:
   ```bash
   npm run dev -- --mode development
   ```

3. Or set NODE_ENV:
   ```bash
   set NODE_ENV=development && npm run dev
   ```

---

## 🔧 Nuclear Option: Manually Load in hooks.server.ts

If nothing else works, load env vars directly in your server code.

**Add this to the TOP of `src/hooks.server.ts`:**

```typescript
import { config } from 'dotenv';

// Force load .env file in development
if (process.env.NODE_ENV !== 'production') {
  config();
}

// Rest of your imports...
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
```

**Then restart dev server.**

---

## ✅ Expected Result After Fix

**Terminal should show:**
```
  VITE v6.3.5  ready in 6679 ms
  ➜  Local:   http://localhost:5173/
```

**NO errors like:**
```
Error fetching programs {
  message: 'TypeError: fetch failed',
```

**Browser should show:**
- Programs page with actual program cards
- Universities page with university data
- No "No programs match your current filters" error

---

## 🎯 Quick Test After Fix

1. Go to: http://localhost:5173/programs
2. Should see programs listed (like production site)
3. Check terminal → no "fetch failed" errors

---

## 📋 Troubleshooting Checklist

If still not working after trying all solutions:

- [ ] `.env` file exists in project root (same folder as `package.json`)
- [ ] `.env` file contains all 3 Supabase variables
- [ ] `dotenv` package is installed: `npm list dotenv`
- [ ] Dev server fully restarted after changes
- [ ] No typos in env variable names (case-sensitive)
- [ ] Supabase project is active (not paused) in dashboard

---

## 🆘 If Nothing Works

**Last resort debug:**

Create `test-supabase-direct.mjs`:

```javascript
import { config } from 'dotenv';
config(); // Load .env

import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url);
console.log('Key:', key ? 'SET' : 'NOT SET');

if (!url || !key) {
  console.error('❌ Environment variables not loading!');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('programs')
  .select('id, program_name')
  .limit(1);

if (error) {
  console.error('❌ Supabase error:', error);
} else {
  console.log('✅ Supabase working!', data);
}
```

**Run:**
```bash
node test-supabase-direct.mjs
```

**If this works:** Issue is with SvelteKit/Vite env loading  
**If this fails:** Issue is with `.env` file itself or Supabase credentials

---

## 🎯 Most Likely Fix

**99% chance it's:** Node.js not loading `.env` automatically in dev mode.

**Quick fix:**
1. Install dotenv: `npm install dotenv`
2. Modify package.json dev script: `"dev": "node -r dotenv/config node_modules/.bin/vite dev"`
3. Restart dev server: `npm run dev`

**Should work immediately after that!** ✅
