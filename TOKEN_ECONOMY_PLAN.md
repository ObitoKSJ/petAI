# Token Economy & Business Model Plan

> **Important finding:** The current codebase uses `kimi-k2-turbo-preview` for text — this is
> the **most expensive** Kimi variant ($1.15/$8.00 per M tokens). Switching to standard `kimi-k2-0905`
> would immediately save ~47% on input and ~69% on output with no quality loss for a chat app.

## 1. Model Selection Matrix

### Kimi (Moonshot AI) Models

| Model | Role | Input $/M | Output $/M | Cached $/M | Context | Speed |
|-------|------|-----------|------------|------------|---------|-------|
| **kimi-k2.5** | Vision + Reasoning | $0.60 | $3.00 | $0.10 | 256K | ~40 tok/s |
| **kimi-k2-0905** | Text Conversation | $0.60 | $2.50 | $0.15 | 256K | ~39 tok/s |
| kimi-k2-turbo (current!) | Fast Text (avoid) | $1.15 | $8.00 | $0.15 | 128K | ~60 tok/s |

### Qwen (Alibaba Cloud / DashScope) Models

| Model | Role | Input $/M | Output $/M | Context | Notes |
|-------|------|-----------|------------|---------|-------|
| **qwen3-vl-plus** | Vision (best) | $0.26 | $2.08 | 262K | Cache support, thinking mode |
| **qwen3-vl-flash** | Vision (budget) | $0.065 | $0.52 | 262K | Great perf/cost ratio |
| qwen-vl-max | Vision (legacy) | $0.80 | $3.20 | 32K | Qwen2.5-VL, being superseded |
| **qwen-turbo** | Text (budget) | $0.05 | $0.20 | 1M | Extremely cheap |
| **qwen-plus** | Text (balanced) | $0.40 | $1.20 | 129K | Good quality/cost balance |
| qwen-max | Text (premium) | $1.60 | $6.40 | 32K | Overkill for chat |

### Recommended Model Pairings

| Stack | Vision Model | Text Model | Best For |
|-------|-------------|------------|----------|
| **Qwen Budget** | qwen3-vl-flash | qwen-turbo | Max scale, cost-sensitive |
| **Qwen Balanced** | qwen3-vl-plus | qwen-plus | Quality + reasonable cost |
| **Kimi Full** | kimi-k2.5 | kimi-k2 | Simplest (already integrated) |
| **Hybrid** | qwen3-vl-flash | qwen-plus | Budget vision, quality text |

---

## 2. Internal Cost Analysis

### Current App Token Profile

Based on codebase analysis (`src/services/ai.ts`, `src/services/session.ts`, `src/lib/prompts.ts`):

| Component | Tokens | Frequency |
|-----------|--------|-----------|
| System prompt | ~1,375 | Every request |
| Tool definitions | ~300 | Every request |
| User message (short) | 50-100 | Per turn |
| User message (detailed + image) | 300-600 | Per turn |
| Conversation history | 400-4,000 | Grows per turn |
| Max assistant output | 1,024 | Per turn |
| Tool call + result | ~600 | Per product search |
| **Session hard limit** | **6,000** | History truncation |

### Per-Request Cost (by turn position)

History grows linearly. Early turns are cheap; later turns are expensive.

| Turn # | ~Input Tokens | ~Output Tokens | Kimi-k2 Cost | Qwen-Plus Cost | Qwen-Turbo Cost |
|--------|--------------|----------------|-------------|----------------|-----------------|
| 1 | 1,750 | 400 | $0.0021 | $0.0012 | $0.00017 |
| 4 | 3,200 | 450 | $0.0030 | $0.0018 | $0.00025 |
| 8 | 4,800 | 500 | $0.0041 | $0.0025 | $0.00034 |
| Vision turn | +500 img | 500 | +$0.0018* | +$0.0015** | +$0.00003*** |

\* kimi-k2.5, \** qwen3-vl-plus, \*** qwen3-vl-flash

### Per-Session Cost (Typical Session: 8 exchanges, 1 image, 1 tool call)

**Total tokens per session (estimated):**
- Input: ~25,000 tokens (cumulative across 8 requests)
- Output: ~4,200 tokens

| Stack | Cost/Session | Breakdown |
|-------|-------------|-----------|
| **Kimi Full** | **$0.026** | Text: $0.021, Vision: $0.005 |
| **Qwen Balanced** | **$0.015** | Text: $0.012, Vision: $0.003 |
| **Hybrid** (vl-flash + plus) | **$0.013** | Text: $0.012, Vision: $0.001 |
| **Qwen Budget** | **$0.002** | Text: $0.0016, Vision: $0.0004 |

### Monthly Infrastructure Cost at Scale

Assumptions: 2 sessions/user/day, 30 days/month

| DAU | Sessions/mo | Kimi Full | Qwen Balanced | Hybrid | Qwen Budget |
|-----|------------|-----------|---------------|--------|-------------|
| 1K | 60K | **$1,560** | $900 | $780 | **$120** |
| 10K | 600K | **$15,600** | $9,000 | $7,800 | **$1,200** |
| 50K | 3M | **$78,000** | $45,000 | $39,000 | **$6,000** |
| 100K | 6M | **$156,000** | $90,000 | $78,000 | **$12,000** |

### Supporting Infrastructure Costs (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Zilliz Cloud (Serverless) | ~$0-65 | Free tier covers small product catalog |
| OpenAI Embeddings (text-embedding-3-small) | ~$1-5 | $0.02/M tokens, minimal for product search |
| Vercel Hosting (Pro) | ~$20 | Next.js deployment |
| **Total fixed overhead** | **~$50-90/mo** | Before AI model costs |

---

## 3. Cost Optimization Strategies

### A. Prompt-Level (Immediate, No Code Change)

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Trim system prompt | ~15-20% input | Remove verbose formatting instructions, compress to ~900 tokens |
| Conditional tool injection | ~15% input | Only include `search_products` tool schema when conversation is product-relevant |
| Lower `max_tokens` for simple Q&A | ~20% output | Use 512 for non-emergency, 1024 for emergency/detailed |

### B. Architecture-Level (Medium Effort)

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| **Sliding window** (last 5 messages) | 30-40% input | Replace full history with recent window + summary |
| **Prompt caching** | 60-75% on system prompt | Kimi auto-caches; Qwen supports context cache for VL models |
| **Model routing** | 40-60% overall | Route simple questions to qwen-turbo, complex/emergency to qwen-plus |
| **Conversation summarization** | 25-35% input | Summarize older messages into a single context block |

### C. Infrastructure-Level (Higher Effort)

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| **Batch API** for non-urgent | 50% | Qwen offers 50% batch discount |
| **Self-host open-source** | 60-80% | Host qwen3-vl-flash or kimi-k2.5 (open-source) on GPU cluster |
| **Replace OpenAI embeddings** | 100% | Switch to Qwen's own embedding model or local model |

### Projected Optimized Cost (with sliding window + model routing + prompt cache)

| DAU | Kimi Optimized | Qwen Balanced Optimized | Qwen Budget Optimized |
|-----|---------------|------------------------|-----------------------|
| 10K | ~$6,200 | ~$3,600 | ~$500 |
| 50K | ~$31,000 | ~$18,000 | ~$2,500 |
| 100K | ~$62,000 | ~$36,000 | ~$5,000 |

---

## 4. External Business Model

### Recommended Pricing Tiers

#### Tier 1: Free (Acquisition)
- **Price:** $0
- **Limits:** 3 sessions/day, 5 messages/session
- **Model:** qwen-turbo + qwen3-vl-flash (cheapest stack)
- **Features:** Basic pet care Q&A, 1 image/day
- **Our cost/user/month:** ~$0.18
- **Purpose:** User acquisition, viral growth

#### Tier 2: Pet Parent Pro (Core Revenue)
- **Price:** $6.99/month (¥49.9/month)
- **Limits:** 20 sessions/day, unlimited messages/session
- **Model:** qwen-plus + qwen3-vl-plus
- **Features:** Full image analysis, product recommendations, priority response
- **Our cost/user/month:** ~$3.60 (assumes 4 sessions/day avg)
- **Gross margin:** ~49%
- **Purpose:** Primary revenue driver

#### Tier 3: Emergency Plus (Premium)
- **Price:** $14.99/month (¥99.9/month)
- **Limits:** Unlimited sessions, unlimited messages
- **Model:** qwen-plus + qwen3-vl-plus (or kimi-k2.5 for vision)
- **Features:** 24/7 emergency priority queue, detailed health reports, vet referral integration, multi-pet profiles
- **Our cost/user/month:** ~$6.00 (assumes 6 sessions/day avg, power users)
- **Gross margin:** ~60%
- **Purpose:** High-value pet parents, emergency use case

#### Enterprise / B2B (Vet Clinics)
- **Price:** Custom ($99-499/month)
- **Model:** Best available, white-labeled
- **Features:** Clinic branding, patient intake bot, after-hours triage, API access
- **Purpose:** Recurring enterprise revenue

### Revenue Projections

Assuming conversion funnel: 70% Free, 25% Pro, 5% Emergency Plus

| DAU | Free Users | Pro Users | Plus Users | Monthly Revenue | Monthly AI Cost | Gross Margin |
|-----|-----------|-----------|------------|-----------------|-----------------|--------------|
| 1K | 700 | 250 | 50 | $2,497 | $1,080 | 57% |
| 10K | 7,000 | 2,500 | 500 | $24,970 | $10,800 | 57% |
| 50K | 35,000 | 12,500 | 2,500 | $124,850 | $54,000 | 57% |
| 100K | 70,000 | 25,000 | 5,000 | $249,700 | $108,000 | 57% |

*AI Cost uses Qwen Balanced stack with optimization strategies applied.*

---

## 5. Recommendation

### Phase 1: Launch (0-10K DAU)
- **Stack:** Qwen Balanced (qwen-plus + qwen3-vl-plus)
- **Why:** Best quality/cost ratio. Qwen's DashScope API is OpenAI-compatible, so integration is minimal — just add a new provider config in `src/services/ai.ts`.
- **Action items:**
  1. Add `qwen` provider in `ai.ts` with `dashscope` base URL
  2. Implement sliding window (last 6 messages + summary) in session management
  3. Add model routing: simple questions → qwen-turbo, complex → qwen-plus
  4. Launch with Free + Pro tiers
- **Expected cost:** $900-9,000/month for AI

### Phase 2: Growth (10K-50K DAU)
- **Stack:** Hybrid with routing (qwen-turbo for simple, qwen-plus for complex, qwen3-vl-flash for images)
- **Why:** Model routing can cut costs by 40-60% without quality loss on simple queries
- **Action items:**
  1. Build intent classifier (can use qwen-turbo itself) to route requests
  2. Implement prompt caching via Qwen's context cache API
  3. Trim system prompt to essential instructions
  4. Introduce Emergency Plus tier
- **Expected cost:** $3,600-18,000/month for AI

### Phase 3: Scale (50K+ DAU)
- **Stack:** Self-hosted open-source models + API fallback
- **Why:** At scale, self-hosting kimi-k2.5 / qwen3-vl-flash on GPU clusters is 60-80% cheaper
- **Action items:**
  1. Deploy qwen3-vl-flash on dedicated GPU cluster (e.g., A100 instances)
  2. Use API as fallback for capacity spikes
  3. Consider Alibaba Cloud savings plans (pre-purchase discounts)
  4. Launch B2B / vet clinic tier
- **Expected cost:** $5,000-20,000/month for AI (with self-hosting)

### Why Qwen Over Kimi for Production

| Factor | Kimi | Qwen | Winner |
|--------|------|------|--------|
| Text conversation cost | $0.60/$2.50 | $0.05-0.40/$0.20-1.20 | **Qwen** (3-12x cheaper) |
| Vision cost | $0.60/$3.00 | $0.065-0.26/$0.52-2.08 | **Qwen** (1.5-9x cheaper) |
| Budget floor | ~$0.026/session | ~$0.002/session | **Qwen** (13x cheaper) |
| Model variety | 3 models | 10+ models | **Qwen** (more routing options) |
| Context window | 256K | Up to 1M (turbo) | **Qwen** |
| Open-source self-host | Yes (k2.5) | Yes (all models) | Tie |
| API compatibility | OpenAI-compatible | OpenAI-compatible | Tie |
| Existing integration | Already built | Needs new provider | **Kimi** |
| Batch discount | None documented | 50% batch discount | **Qwen** |
| Regional availability | CN-primary | CN + International | **Qwen** |

**Bottom line:** Keep Kimi as a working fallback (it's already integrated), but migrate primary traffic to Qwen for production. The cost difference at scale is massive — $12K/month vs $156K/month at 100K DAU on the budget stack.

---

## Sources

- [Moonshot AI Official Pricing](https://platform.moonshot.ai/docs/pricing/chat)
- [Alibaba Cloud Model Studio Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- [Kimi K2.5 Analysis - Artificial Analysis](https://artificialanalysis.ai/models/kimi-k2-5)
- [Kimi K2 Pricing - pricepertoken.com](https://pricepertoken.com/pricing-page/model/moonshotai-kimi-k2)
- [Qwen API Pricing - pricepertoken.com](https://pricepertoken.com/pricing-page/provider/qwen)
- [Qwen API Pricing Guide - DeepInfra](https://deepinfra.com/blog/qwen-api-pricing-2026-guide)
- [OpenAI Embeddings Pricing](https://platform.openai.com/docs/pricing)
- [Zilliz Cloud Pricing](https://zilliz.com/pricing)
