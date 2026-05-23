# Build vs Don’t Build Memo: Studee Benchmark

Date: 2026-03-27
Owner: Product / Copilot Pivot

## Decision

**Verdict: BUILD (with strict scope discipline).**

Studee is strong at application funnel operations, but Abroaducate still has a clear wedge if we stay affordability-first and execution-intelligence-first.

## What We Observed (Live Audit)

Studee currently does this very well:

- large program listing surface with sorting (`Cheapest tuition`, deadlines, application fees)
- direct `Start application` entry from listing cards
- clear funnel progression: `Options -> Right fit -> Apply`
- dual path choice:
  - apply with Studee
  - apply on university website
- structured right-fit gate (country, age, school type, budget, requirement checks)
- trust and conversion packaging (gift card, reviews, accreditation badges)

Conclusion: they are highly optimized for **application conversion flow**.

## Why We Should Still Build

Studee is not the same product strategy we are pursuing.

Their center of gravity:

- tuitioned university pipeline
- partner-mediated admissions flow
- application completion support

Our required center of gravity:

- no tuition / low tuition / high scholarship pathways
- competitiveness diagnosis with transparent gaps
- inline profile improvement prompts
- next-best-action playbook tied to affordability outcomes

This is a different promise and different product value chain.

## Build (Copy This)

We should copy these mechanics:

- input-first entry with low-friction search controls
- fast listing-to-action transition
- clear, staged flow language (what step user is on)
- polished conversion UX (progressive disclosure, no clutter)
- strong trust signaling near CTAs

## Don’t Build (Avoid This)

We should avoid these traps:

- becoming a generic university-application concierge
- trying to replicate partner-operations moat before product wedge is proven
- over-prioritizing admissions logistics over affordability intelligence
- promising “full done-for-you” application handling in V1
- commission-like perception that weakens student-trust positioning

## Non-Negotiable V1 Differentiators

These must be visible in first-run experience:

1. Mixed affordability feed: program + scholarship ranked together.
2. Transparent rationale tags: fit, affordability, urgency, effort.
3. Competitiveness snapshot with top gaps (not generic advice).
4. Inline prompts that improve board quality in-session.
5. Concrete next-best action + short playbook preview.
6. Student-aligned framing: optimize for reduced cost and funding outcomes.

If any of these are missing, we risk collapsing into a “search + apply” clone.

## Scope Boundary (Next 6-8 Weeks)

We will build:

- hero input -> `/copilot` intake handoff
- quick intake -> strategy board
- mixed ranked matches + competitiveness + playbook snapshot
- lightweight enrichment prompts in-board
- static homepage product proof of real board structure

We will not build yet:

- full admissions case-management operations
- university CRM-like workflow tooling
- heavy human-agent fulfillment layer
- portal-wide automation beyond scoped assistive guidance

## KPI Frame (How We Win)

Primary metrics:

- % users who generate board from hero
- % users who complete at least 2 inline prompts
- % users who run competitiveness snapshot
- % users who save or execute next-best action

Outcome metrics (later, once data matures):

- % users securing no/low-tuition admission pathways
- % users securing scholarship funding
- median projected cost reduction vs initial user baseline

## Final Call

Do not stop building.

We should **not** compete with Studee on “application operations depth” first.
We should compete on what they are weakest at for this niche: **affordability intelligence + personalized execution clarity**.

That is our wedge, our trust story, and our best path to durable differentiation.

