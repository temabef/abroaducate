# One Program Workflow Blueprint

Date: 2026-03-27
Route: `/copilot/program`

## Core Product Idea (Plain Language)

User chooses one program.
We help them:

1. apply to that program,
2. apply to funding that can pay for that program,
3. track everything in one place.

Program is the anchor. Funding is the booster.

## What "Apply with Guidance" vs "Apply Direct" Means

### Apply with Abroaducate Guidance

- We guide step-by-step inside our workspace.
- We validate completeness before user submits.
- We generate submission packet + handoff instructions.
- More support, more checks, fewer mistakes.

### Apply Direct (with Abroaducate checklist support)

- User applies directly on university/funding websites.
- We still provide checklist, reminders, and document prep.
- Less guided workflow, faster self-serve path.

## Are users applying to program or scholarship?

Both.

### Program Track (required anchor)

- Application to the university program itself.
- Status examples: `Not started -> In progress -> Submitted -> Decision`.

### Funding Track (parallel lanes)

- Program-specific funding lane.
- Country-wide scholarship lane.
- Professor/research funding lane.
- Status tracked separately for each lane.

User can:

- apply only program,
- apply program + one funding lane,
- apply program + multiple funding lanes.

Default recommendation: apply to program + all eligible funding lanes.

## Right-Fit Signals (Clarified)

We do not use one vague fit label.
We show 2 separate signals:

1. Program Eligibility Fit

- Good fit / Needs prep / High risk (for admission requirements)

2. Funding Competitiveness Fit

- Good fit / Needs prep / High risk (for scholarship/funding competitiveness)

Each includes plain reasons and exact improvements.

## Intake Closed Logic

If intake is closed:

- we do not dead-end the user.
- we switch to `Prep Mode + Next Intake`.
- user continues documents, profile upgrades, and funding prep.
- we show next intake timeline and reminder setup.

## Program Lock Screen (Must Include)

- Program name
- University
- Country
- Degree level
- Tuition
- Application fee
- Next intake
- Deadline
- Living-cost estimate

## V1 Submission Model

V1 = Assisted handoff:

- generate complete application packet
- show where/how to submit
- track submission state in platform

No direct broker API submission in V1.

## Acceptance Notes

- `/copilot/program` is production URL (not MVP naming).
- Program-first flow is permanent architecture and reusable for scaling.
- One-program template is the base pattern for adding more programs later.
