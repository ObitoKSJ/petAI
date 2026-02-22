# Token Economy & Business Model Plan

> **Critical findings:**
> 1. The codebase currently uses `kimi-k2-turbo-preview` — the **most expensive** Kimi variant ($1.15/$8.00/M).
> 2. **Qwen3.5-Plus** (released Feb 15, 2026) is a game-changer: native multimodal (text + vision + video)
>    at just **$0.11/$0.28 per M tokens** with 1M context. It handles BOTH conversation and image analysis
>    in a single model, eliminating the need for separate vision/text models.
> 3. Qwen-Turbo is **deprecated** — replaced by Qwen-Flash ($0.05/$0.40/M).

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
| **qwen3.5-plus** (NEW) | Vision + Text (unified) | $0.11 | $0.28 | **1M** | Released Feb 15, 2026. Native multimodal. Best value. |
| qwen-plus | Text (maps to 3.5-plus) | $0.11 | $0.28 | 1M | Same model as qwen3.5-plus |
| **qwen-flash** | Text (budget) | $0.05 | $0.40 | 1M | Replaces deprecated qwen-turbo |
| qwen3-vl-plus | Vision (Qwen3 gen) | $0.26 | $2.08 | 262K | Superseded by qwen3.5-plus |
| qwen3-vl-flash | Vision (Qwen3 budget) | $0.065 | $0.52 | 262K | Still viable for ultra-budget vision |
| ~~qwen-turbo~~ | ~~Text (budget)~~ | ~~$0.04~~ | ~~$0.08~~ | ~~1M~~ | **Deprecated.** Use qwen-flash instead. |
| qwen-vl-max | Vision (legacy) | $0.42 | $1.67 | 32K | Qwen2.5-VL, being superseded |
| qwen-max | Text (premium) | $0.28 | $0.83 | 32K | Overkill for chat |

> **CNY reference** (at ~7.2 CNY/USD): qwen3.5-plus = ¥0.80/1K input, ¥2.00/1K output.
> Thinking-mode output is higher at $1.11/M ($0.008 CNY/1K).

### Recommended Model Pairings

| Stack | Vision Model | Text Model | Best For |
|-------|-------------|------------|----------|
| **Qwen Unified** (recommended) | qwen3.5-plus | qwen3.5-plus | One model for everything. Simplest. Cheapest quality option. |
| **Qwen Split** | qwen3.5-plus (vision) | qwen-flash (text) | Marginally cheaper on text-heavy sessions |
| **Kimi Full** | kimi-k2.5 | kimi-k2-0905 | Simplest migration (already integrated) |
| **Hybrid Fallback** | qwen3.5-plus | qwen3.5-plus + kimi-k2 fallback | Redundancy across providers |

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

| Turn # | ~Input Tokens | ~Output Tokens | Kimi-k2 Cost | Qwen3.5-Plus Cost | Qwen-Flash Cost |
|--------|--------------|----------------|-------------|-------------------|-----------------|
| 1 | 1,750 | 400 | $0.0021 | $0.00030 | $0.00025 |
| 4 | 3,200 | 450 | $0.0030 | $0.00048 | $0.00034 |
| 8 | 4,800 | 500 | $0.0041 | $0.00067 | $0.00044 |
| Vision turn | +500 img | 500 | +$0.0018 | +$0.00019 | N/A (no vision) |

### Per-Session Cost (Typical Session: 8 exchanges, 1 image, 1 tool call)

**Total tokens per session (estimated):**
- Input: ~25,000 tokens (cumulative across 8 requests)
- Output: ~4,200 tokens

| Stack | Cost/Session | vs Current (k2-turbo) |
|-------|-------------|----------------------|
| kimi-k2-turbo (current!) | **$0.045** | baseline |
| **Kimi Standard** (k2-0905 + k2.5) | **$0.026** | 42% savings |
| **Qwen Unified** (qwen3.5-plus) | **$0.004** | **91% savings** |
| **Qwen Split** (flash + 3.5-plus) | **$0.003** | **93% savings** |

#### Qwen Unified breakdown (qwen3.5-plus for all 8 turns):
- Input: 25,000 × $0.11/M = $0.00275
- Output: 4,200 × $0.28/M = $0.00118
- **Total: ~$0.004/session**

#### Qwen Split breakdown (flash for 7 text turns, 3.5-plus for 1 vision turn):
- Text input: 21,000 × $0.05/M = $0.00105
- Text output: 3,150 × $0.40/M = $0.00126
- Vision input: 4,000 × $0.11/M = $0.00044
- Vision output: 1,050 × $0.28/M = $0.00029
- **Total: ~$0.003/session**

### Monthly Infrastructure Cost at Scale

Assumptions: 2 sessions/user/day, 30 days/month

| DAU | Sessions/mo | Current (k2-turbo) | Kimi Standard | Qwen Unified | Qwen Split |
|-----|------------|-------------------|---------------|--------------|------------|
| 1K | 60K | $2,700 | $1,560 | **$240** | **$180** |
| 10K | 600K | $27,000 | $15,600 | **$2,400** | **$1,800** |
| 50K | 3M | $135,000 | $78,000 | **$12,000** | **$9,000** |
| 100K | 6M | $270,000 | $156,000 | **$24,000** | **$18,000** |

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
| **Prompt caching** | up to 80% on system prompt | Qwen implicit cache = 20% of input price; explicit cache = 10% |
| **Model routing** | 40-60% overall | Route simple questions to qwen-flash, complex/emergency to qwen3.5-plus |
| **Conversation summarization** | 25-35% input | Summarize older messages into a single context block |

### C. Infrastructure-Level (Higher Effort)

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| **Batch API** for non-urgent | 50% | Qwen offers 50% batch discount on all models |
| **Self-host open-source** | 60-80% | Host qwen3.5-plus (397B MoE, 17B active) or kimi-k2.5 on GPU cluster |
| **Replace OpenAI embeddings** | 100% | Switch to Qwen's own embedding model or local model |

### Qwen Cache Pricing Detail

| Cache Type | Cost vs Standard Input | How It Works |
|------------|----------------------|--------------|
| **Implicit** (automatic) | 20% of input price | System auto-detects repeated prefixes (e.g., system prompt) |
| **Explicit** (manual) | 10% of input price (125% for creation) | You define cacheable context blocks |
| Batch + Cache | Cannot be combined | Choose one or the other |

### Projected Optimized Cost (with sliding window + model routing + caching)

| DAU | Kimi Optimized | Qwen Unified Optimized | Qwen Split Optimized |
|-----|---------------|------------------------|----------------------|
| 10K | ~$6,200 | ~$1,000 | ~$750 |
| 50K | ~$31,000 | ~$5,000 | ~$3,750 |
| 100K | ~$62,000 | ~$10,000 | ~$7,500 |

---

## 4. External Business Model

### Recommended Pricing Tiers

#### Tier 1: Free (Acquisition)
- **Price:** $0
- **Limits:** 3 sessions/day, 5 messages/session
- **Model:** qwen-flash (text) + qwen3.5-plus (vision, 1 image/day)
- **Features:** Basic pet care Q&A, 1 image analysis/day
- **Our cost/user/month:** ~$0.09
- **Purpose:** User acquisition, viral growth

#### Tier 2: Pet Parent Pro (Core Revenue)
- **Price:** $6.99/month (¥49.9/month)
- **Limits:** 20 sessions/day, unlimited messages/session
- **Model:** qwen3.5-plus (unified for text + vision)
- **Features:** Unlimited image analysis, product recommendations, chat history
- **Our cost/user/month:** ~$0.96 (assumes 4 sessions/day avg)
- **Gross margin:** ~86%
- **Purpose:** Primary revenue driver

#### Tier 3: Emergency Plus (Premium)
- **Price:** $14.99/month (¥99.9/month)
- **Limits:** Unlimited sessions, unlimited messages
- **Model:** qwen3.5-plus (thinking mode for complex cases)
- **Features:** 24/7 emergency priority queue, detailed health reports, vet referral integration, multi-pet profiles, thinking-mode reasoning
- **Our cost/user/month:** ~$2.40 (assumes 6 sessions/day avg, some thinking-mode output at $1.11/M)
- **Gross margin:** ~84%
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
| 1K | 700 | 250 | 50 | **$2,497** | $303 | **88%** |
| 10K | 7,000 | 2,500 | 500 | **$24,970** | $3,030 | **88%** |
| 50K | 35,000 | 12,500 | 2,500 | **$124,850** | $15,150 | **88%** |
| 100K | 70,000 | 25,000 | 5,000 | **$249,700** | $30,300 | **88%** |

*AI Cost uses Qwen Unified stack (qwen3.5-plus) with caching and sliding window applied.*

---

## 5. Recommendation

### Phase 1: Launch (0-10K DAU)
- **Stack:** Qwen Unified — `qwen3.5-plus` for everything (text + vision)
- **Why:** One model handles all modalities. $0.11/$0.28 per M tokens is absurdly cheap. 1M context window means no context overflow. OpenAI-compatible API — just add a provider config.
- **Action items:**
  1. Add `qwen` provider in `ai.ts` with DashScope base URL (`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`)
  2. Set model to `qwen3.5-plus` for both text and vision
  3. Implement sliding window (last 6 messages + summary) in session management
  4. Keep Kimi as fallback provider (already integrated)
  5. Launch with Free + Pro tiers
- **Expected AI cost:** $240-2,400/month

### Phase 2: Growth (10K-50K DAU)
- **Stack:** Qwen Split with routing (qwen-flash for simple text, qwen3.5-plus for complex + vision)
- **Why:** Model routing can shave another 25% off by sending simple questions to the cheaper flash model
- **Action items:**
  1. Add lightweight intent classifier to route: simple Q&A → qwen-flash, complex/emergency/image → qwen3.5-plus
  2. Enable explicit prompt caching for the system prompt (10% of input cost)
  3. Trim system prompt to ~900 tokens
  4. Introduce Emergency Plus tier with thinking-mode reasoning
  5. Implement Qwen's 50% batch discount for non-real-time features (e.g., health report generation)
- **Expected AI cost:** $1,800-9,000/month

### Phase 3: Scale (50K+ DAU)
- **Stack:** Self-hosted Qwen3.5-Plus + API overflow
- **Why:** At 50K+ DAU, self-hosting the 17B-active-parameter MoE model on A100/H100 GPU clusters becomes 60-80% cheaper than API
- **Action items:**
  1. Deploy qwen3.5-plus (open weights) on dedicated GPU cluster
  2. Use API as overflow for traffic spikes
  3. Consider Alibaba Cloud savings plans (pre-purchase discounts)
  4. Launch B2B / vet clinic tier
  5. Replace OpenAI embeddings with Qwen's own embedding model
- **Expected AI cost:** $5,000-15,000/month (with self-hosting)

### Head-to-Head: Qwen3.5-Plus vs Kimi for Production

| Factor | Kimi (k2 + k2.5) | Qwen3.5-Plus | Winner |
|--------|------------------|--------------|--------|
| Text cost | $0.60/$2.50 | $0.11/$0.28 | **Qwen** (5-9x cheaper) |
| Vision cost | $0.60/$3.00 | $0.11/$0.28 | **Qwen** (5-11x cheaper) |
| Need separate vision model? | Yes (k2.5) | No (unified) | **Qwen** (simpler) |
| Cost/session | ~$0.026 | ~$0.004 | **Qwen** (6.5x cheaper) |
| Monthly @ 100K DAU | ~$156,000 | ~$24,000 | **Qwen** (6.5x cheaper) |
| Context window | 256K | 1M | **Qwen** |
| Model variety for routing | 3 models | 5+ models | **Qwen** |
| Batch discount | None documented | 50% | **Qwen** |
| Prompt caching | Auto ($0.10-0.15/M) | Implicit 20% + Explicit 10% | **Qwen** |
| Open-source self-host | Yes | Yes (397B MoE, 17B active) | Tie |
| API compatibility | OpenAI-compatible | OpenAI-compatible | Tie |
| Existing integration | Already built | Needs new provider | **Kimi** |
| Regional availability | CN-primary | CN + International (SG) | **Qwen** |

**Bottom line:** Qwen3.5-Plus is the clear winner for production. A single model handles both text and vision at $0.11/$0.28/M — roughly **6-10x cheaper than Kimi** with a larger context window. Keep Kimi as a redundancy fallback. The business model achieves **~88% gross margin** at $6.99/month pricing, making this a highly viable SaaS product.

---

## Sources

- [Moonshot AI Official Pricing](https://platform.moonshot.ai/docs/pricing/chat)
- [Alibaba Cloud Model Studio Pricing](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- [Alibaba Cloud Model Studio Models](https://www.alibabacloud.com/help/en/model-studio/models)
- [Alibaba Cloud Free Quota](https://www.alibabacloud.com/help/en/model-studio/new-free-quota)
- [Qwen3.5 Release Blog](https://qwenlm.github.io/blog/qwen3.5/)
- [Kimi K2.5 Analysis - Artificial Analysis](https://artificialanalysis.ai/models/kimi-k2-5)
- [Kimi K2 Pricing - pricepertoken.com](https://pricepertoken.com/pricing-page/model/moonshotai-kimi-k2)
- [Qwen API Pricing - pricepertoken.com](https://pricepertoken.com/pricing-page/provider/qwen)
- [Qwen API Pricing Guide - DeepInfra](https://deepinfra.com/blog/qwen-api-pricing-2026-guide)
- [OpenAI Embeddings Pricing](https://platform.openai.com/docs/pricing)
- [Zilliz Cloud Pricing](https://zilliz.com/pricing)
- [Kimi K2.5 - OpenRouter](https://openrouter.ai/moonshotai/kimi-k2.5)
- [Qwen3.5-Plus - OpenRouter](https://openrouter.ai/qwen/qwen3.5-plus-02-15)
