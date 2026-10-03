# 🤖 Abroaducate AI Email Agent — Setup & Deployment Guide

This guide walks you through the complete setup of the **Abroaducate AI Email Agent**, an autonomous system that reads, classifies, and replies to incoming student and applicant emails sent to `hello@abroaducate.com`.

---

## 🏗️ Architecture & Pipeline Flow

```
[Student sends email to hello@abroaducate.com]
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Email Routing / Email Worker                    │
│  (scripts/cloudflare-email-worker.js)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS POST (Secured via secret)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Abroaducate Webhook Endpoint                                │
│  /api/ai-email-agent/webhook                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Safety & Loop Prevention Guard                              │
│  - Filters out mailer-daemons, bounces, no-reply addresses   │
│  - Prevents infinite email ping-pong loops                   │
│  - Enforces hourly per-sender rate limiting                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Context Retrieval & Grounding                               │
│  - Looks up student profile in Supabase (target country,     │
│    degree level, subscription tier)                          │
│  - Injects Abroaducate tools knowledge (SOP reviewer,        │
│    scholarship database, Germany blocked account, visa tools)│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  LLM Academic Advisor Reasoning (OpenAI / Gemini)           │
│  - Classifies intent (scholarships, SOP, visa, account)     │
│  - Determines urgency & detects escalation needs             │
│  - Crafts warm, empathetic, authoritative response           │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐       ┌────────────────────────┐
│ Autonomous Reply │       │ Human Escalation Alert │
│ Dispatched via   │       │ (If student has refund │
│ Customer.io from │       │  or payment dispute,   │
│ hello@...        │       │  sent to admin email)  │
└────────┬─────────┘       └───────────┬────────────┘
         └─────────────┬───────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Audit Trail (ai_email_logs)                        │
│  - Visible in Admin Console: /admin/ai-email-agent          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Step 1: Database Migration (Supabase)

1. Open your **Supabase Dashboard** (`https://supabase.com/dashboard/project/yiubrielkgrzcwdabepp`).
2. Go to the **SQL Editor**.
3. Copy and paste the contents of:
   ```
   database_migrations/ai_email_agent.sql
   ```
4. Click **Run**.
5. This creates:
   - `public.ai_email_logs`: Stores incoming email text, AI replies, classifications, latency, and status.
   - `public.ai_email_settings`: Stores global agent toggle, autonomous mode, and alert preferences.

---

## ⚡ Step 2: Environment Variables

Add the following variable to your `.env` (and your Cloudflare Worker settings / Vercel):

```env
# Secret token to authenticate incoming webhooks from Cloudflare Email Worker
AI_EMAIL_AGENT_SECRET=df688903-b6c7-436a-93a8-0bad926288c9
```

*(Note: `OPENAI_API_KEY`, `CUSTOMER_IO_API_KEY`, `CUSTOMER_IO_SITE_ID`, and Supabase credentials are already configured in `.env`).*

---

## ☁️ Step 3: Configure Inbound Email Routing

Because your domain `abroaducate.com` is hosted on Cloudflare, you can use **Cloudflare Email Routing** completely free of charge.

### Option A: Cloudflare Email Routing + Worker (Recommended)

1. **Deploy the Email Worker**:
   - Go to **Cloudflare Dashboard** &rarr; **Workers & Pages** &rarr; **Create application** &rarr; **Create Worker**.
   - Name it: `abroaducate-email-agent-worker`.
   - Paste the code from [`scripts/cloudflare-email-worker.js`](scripts/cloudflare-email-worker.js).
   - Go to Worker **Settings** &rarr; **Variables and Secrets** &rarr; Add:
     - `WEBHOOK_URL` = `https://www.abroaducate.com/api/ai-email-agent/webhook`
     - `AI_EMAIL_AGENT_SECRET` = `<your AI_EMAIL_AGENT_SECRET from .env>`
   - Click **Deploy**.

2. **Connect Email Routing to Worker**:
   - In Cloudflare Dashboard, select your domain **abroaducate.com**.
   - Go to **Email Routing** &rarr; **Routing Rules**.
   - Click **Create rule**:
     - **Custom address**: `hello@abroaducate.com` (or create a catch-all if desired)
     - **Action**: `Send to a Worker`
     - **Destination worker**: `abroaducate-email-agent-worker`
   - Save and Enable the rule.

---

### Option B: Resend Inbound Webhook (Alternative)

If you prefer using Resend for inbound email processing:
1. Log into your Resend dashboard &rarr; **Inbound Webhooks**.
2. Set Endpoint URL to:
   ```
   https://www.abroaducate.com/api/ai-email-agent/webhook
   ```
3. Add the HTTP header:
   ```
   X-Email-Agent-Secret: <your AI_EMAIL_AGENT_SECRET>
   ```

---

## 🎮 Step 4: Testing & Admin Console

1. Navigate to:
   ```
   https://www.abroaducate.com/admin/ai-email-agent
   ```
2. You will find:
   - **🧪 Live Email Simulator**: Test incoming questions with 1-click presets (DAAD scholarship, German blocked account €11,904, SOP review, visa interview prep, refund escalation).
   - **📋 Activity Stream**: Real-time table of all incoming emails, AI replies, loop-guard blocks, and processing latencies.
   - **🎛️ Agent Settings**: Toggle autonomous auto-reply on/off, adjust escalation emails, or switch LLM models (`gpt-4o-mini`, `gpt-4o`, `gemini-1.5-flash`).

---

## 🔒 Safety & Loop Protection Features

- **No Infinite Loops**: The system automatically rejects headers with `Auto-Submitted: auto-replied`, `Precedence: bulk/junk`, bounces, out-of-office autoreplies, and addresses like `mailer-daemon@`, `no-reply@`, or `hello@abroaducate.com`.
- **Per-Sender Rate Limiting**: Caps processing at 5 emails per hour per sender to prevent spamming.
- **Human Escalation**: Payment disputes, severe bugs, or sensitive partnership inquiries trigger an alert directly to the administrator while acknowledging the student.
