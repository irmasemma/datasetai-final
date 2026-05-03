---
stepsCompleted: [1, 2, 3, 'pivot', 'verdict', 'competitor-teardown']
inputDocuments: []
workflowType: 'research'
lastStep: 6
research_topic: 'Format-agnostic registry for AI-agent definition files (corrected concept; original framing was a hosted-runtime marketplace)'
research_type: 'market'
research_topic: 'Web platform marketplace for LLM agents (upload/download community-built agents)'
research_goals: '(1) Validate strength of demand. (2) Assess realistic traffic potential. (3) Evaluate monetization viability.'
user_name: 'Semma'
date: '2026-05-02'
web_research_enabled: true
source_verification: true
---

# Research Report: market

**Date:** 2026-05-02
**Author:** Semma
**Research Type:** market

---

## Research Overview

[Research overview and methodology will be appended here]

---

# Market Research: Web platform marketplace for LLM agents (upload/download community-built agents)

## Research Initialization

### Research Understanding Confirmed

**Topic**: Web platform marketplace where users upload their own LLM agents and download/use existing ones built by others.
**Goals**:
1. Validate strength of demand — is there real, durable user pull for an "agent marketplace"?
2. Assess realistic traffic potential — could this attract meaningful, monetizable traffic?
3. Evaluate monetization viability — what models work (marketplace fees, subscriptions, ads, enterprise tier, etc.) and at what scale?
**Research Type**: Market Research
**Date**: 2026-05-02

### Research Scope

**Market Analysis Focus Areas:**

- Market size, growth projections, and dynamics for the AI-agent / agent-marketplace category
- Customer segments (hobbyist agent builders, indie devs, prosumers, SMB ops, enterprise teams), behavior patterns, willingness-to-pay
- Competitive landscape and positioning — incumbents (OpenAI GPT Store, Anthropic Skills marketplace dynamics, HuggingFace Spaces, LangChain Hub, CrewAI hub, Replit Agents, Poe, Microsoft Copilot Studio gallery, Salesforce AgentExchange, Sierra, Zapier Agents) and the gaps they leave open
- Strategic recommendations and implementation guidance for `datasetai.xyz` to enter and win a slice of this market

**Research Methodology:**

- Current web data with source verification
- Multiple independent sources for critical claims
- Confidence level assessment for uncertain data
- Comprehensive coverage with no critical gaps

### Next Steps

**Research Workflow:**

1. ✅ Initialization and scope setting (current step)
2. Customer Insights and Behavior Analysis
3. Competitive Landscape Analysis
4. Strategic Synthesis and Recommendations

**Research Status**: Scope confirmed by user on 2026-05-02. Proceeding to detailed market analysis.

---

## Customer Behavior and Segments

### Customer Behavior Patterns

The "build-your-own-agent" behavior pattern is now mainstream and growing fast. Custom GPTs already account for **~12% of daily ChatGPT usage**, and **20% of all Enterprise messages are processed via a Custom GPT or Project**, with weekly users of Custom GPTs/Projects up **~19× year-to-date**. OpenAI users have created **3M+ custom GPTs total**, of which **159K are public on the GPT Store**. ([First Page Sage](https://firstpagesage.com/seo-blog/chatgpt-usage-statistics/), [SEO.ai](https://seo.ai/blog/gpt-store-statistics-facts))

For developer-built agents, behavior is increasingly habitual, not exploratory: **71% of professional developers use an AI coding agent at least daily** (Stack Overflow Developer Survey 2026), and **79% of organizations** have adopted AI agents to some degree. ([Stack Overflow](https://survey.stackoverflow.co/2025/ai), [Warmly](https://www.warmly.ai/p/blog/ai-agents-statistics))

_Behavior Drivers:_ Speed to ship a prototype, plug-and-play retrieval, multi-agent coordination, "avoid reinventing the wheel," and automation of repetitive workflows. ([daily.dev](https://daily.dev/blog/ai-agents-guide-for-developers-langchain-crewai), [InstincTools](https://www.instinctools.com/blog/autogen-vs-langchain-vs-crewai/))
_Interaction Preferences:_ Discovery via category/leaderboard pages, fork & remix (HF Spaces fork model), one-click install/run, in-product chat as the primary engagement surface. Hugging Face Spaces alone draws **~10M monthly visits and 5M chat interactions**, with **25% of HF users using Spaces daily** — a strong proxy for browse-and-run agent behavior. ([wifitalents](https://wifitalents.com/hugging-face-statistics/))
_Decision Habits:_ Try-before-buy is dominant; users spin up free public agents first, with **conversion to paid driven by closed-loop value** (the agent finishes a measurable task) rather than soft-ROI copilots. ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-should-you-monetize-your-ai-features))

### Demographic Segmentation

_Builder demographics (uploaders):_ Skews heavily toward developers and prosumers. Hugging Face hosts **~500K active contributing developers** out of **~10M registered users (≈5% upload rate)**, with Spaces deployments at **150K (>100K from individuals)** — i.e., a long tail of independent builders is the dominant supply pattern in adjacent agent-marketplace ecosystems. ([wifitalents](https://wifitalents.com/hugging-face-statistics/), [LinkedIn / Analytics India](https://www.linkedin.com/posts/analytics-india-magazine_with-over-five-million-users-and-one-million-activity-7367492532940767232-Rhsc))
_Consumer demographics:_ ChatGPT-class user base — broad and globally distributed (52% female / 48% male per available reporting), spanning students, knowledge workers, SMB owners, and enterprise employees. ([resourcera](https://resourcera.com/data/artificial-intelligence/chatgpt-users/))
_Income Levels & Geography:_ Enterprise/large-org users overrepresent in production usage (**31% enterprise vs. 22% SMB** in production agents), but SMBs make up the **fastest-growing pilot cohort (54% pilot rate)** — a lucrative middle market. ([digitalapplied](https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points), [Joget](https://joget.com/ai-agent-adoption-in-2026-what-the-analysts-data-shows/))
_Education / Skill Levels:_ Two clear bands — (a) technical builders (developers, data folks, automation engineers) who want raw frameworks (LangChain, CrewAI, AutoGen), and (b) non-technical creators using GUI/no-code agent builders (GPT Store, MindStudio, Zapier Agents). ([fungies.io](https://fungies.io/ai-agent-frameworks-langchain-crewai-autogen-2026/), [MindStudio](https://www.mindstudio.ai/blog/creator-economy-ai-monetizing-agent-apps))

### Psychographic Profiles

_Values and Beliefs:_ Builders value reach (audience, distribution), reuse (don't rebuild), and recognition (leaderboard / verified badge). Consumers value reliability, time savings, and *trustworthy provenance* — a reaction against unvetted GPTs. ([Stactize](https://stactize.com/artikel/ai-agent-monetization-lessons-from-the-real-world/))
_Lifestyle Preferences:_ Always-on; weekly Custom-GPT users grew **~19×** YTD — habituation, not novelty. ([First Page Sage](https://firstpagesage.com/seo-blog/chatgpt-usage-statistics/))
_Attitudes and Opinions:_ **87% are concerned about agent accuracy** and **81% about security/privacy** — trust is the dominant emotional barrier. ([Warmly](https://www.warmly.ai/p/blog/ai-agents-statistics))
_Personality Traits:_ Builder side over-indexes on early-adopter / maker / status-seeking traits; consumer side over-indexes on ROI-seeking pragmatists. ([MindStudio](https://www.mindstudio.ai/blog/creator-economy-ai-monetizing-agent-apps))

### Customer Segment Profiles

_**Segment 1 — Indie Builders & Devs (the supply side, ~5–10% of users but produce ~80% of agents):**_ developers, AI tinkerers, prompt engineers, indie hackers. They upload to gain audience, validate ideas, monetize through tips/subs/marketplace splits, and signal expertise. They want: API access, version control, evals, transparent traffic/revenue analytics, and a path to monetization. ([Aalpha](https://www.aalpha.net/blog/how-to-monetize-ai-agents/), [MindStudio](https://www.mindstudio.ai/blog/creator-economy-ai-monetizing-agent-apps))

_**Segment 2 — Prosumer Creators (the no-code uploader long tail):**_ educators, marketers, niche-domain experts (legal, real estate, finance, e-learning — the top GPT Store categories). They build narrow, high-value, "personal-brand" agents. They want: simple builders, traffic via discovery, and gentle monetization (per-seat or credit-based). ([Demandsage](https://www.demandsage.com/chatgpt-statistics/), [SEO.ai](https://seo.ai/blog/gpt-store-statistics-facts))

_**Segment 3 — Knowledge-Worker & SMB Consumers (the demand side bulk):**_ marketers, ops, finance, customer-support teams; **agency adoption hit 41% shipped + 58% piloting in 2026** (vs. 9%/55% a year prior). Top workflows: brief/outline generation (64%), SEO audits (51%, highest reported ROI), customer service. They want: vetted agents, ROI metrics, integrations (CRM/Slack/Zapier), and predictable pricing. ([digitalapplied — agencies](https://www.digitalapplied.com/blog/agentic-ai-adoption-survey-2026-250-agencies))

_**Segment 4 — Enterprise Buyers (high ARPU, slow cycle):**_ **34% of enterprise teams run production agents vs. 19% mid-market vs. 7% SMB.** Top blockers: **pricing opacity (27%), commitment anxiety (28%), integration uncertainty (21%)**. They want: SOC2/governance, model-flexibility (no vendor lock-in), audit logs, on-prem or VPC options. ([digitalapplied](https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points), [Kai Waehner](https://www.kai-waehner.de/blog/2026/04/06/enterprise-agentic-ai-landscape-2026-trust-flexibility-and-vendor-lock-in/))

_**Segment 5 — Hobbyists & Discovery-Driven Consumers (the casual top of funnel):**_ ChatGPT-Plus subscribers, students, curious explorers. They drive raw traffic and word-of-mouth but rarely pay directly. ([Demandsage](https://www.demandsage.com/chatgpt-statistics/))

### Behavior Drivers and Influences

_Emotional Drivers (uploaders):_ Status (leaderboard rank, follower count), creative pride, fear of missing the "agent gold rush." _Emotional Drivers (consumers):_ Anxiety about being left behind in the AI shift; relief at offloading drudgery. ([MindStudio](https://www.mindstudio.ai/blog/creator-economy-ai-monetizing-agent-apps))
_Rational Drivers:_ Median reported ROI on agentic workflows is **3.2× over manual baseline**, with a top decile at **11×** — strong rational pull, though the bottom quartile is below break-even (0.7×), so "agent buying" is risky and requires social proof / review systems. ([digitalapplied — agencies](https://www.digitalapplied.com/blog/agentic-ai-adoption-survey-2026-250-agencies))
_Social Influences:_ Communities (Discord — HF's grew to 200K, Reddit, Twitter/X) drive most agent discovery; leaderboards and "trending" pages are the gravity well. ([wifitalents](https://wifitalents.com/hugging-face-statistics/))
_Economic Influences:_ The AI-agent market is **projected to grow from $5.4B (2024) → $7.6B (2025) → $47.1B (2030) at 45.8% CAGR** — a deeply rising tide. ([Warmly](https://www.warmly.ai/p/blog/ai-agents-statistics))

### Customer Interaction Patterns

_Research and Discovery:_ Category browse → leaderboards → trending → influencer/Discord recommendation → direct search. GPT Store, HF Spaces, and LangChain Hub all converge on this UX. ([SEO.ai](https://seo.ai/blog/gpt-store-statistics-facts), [wifitalents](https://wifitalents.com/hugging-face-statistics/))
_Purchase Decision Process:_ Free public try → side-by-side compare → install / fork → light paid use → upgrade. Closed-loop, outcome-priced agents convert at materially higher rates than copilot-style "advice" agents. ([Bessemer](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook), [Chargebee](https://www.chargebee.com/blog/pricing-ai-agents-playbook/))
_Post-Purchase Behavior:_ Heavy session habituation when ROI is visible; rapid churn when value is "soft." Lovable-style per-new-user-with-included-credits is emerging as the prosumer-monetization standard. ([Bessemer](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook))
_Loyalty and Retention:_ Driven by (a) integrations into the user's existing tools, (b) provenance/trust signals, (c) accumulated user data/memory inside the agent. ([Salesmate](https://www.salesmate.io/blog/future-of-ai-agents/))

### Confidence & Gaps

_High confidence:_ Aggregate adoption metrics, custom-GPT usage trajectories, market-size CAGR, segment-level adoption rates (multiple corroborating sources).
_Medium confidence:_ Behavioral drivers and segment psychographics (single-source in places, qualitative).
_Gap to close in Step 3:_ Direct competitor traffic / take-rate / monetization data for GPT Store, Salesforce AgentExchange, Microsoft Copilot Studio gallery, Zapier Agents, Replit Agents, Poe — to be addressed in the competitive landscape step.

---

## Customer Pain Points and Needs

### Customer Challenges and Frustrations

The clearest single insight: **the incumbent GPT Store has structural pain points that have already pushed savvy creators elsewhere.** "Smart developers have stopped chasing viral consumer GPTs and pivoted to where the real money is: B2B consulting and enterprise internal GPTs." ([The GPT Shop](https://www.thegptshop.online/blog/openai-gpt-store-revenue-sharing))

_Primary Frustrations (builders):_
- **Opaque revenue algorithm.** "Revenue is calculated on 'engagement' metrics that remain intentionally opaque… you can't optimize for something you can't measure." Average payout **~$0.03 per conversation**; soft ceiling **$100–500/month** unless top 0.01%; you need **~33,000 quality conversations to earn $1,000/month**. ([The GPT Shop](https://www.thegptshop.online/blog/openai-gpt-store-revenue-sharing))
- **Geographic exclusion.** GPT Store revenue share is gated to a small set of countries; non-US/EU builders are de facto locked out of monetization. ([OpenAI Community](https://community.openai.com/t/guidance-for-gpt-store-builders-outside-the-us/1357911))
- **Discoverability is broken.** Recurring user reports: "Wolfram's GPT has been pick of the week since January", search returns nothing for partial words, custom GPTs disappear from search inexplicably, the explore page is "static and generic." ([OpenAI Community — discoverability](https://community.openai.com/t/feedback-discoverability-of-gpts-needs-improvement/585652), [OpenAI Community — disappearing GPTs](https://community.openai.com/t/explore-gpts-no-longer-shows-our-custom-gpt-when-searching-the-store/1266123))
- **Vendor-lock-in penalty.** Anthropic recently restricted standard Claude subscription users from running popular open-source agent frameworks, pushing them to pay-as-you-go — "criticized as a ban disguised as a pricing change." ([TechBuzz](https://www.techbuzz.ai/articles/openai-and-anthropic-hit-the-ai-monetization-cliff))

_Primary Frustrations (consumers/buyers):_
- **Hallucination/accuracy** — *"Inaccuracy is the leading reported risk from generative AI… yet only 32% of companies say they are actively mitigating it."* ([Airia](https://airia.com/ai-hallucination-explained-causes-risks-and-enterprise-safeguards/))
- **No quality vetting on most marketplaces** — see Adoption Barriers below.
- **Confident-but-incorrect outputs** create what one analyst calls an *"enterprise trust crisis"*. ([Yuyjo](https://www.yuyjo.com/archives/62784))

_Service Pain Points:_ Custom GPT knowledge-retrieval failures and document-reading bugs are common forum complaints. ([OpenAI Community — knowledge retrieval](https://community.openai.com/t/custom-gpts-cannot-even-retrieve-information-from-its-custom-knowledge/878908), [OpenAI Community — uploaded docs](https://community.openai.com/t/issue-with-custom-gpt-not-reading-uploaded-documents-properly/1143059))
_Frequency Analysis:_ Discoverability and revenue-share complaints recur monthly in OpenAI's own developer forum from late 2024 through 2026 — i.e. **persistent, unaddressed**, not transient.

### Unmet Customer Needs

_Critical Unmet Needs:_

1. **Transparent, generous, global creator monetization.** Anthropic offers some developers **50% of API revenue** — vs. OpenAI's opaque engagement model often yielding **1–3%** effective share. ([TechBuzz](https://www.techbuzz.ai/articles/openai-and-anthropic-hit-the-ai-monetization-cliff)) **No major store currently offers a clean, global, transparent revenue share with proper analytics.**
2. **Model-agnostic agents.** Builders are forced to maintain separate variants for GPT Store / Claude / Gemini / Copilot. A platform that lets one agent run on any LLM — and switch backends — fills a wide-open gap.
3. **Trust/quality layer** — independent eval scores, vetted-publisher badges, malicious-code scanning, sandboxed execution. **OWASP 2025 found 61% of AI agent skill marketplaces had zero automated scanning for malicious code.** ([InfoQ — securing agents](https://www.infoq.com/articles/securing-autonomous-ai-agents-kubernetes/))
4. **Personalized, intent-aware discovery** — current explore pages are static; users need "agents that solve *my* job" not "popular this week".
5. **Closed-loop, outcome-priced agents** — buyers reject soft-ROI copilots; they pay for measurable task completion.

_Solution Gaps:_ Cross-LLM portability • independent quality benchmarks • creator analytics dashboards • outcome-based pricing infrastructure.
_Market Gaps:_ Global creator monetization • verticalized (vs. generic) marketplaces • trust-layer-as-a-service for agents.
_Priority Analysis:_ #1 trust/quality, #2 monetization transparency, #3 discoverability, #4 model-agnosticism, #5 governance for enterprise.

### Barriers to Adoption

_Price Barriers:_ **27% of SMBs cite pricing opacity** as the top blocker (digitalapplied). Per-seat SaaS pricing increasingly mismatches AI-agent value, but usage-based pricing creates billing-anxiety friction. ([digitalapplied — agencies](https://www.digitalapplied.com/blog/agentic-ai-adoption-survey-2026-250-agencies))
_Technical Barriers:_ **21% cite integration uncertainty.** Connecting agents to existing CRMs/ticketing/data stores remains hard; "siloed data" is a recurrent enterprise pain. ([digitalapplied](https://www.digitalapplied.com/blog/ai-agent-adoption-2026-enterprise-data-points), [Onix](https://www.onixnet.com/blog/3-common-enterprise-pain-points-and-how-agentic-ai-delivers-breakthrough-value/))
_Trust Barriers:_ **96% of developers don't fully trust AI-generated code without manual review** (Sonar 2026). **87% of all respondents are concerned about agent accuracy; 81% about security/privacy.** ([The New Stack](https://thenewstack.io/agentic-ai-verification-impact/), [Warmly](https://www.warmly.ai/p/blog/ai-agents-statistics))
_Convenience Barriers:_ **28% cite commitment anxiety** — buyers don't want to be locked in. Discoverability friction (above) is a major top-of-funnel barrier.

### Service and Support Pain Points

_Customer Service Issues:_ Forum-driven support on incumbents (OpenAI Community) is slow and inconsistent; structural bugs (search, knowledge retrieval) persist for months without official acknowledgement. ([OpenAI Community examples](https://community.openai.com/t/custom-gpts-has-some-problems/1103533))
_Support Gaps:_ No SLA on free tiers; enterprise support exists but "siloed data" gaps are not addressed by the platform. ([Onix](https://www.onixnet.com/blog/3-common-enterprise-pain-points-and-how-agentic-ai-delivers-breakthrough-value/))
_Communication Issues:_ Builders complain of zero feedback loop — agents disappear from search with no notification; revenue criteria undocumented.
_Response Time Issues:_ Sometimes weeks-long resolution on bug reports in public forums.

### Customer Satisfaction Gaps

_Expectation Gaps:_ Builders expect creator-economy economics (à la YouTube, Substack); they get sub-1% effective royalty rates with no cohort transparency.
_Quality Gaps:_ Buyers expect curation; they get a flood of low-quality SEO-spam GPTs and thin wrappers. Current marketplaces "treat agent approval as a progressive trust problem" but most haven't operationalized it. ([anationofmoms — CISO guide](https://anationofmoms.com/2026/04/the-cisos-guide-to-approving-ai-agents-in-the-enterprise.html))
_Value Perception Gaps:_ "Copilots offering advice without closing the loop live in dangerous soft ROI territory — customers question 'are we really getting value?'" ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-should-you-monetize-your-ai-features))
_Trust and Credibility Gaps:_ Confident-but-wrong outputs erode trust faster than no answer at all.

### Emotional Impact Assessment

_Frustration Levels:_ **High** among non-US builders (locked out of monetization) and serious creators (opaque ranking). **Medium-high** among enterprise buyers (security/governance friction).
_Loyalty Risks:_ Material — creators are actively migrating to direct sales, MindStudio, Anthropic, and self-hosted approaches. ([Frenchie T](https://www.francescatabor.com/articles/2025/10/19/monetising-custom-gpts), [MindStudio](https://www.mindstudio.ai/blog/best-ai-agent-builders-monetize-public-apps))
_Reputation Impact:_ "AI Agents Face Enterprise Trust Crisis" headlines and database-deletion incidents are normalizing skepticism. ([Dark Reading](https://www.darkreading.com/cloud-security/ais-so-smart-keep-deleting-production-databases))
_Customer Retention Risks:_ Builder-side churn risk is **acute** for any marketplace that doesn't fix monetization transparency. Buyer-side churn risk is acute for any marketplace that lets bad agents through unvetted.

### Pain Point Prioritization

| Priority | Pain Point | Affects | Solution Opportunity for `datasetai.xyz` |
|---|---|---|---|
| 🔴 **P0** | Opaque & paltry creator monetization (and geo-locked) | Builders globally | Transparent rev-share + global payouts + analytics |
| 🔴 **P0** | No automated security/quality vetting (61% of agent stores have none) | Buyers & enterprises | Mandatory eval + sandbox + verified-publisher badge |
| 🔴 **P0** | Hallucination / accuracy / "confident-but-wrong" | Buyers & enterprises | Independent eval scores per agent, with task-level success metrics |
| 🟠 **P1** | Discoverability — static explore pages, broken search | Both sides | Personalized, intent-aware, vertical-aware discovery |
| 🟠 **P1** | Vendor lock-in to one LLM ecosystem | Builders & buyers | Model-agnostic runtime — bring your own LLM key |
| 🟠 **P1** | Pricing opacity / commitment anxiety | SMB buyers | Usage- and outcome-based pricing with predictable caps |
| 🟡 **P2** | Integration friction (CRM, Slack, Zapier) | SMB & enterprise | Built-in integrations layer or open MCP/tool hub |
| 🟡 **P2** | Soft-ROI copilots vs. closed-loop agents | Buyers | Default to outcome agents, expose success metrics |
| 🟢 **P3** | Forum-only support / no SLA | Builders | Tiered support + creator-success program |

_Source: synthesized from above citations._

### Confidence & Gaps

_High confidence:_ Discoverability complaints, revenue-share opacity, trust/security marketplace gaps (multi-source).
_Medium confidence:_ Specific revenue-share percentages — figures vary by source and time. The "1–3% to creator" claim is a community estimate, not OpenAI-published.
_Gap to close in Step 4:_ Decision-process detail — *how* enterprise/SMB buyers actually evaluate and procure agents (RFP shape, eval criteria, time-to-decide).

---

# 🔄 Strategic Pivot — Concept Re-frame

> **The original concept brief described a "web platform where users upload their own agents and download existing ones." Steps 1–3 above analyzed this as a *hosted-runtime marketplace* (à la GPT Store / Poe / HuggingFace Spaces). On 2026-05-02, the user clarified the actual product is a *registry of agent definition files* (`.md` / `.json` / `.toml` / etc.) — users upload agent specs, others download them and run them locally in their own tooling (`.claude/skills/`, `.cursorrules`, `AGENTS.md`, MCP servers, system prompts, etc.) or via API with their own LLM key.**

This is a **fundamentally different product** with a **fundamentally different competitive landscape and economics**. The Steps 1–3 analysis remains useful for context (demand for "agents" is still demand for agents) but the competitor set, monetization model, and strategic position all change materially. Below: the corrected analysis.

## Corrected Product Definition

- "Agent" = a definition file (or small folder) containing instructions, tools, persona, configs
- Users **upload** the file/folder; others **download** and drop into:
  - `.claude/skills/` (Claude Code) — exactly how BMAD itself was installed
  - `.cursor/rules/` or `.cursorrules` (Cursor)
  - `AGENTS.md` (cross-tool: Codex, Aider, Copilot, Gemini CLI, Cursor, Windsurf — 55+ tools, Linux-Foundation-stewarded)
  - `system_prompt` field (API calls)
  - MCP server configs
- **No hosted execution.** Users bring their own LLM. **Zero compute cost on the platform side.**

## Three Concurrent Demand Waves (2026)

1. **MCP servers** — 9,400+ across 4 major registries (Q2 2026), **+58% QoQ, 7.8× YoY** (1,200 in Q1 2025); forecast 18,000+ by year-end. ([digitalapplied — MCP](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol), [digitalapplied — forecast](https://www.digitalapplied.com/blog/mcp-adoption-wave-6-month-forecast-q2-q3-2026))
2. **AGENTS.md / Claude Skills** — AGENTS.md adopted across **60,000+ open-source projects**, stewarded by Linux Foundation (Agentic AI Foundation), works on 55+ tools. Claude Code does NOT yet support AGENTS.md natively (open issue with 1000s of upvotes). ([agents.md](https://agents.md/), [hivetrail](https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard))
3. **Mass-market coding agents** — Cursor at 1M+ DAU / 360K paying / **$2B annualized revenue** (Feb 2026). AI prompt marketplace TAM: $1.94B → $2.51B at 29.5% CAGR. ([Shipper Cursor stats](https://shipper.now/cursor-stats/), [Business Research Co.](https://www.thebusinessresearchcompany.com/report/artificial-intelligence-ai-prompt-marketplace-market-report))

## Competitive Landscape (Corrected)

### Tier 1 — Closest direct competitors

| Player | Scale | Model | Moat | Weakness — your opening |
|---|---|---|---|---|
| **VoltAgent / awesome-agent-skills** | 16.5K stars, 1.8K forks, 1,400+ skills, cross-tool (Claude/Codex/Cursor/Gemini CLI/Aider/Trae/Kimi/MCP), CLI installer ([GitHub](https://github.com/VoltAgent/awesome-agent-skills)) | Free awesome-list | Cross-tool from day one, real momentum | GitHub-as-frontend; no creator monetization, no analytics, no quality vetting, no private/team registries — *a list, not a product* |
| **Smithery.ai** | 7,000+ MCP servers, 290.5K monthly visits, "Docker Hub for MCPs" ([Smithery](https://smithery.ai/), [WorkOS](https://workos.com/blog/smithery-ai)) | Free to list/install; usage-based on hosted runtime | Strong CLI dev UX, default destination for MCP | MCP-only; no creator monetization; not even largest by raw count (Glama 21K, MCP.so 19.7K, PulseMCP 11.8K) |
| **PromptBase** | 130K+ prompts, ~250K users, top creators $500–$1,500/mo passive ([SoftHub](https://softhubtools.com/promptbase-review-2026-buy-sell-make-money-ai-prompts/)) | $1.99–$9.99 paid; **80%/20% rev share, 90% on referrals/custom jobs** | Mature payment infra, real seller incomes, brand | Prompt-format-only; quality lottery (3.6/5 on Alternatives.co); no refunds; buyer cost-escalation pain |
| **SkillsMP** | 425K–500K+ skills aggregated (≥2 stars filter — basically no quality bar) ([SmartScope](https://smartscope.blog/en/blog/skillsmp-marketplace-guide/)) | Free; "currently in collection phase," no monetization | Largest raw count, broad search | **No CLI, no installer** (manual copy); no creator economics; passive scrape; not a venture |
| **prompts.chat** | 143K GitHub stars; 100+ curated; Forbes/Harvard/Columbia citations; self-hostable ([GitHub](https://github.com/f/prompts.chat)) | Pure community OSS, no monetization | Massive top-of-funnel SEO, brand authority | Free-only; no monetization; small actual content; no installer |
| **cursor.directory** | Tens of thousands MAU est.; default for Cursor `.cursorrules` | Community-driven; copy-paste UX; no monetization | Default for Cursor users | Cursor-only; copy-paste, not installer |

### Tier 2 — Adjacent MCP registries

PulseMCP (11,840+ servers, hand-reviewed daily by founder), Glama (21,000+, largest), MCP.so (19,700+, community-submitted), Official Anthropic MCP registry — all free, all MCP-only, none with creator monetization. ([truefoundry](https://www.truefoundry.com/blog/best-mcp-registries))

### Tier 3 — Future first-party threats (12–24 months)

- **Anthropic** — likely to launch official Skills marketplace; will be **Claude-only**, killing them in cross-tool plays
- **OpenAI** — Apps SDK / Agents marketplace direction; **OpenAI-ecosystem-only**
- **Cursor** — likely to grow `cursor.directory` into a real registry; **Cursor-only**
- **Linux Foundation / Agentic AI Foundation** — stewards AGENTS.md; could launch a canonical registry; would likely be free/non-commercial → still leaves the *paid creator economy* lane open

## The White Space (Corrected)

Two-axis map:

```
                    │ Single-format          Multi-format
─────────────────────┼──────────────────────────────────────────
Creator monetized   │ PromptBase             ◀── 🎯 datasetai.xyz
Free / no economics │ Smithery, cursor.dir   VoltAgent, SkillsMP, prompts.chat
```

**No competitor sits in the top-right quadrant: multi-format + creator-monetized.** That is the wedge.

## Strategic Verdict (Corrected Concept)

| Question | Verdict | Confidence |
|---|---|---|
| Strong demand? | ✅✅ Very strong — three concurrent waves | High |
| Achievable traffic? | ✅ Yes, with a focused wedge — fragmented competition, no dominant unifier | Medium-high |
| Viable monetization? | ✅ Yes — PromptBase economics validated; expand model to agents | High |
| Indie-bootstrap viable? | ✅ Yes — zero compute cost, software margins from day one | High |
| Window of opportunity? | ⚠️ Open NOW, narrowing in 12–24 months as first-party registries emerge | Medium |

## Recommended Strategic Position

**Tagline:** *"npm for AI agents — works with every coding agent, every LLM, every format."*

**Phased roadmap:**
- **Phase 1 (months 0–6):** Dominate **Claude Code Skills + MCP servers** with `npx datasetai install <agent>` CLI. Free tier with discovery + install + GitHub-source-import.
- **Phase 2 (months 6–12):** Add **AGENTS.md, .cursorrules, .aider.conf.yml, Codex** support. Cross-tool position established. Launch **paid creator program** (70–80% revenue share — match PromptBase floor).
- **Phase 3 (year 2+):** Private registries for teams/enterprise (SOC2, on-prem), commercial agents, evals/sandbox/quality layer, agent bundles.

## Three Defensible Differentiators

1. **🌐 Format-agnostic** — Claude Skills + MCP + AGENTS.md + .cursorrules + system prompts in one place, one CLI.
2. **💰 Creator monetization** — match PromptBase 80% rev share, but for *agents* not just prompts. Bundles, subs, paid publishing. *Nobody currently pays MCP authors or Claude-skill authors.*
3. **✅ Quality & trust layer** — independent eval scores, sandboxed previews, verified publishers, malicious-code scanning. *Hard for awesome-list-style competitors to replicate without becoming a real product.*

## Three Attack Moves at Launch

1. **Bootstrap supply via auto-mirroring** — index VoltAgent + SkillsMP + Smithery + cursor.directory + prompts.chat with attribution and a "claim your listing → monetize it" CTA.
2. **One-command cross-format install** — `npx datasetai install <agent>` auto-detects the user's tool and writes to the right folder.
3. **Founding-creator program** — 20–50 high-output builders (especially refugees from GPT Store, frustrated PromptBase sellers, top VoltAgent contributors) with upgraded 90% rev share for the first 6 months.

## What Not to Do

- Don't build hosted agent execution — stay registry-only
- Don't fight VoltAgent on free awesome-list mindshare — sit above it
- Don't expand all formats on day one — Claude Skills + MCP first, then expand

## Realistic Outcome Ladder

| Stage | Timeline | Outcome |
|---|---|---|
| Indie / lifestyle | Year 1 | $50K–$300K ARR, 10K–50K MAU |
| Mid-success | Year 2 | $500K–$2M ARR, 100K–500K MAU |
| Breakout | Year 3 | $2M–$15M ARR, 1M+ MAU |
| Venture-scale outcome | Year 3+ | Realistic IF default cross-tool unifier before incumbents catch up. Acquisition by Cursor / Anthropic / OpenAI / a Linux-Foundation entity is a plausible exit. |

## Confidence & Gaps

_High confidence:_ Demand waves, competitor gaps, fragmented landscape, monetization viability (PromptBase as proof).
_Medium confidence:_ Specific cursor.directory traffic figures (hard to isolate from Cursor IDE data); long-term first-party-registry timing.
_Open questions for Stage 4–6 of the BMAD flow (deferred):_ Customer decision processes (RFP shape for buyers), enterprise sales motion, exact MVP feature scope, defensibility scoring vs. each competitor over a 24-month horizon.

---

_End of corrected analysis. Original Steps 1–3 above remain valid context for the broader "agent demand" picture; this Strategic Pivot section is the operative analysis going forward._
