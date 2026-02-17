# Pet Care Chat

A 24/7 AI-powered chat assistant for first-time pet parents. Ask questions about your pet's health, nutrition, and behavior — get immediate guidance during stressful situations. The AI acts like a knowledgeable friend who knows a lot about pets: supportive, calm, and never judgmental.

## Core Features

- **AI veterinary consultation** — Follows a structured triage flow: gather info, understand concern, assess severity, give actionable advice
- **Image analysis** — Upload photos of wounds, skin issues, eye/ear problems for visual assessment (up to 4 images, 5MB each)
- **Product recommendations** — Semantic search over a vector database of pet care products, surfaced automatically when relevant
- **Emergency quick-actions** — Pre-built prompts for common urgent situations (vomiting, not eating, injury, etc.)
- **Multilingual** — English and Chinese with locale persistence
- **Mobile-first** — iOS safe areas, virtual keyboard detection, responsive design

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | shadcn/ui + Tailwind CSS 4 |
| AI | Pluggable — KIMI (default), OpenAI, DeepSeek |
| Vector DB | Zilliz (managed Milvus) |
| Embeddings | OpenAI `text-embedding-3-small` (512 dims) |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### AI Provider (required)

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `kimi` | Which AI provider to use: `kimi`, `openai`, or `deepseek` |
| `AI_API_KEY` | — | Universal API key (works for any provider) |
| `AI_BASE_URL` | — | Override the provider's base URL (useful for proxies or self-hosted models) |

You can also use provider-specific keys instead of `AI_API_KEY`:

| Variable | Provider |
|---|---|
| `KIMI_API_KEY` | Moonshot AI (KIMI) |
| `OPENAI_API_KEY` | OpenAI |
| `DEEPSEEK_API_KEY` | DeepSeek |

### Vector Database (optional — for product recommendations)

| Variable | Description |
|---|---|
| `ZILLIZ_ENDPOINT` | Your Zilliz Cloud instance URL |
| `ZILLIZ_API_KEY` | Zilliz API key |
| `OPENAI_API_KEY` | Required for generating embeddings (even if your chat AI uses a different provider) |

Without vector DB configuration, the chat works normally — it just won't recommend products.

## Switching AI Providers

The AI service layer (`src/services/ai.ts`) uses an OpenAI-compatible interface, making it easy to swap providers.

**Preconfigured providers:**

| Provider | Model (text) | Model (vision) | Vision Support |
|---|---|---|---|
| `kimi` | `kimi-k2-turbo-preview` | `kimi-k2.5` | Yes |
| `openai` | `gpt-5-nano-2025-08-07` | `gpt-5-nano-2025-08-07` | Yes |
| `deepseek` | `deepseek-chat` | — | No |

To switch, change `AI_PROVIDER` in `.env.local` and set the corresponding API key:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```

**Adding a new provider:** Add an entry to the `PROVIDERS` object in `src/services/ai.ts`. Any OpenAI-compatible API works:

```typescript
myProvider: {
  baseUrl: 'https://api.my-provider.com/v1',
  model: 'my-model',
  visionModel: 'my-vision-model',
  supportsVision: true,
},
```

## Product Recommendations (Vector DB)

The app uses Zilliz (managed Milvus) for semantic product search. When the AI determines a product recommendation would help, it autonomously calls a `search_products` tool to find relevant items.

### Setting Up Zilliz

1. Create a free cluster at [cloud.zilliz.com](https://cloud.zilliz.com)
2. Copy your endpoint and API key into `.env.local`
3. Make sure `OPENAI_API_KEY` is also set (used for generating embeddings)

### Seeding Products

A seed script with 50+ sample pet care products is included:

```bash
npx tsx scripts/seed-products.ts
```

This drops the existing collection, recreates it, and inserts all products with embeddings. Products span categories like wound care, digestive health, ear/eye care, anxiety relief, first aid, dental care, joint health, flea & tick, and nutrition.

### Adding Your Own Products

Products follow this schema:

```typescript
{
  id: string;          // Unique identifier
  name: string;        // Product name
  description: string; // What it does
  category: string;    // e.g. 'wound-care', 'digestive-health', 'ear-care'
  conditions: string[];// e.g. ['wound', 'infection', 'hot-spots']
  pet_types: string[]; // ['dog'], ['cat'], or ['dog', 'cat']
  price: number;       // Price in USD
  image_url: string;   // Product image URL
  product_url: string; // Link to purchase
  brand?: string;      // Optional brand name
}
```

You can insert products programmatically using the Zilliz service:

```typescript
import { createCollection, insertProduct } from '@/services/zilliz';

await createCollection(); // Idempotent — skips if already exists
await insertProduct({
  id: 'my-product',
  name: 'My Pet Product',
  description: 'Description for embedding and display',
  category: 'wound-care',
  conditions: ['wound', 'cut'],
  pet_types: ['dog', 'cat'],
  price: 19.99,
  image_url: 'https://example.com/image.jpg',
  product_url: 'https://example.com/product',
  brand: 'MyBrand',
});
```

Available product categories: `wound-care`, `digestive-health`, `ear-care`, `eye-care`, `skin-care`, `allergy-relief`, `anxiety-relief`, `first-aid`, `dental-care`, `joint-health`, `flea-tick`, `nutrition`.

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts       # Chat API endpoint
│   ├── globals.css             # Design tokens & theme
│   ├── layout.tsx              # Root layout with fonts
│   └── page.tsx                # Main page
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx   # Main chat UI
│   │   ├── ChatMessage.tsx     # Message bubble (memoized)
│   │   ├── ChatInput.tsx       # Input with image upload
│   │   ├── ProductCard.tsx     # Product recommendation card
│   │   ├── TypewriterText.tsx  # Typewriter animation
│   │   └── EmergencyPrompts.tsx# Quick-action buttons
│   ├── layout/Header.tsx       # App header
│   └── ui/                     # shadcn components
├── hooks/
│   ├── useChat.ts              # Chat state & API integration
│   ├── useAutoScroll.ts        # ChatGPT-style scroll behavior
│   └── useKeyboardHeight.ts    # Mobile keyboard detection
├── i18n/                       # Internationalization (en, zh)
├── lib/
│   ├── prompts.ts              # System prompt & emergency prompts
│   ├── tools.ts                # Tool definitions (product search)
│   └── utils.ts                # Utilities
├── services/
│   ├── ai.ts                   # Pluggable AI provider service
│   └── zilliz.ts               # Vector DB operations
└── types/index.ts              # TypeScript interfaces
```

## Scripts

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```
