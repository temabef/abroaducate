# Copilot Execution Roadmap

Date: 2026-03-26

## Runtime Contract Update (2026-04-22)

- Canonical product route for V1 is `/dashboard`.
- `/copilot` remains a route alias that redirects to `/dashboard`.
- Handoff package work is deferred to a later phase.

## Development Order

Follow this sequence without adding extra product ideas mid-build.

### Phase 1: Product Lock

- finalize pivot documents
- freeze legacy boundaries
- define new naming and navigation

### Phase 2: Domain Foundation

- define affordability-first program schema (multi-country ready)
- define Story Vault schema
- define simulator response shape
- define playbook response shape

### Phase 3: Story Vault

- implement capture
- implement persistence
- implement completeness scoring
- support inline prompt updates from board cards (no modal wizard dependency)

### Phase 4: Affordable Path Finder

- implement curated launch program dataset with affordability metadata
- implement transparent affordability metadata
- implement simple relevance filtering

### Phase 5: Acceptance Simulator

- implement transparent score/band logic
- implement reasons, gaps, and recommended actions
- implement “ready now” vs “needs preparation”

### Phase 6: Application Playbook

- implement required documents
- implement ordered tasks
- implement blockers and readiness
- implement next-best action

### Phase 7: Product Shell

- pivot homepage
- add dashboard navigation
- add legacy tools boundary
- align product messaging
- make hero submit route to `/dashboard` with query params:
  - `destination`
  - `level`
  - `field`
  - `budget`
  - `priority`
- add auth-gated redirect-preserving handoff so signed-out users return to a prefilled dashboard
- place a static strategy-board product mock directly below homepage hero

### Canonical Dashboard UX (locked)

- Step 1: Quick Intake (5 fields)
  - destination preference
  - degree level
  - field
  - budget comfort
  - funding priority
- Step 2: Strategy Board (primary surface)
  - left column: profile health + inline prompts
  - center column: ranked mixed feed (programs + scholarships)
  - right column: competitiveness snapshot + next-best action/playbook preview
- Progressive enrichment
  - inline prompts update Story Vault directly and re-hydrate board scores/results

### Phase 8: Pricing And Access Framing

- reuse current billing
- align plan copy to the dashboard value proposition
- keep production rollout deferred until local-complete build is finished
