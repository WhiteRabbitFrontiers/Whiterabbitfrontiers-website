# White Rabbit Frontiers · Editorial Production System 1.0
Effective: 2026-10-26. **Editorial-only infrastructure; no publication authorization.**

## Roles and source of truth
- Human editor is final authority on editorial selection, meaning, visuals, accuracy sign-off and publication.
- Research/production assistant may propose, investigate, draft, fact-check and prepare review material, but **must not publish without specific, affirmative, version-bound human authorization**.
- `editorial/index.json` is the canonical story register. Existing `radar/` sources remain canonical research/drafts until individually migrated by explicit decision. **Link, never clone, existing source files.** `editorial/inventory.md` inventories legacy files and webpage relationships.
- Set distinct IDs for new stories; never reuse IDs. Record title, frontier, stage, priority, sources, next action and authorization state. Every newly added story must appear in the register.
- Current backlog is a *prioritized subset*, not a claim that every discussed Radar concept is already inventoried.

## Stages and gates
1. `concept`: capture the idea, its source and central question.
2. `rdq`: editor accepts for triage; mark investigate / park / toss (toss retains an audit record).
3. `investigate_backlog` or `investigate_active`: seek primary evidence, counterarguments, dates, uncertainty and independent expertise. At most 3 active.
4. `produce`: sourced manuscript, headline, citations, art direction, captions, accessibility, legal/copyright review. At most 2.
5. `review`: verify each material claim, check source versions, links, figures, dates, misleading implications and artwork rights. Log unresolved caveats.
6. `approved`: editor explicitly approves a **named story ID, exact content revision/commit, images, destination and planned publication scope**. Document approval text, date and version in the record; approval may be revoked.
7. `published`: only after the approved changes are merged/deployed and live URLs checked. Track corrections and evidence updates.
8. `parked` / `rejected`: retain reason and citations; do not erase history.

## Hard publication lock
- Default: **NOT AUTHORIZED**, including all 18 prioritized investigations. P1, 'go', 'investigate', 'develop', 'make it so', 'ready for review', draft completion and an issue/PR are **not** publication permission.
- Authorization must explicitly say `Publish WRF-###` (or equally unambiguous wording), identify the final version and delivery scope. If the version or scope changes materially, obtain fresh approval.
- No site HTML, website assets, build configuration, production branch, Vercel settings, DNS, newsletters, social feeds or other public surfaces may change merely because an item moves editorial stage.
- Work on an isolated branch and submit a pull request for human review. Do not merge, enable auto-merge or deploy on a production-linked branch without publication authorization.
- Approved status alone is not a guarantee that CI/Vercel has published: verify the deployed artifact and URL, and record evidence. Preview links may themselves be publicly reachable; do not generate preview deployments for embargoed/confidential work without approval.
- GitHub is a **public repository**. Unpublished drafts already committed there are not confidential. Do not add confidential interview material, private information or embargoed content.

## Standard production checklist
- [ ] Framing clearly differentiates fact, speculation, inference and WRF opinion
- [ ] Primary papers/registries/regulators checked; sources linked; dates, version and population stated
- [ ] Independent verification and credible counterexamples included where relevant
- [ ] Figures/claims reviewed; no relative-risk or preliminary-result overstatement
- [ ] Copy edited; headline, deck, accessibility, art rights, captions, SEO and links reviewed
- [ ] Editor approves exact revision, art and publication scope
- [ ] Production change isolated; build includes the approved page; deployment checked
- [ ] Published URL, date, commit, corrections contact and update policy recorded

## Weekly editorial desk
Report new concepts, active investigations (max 3), drafts in production (max 2), blockers, editor decisions and correction/watch items. Only update actual repository status, not a simulated chat dashboard.

## Operational note
The existing `package.json` build script copies a fixed HTML/asset list to `dist`; writing an additional HTML article alone does **not** publish it. Revisit packaging on a separate, explicitly approved website-technical change. This v1 implementation changes no build or website files.
