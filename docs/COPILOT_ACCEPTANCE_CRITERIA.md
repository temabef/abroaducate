# Copilot Acceptance Criteria

Date: 2026-03-26

## Runtime Contract Update (2026-04-22)

- Canonical product route for V1 is `/dashboard`.
- `/copilot` is an alias route that redirects to `/dashboard`.
- Handoff package delivery is not part of current acceptance.

## Product Acceptance

### Story Vault

- user can save structured profile information
- user can save stories, goals, and achievements
- user sees a completeness score
- user can resolve missing-profile prompts inline from strategy board cards

### Affordable Path Finder

- user can see affordability-first program pathways across destinations
- each path shows cost context and language/application details
- user can see a mixed ranked feed that includes program paths and scholarship opportunities
- each match shows transparent rationale tags (fit, affordability, urgency, effort)
- results are relevant to the user’s profile

### Acceptance Simulator

- user sees a score or competitiveness band
- user sees why the score was given
- user sees concrete gaps
- user sees recommended actions
- free users have limited monthly simulation runs
- paid users can run unlimited simulations

### Application Playbook

- user can open a playbook for a selected program
- playbook includes tasks, document requirements, blockers, and a next-best action
- playbook feels actionable without requiring extension automation
- free users can access a meaningful playbook preview
- paid users can access full playbook details including blockers

### Product Shell

- homepage reflects the new debt-free affordability-first promise
- dashboard flow is clearly separate from legacy tools
- users can reach the new product without relying on broad legacy experiences
- homepage hero submit routes to `/dashboard` with intake params (`destination`, `level`, `field`, `budget`, `priority`)
- signed-out users are auth-gated on `/dashboard` and returned to their prefilled board after sign-in
- homepage includes a static strategy-board product preview in place of heavy illustration reliance

### Strategy Board

- new users complete a 5-field quick intake before board generation
- generated board uses a 3-column layout:
  - left: profile health and inline prompts
  - center: ranked mixed matches (program + scholarship)
  - right: competitiveness snapshot and playbook next-best action
- board can expand into detailed panels without losing current board state

## Technical Acceptance

- local sign-in still works
- subscription/account state still resolves
- Story Vault persistence survives reloads
- simulator and playbook work end to end for a signed-in user
- free vs paid access boundaries are enforced in-dashboard
- legacy routes remain accessible through a clear boundary
- hero-to-dashboard query handoff is preserved through auth flow
