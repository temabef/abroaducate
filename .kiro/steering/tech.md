# Tech Stack & Build System

## Framework & Runtime
- **SvelteKit 2** with **Svelte 5** — full-stack framework
- **TypeScript 5** throughout (strict mode)
- **Vite 6** — build tool and dev server
- **Node.js** — runtime for scripts and server-side code

## Styling
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no PostCSS config needed)
- **DaisyUI v5** — component library on top of Tailwind (themes: light, dark, cupcake)
- **Flowbite / flowbite-svelte** — additional UI components
- **Lucide Svelte** — icon library (preferred over emoji or Font Awesome in UI)

## Database & Auth
- **Supabase** — Postgres database, auth, storage, Row Level Security
- `@supabase/ssr` for server-side auth (cookie-based sessions)
- `@supabase/supabase-js` for client-side and service-role access
- Generated types in `src/lib/database.types.ts` — keep in sync with schema
- **DDL changes must be applied manually in the Supabase SQL Editor** — the `execute_sql` RPC cannot run DDL

## AI & External APIs
- **OpenAI** (`openai` package) — gpt-4o-mini for document generation and support chat
- **Customer.io** (`customerio-node`) — email, EU region
- **Stripe** (`stripe` + `@stripe/stripe-js`) — payments
- **Google Cloud Vision** + **Tesseract.js** — OCR
- **PostHog** — analytics

## PWA
- `@vite-pwa/sveltekit` — service worker, offline support, manifest

## Document Export
- `docx` — Word export
- `jspdf` + `jspdf-autotable` — PDF export

## Code Quality
- **ESLint 9** with `eslint-plugin-svelte` and `typescript-eslint`
- **Prettier 3** with `prettier-plugin-svelte`
  - Tabs (not spaces), single quotes, no trailing commas, 100-char print width

## Common Commands

```bash
# Development
npm run dev               # start dev server (run manually in terminal)

# Type checking
npm run check             # one-time svelte-check
npm run check:watch       # watch mode

# Linting & formatting
npm run lint              # prettier check + eslint
npm run format            # auto-format all files

# Build & preview
npm run build
npm run preview

# Data scripts
node scripts/match-scholarships-to-programs.js --apply --rollover-scholarships --persist-rollover
node scripts/post-deploy-credits.mjs --dry-run   # preview credit init
node scripts/post-deploy-credits.mjs --apply     # apply after deploy
```

## Environment Variables
- Public vars use `PUBLIC_` prefix and are imported from `$env/static/public`
- Private vars (API keys, service role key) imported from `$env/static/private`
- See `.env.example` for required keys
- Never commit `.env` — it is gitignored

## Path Aliases
- `$lib` → `src/lib`
- `$env/static/public` / `$env/static/private` — SvelteKit env modules

## Scripts Directory
- One-off and maintenance scripts live in `scripts/` as `.mjs` or `.js` files
- Scratch/temp scripts go in `scratch/` — clean up when done
- On Windows, prefer `.mjs` script files over inline `node -e` commands
