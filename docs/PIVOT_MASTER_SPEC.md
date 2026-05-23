# Pivot Master Spec

Date: 2026-03-26

## Product Statement

Abroaducate is pivoting into a **Germany-first Debt-Free Study Abroad Copilot**.

The product helps students:

- discover realistic debt-free or very low-cost Germany study paths
- understand how competitive they are for those paths
- build a reusable Story Vault for applications
- follow a practical Application Playbook that reduces friction and overwhelm

## Core Promise

**Find realistic debt-free Germany study paths, know where you stand, and get guided help to apply.**

## Launch Scope

### Geography

- Germany only

### Audience

- Master’s applicants
- students from underserved regions
- price-sensitive applicants who want to avoid loans
- users able to fund small unavoidable costs from personal/family resources without relying on debt

### Product Pillars

1. Affordable Path Finder
2. Acceptance Simulator
3. Story Vault
4. Application Playbook

## Non-Goals For V1

The following are explicitly out of scope:

- browser extension
- full portal automation
- mentorship marketplace
- visa support
- housing support
- newsletter redesign
- scholarship marketplace expansion
- test prep redesign
- generic AI document generation as the main product story
- multi-country launch

## Success Criteria

V1 is successful locally when:

- a signed-in user can create and save a Story Vault
- a signed-in user can browse Germany-first affordable paths
- the simulator returns a transparent competitiveness result
- the playbook returns ordered next steps and a next-best action
- the new copilot flow can be used without touching old broad-platform flows
- legacy tools are still present, but visibly separated

## V1 Product Boundaries

### Must Feel True In The UI

- affordability-first
- debt-free positioning
- strategy before automation
- clarity before breadth
- practical action over feature sprawl

### Must Not Feel True In The UI

- “all-in-one study abroad marketplace”
- “AI writes everything for you”
- “we support every country and every workflow”
- “we are still the old platform with a new headline”




new pivot one program 

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

## What “Apply with Guidance” vs “Apply Direct” Means

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

## Right-Fit Signals (clarified)
We do NOT use one vague fit label.
We show 2 separate signals:

1. Program Eligibility Fit  
- Good fit / Needs prep / High risk (for admission requirements)

2. Funding Competitiveness Fit  
- Good fit / Needs prep / High risk (for scholarship/funding competitiveness)

Each includes plain reasons and exact improvements.

## Intake Closed Logic
If intake is closed:
- we do NOT dead-end the user.
- we switch to `Prep Mode + Next Intake`.
- user continues documents, profile upgrades, and funding prep.
- we show next intake timeline and reminder setup.

## Program Lock Screen (must include)
- Program name
- University
- Country
- Degree level
- Tuition
- **Application fee**
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
