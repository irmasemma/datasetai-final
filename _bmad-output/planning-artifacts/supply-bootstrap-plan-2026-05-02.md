---
artifact_type: 'supply-bootstrap-plan'
date: '2026-05-02'
author: 'Semma'
authored_with: 'BMAD bmad-agent-analyst skill (drafted by Mary, Business Analyst)'
status: 'v0.1 — initial plan, ready for execution'
project_name: 'datasetai.xyz'
input_documents:
  - '_bmad-output/planning-artifacts/product-brief-datasetai-2026-05-02.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/research/market-llm-agent-marketplace-research-2026-05-02.md'
addresses_risks:
  - 'PRD R-5 — auto-mirror legal/social backlash'
  - 'PRD R-6 — no supply-side liquidity at launch (cold-start)'
  - 'PRD R-10 — search quality at launch (long-tail discoverability)'
addresses_open_questions:
  - 'PRD Q2 — auto-mirror legal/social posture'
  - 'PRD Q7 — mirror seed list and outreach order'
launch_supply_target: '~10,200 listings (10K mirrored + 150 founding-creator + 30–50 curated anchor)'
---

# Supply Bootstrap Plan — Initial High-Quality Agents for datasetai.xyz

> **Goal:** Solve the cold-start problem (PRD R-6) with concrete, dated tactics. By launch day, the registry should have **~10,200 listings**, with a **healthy long-tail mirrored base + a quality spine of ~200 active claimed/curated agents**.

---

## Strategic Principle

Run **three concurrent supply motions**, each with a different cost / quality / control trade-off. They are complementary, not alternatives.

| Motion | Effort | Cost | Quality Control | Throughput | Speed |
|---|---|---|---|---|---|
| **A. Auto-mirror at scale** | Low | $ | Low (you trust upstream) | High (10K+ in weeks) | Fast |
| **B. Founding-creator program** | High | $$ | High (real publishers) | Medium (50 creators in 12 weeks) | Medium |
| **C. Curated launch collection** | High | $$$ | Highest (you set the bar) | Low (30–50 hand-built) | Medium-Slow |

---

## 🅰️ Motion A — Auto-Mirror Plan

### A1. Tier-1 must-mirror sources (ranked by quality × reach)

#### 🥇 Tier 1 — Mirror at launch

| Repo | Stars | What's there | Why first |
|---|---|---|---|
| **Superpowers** *(canonical org TBD; search GitHub)* | **94K** | TDD-first 7-phase Claude Code workflow framework | Officially accepted into Anthropic's marketplace; #1 brand-quality signal possible at launch |
| **Everything Claude Code (ECC)** | **100K+** | 135 agents, security scanning, memory, harness | Anthropic Hackathon winner; deepest single-repo content in the ecosystem |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | 16.5K | 1,400+ cross-tool skills with CLI installer | Already cross-tool-aware; sets the bar to beat |
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 5.2K | 232+ skills, multi-tool (Claude/Codex/Cursor/Gemini CLI/Aider) | Broad domain coverage |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | – | Curated list (entry point to many other repos) | Use as discovery seed; follow links to underlying repos |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | – | Composio-curated list | Composio is a known agent-tooling brand; their curation is signal |

#### 🥈 Tier 2 — Mirror in launch month 2

| Repo | Why |
|---|---|
| [daymade/claude-code-skills](https://github.com/daymade/claude-code-skills) — 51 production-ready skills | Quality-curated, smaller, manageable |
| [netresearch/claude-code-marketplace](https://github.com/netresearch/claude-code-marketplace) | Curated by an agency; another quality signal |
| [glebis/claude-skills](https://github.com/glebis/claude-skills) | Active maintainer, organized collection |
| [phuryn/pm-skills](https://github.com/phuryn/pm-skills) — PM Skills Marketplace, 100+ agentic skills | Strong vertical (product management) |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | The very framework that produced this analysis — high quality + great founding-creator partnership target |

#### 🥉 Tier 3 — MCP server universe (index metadata, not full hosting)

Don't try to be Smithery. *Index* their public catalog with attribution + one-click handoff:

| Source | Coverage | Approach |
|---|---|---|
| **[Smithery.ai](https://smithery.ai)** — 7,000+ MCP servers | Most polished | Index metadata, deep-link to their install command; do not duplicate their hosted runtime |
| **[Glama.ai](https://glama.ai/mcp/servers)** — 21,000+ servers | Broadest | Mirror metadata, dedupe overlap |
| **[PulseMCP](https://www.pulsemcp.com)** — 11,840+ hand-reviewed | Highest quality | Promote PulseMCP-reviewed servers with a "PulseMCP-reviewed ✓" badge — turn their curation into your trust signal |
| **[MCP.so](https://mcp.so)** — 19,700+ | Community submissions | Mirror with attribution |
| **Official Anthropic MCP registry** *(when public)* | Canonical | Auto-sync; table stakes |

#### 🌟 Anchor MCP servers users will *expect* on day one

Hand-verify these (don't just auto-mirror): **GitHub MCP server (28.3K stars), Notion MCP, Taskade MCP, Slack, Zapier, HubSpot, Salesforce, Google Workspace (Drive, Gmail, Calendar, Sheets), Figma, Sentry, Microsoft.** Reference: [k2view top 15 MCP](https://www.k2view.com/blog/awesome-mcp-servers).

### A2. Operational plan

**Pre-launch (4–6 weeks before public launch):**

1. **Build the ingestion-job framework** — one job per source, idempotent, attribution-preserving, resumable
2. **Outreach to upstream maintainers BEFORE mirroring** (not after). Explain the program, give them suppression rights, offer them a pinned creator badge if they claim
3. **Honor robots.txt** + identify with User-Agent: `datasetai-mirror/1.0 (https://datasetai.xyz/mirror-policy; mirror@datasetai.xyz)`
4. **Suppression turnaround:** <72h SLA, documented publicly
5. **License preservation:** never re-license; show upstream license prominently on every listing

**Goal:** **8,000–12,000 listings live at launch**, each with attribution + claim CTA.

---

## 🅱️ Motion B — Founding-Creator Program

The PromptBase + Substack lesson: **50 active, recognized creators with ~250 quality agents beat 500 anonymous mirrored ones.**

### B1. Where to find them — six talent pools

#### Pool 1 — **Top GitHub maintainers**
- Maintainers of every Tier-1/Tier-2 mirror source above
- Cross-reference: GitHub commit activity > 50 commits in last 6 months on agent/skill repos
- **Tool:** GitHub trending + `topic:claude-code-skills` + `topic:mcp-server`, sort by stars
- **Estimated pool:** 300–500 candidates worldwide

#### Pool 2 — **Active prompt-engineering Twitter/X**
- Watch `#ClaudeCode #MCP #cursorrules #aiagents` daily for 2 weeks
- Build a list of accounts that *publish original work* with > 1K followers
- Illustrative seed accounts to validate before pitching: *Moritz Kremb*, *Mckay Wrigley*, *Eduardo Slonski*, *Aiden Bai*, *Geoffrey Huntley*, *David Hsu*, *Logan Kilpatrick*, *Simon Willison*, *Riley Goodside*, *Anthropic devrel team*, *Cursor devrel team*
- **Estimated pool:** 150–200 high-signal accounts

#### Pool 3 — **PromptBase top sellers**
- Their model is broken for skills/MCP — they want a place to publish richer artifacts
- Browse [promptbase.com](https://promptbase.com) by sales volume / by category
- **Pitch:** *"We pay 80% (90% as founding creator), and we accept skills + MCP, not just prompts."*
- **Estimated pool:** 100–150 sellers worth pitching

#### Pool 4 — **Frustrated GPT Store creators**
- Mine the OpenAI community forum, Reddit r/OpenAI, r/ChatGPT, r/GPTPromptGenius, X for `"GPT Store" frustration` posts. They're qualified leads.
- **Pitch:** *"Your GPT Store payout sucks. Transparent rev share, global payouts, your work installable on Claude/Cursor/MCP, not just ChatGPT."*
- **Estimated pool:** 80–120 motivated creators

#### Pool 5 — **Cursor Directory contributors**
- Top contributors to [cursor.directory](https://cursor.directory) and [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)
- **Pitch:** *"Publish once, reach Cursor + Claude Code + Codex + Aider users."*

#### Pool 6 — **MCP server authors with > 500 GitHub stars**
- Anyone shipping a public MCP server
- **Pitch:** *"We index Smithery, Glama, PulseMCP, MCP.so — but we *also* let you monetize. The MCP SDK just hit 97M monthly downloads. Don't leave money on the table."*
- **Estimated pool:** 200–300 authors

### B2. Founding-creator deal terms

| Term | Standard | **Founding-creator (first 50, 6-month window)** |
|---|---|---|
| Revenue share | 80% creator / 20% platform | **90% creator / 10% platform** |
| Payouts | Stripe Connect (Phase 2) | Same + manual concierge for excluded countries |
| Onboarding | Self-serve | **1:1 concierge call**, profile setup, listing review |
| Co-marketing | Standard | **Featured-creator slot, blog spotlight, social co-promotion** |
| Discord access | Public | **Private founding-creator channel** with the team |
| Roadmap input | Public feedback | **Direct line to product**, monthly group call |
| Verified-publisher badge | Apply + review | **Auto-granted** on join |

### B3. Outreach plan

**Weeks -8 to -6:**
- Build target list (≥ 200 names across pools 1–6)
- Score: GitHub activity × external presence × format fit × geography
- Top 100: personalized cold pitches; bottom 100: templated invite

**Weeks -6 to -4:**
- First-wave outreach (Twitter DMs > GitHub email > LinkedIn — order of response rate)
- **Goal:** 30 first-wave creators committed
- Concierge onboarding starts immediately

**Weeks -4 to -2:**
- Second-wave outreach + alumni-referral push (every committed founder names 2 peers)
- **Goal:** 50 total committed
- Each publishes ≥ 3 agents pre-launch → **150 high-quality founding-creator agents at launch**

**Weeks -2 to 0:**
- Polish + pre-launch promo kit per founding creator
- Coordinated launch-day social-media wave (50 creators posting same day = real signal)

### B4. Outreach template (adapt to your voice)

> **Subject:** Quick pitch — 90% rev share for your skills/MCPs
>
> Hi [name],
>
> Saw your [specific repo / specific tweet / specific GPT Store agent] — sharp work, especially [specific detail showing you actually looked].
>
> I'm building **datasetai.xyz** — think *npm for AI agents*. One CLI, every format (Claude Skills, MCP servers, AGENTS.md, .cursorrules), every tool. We just hit private beta and are picking 50 founding creators.
>
> The deal: **90% revenue share** for 6 months (vs. 80% standard, vs. GPT Store's opaque 1–3%), 1:1 concierge onboarding, featured-creator placement, monthly product call with the team. Goal is to make agent-building a viable creator profession — and I want you in early.
>
> 15 min next week to walk through? Or just reply with your GitHub handle and I'll set up your verified-publisher account.
>
> — Semma
>
> P.S. We mirror with attribution + a "claim this listing" flow — your existing GitHub agents are probably already indexed; founding-creator status lets you take ownership + monetize.

**Conversion targets (back-of-envelope):**

- ~30% open → reply rate
- ~30% replies → call
- ~50% calls → committed
- Net: ~5% cold → committed → **target list of ~1,000 to land 50 founders.** Realistic with focused effort over 6 weeks.

---

## 🅲 Motion C — Curated Launch Collection (the quality bar)

You commission or build **30–50 anchor agents** that you control. They demonstrate the quality bar, fill key vertical gaps, and are unimpeachably high-signal.

### C1. Verticals to seed (high-pain × high-pay)

| Vertical | Why anchor here | Sample anchor agent ideas |
|---|---|---|
| **Code review** | Universal dev pain | "Senior code reviewer w/ style guide", "Security-focused reviewer", "Performance reviewer" |
| **Sales ops** | High ROI, high WTP | "RFP responder", "LinkedIn prospect researcher", "Discovery-call note-taker + CRM update" |
| **Legal ops** | High pay, compliance-heavy | "Contract red-flag finder", "GDPR compliance checker", "Policy summarizer" |
| **Customer support** | Top agency-adoption workflow | "Triage classifier", "Empathetic-response drafter", "Macro updater" |
| **DevOps** | Power-user catnip | "Incident commander", "Postmortem writer", "Runbook generator" |
| **Marketing / SEO** | Highest GPT Store ROI | "SEO audit agent" (51% of agencies run it), "Content brief generator" (64%) |
| **Research / writing** | Wide consumer pull | "Academic literature scanner", "Editorial review" — partner with BMAD here |
| **Data / analytics** | Underserved vs. demand | "SQL query builder + checker", "Data-quality auditor" |

### C2. How to build them

Three sub-options, ranked by cost:

1. **Build them yourself + co-author with founding creators** — $0 cash, big time investment. Best when founder wants the quality stamp.
2. **Hire 2–3 freelance prompt engineers / agent builders** — $50–150/hr on Upwork, Toptal, or X bounty network. **Budget: $10K–$25K for 30 anchor agents.**
3. **Bounty program** — post specs on X / Discord / r/ClaudeAI: "$200–$500 per accepted anchor agent meeting our spec." Tap the prompt-engineer community. **Budget: $8K–$15K for 30 agents.**

### C3. Quality bar (publishable spec)

Every anchor agent must have:

- ✅ Clear, single-job-to-be-done description
- ✅ Working example: input → output transcript
- ✅ Tested across at least 2 tools (e.g. Claude Code + one MCP-aware client)
- ✅ Eval scenarios (5–10 test inputs with expected behaviors)
- ✅ Clear license (MIT or Apache-2 default)
- ✅ Versioned with semantic version
- ✅ < 5 KB content size where possible (smaller = easier to install + audit)
- ✅ No external API calls without disclosure
- ✅ No prompt-injection-vulnerable patterns (basic checklist; ref: [InfoQ guide](https://www.infoq.com/articles/securing-autonomous-ai-agents-kubernetes/))

This becomes the **"Verified-Publisher Spec v1"** — the bar for the trust badge.

---

## 🏘️ Communities to Recruit From

### High-signal channels — be active *daily*

| Community | Where | What to do |
|---|---|---|
| **Anthropic Discord / Claude Builders** | discord.gg/claudeai (or current handle) | Daily presence, helpful answers, announce founding-creator program |
| **Cursor Discord** | cursor.com/community | Same |
| **Hugging Face Discord** | 200K members | Lower priority; HF is broader ML, less agent-builder concentration |
| **Reddit r/ClaudeAI, r/cursor, r/OpenAI, r/LocalLLaMA, r/GPTPromptGenius** | – | Helpful answers, weekly "build of the week" thread, never spam |
| **X / Twitter** | `#ClaudeCode #MCP #cursorrules #aiagents` | Daily engagement, list of 200 high-signal accounts to follow + interact |
| **Hacker News** | news.ycombinator.com | One Show HN at launch + one well-timed Ask HN for feedback |
| **Indie Hackers** | indiehackers.com | Weekly progress posts; audience overlaps with prosumer creators |
| **Product Hunt** | producthunt.com | Single launch-day push, coordinated with founding creators |
| **Anthropic Build / OpenAI DevDay / AI Engineer Summit** | In-person | If timing fits, demo + recruit on the floor |
| **Hackathons** | mlh.io, lu.ma/ai | Sponsor or mentor at one Claude/MCP-focused hackathon — instant founding-creator pipeline |

---

## 📅 12-Week Pre-Launch Supply Timeline

| Week | Motion A — Mirror | Motion B — Founding | Motion C — Curated | Community |
|---|---|---|---|---|
| **-12** | Build target list of upstream sources; draft mirror policy + outreach | Build target list of 200+ founding-creator candidates | Define vertical priorities + spec v1 | Set up brand presence on Discord/X |
| **-11** | Write maintainer outreach emails | Score & rank candidates | Hire 2 freelance builders or post bounty | Begin daily Discord presence |
| **-10** | Send maintainer outreach (Tier 1) | First-wave outreach to top 50 | Build first 10 anchor agents | Start posting weekly on X |
| **-9** | Build ingestion framework | Founding-creator deal page + onboarding flow | Build agents 11–20 | Engage in r/ClaudeAI, r/cursor |
| **-8** | Mirror Tier 1 sources | Concierge onboarding for first 10 committed | Build agents 21–30 | Show progress publicly |
| **-7** | Mirror Tier 2 + start MCP-registry indexing | Second-wave outreach (next 100) | Build agents 31–40 | Apply to AI Engineer Summit / hackathons |
| **-6** | Quality + dedup pass on mirrored content | 30 founding creators committed; concierge onboarding ongoing | Build agents 41–50 | "Build of the week" content live |
| **-5** | License & attribution audit | Founding-creator Discord channel + first group call | Eval testing pass | Pitch hackathons / sponsor 1 |
| **-4** | Mirror refresh cadence in production | 40 committed; ask for referrals | Founding creators co-author 5 anchor agents with you | Show HN dry-run with friendly audience |
| **-3** | Final content audit + content-policy enforcement live | 50 committed; ≥ 3 agents each pre-publishing | Anchor collection complete; quality-reviewed | Polish launch-day plan |
| **-2** | Suppression flow + DMCA process tested | Founding-creator launch-day kit handed out | Anchor agents featured on home page | Coordinate launch-day social wave |
| **-1** | Beta-test installs across all formats | Final concierge polish | Final reviews + freezing | Show HN draft + Product Hunt prep |
| **0 (launch)** | 8K–12K mirrored listings live | 50 founding creators × 3 agents = **150 publisher agents** | 30–50 anchor agents | Coordinated launch wave |

**Launch supply target:** ~10,200 listings, of which ~200 are claimed/active (founding creators + anchor collection). Healthy long-tail-with-quality-spine shape.

---

## 🎯 The Single Most Important Tactical Move

If you only do *one* thing from this entire plan, do this:

> **Email the maintainers of [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) (16.5K ⭐) and "Superpowers" (94K ⭐) BEFORE you launch.**
>
> **Pitch:** *"We're building cross-tool registry with creator monetization. Your work is going to be auto-mirrored anyway by SkillsMP and others. We want to mirror it with your blessing, give you a verified-publisher badge, and offer you a founding-creator slot at 90% rev share. Happy to write the integration code if you'd rather have an official sync."*
>
> **Why:** these two sources are 60–80% of Tier-1 mirror content. If they bless you, your launch narrative is *"the best Claude-skill maintainers backed it."* If they don't, your launch narrative is *"we scraped them."*

The same call to **bmad-code-org** (BMAD-METHOD) is high-leverage — they're a serious player and their endorsement is real signal.

---

## 💸 Total Budget Estimate (pre-launch supply work)

| Line item | Low | High |
|---|---|---|
| Curated anchor agents (Motion C) — freelance or bounty | $8,000 | $25,000 |
| Founding-creator concierge ops (Motion B) — your time + minor tooling | $0 (founder time) | $5,000 (1 part-time ops contractor) |
| Hackathon sponsorship (community) | $1,000 | $5,000 |
| Mirror infra (Motion A) — hosting, scraping, CI | $200 | $1,000 |
| Legal review (mirror policy, ToS, Creator Agreement) | $1,500 | $5,000 |
| **Total** | **$10,700** | **$41,000** |

Realistic indie-founder budget: **~$15K–$20K** + significant founder time over 12 weeks.

---

## ✅ Definition of Done (pre-launch)

- [ ] **Motion A — Mirror:** ≥ 8,000 listings live, all with attribution + claim CTA, suppression flow tested, ≥ 5 upstream maintainers contacted with positive or neutral response
- [ ] **Motion B — Founders:** ≥ 50 founding creators committed, ≥ 150 publisher agents pre-published (3 per founder), founding-creator Discord live, first group call held
- [ ] **Motion C — Curated:** ≥ 30 anchor agents shipped, all passing the Verified-Publisher Spec v1, featured on home page
- [ ] **Community:** Active presence on Anthropic Discord, Cursor Discord, X, r/ClaudeAI, r/cursor for ≥ 8 weeks; ≥ 1 hackathon mentorship completed
- [ ] **Total launch supply:** ~10,200 listings, ~200 active claimed/curated

---

## Risks & Open Questions

### Risks specific to supply bootstrapping

| # | Risk | Mitigation |
|---|---|---|
| SR-1 | Mirror sources go cold or get hostile (e.g. VoltAgent maintainer asks for removal) | Pre-launch outreach + suppression-flow SLA; have ≥ 3 backup mirror sources per format |
| SR-2 | Founding creators don't convert at 5% cold rate | Widen the funnel to 1,500+ candidates; warmer intros via referral; raise rev share to 95% for first 10 if needed |
| SR-3 | Curated anchor agents don't reach quality bar in time | Hire dedicated freelance team early (week -12, not -8); have at least 10 anchors built by founder hands as a safety net |
| SR-4 | Mirror discovers low-quality bulk content that drags trust | Per-source quality filter (minimum stars, README quality, recency); de-rank in search |
| SR-5 | Outreach gets flagged as spam | Personalize first 100 messages; warm up sender domain; rotate channels (X DM > email > LinkedIn) |

### Open questions

1. **Outreach owner.** Founder vs. dedicated DevRel hire vs. fractional ops contractor for Motion B?
2. **Anchor-agent licensing.** All MIT, or some agents proprietary to drive paid-tier value (Phase 2)?
3. **Founding-creator selection criteria.** Pure quality, or weighted toward audience reach? Probably weighted (audience reach drives the launch wave).
4. **Mirror suppression policy specifics.** 72h SLA committed, but what about partial-source suppression (mirror the repo but exclude one folder)? Probably yes — flexibility wins maintainer goodwill.
5. **Anchor-agent freshness.** How often do we rebuild anchors as Claude/MCP/Cursor formats evolve? Probably quarterly.
6. **Community channel ownership.** Founder is unlikely to scale to all 6 community channels solo. Plan to delegate at least Reddit + IH to a community contractor by week -6.

---

## Source Documents

- [Product Brief](./product-brief-datasetai-2026-05-02.md)
- [PRD](./prd.md) — see §13 Risks (R-5, R-6, R-10) and §14 Open Questions (Q2, Q7) which this plan addresses
- [Market Research](./research/market-llm-agent-marketplace-research-2026-05-02.md)

## Key External References

- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 16.5K ⭐, 1,400+ skills, closest direct competitor and #1 mirror source
- "Superpowers" — 94K ⭐, official Anthropic marketplace member ([Top 50 Claude Skills overview](https://www.blockchain-council.org/claude-ai/top-50-claude-skills-and-github-repos/))
- "Everything Claude Code (ECC)" — 100K ⭐, Anthropic Hackathon winner
- [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — 5.2K ⭐, 232+ multi-tool skills
- [Smithery.ai](https://smithery.ai) — 7K MCP servers, "Docker Hub for MCPs"
- [PulseMCP](https://www.pulsemcp.com) — 11.8K hand-reviewed MCP servers
- [Glama.ai](https://glama.ai/mcp/servers) — 21K MCP servers (largest)
- [MCP.so](https://mcp.so) — 19.7K community MCP servers
- [PromptBase](https://promptbase.com) — creator-economy proof point (80% rev share, 130K prompts)
- [agents.md](https://agents.md/) — cross-tool open standard
- [k2view top 15 MCP](https://www.k2view.com/blog/awesome-mcp-servers) — anchor MCP server list

---

_End of plan v0.1. Next: execution. Recommended cadence — weekly review of supply metrics during the 12-week pre-launch window._
