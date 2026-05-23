# Pivot Codebase Audit

Date: 2026-03-27

## Executive Summary

Abroaducate has made a real strategic pivot in both planning and implementation, but the codebase is still in a transitional state.

The correct direction is:

- pivot away from a broad all-in-one study abroad platform
- become an affordability-first study abroad copilot
- focus on no-tuition, low-tuition, and high-scholarship pathways
- start with Germany as the first launch wedge, not the permanent product identity
- build around four core pillars:
  - Affordable Path Finder
  - Acceptance Simulator
  - Story Vault
  - Application Playbook

The codebase already contains the beginning of that product:

- a new `/copilot` flow exists
- a `/legacy` boundary exists
- homepage, navbar, footer, and pricing have been partially reframed
- there is a working prototype for Story Vault, Germany program selection, simulation, and playbook generation

However, the platform is still not fully aligned with the pivot.

The current state is best described as:

**strategy partially clarified, shell partially pivoted, core copilot prototyped, legacy still dominant underneath.**

## Correct Product Framing

The product is not best understood as “Germany-first” in the long-term identity sense.

The better framing is:

**Abroaducate is an affordability-first study abroad copilot focused on no-tuition, low-tuition, and high-scholarship pathways.**

Germany is the first launch wedge because it strongly fits that promise, but the real product identity is affordability-first, not country-first.

That means:

- `Germany` is the starting dataset
- `affordability` is the actual wedge
- the future system should be extensible to other countries that fit the same promise

## What The Pivot Documents Currently Imply

Based on:

- `docs/PIVOT_MASTER_SPEC.md`
- `docs/LEGACY_FREEZE_MAP.md`
- `docs/COPILOT_EXECUTION_ROADMAP.md`
- `docs/COPILOT_ACCEPTANCE_CRITERIA.md`
- `docs/GO_NO_GO_MEMO_DEBT_FREE_COPILOT.md`

the current documents over-emphasize Germany as the product identity.

They are directionally useful, but they should now be interpreted like this:

- the enduring product identity is affordability-first
- the initial launch scope is Germany
- the path model should eventually support multiple countries that fit:
  - no tuition
  - very low tuition
  - strong scholarship-backed affordability

### Core Promise

The better product promise is:

**Find realistic no-tuition, low-tuition, and high-scholarship study paths, know where you stand, and get guided help to apply.**

### Launch Boundaries

For the immediate build, V1 still appears to be:

- Germany as the first launch country
- master’s applicants as the clearest initial segment
- affordability-first
- strategy-first, not automation-first
- trust-first, not marketplace-first

But the architecture should not assume Germany is the final scope.

### Required Product Pillars

The new product spine remains:

1. Affordable Path Finder
2. Acceptance Simulator
3. Story Vault
4. Application Playbook

This pillar structure still makes sense under the corrected strategy.

### Freeze Rule

The legacy platform is frozen.

That means:

- old routes remain accessible
- old systems can receive break-fix support
- no new strategic product work should be added to those legacy surfaces

The new core should live under the Copilot flow.

## What The Codebase Currently Looks Like

### Overall Shape

The repository is still large and carries a lot of the old platform inside it.

Observed:

- `src/routes` contains 233 route files
- many broad legacy surfaces are still present:
  - scholarships
  - universities
  - document generators
  - dashboard
  - tools hub
  - visa practice
  - test prep
  - newsletters
  - subscription flows
  - admin systems

This confirms that the pivot is happening inside an already mature and broad codebase, not in a clean-slate repo.

The core product risk is no longer:

- can we build the new thing?

It is now:

- can we keep the new thing focused enough that the old platform does not keep redefining it?

## What Has Already Been Implemented For The Pivot

### 1. New Homepage Direction Exists

File:

- `src/routes/+page.svelte`

Status:

- partially aligned

What is good:

- homepage has been reframed around affordable / funded planning
- visual structure is more product-led than before
- finder section exists
- hero no longer reads like the old generic platform marketing

What is still off:

- it still carries mixed geography signals
- some copy still implies broader current support than the launch wedge really has
- it is not yet clearly framed as:
  - affordability-first product
  - Germany as current starting wedge

Assessment:

- this is a meaningful shell improvement
- but the messaging model is not fully settled yet

### 2. The New Copilot Route Exists

File:

- `src/routes/copilot/+page.svelte`

Status:

- strong prototype

What exists:

- signed-out landing state
- signed-in working state
- Story Vault UI
- Germany program list
- simulation UI
- playbook UI
- free vs paid behavior for simulation/playbook preview

This is the strongest evidence that the pivot is already moving from planning into product.

### 3. Story Vault Exists

Files:

- `src/lib/copilot/types.ts`
- `src/lib/copilot/storyVault.ts`
- `src/routes/copilot/+page.svelte`

Status:

- implemented as a practical prototype

What exists:

- structured fields for:
  - field of study
  - intake
  - GPA
  - English/German readiness
  - academic highlights
  - projects
  - work experience
  - personal stories
  - career goals
  - reusable answers
- completeness scoring
- load/save behavior

Important implementation detail:

- persistence is not a dedicated new copilot schema yet
- it reuses `user_quick_profile` through `src/lib/services/unifiedProfile.ts`
- localStorage is used as fallback

Important strategic detail:

- current types still hardcode Germany in places
- that is acceptable for a launch wedge
- but it is not correct as a long-term domain assumption

Assessment:

- this is a strong prototype
- but the current implementation should evolve from country-hardcoded to launch-country-configured

### 4. Affordable Path Finder Exists

Files:

- `src/lib/copilot/data/germany-programs.ts`
- `src/lib/copilot/types.ts`
- `src/routes/copilot/+page.svelte`

Status:

- early prototype

What exists:

- Germany-specific program dataset
- current dataset size is 6 programs
- cost metadata includes:
  - tuition
  - semester fee
  - blocked account
  - living cost
  - application method
  - intakes
  - deadline summary
  - affordability notes

What does not exist yet:

- a country-agnostic path schema
- persistence in database
- robust filtering and ranking
- affordability scoring model
- meaningful user relevance ranking beyond simple field/language matching
- scholarship overlays attached to paths in a structured way

Assessment:

- the right pillar exists
- but the current implementation is still a Germany demo dataset rather than a reusable affordability engine

### 5. Acceptance Simulator Exists

Files:

- `src/lib/copilot/simulator.ts`
- `src/lib/copilot/usage.ts`
- `src/routes/copilot/+page.svelte`

Status:

- implemented as deterministic client-side scoring

What exists:

- score out of 100
- competitiveness band
- readiness signal
- rationale
- gaps
- recommended actions
- free-user simulation limits

What is notable:

- simulator logic is transparent and understandable
- this matches the product better than a black-box AI-only experience

What is missing:

- stronger scoring inputs
- stronger path-specific logic
- persistence/history
- validation against richer program and funding data
- a more explicit cross-path readiness framing

Assessment:

- good prototype logic
- not yet strong enough for a launch-quality affordability copilot

### 6. Application Playbook Exists

Files:

- `src/lib/copilot/playbook.ts`
- `src/routes/copilot/+page.svelte`

Status:

- implemented as generated workflow guidance

What exists:

- required documents
- ordered tasks
- blockers
- next-best action
- free preview and paid full view

What is missing:

- richer program-specific task logic
- stronger scholarship-specific or funding-specific task modeling
- deeper blocker realism
- persistence of playbook state
- task completion tracking

Assessment:

- the pillar exists and is usable
- but it is still a generated helper, not yet a full execution system

### 7. Legacy Boundary Exists

File:

- `src/routes/legacy/+page.svelte`

Status:

- implemented, but under-exposed

What exists:

- a dedicated Legacy Tools page
- old routes grouped and labeled as preserved

What is missing:

- strong exposure in primary navigation
- clearer routing separation from the main product shell

Assessment:

- directionally correct
- not yet strong enough as an information architecture boundary

### 8. Navbar / Footer / Pricing Have Been Reframed

Files:

- `src/lib/components/Navbar.svelte`
- `src/lib/components/SiteFooter.svelte`
- `src/routes/pricing/+page.svelte`

Status:

- partially aligned

What is good:

- navbar centers `Copilot`
- footer copy reflects the new strategy more than the old platform
- pricing has been rewritten around the new product language

Main issues:

- pricing is currently framed as one-time credit packs
- copilot gating is currently implemented using the existing subscription model
- product language is still between:
  - scholarship and affordable study
  - debt-free positioning
  - launch-country-specific behavior

Assessment:

- positioning has moved
- monetization and product language are not yet internally consistent

## Where The Codebase Is Still Fighting The Pivot

### 1. Legacy Is Still The Bigger Product

Important legacy surfaces still speak the old language loudly.

Examples:

- `src/routes/universities/+page.svelte`
  - still markets “Global University Matching”
  - still promotes multi-country breadth as a core value
- `src/routes/scholarships/+page.svelte`
  - remains a broad marketplace-style scholarships browser
- `src/routes/tools/+page.svelte`
  - still presents a wide all-in-one tools catalog

This does not mean those routes are wrong to keep.

It means the new core product is still sitting beside a much larger, older product identity.

That creates brand confusion.

### 2. The Product Story Is Still Between Two Models

Right now the codebase is caught between:

- `Germany-first debt-free copilot`

and:

- `broader affordability-first copilot`

The corrected strategy is the second one.

But several implementation choices still reflect the first one too rigidly.

Examples:

- hardcoded Germany assumptions in copilot types
- launch data represented as if it were permanent product scope
- documents and shell language that treat Germany as the identity, not the starting wedge

### 3. There Is No Real Domain Foundation Yet

The roadmap says Phase 2 should define:

- program schema
- Story Vault schema
- simulator response shape
- playbook response shape

In practice:

- response shapes exist in TypeScript
- but the domain model is still mostly local TS data plus existing shared profile plumbing

What is missing:

- a reusable path schema that supports multiple affordability-first countries
- a canonical affordability model
- a canonical readiness/simulator model
- a canonical playbook/task model
- a scholarship/funding overlay model attached to paths

### 4. Copilot Persistence Still Leans On Legacy Foundations

This is currently both a strength and a limitation.

Strength:

- faster implementation
- less migration work
- existing auth/profile infrastructure reused well

Limitation:

- Story Vault is not truly independent yet
- it is partially mapped into `user_quick_profile`
- the shape may become constrained once the product expands beyond the first-country wedge

### 5. Pricing And Access Are Not Aligned

Current state:

- copilot logic checks `subscription`
- pricing page sells credit packs
- acceptance criteria still describe free vs paid tier boundaries

This is a product and technical mismatch.

It needs a product decision, not more copy.

### 6. Legacy Boundary Is Present But Not Fully Operationalized

The freeze map says legacy tools should remain accessible through a clearly labeled boundary.

Current state:

- `/legacy` exists
- but the main nav does not visibly surface `Legacy Tools`

This means the boundary exists in code, but not yet strongly in user experience.

### 7. Technical Debt Across The Repo Is Still High

Observed during audit:

- broad TypeScript errors already exist across unrelated modules
- country data and integration files are large and heterogeneous
- the codebase contains a lot of old product logic and broad-scope assumptions

This means the pivot is not blocked by the absence of product code.

It is more likely to be slowed by:

- complexity
- inconsistency
- inability to confidently evolve the app shell

## Phase-by-Phase Status Against The Roadmap

### Phase 1: Product Lock

Status:

- partially complete

Why:

- pivot docs exist
- freeze map exists
- naming is partially implemented in shell surfaces

Remaining:

- correct the product framing in the docs
- lock shell language around affordability-first positioning
- define Germany as launch wedge, not permanent product identity

### Phase 2: Domain Foundation

Status:

- partially complete

Why:

- TypeScript interfaces exist
- prototype data exists

Missing:

- canonical path schema that can scale beyond Germany
- production-ready launch dataset
- deeper affordability model
- scholarship overlay model

### Phase 3: Story Vault

Status:

- partially complete to strong prototype level

Why:

- capture exists
- save/load exists
- completeness score exists

Missing:

- dedicated persistence model or explicit long-term reuse strategy
- richer structured evidence fields
- launch-wedge-specific configuration instead of permanent hardcoding

### Phase 4: Affordable Path Finder

Status:

- prototype only

Why:

- curated Germany dataset exists
- cost context exists

Missing:

- scale
- ranking
- transparency depth
- multi-country-capable path schema
- scholarship/funding attachment model

### Phase 5: Acceptance Simulator

Status:

- prototype only

Why:

- transparent scoring exists
- reasons/gaps/actions exist

Missing:

- stronger input model
- stronger calibration
- better path-specific scoring
- more nuanced readiness output

### Phase 6: Application Playbook

Status:

- prototype only

Why:

- required documents
- tasks
- blockers
- next-best action

Missing:

- persistent workflow state
- deeper task logic
- stronger path/funding-specific process mapping

### Phase 7: Product Shell

Status:

- partially complete

Why:

- homepage has been pivoted
- copilot nav exists
- legacy page exists
- footer and pricing are reframed

Missing:

- homepage must reflect affordability-first positioning cleanly
- Germany must be framed as launch wedge, not necessarily the total product identity
- `Legacy Tools` needs to be visible as a boundary
- old broad routes still overpower the new shell

### Phase 8: Pricing And Access Framing

Status:

- incomplete / inconsistent

Why:

- pricing copy moved
- access logic still follows subscription reality
- monetization model is not yet coherent end to end

## Acceptance Criteria Check

### Story Vault

Status:

- mostly met at prototype level

Evidence:

- structured profile save works
- stories and goals can be saved
- completeness score exists

### Affordable Path Finder

Status:

- partially met

Evidence:

- affordability-oriented launch data exists
- cost context exists

Missing:

- stronger profile relevance
- stronger launch-quality dataset
- scholarship/path integration

### Acceptance Simulator

Status:

- mostly met at prototype level

Evidence:

- score/band exists
- score rationale exists
- gaps exist
- recommended actions exist
- free limits exist

Missing:

- stronger depth and calibration

### Application Playbook

Status:

- mostly met at prototype level

Evidence:

- program-specific playbook can be opened
- tasks/documents/blockers/next action exist
- free preview and paid fuller version exist

Missing:

- deeper realism and execution persistence

### Product Shell

Status:

- partially met

Evidence:

- homepage is pivoting
- copilot is clearly reachable
- legacy page exists

Missing:

- stronger separation from broad legacy product
- clearer affordability-first promise
- cleaner launch-wedge framing

### Technical Acceptance

Status:

- mixed

Good:

- sign-in still works
- subscription/account foundations still exist
- free vs paid behavior exists in copilot
- Story Vault survives reload through remote/local persistence

Risks:

- codebase has substantial unrelated technical debt
- build/typecheck cleanliness is not yet where a focused pivot should ideally be

## What We Have Actually Built So Far

In plain terms, the team has already built:

- the strategic pivot documents
- a first-generation homepage for the new direction
- a new copilot route
- a functional Story Vault prototype
- a functional Germany launch-wedge dataset
- a transparent simulation prototype
- a functional playbook prototype
- a legacy tools holding area
- a partially updated shell

That is real progress.

This is not just ideas on paper anymore.

But it is also not yet a finished pivot.

## Where We Are Right Now

Right now the product is in this state:

**We have escaped the old strategy in product thinking, but not yet fully in product structure or product framing.**

More specifically:

- the new copilot flow proves the intended product can exist
- the surrounding app still contains too much of the old broad platform identity
- the documents and implementation still need to agree that:
  - affordability is the product identity
  - Germany is the first launch wedge

So the current task is not to invent more product concepts.

The current task is to:

**finish the separation, harden the new core, and make the platform’s real identity consistent everywhere.**

## What We Are Going To

The destination is:

**an affordability-first study abroad copilot for no-tuition, low-tuition, and high-scholarship pathways, with Germany as the first launch wedge and room to expand into other countries that fit the same promise.**

That means the finished product should feel like:

- one product
- one promise
- one affordability thesis
- one clear launch wedge
- one strategy-first workflow

Not:

- a broad platform plus a copilot tab

And not:

- a permanently Germany-only identity if the true thesis is broader affordability

## Recommended Next Work

### Priority 1: Correct The Product Framing Everywhere

Do this next:

- update docs to reflect affordability-first positioning
- stop describing Germany as the permanent product identity
- describe Germany as the launch wedge
- align homepage, copilot shell, and pricing language with that model

Why:

- product and code decisions will stay confused until this is explicit

### Priority 2: Finish The Product Shell

Do this next:

- make the homepage clearly affordability-first
- remove copy that implies unsupported breadth today
- add visible `Legacy Tools` boundary in primary navigation or an equivalent shell pattern
- ensure the copilot is unmistakably the primary route

Why:

- right now product identity is still mixed

### Priority 3: Lock Domain Foundations Properly

Do this next:

- define canonical path schema
- define how countries, programs, and scholarships/funding overlays are modeled
- decide whether Story Vault remains layered on unified profile or gets a dedicated model
- define canonical simulator input/output model
- define canonical playbook/task model

Why:

- current prototypes are good enough to prove the shape
- not yet strong enough to scale confidently

### Priority 4: Strengthen The Affordable Path Finder

Do this next:

- expand beyond the current 6-program Germany launch dataset
- create affordability ranking rules
- model cost transparency more rigorously
- attach scholarship and funding context to each path
- improve relevance filtering based on Story Vault data

Why:

- this is one of the most important trust-building parts of the new product

### Priority 5: Harden The Simulator And Playbook

Do this next:

- improve competitiveness logic
- improve action recommendations
- add stronger path-specific blockers
- consider saving run history or selected target state

Why:

- these pillars are already visible, so quality upgrades here will move the product meaningfully

### Priority 6: Resolve Pricing / Access Strategy

Do this next:

- choose one primary access model for V1
- align pricing page, entitlement logic, and plan language

Current mismatch:

- pricing says credits
- copilot logic says subscription tier

Why:

- this ambiguity will create implementation drag and user confusion if left unresolved

### Priority 7: Keep Legacy Frozen For Real

Do this next:

- stop improving legacy surfaces unless required for continuity
- avoid routing new strategic work through old scholarship/university/tool flows
- treat shared auth, billing, and profile systems as infrastructure only

Why:

- this is how the pivot avoids collapsing back into the old platform

## Final Assessment

Verdict:

**The pivot is real, promising, and already partially implemented, but it is not complete and its framing still needs correction.**

Best summary of current status:

- strategy: promising but needs corrected framing
- shell: partially pivoted
- copilot core: prototyped
- domain/data foundation: incomplete
- monetization framing: inconsistent
- legacy separation: started but not fully enforced

Best summary of what should happen next:

**Correct the product framing, finish the shell, formalize the domain foundation, deepen the four copilot pillars, and prevent the broad legacy platform from reclaiming the center of the product.**

## Execution Priority: Now / Next / Later / Frozen

### Now

These are the highest-priority tasks because they reduce ambiguity and make the pivot feel real immediately.

- rewrite pivot docs to reflect affordability-first positioning
- define Germany as the launch wedge, not the permanent identity
- make the homepage reflect:
  - no tuition
  - low tuition
  - high scholarship
- remove mixed-scope examples from the homepage and copilot shell
- expose `Legacy Tools` clearly in navigation or an equivalent shell boundary
- make `/copilot` the unmistakable primary route
- define the canonical V1 output model for:
  - path results
  - simulator result
  - playbook result
- decide the V1 monetization model:
  - subscription
  - credit-based
  - or hybrid with one clearly primary system

### Next

These are the next product-building tasks once the framing and shell are stable.

- expand the Germany launch dataset well beyond the current prototype set
- define affordability scoring logic across tuition, semester fee, living cost, and blocked-account burden
- define relevance scoring logic from Story Vault inputs
- define how scholarship/funding results attach to each path
- improve simulator calibration and recommendation quality
- improve playbook depth with stronger program-specific blockers and task logic
- decide whether Story Vault remains on top of `user_quick_profile` or gets a dedicated persistence model
- save user target selections and copilot state more explicitly

### Later

These are valuable, but should only happen after the core copilot feels complete and coherent.

- expand to additional countries that fit the affordability thesis
- add richer scholarship integration into the copilot result view
- saved scenarios and path comparison
- simulation history and change tracking
- stronger account-level planning dashboards tied to the new copilot only
- side-panel extension support for copy-ready execution workflows
- adjacent monetization layers once trust and product usefulness are proven

### Frozen

These areas should remain frozen except for break-fix support and continuity work.

- broad all-in-one platform positioning
- generic university matching as the center of the product
- generic scholarship marketplace expansion as the center of the product
- SOP / cover letter / personal statement tools as the main growth story
- newsletter redesign
- test prep redesign
- visa support expansion
- mentorship marketplace ideas
- housing and post-admission support
- extension-first product work
- broad multi-country expansion before the affordability-first copilot is clearly complete
