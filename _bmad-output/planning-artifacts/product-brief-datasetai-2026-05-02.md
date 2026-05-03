---
artifact_type: 'product-brief'
date: '2026-05-02'
author: 'Semma'
authored_with: 'BMAD bmad-product-brief skill (drafted by Mary, Business Analyst)'
status: 'v0.1 — initial draft, ready for review'
input_documents:
  - '_bmad-output/planning-artifacts/research/market-llm-agent-marketplace-research-2026-05-02.md'
project_name: 'datasetai.xyz'
working_codename: 'datasetai'
---

# Product Brief: datasetai.xyz

## Executive Summary

**datasetai.xyz is the *npm for AI agents*** — a format-agnostic registry where developers and prosumers upload, discover, and one-command install agent definition files for any coding agent or LLM tool. Whether the user runs Claude Code, Cursor, Codex CLI, Aider, Gemini CLI, or makes raw API calls, datasetai delivers the right agent format (`SKILL.md`, `AGENTS.md`, `.cursorrules`, MCP server config, system prompt) into the right folder with one command.

The AI-agent ecosystem is mid-explosion in 2026 — MCP servers grew 7.8× year-over-year, AGENTS.md is stewarded by the Linux Foundation and adopted across 60,000+ open-source projects, and Cursor alone has 1M+ daily users hungry for shareable agent rules. Yet today's distribution is fragmented across a dozen format-narrow registries (Smithery, cursor.directory, prompts.chat, SkillsMP) plus thousands of unmonetized GitHub awesome-lists. **No one currently sits in the top-right quadrant of "multi-format + creator-monetized."** That is datasetai's wedge — and it must be claimed before Anthropic, OpenAI, and Cursor each launch their own ecosystem-locked first-party registries in the next 12–24 months.

The product is bootstrappable: registry-only (no hosted runtime), zero compute cost, software margins from day one, with a creator-economy revenue model proven by PromptBase ($1.94B+ TAM, 80% creator share, $500–$1,500/mo realistic for serious creators).

## The Problem

**For agent builders today, the world is broken three ways:**

1. **No path to monetize their work.** A developer who builds a brilliant Claude skill or MCP server has only two options: dump it in a GitHub repo and hope (no payment, no analytics, no audience-tracking), or wedge it into a format-narrow paid platform like PromptBase that doesn't support skills or MCPs at all. The GPT Store offers ~$0.03/conversation in opaque, geo-restricted rev-share that effectively pays creators 1–3% — and most countries are excluded outright.
2. **Distribution is splintered.** A creator who builds an agent that works across Claude Code, Cursor, and Aider has to publish it in 3+ different places, in 3+ different formats, with no unified install UX. The "awesome list" pattern is the de facto standard, but it's a static markdown file — no install command, no analytics, no tagging, no versioning.
3. **No quality or trust layer.** OWASP found that **61% of AI-agent skill marketplaces have zero automated malicious-code scanning.** Buyers can't tell good agents from spam; SkillsMP indexes 425K+ skills but its "quality bar" is a ≥2-star GitHub filter. Trust is the dominant emotional barrier (87% concerned about agent accuracy, 81% about security/privacy).

**For agent users (developers, prosumers, knowledge workers), the symmetric pain:**

4. **Discovery is broken.** GPT Store's explore page has had Wolfram pinned as "pick of the week" since January. Search returns nothing for partial words. New, useful agents are buried under SEO spam. Users resort to scrolling Reddit and X for recommendations.
5. **Vendor lock-in.** Every existing registry is locked to one ecosystem. A user who wants to switch from ChatGPT to Claude — or from a hosted LLM to a local Ollama — has to abandon their agent library and rebuild from scratch.
6. **Install friction.** Even when a user finds a great agent on GitHub, the install pattern is "copy-paste this README block into your config file" — manual, error-prone, version-fragile.

The status quo cost: creators leave value on the table or migrate to direct B2B sales; users lose hours per week to discovery and install friction; the broader agent ecosystem fragments along vendor lines instead of compounding into shared infrastructure.

## The Solution

datasetai.xyz is a **registry-only platform** (no hosted execution) with three integrated surfaces:

1. **Web UI** for personalized, intent-aware discovery — search/filter by format, tool compatibility, vertical, eval score, verified-publisher status. "I'm building a customer-support agent in Claude Code" → ranked relevant skills + MCP bundles + prompt templates, all installable in one click.
2. **CLI** — `npx datasetai install <agent-id>` auto-detects which AI tool(s) the user has installed (Claude Code, Cursor, Codex, Aider, Gemini CLI…) and writes the agent file in the correct format to the correct folder. One command, any tool.
3. **Creator dashboard** — uploaders see installs, retention, version performance, search-rank, revenue. Creators can publish free, paid (per-install), or subscription. Optional verified-publisher review for a trust badge.

The agent itself never runs on datasetai's infrastructure. It's a *file* (or small folder) — open-format, version-controlled, signed, optionally evaluated by a sandboxed test harness. The user runs the agent against their own LLM key, on their own machine, with their existing tooling. **datasetai is a registry, not a runtime.**

## What Makes This Different

The competitive moat is the intersection of three positions, each unoccupied today:

1. **Format-agnostic by design.** SKILL.md (Claude), AGENTS.md (cross-tool standard), `.cursorrules`, MCP servers, system prompts, framework configs (BMAD, CrewAI, AutoGen) — all first-class. No competitor handles more than ~2 of these. VoltAgent is the closest, but it's a GitHub list, not a product.
2. **Creator-economy economics.** Match PromptBase's 80% revenue share — but for *agents*, not just prompts. Founding-creator program: 90% rev share for the first 6 months, courting refugees from GPT Store's opaque payouts and frustrated PromptBase sellers who want to ship agents (not just prompts).
3. **Quality and trust layer.** Mandatory automated security scanning (closing the 61% OWASP gap), independent eval scores, verified-publisher badges, refund policy on paid agents. PromptBase explicitly does not refund — that's an easy differentiator.

**The honest unfair-advantage acknowledgement:** the moat is not technical novelty (the registry pattern is well-understood). It is **execution speed and willingness to support every format**, plus **arriving with creator monetization on day one** — a posture incumbents structurally can't match (Anthropic / OpenAI / Cursor will only ever support their own format).

## Who This Serves

### Primary: Indie agent builders & prosumer creators
Developers, prompt engineers, AI tinkerers, and niche-domain experts (legal, real estate, marketing, finance, e-learning are the proven top GPT Store categories) who already publish agents to GitHub awesome-lists and want a path to monetize, build an audience, and reach users across multiple AI tools. They write `SKILL.md` files, build MCP servers, draft `.cursorrules`, and want one place to publish that pays them and reaches every coding-agent ecosystem.

**Success for them looks like:** $500–$5,000/mo in passive agent revenue (PromptBase-grade outcomes, but for richer artifacts) + audience growth + analytics that let them iterate.

### Secondary: Coding-agent and prosumer users
Cursor's 1M+ DAU, Claude Code users, Codex/Aider/Gemini CLI users, ChatGPT power-users — anyone who wants vetted, ready-made agents to drop into their workflow without writing them from scratch.

**Success for them looks like:** discovering a high-quality agent in <2 minutes, installing it in one command, and trusting that it won't leak data or hallucinate critical outputs.

### Tertiary (Phase 3): SMB and enterprise teams
Marketing agencies, dev shops, internal-platform teams who need shared, governed agent libraries for their org. Private registries, SSO, audit logs, on-prem options.

## Success Criteria

### User-success signals (Phase 1, months 0–6)
- **Time-to-first-install** under 60 seconds for a new user (browse → install command → working agent)
- **Cross-tool reach:** ≥3 supported tools at launch (Claude Code + MCP-via-Claude-Desktop + at least one of: Cursor / Codex CLI / Aider)
- **Indexed agent count:** ≥10,000 within 6 months (mostly via auto-mirror with attribution; ~500–1,000 actively-claimed-and-maintained)

### Business signals (Phase 1, months 0–6)
- 25,000–50,000 monthly active users (browsing or installing)
- 200+ verified publishers (creators who claim their listing and opt into the platform)
- Free→paid conversion validation: 5–10% of installs of premium agents

### Year-1 milestones
- $50K–$300K ARR
- 10K–50K MAU
- ≥1,000 monetizing creators
- 10+ supported formats

### Year-2+ benchmarks
- Year 2: $500K–$2M ARR, 100K–500K MAU
- Year 3: $2M–$15M ARR, 1M+ MAU — at which point datasetai is a credible acquisition target for Cursor / Anthropic / OpenAI / a Linux-Foundation entity, *or* a credible standalone venture.

## Scope (MVP — Phase 1, months 0–6)

### In scope for v1
- **Format support:** Claude Code Skills (`.claude/skills/`) and MCP servers — the two highest-momentum, weakest-incumbent formats
- **Web registry** with search, filters, agent detail pages, install command snippets
- **CLI installer** (`npx datasetai install <agent-id>`) that auto-detects Claude Code or Claude Desktop and writes to the correct location
- **Auto-mirror with attribution** — index VoltAgent, SkillsMP, Smithery, prompts.chat content with clear source links and "claim this listing" CTA on each entry
- **Creator account + listing claim flow** — verify GitHub ownership, gain control of analytics
- **Free tier only at launch** — paid agents come in Phase 2 once supply density justifies a marketplace
- **Founding-creator outreach program** — manual recruiting of 20–50 high-output builders

### Explicitly out of scope for v1
- Hosted agent execution (permanently out — registry-only)
- Paid agents and creator monetization (Phase 2)
- Cursor `.cursorrules`, AGENTS.md, Codex, Aider, Gemini CLI support (Phase 2)
- Private/team/enterprise registries (Phase 3)
- Custom evals, sandboxed previews, automated security scanning (Phase 3 — start with manual verified-publisher review)
- Mobile app
- Hosted CI/eval infrastructure for agents

## Network Effects & Ecosystem

The two-sided dynamic to engineer from day one:

- **Supply-side flywheel:** auto-mirroring + founding-creator program seeds enough listings to be useful → useful registry attracts more creators to claim+monetize their listings → claimed listings attract better creators → discovery quality improves → more users.
- **Demand-side flywheel:** cross-tool install UX is uniquely valuable to multi-tool users → these users tell their teammates → teammates trying to find agents discover datasetai → install once, use across all their tools → switching cost compounds with library size.

The ecosystem position: datasetai sits **above** the format-specific registries, not against them. Smithery/PulseMCP/Glama can keep being authoritative MCP registries; datasetai indexes them, adds creator monetization on top, and bundles MCP servers with skills and prompts into composable agent kits the format-narrow players cannot.

## Vision (2–3 years)

**By the end of year 3, datasetai is the default destination for cross-tool agent distribution and the de facto creator-economy layer for the AI-agent ecosystem.** When a developer builds a useful agent — in any format, for any tool — datasetai is where they publish it because that's where the audience and the revenue are. When a user wants an agent — for whatever stack they happen to use — datasetai is where they go because that's where everything is, in the format they need, with eval scores they trust.

The platform expands from registry → quality layer → trust authority. Verified publishers become a meaningful trust signal in the broader ecosystem. Eval scores become referenced in procurement decisions. Private registries become the default "agent backbone" for mid-market companies the way GitHub Enterprise became the default for code.

The plausible exit envelope at year 3:
- **Acquisition:** Cursor (extending its IDE moat), Anthropic (locking in cross-tool standardization), OpenAI (reclaiming the agent-distribution narrative they lost with the GPT Store's stagnation), GitHub/Microsoft (folding into the dev-tooling stack), Linux Foundation–adjacent (canonical AGENTS.md infrastructure).
- **Standalone venture:** $10M–$50M ARR, with the durable network effect carrying it past the 12–24 month window when first-party registries arrive.

The mission underneath: **make agent-building a viable creator profession** — the way YouTube made video, Substack made writing, and the App Store made indie iOS development. The moment a 19-year-old prompt engineer in Bangalore can pay rent on agent royalties from a global audience, datasetai has won.

---

## Appendix: Open Questions

These are the unresolved questions that BMAD's later artifacts (PRD, architecture) should close:

1. **Format priority:** Claude Skills vs. MCP — which one to launch with as the *flagship*, with the other as the bundled secondary? Lean Claude Skills (cleaner artifact, sharper UX story), but MCP has stronger growth — confirm with first 5 founding creators.
2. **Auto-mirror legal/social posture:** how to credit-and-claim source repos in a way that's welcomed (not resented) by VoltAgent / SkillsMP / Smithery maintainers. Reach out before launching.
3. **CLI distribution channel:** `npx`-only at launch, or also a real installer (Homebrew, Scoop)? Probably `npx` only for v1 — instant zero-install pattern matches BMAD's own distribution.
4. **Pricing/payment infra (Phase 2):** Stripe Connect for creator payouts? Crypto rails for global reach (since GPT Store geo-locks are a key creator pain we're attacking)? Probably both — Stripe for the 90% case, on-chain or platform-wallet for the long tail of countries Stripe doesn't serve.
5. **Trust mechanics order:** evals first, or verified-publisher first? Verified-publisher is cheaper to ship and a more visible trust signal early — start there.
6. **Defensibility against first-party launches:** the 12–24 month window assumption needs a quarterly recheck. If Anthropic ships an official Skills marketplace in Q3 2026, accelerate AGENTS.md / cross-tool support to stay in the differentiated lane.

## Appendix: Source Documents

- [Market research artifact](./research/market-llm-agent-marketplace-research-2026-05-02.md) — full demand/pain-point/competitor analysis with citations.
