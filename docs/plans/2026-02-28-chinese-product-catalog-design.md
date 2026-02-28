# Chinese Pet Product Catalog Design

**Date:** 2026-02-28
**Status:** Approved

## Summary

Rebuild the Zilliz product catalog from English/US market (Chewy.com) to Chinese market. All product names, descriptions, and conditions are in Chinese. Prices in CNY.

## Catalog Structure

- **72 products** across 12 categories (6 per category)
- **Platform:** Placeholder URLs (to be filled with JD.com links later)
- **Brand mix:** ~50% domestic Chinese, ~50% international brands sold in China

## Categories (unchanged slugs except one)

| Slug | Chinese Name | Change |
|---|---|---|
| `wound-care` | 伤口护理 | — |
| `digestive-health` | 消化健康 | — |
| `ear-care` | 耳道护理 | — |
| `eye-care` | 眼部护理 | — |
| `skin-care` | 皮肤护理 | — |
| `allergy-relief` | 过敏护理 | — |
| `anxiety-relief` | 焦虑缓解 | — |
| `first-aid` | 急救备用 | — |
| `dental-care` | 口腔护理 | — |
| `joint-health` | 关节健康 | — |
| `pest-prevention` | 宠物驱虫防螨 | **renamed from `flea-tick`** |
| `nutrition` | 营养补充 | — |

## Implementation Steps

1. Update `src/lib/tools.ts` — change `flea-tick` → `pest-prevention` in category enum
2. Run `npx tsx scripts/seed-products.ts` — drops and re-seeds Zilliz with 72 Chinese products
