# Next Phase Plan: Strategy & Creative Expansion

**Status:** Planning only  
**Scope:** Post-Phase 4 roadmap for Marketing OS Lite  
**Goal:** Move from campaign execution into strategy intake, creative direction, and smarter recommendations — while keeping all guardrails intact.

---

## 1) Customer Intake and Diagnosis

Build a structured intake flow that captures:
- business category
- current offer
- target audience
- geographic focus
- budget range
- primary goal
- existing brand voice
- pain points and constraints
- available creative assets
- previous campaign learnings

**Output:** a diagnosis summary that explains:
- what the business is trying to achieve
- what is missing
- what should be tested first
- what creative direction is most likely to work

**Why next:** this creates the strategic context needed before generating more assets.

---

## 2) Strategy Builder

Add a lightweight strategy workspace that converts intake data into:
- campaign objective recommendation
- messaging angle recommendations
- channel mix suggestion
- launch priority
- test plan
- risk flags

The Strategy Builder should not autonomously optimize live campaigns. It should only propose a plan for human review.

---

## 3) Audience and Offer Analysis

Expand analysis around:
- audience segments
- buyer intent
- objections
- offer clarity
- differentiators
- urgency/seasonality
- trust signals

**Desired output:** a readable analysis panel with:
- audience summary
- offer summary
- top objections
- suggested creative angle
- suggested CTA

This should feed both Strategy Builder and creative generation.

---

## 4) Image Generation Roadmap

Add image generation in stages:

### Phase A
- prompt-based image brief generation
- simple image concepts tied to campaign strategy
- human review before use

### Phase B
- variant generation by platform
- style consistency checks
- brand-safe prompt constraints

### Phase C
- asset versions stored in library
- re-use of approved image concepts across campaigns

**Do not do yet:** direct publishing, automated design replacement, or any external media API calls without explicit review.

---

## 5) Video Generation Roadmap

Add video generation support after image strategy is stable:
- short-form script generation
- hook / body / CTA structure
- storyboard outline
- platform-specific cutdown guidance
- manual approval before any export/use

**Priority:** keep it text-first before building media rendering workflows.

---

## 6) Asset Library

Create a central library for reusable approved assets:
- approved images
- approved videos
- approved captions
- approved hooks
- approved offers
- approved brand-safe prompts

Library should support:
- search
- filter by campaign / channel / status
- reuse across campaigns
- version history
- approval state

---

## 7) Recommendation Improvement

Upgrade recommendations from rules-only to strategy-aware suggestions:
- use intake context
- use audience/offer analysis
- use campaign history
- use asset performance patterns
- surface next-best action suggestions

Keep recommendations advisory only.
No autonomous optimization.
No live budget changes.

---

## 8) What Should Be Implemented Next

Recommended next sprint:
1. Customer intake + diagnosis summary
2. Audience and offer analysis panel
3. Strategy Builder draft view
4. Recommendation refinement using the new strategic context

This gives immediate value without requiring media generation or library complexity first.

---

## 9) What Should Remain Deferred

Defer for now:
- live ad publishing
- payment handling
- budget automation
- autonomous optimization
- external platform write access
- automated media replacement
- bulk creative export pipelines
- copyright clearance automation beyond basic warnings

---

## 10) Guardrails

### Claims
- no guaranteed outcomes
- no misleading performance promises
- flag risky or unverified claims for human review

### Copyright
- do not copy known brand assets or copyrighted media verbatim
- warn when prompts request logos, celebrities, or protected styles
- keep generated media clearly labeled as demo / draft unless approved

### Media Generation
- generation is advisory and human-reviewed
- store prompts and versions for traceability
- separate draft assets from approved assets
- keep platform-specific outputs scoped to the selected campaign

### Human Approval
- human approval required before assets can be used in a campaign
- no automated publication
- no autonomous creative deployment
- approvals must remain auditable

---

## Execution Order

1. Intake and diagnosis
2. Audience and offer analysis
3. Strategy Builder
4. Recommendation improvement
5. Image generation roadmap
6. Video generation roadmap
7. Asset library

---

## Risks

- strategy features can become too abstract without a concrete intake form
- media generation can sprawl if asset storage is not designed early
- recommendation quality may stagnate if it lacks campaign context
- creative automation can blur the line between draft and approved content
- without strict approval states, asset reuse can become unsafe

---

## Summary

The best next step is to build the planning and diagnosis layer first, then use that context to improve recommendations and creative generation. Media generation and asset library work should follow, with human approval and strong guardrails preserved throughout.
