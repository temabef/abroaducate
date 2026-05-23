# Project Structure

## Top-Level Layout

```
src/                  # Application source
scripts/              # Data import/maintenance scripts (.mjs/.js)
scratch/              # Temporary/throwaway scripts — clean up when done
supabase/             # Supabase migrations and seed SQL
database_migrations/  # Additional migration SQL files
database_scripts/     # Utility SQL scripts
static/               # Static assets served as-is
docs/                 # Internal documentation
.github/workflows/    # GitHub Actions cron jobs (scholarship matching, reminders)
```

## `src/` Structure

```
src/
├── app.css           # Global styles (Tailwind base imports)
├── app.d.ts          # Global TypeScript declarations (App.Locals, App.PageData)
├── app.html          # HTML shell
├── hooks.server.ts   # Server hooks — Supabase client setup, session injection
├── lib/              # Shared library code (imported via $lib)
└── routes/           # SvelteKit file-based routing
```

## `src/lib/` Subdirectories

| Directory | Purpose |
|---|---|
| `components/` | Reusable Svelte components |
| `components/admin/` | Admin-only components |
| `components/dashboard/` | Dashboard-specific components |
| `components/form/` | Form building blocks |
| `server/` | Server-only modules (`.server.ts`) — email, scholarship matching, strategy |
| `services/` | Client-callable service modules (API wrappers, business logic) |
| `stores/` | Svelte writable stores for shared client state |
| `utils/` | Pure utility functions (analytics, rate limiting, GPA conversion, etc.) |
| `ai/` | AI-specific helpers (plagiarism detection, etc.) |
| `ocr/` | OCR integrations (Google Vision, Tesseract) |
| `academicAnalyzer/` | Academic profile analysis engine |
| `copilot/` | Application copilot feature logic |
| `data/` | Static data files (grading systems, etc.) |
| `config/` | Site-wide config constants |
| `images/` | Static images imported by components |

Key files in `src/lib/`:
- `database.types.ts` — auto-generated Supabase types, do not edit manually
- `types.ts` — app-specific TypeScript types and interfaces
- `stores.ts` — top-level shared stores
- `supabase.ts` / `supabaseClient.ts` — Supabase client initialisation
- `stripe.ts` — Stripe client setup
- `comprehensive-usage-limits.server.ts` — credit/usage enforcement (server-only)

## `src/routes/` Conventions

SvelteKit file-based routing. Each route folder can contain:
- `+page.svelte` — page component
- `+page.ts` — universal load function (runs on client + server)
- `+page.server.ts` — server-only load function and form actions
- `+layout.svelte` / `+layout.server.ts` — shared layout
- `+server.ts` — API endpoint (GET/POST/etc.)

### Key Routes

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/dashboard` | Main user dashboard (program tracking, documents, scholarship radar) |
| `/programs` | Program listing with filters |
| `/programs/[id]` | Program detail with scholarship matches, similar programs, documents tab |
| `/scholarships` | Scholarship catalog |
| `/sop/[id]` | SOP editor |
| `/cover-letters/[id]` | Cover letter editor |
| `/personal-statements/[id]` | Personal statement editor |
| `/academic-cv/[id]` | Academic CV editor |
| `/onboarding` | New user onboarding flow |
| `/profile` | User profile / academic footprint |
| `/pricing` | Credits and pricing page |
| `/admin/*` | Admin panel (requires `canManageScholarships` permission) |
| `/api/*` | API endpoints |
| `/auth/*` | Auth callbacks, logout, reset, email verify |

### API Route Patterns

All API endpoints live under `src/routes/api/`. Each is a `+server.ts` file exporting HTTP method handlers. Common patterns:
- Validate session via `event.locals.supabase.auth.getSession()`
- Use `event.locals.supabaseServiceRole` only when bypassing RLS is explicitly required
- Return `json(data)` or `error(status, message)` from `@sveltejs/kit`
- Rate limiting applied via `src/lib/utils/rateLimiter.ts`
- Credit checks enforced via `src/lib/comprehensive-usage-limits.server.ts`

## Naming Conventions

- **Svelte components**: PascalCase — `ScholarshipTable.svelte`
- **Route files**: SvelteKit convention — `+page.svelte`, `+server.ts`
- **Non-component TS/JS files**: kebab-case — `scholarship-matcher.ts`
- **Variables & functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## Server vs Client Boundary

- Files ending in `.server.ts` are server-only — never imported by client code
- `src/lib/server/` contains server-only modules
- Environment secrets (`$env/static/private`) only accessible in `.server.ts` files and `+server.ts` endpoints
- Public env vars (`$env/static/public`) usable anywhere

## Cron Jobs

Defined as GitHub Actions workflows in `.github/workflows/`:
- `cron-match-scholarships.yml` — daily scholarship re-matching
- `cron-reminders.yml` — deadline reminder emails

Both call API endpoints on the deployed app.
