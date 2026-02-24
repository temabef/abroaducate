# Supabase Advisor warnings – what’s fixed and what to do

## 1. Function search path (fixed by migration)

**Migration:** `20260224000001_fix_function_search_path_warnings.sql`

Sets `search_path = public` on all functions reported by the “Function Search Path Mutable” warning so the linter no longer flags them. Run this migration (e.g. in SQL Editor or `supabase db push`) to clear those warnings.

---

## 2. RLS policy “always true” (optional / intentional)

**Warning:** Tables `budget_calculator_usage`, `diagnostic_results`, `email_logs`, `user_activity` have INSERT policies with `WITH CHECK (true)`.

- **budget_calculator_usage** and **diagnostic_results**: Allowing anonymous INSERT is intentional (usage tracking, diagnostic before signup). Changing this would require authenticated users only and would change product behavior.
- **email_logs** and **user_activity**: Used for server-side logging; inserts are typically done with service role or from your backend.

If you want to satisfy the linter and are okay with the behavior change:

- For **diagnostic_results** / **budget_calculator_usage**: Replace “anyone can insert” with a policy that allows only `authenticated` or only `service_role`, or add a stricter `WITH CHECK (...)` (e.g. limiting columns or role).
- For **email_logs** / **user_activity**: Use a policy that allows INSERT only for `service_role` (or a dedicated role your backend uses), and ensure your app always inserts via that role.

No migration is provided for these so you can decide whether to keep the current behavior or tighten it.

---

## 3. Leaked password protection (dashboard)

**Warning:** “Leaked password protection is currently disabled.”

- In **Supabase Dashboard**: **Authentication** → **Settings** (or **Providers** / **Auth** settings).
- Enable **“Leaked password protection”** (or “Check passwords against HaveIBeenPwned”) so Supabase Auth rejects known-compromised passwords.

This is a project setting, not something you fix in SQL or in this repo.

---

## 4. Postgres version (dashboard)

**Warning:** “Current Postgres version has security patches available.”

- In **Supabase Dashboard**: **Project Settings** → **Infrastructure** (or **Database** / **Settings**).
- Follow the instructions to **upgrade** the Postgres / database version so you get the latest security patches.

Also a platform/dashboard action, not a code or migration change.
