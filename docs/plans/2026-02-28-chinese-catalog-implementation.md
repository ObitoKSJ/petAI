# Chinese Pet Catalog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sync the Chinese product catalog to Zilliz and update the tool definition to match the new category slugs and CNY pricing.

**Architecture:** Two code changes in `src/lib/tools.ts` (category enum + price format), then re-seed Zilliz. The seed script already contains the 72 Chinese products and was pre-written during design.

**Tech Stack:** TypeScript, Zilliz REST API, OpenRouter Qwen3 embeddings, `npx tsx` for scripts.

---

### Task 1: Update category enum in tools.ts

**Files:**
- Modify: `src/lib/tools.ts:41`

**Step 1: Replace `flea-tick` with `pest-prevention` in the category enum**

In `src/lib/tools.ts`, change line 41:
```typescript
// Before
'flea-tick',
// After
'pest-prevention',
```

**Step 2: Fix price formatting from USD to CNY**

In the same file at line 101, change:
```typescript
// Before
price: `$${p.price.toFixed(2)}`,
// After
price: `¥${Math.round(p.price)}`,
```

**Step 3: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No output (zero errors)

**Step 4: Commit**

```bash
git add src/lib/tools.ts
git commit -m "fix: update category slug flea-tick→pest-prevention, format prices as CNY"
```

---

### Task 2: Seed Zilliz with Chinese product catalog

**Files:**
- Run: `scripts/seed-products.ts` (already contains 72 Chinese products)

**Step 1: Run the seed script**

```bash
npx tsx scripts/seed-products.ts
```

Expected output:
```
Starting Chinese pet product catalog seed...
[Zilliz] Collection dropped
[Zilliz] Creating collection: pet_products
[Zilliz] Collection created successfully
[Zilliz] Inserting 72 products...
[Zilliz] Inserted product: cn-wc-001
...
[Zilliz] All products inserted

Seed completed successfully!
   Total products: 72
```

**Step 2: Verify counts per category**

Output should show 6 products per category across all 12 categories.

**Step 3: Commit**

```bash
git add scripts/seed-products.ts docs/plans/
git commit -m "feat: rebuild product catalog for Chinese market (72 products, CNY pricing)"
```
