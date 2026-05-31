# Abroaducate — Product Overview

Abroaducate is an AI-powered study-abroad platform helping students (primarily from Africa and other emerging markets) find, apply to, and fund affordable university programs in Europe.

## Core Value Proposition
- Discover affordable/tuition-free programs across 10 European countries (Germany, France, Italy, Poland, Lithuania, Estonia, Austria, Czechia, Sweden, Portugal)
- Match with relevant scholarships via a precomputed scoring system
- Generate AI-assisted application documents (SOP, Cover Letter, Personal Statement, Academic CV)
- Track applications and deadlines in a personal dashboard

## Key Numbers (as of May 2026)
- ~5,100 registered users, ~8,000 newsletter subscribers
- 2,597 programs across 10 countries
- 679 scholarships, 12,985 precomputed match rows
- Credit system: 3 lifetime free credits per user; pay-as-you-go packs (20/$4.99, 50/$9.99, 130/$24.99)

## Monetisation
- Pay-per-use credits for AI document generation and scholarship strategy features
- Stripe for card payments (global); Paystack planned for African markets (NGN/GHS/KES/ZAR)
- No subscription model — credits are lifetime, not monthly

## Deployment Status
- **Not yet deployed.** Local rebuild only. Old platform still live at abroaducate.com.
- Do not push to production until the pre-launch checklist in `ROADMAP_2026-05-12.md` is complete.

## Key External Services
- **Supabase** — Postgres database, auth, storage, RLS
- **OpenAI (gpt-4o-mini)** — AI document generation and support chat
- **Customer.io** — Transactional and marketing email (EU region)
- **Stripe** — Payment processing
- **PostHog** — Product analytics
- **Google Cloud Vision / Tesseract.js** — OCR for uploaded documents
- **Vercel** — Hosting target (adapter-auto)
