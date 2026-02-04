# Pet Care Chat - TODO

## Current Sprint

- [ ] Add dark mode toggle

## Backlog

- [ ] Pet profile creation (name, type, breed, age)
- [ ] Chat history sidebar with localStorage
- [ ] Message copy functionality
- [ ] Voice input support

## Technical Debt

- [ ] Add unit tests
- [ ] Add E2E tests with Playwright
- [ ] Implement rate limiting on API
- [ ] Remove unused session API routes (now using client-side history)

## Completed

### Mobile UX & Scroll Behavior (Feb 4 - Night)
- [x] Mobile keyboard handling with `visualViewport` API
  - Input stays above keyboard, not pushing whole page
  - `useKeyboardHeight` hook for real-time keyboard detection
  - `interactive-widget=resizes-content` viewport meta tag
- [x] ChatGPT/Claude-style "anchor to top" scroll pattern
  - User message scrolls to top on send (below header)
  - Response grows below, no forced auto-scroll
  - `useAutoScroll` hook with anchor positioning
- [x] Floating UI design pattern
  - Header and input as chromeless fixed containers
  - Only pill-shaped elements visible (no container backgrounds)
  - Elastic overscroll for natural iOS bounce feel
- [x] Consistent input styling
  - No visual change during loading state
  - Only send button indicates ready/loading state
  - Users can type while waiting for response

### AI Prompt & UX Improvements (Feb 4 - Evening)
- [x] Product cards as structured data (not markdown)
  - Products returned separately from API, rendered as visual cards
  - ProductCard component with image, brand, name, price, buy link
  - Responsive grid layout (1-3 columns)
- [x] Mandatory image analysis response structure
  - 1. Observation → 2. Empathy → 3. Assessment → 4. Care Instructions → 5. Products (last)
  - Bad/good examples in prompt to prevent products-first responses
- [x] Direct & urgent messaging for serious situations
  - No sugarcoating when something looks bad or uncertain
  - "Go to vet now" guidance when needed, no hedging
- [x] Bilingual support (Chinese/English)
  - AI matches user's language automatically
- [x] UI polish
  - User message bubble: more roundness (rounded-3xl), no tail
  - Send button shows spinning loader when waiting for response
  - Loading state uses grey button instead of primary color

### Product Recommendations with Vector Search (Feb 4)
- [x] Zilliz vector database integration (serverless)
- [x] OpenAI text-embedding-3-small for semantic search
- [x] 60 curated pet care products from Chewy
- [x] AI tool calling (function calling) for product search
- [x] Product cards with images, prices, and purchase links
- [x] Category filtering (wound-care, anxiety, digestive, etc.)
- [x] Pet type filtering (dog, cat)

### Pluggable AI Provider System (Feb 4)
- [x] Refactored to generic `ai.ts` service (removed `kimi.ts`)
- [x] Support for multiple providers: KIMI, OpenAI, DeepSeek
- [x] Environment variable configuration (`AI_PROVIDER`, `AI_API_KEY`)
- [x] Provider-specific quirks handled automatically (e.g., temperature)

### Image Upload & Vision Fixes (Feb 4)
- [x] Fixed KIMI K2.5 temperature requirement (must be 1)
- [x] Fixed text + image mixed input (empty history message handling)
- [x] Added "[Shared an image]" placeholder for image-only messages
- [x] Added "Analyzing image..." animated status text during processing
- [x] Updated AI prompt with visual assessment capabilities

### Image Upload & Vision (Feb 4)
- [x] Image upload UI (up to 4 images, 5MB max)
- [x] Base64 conversion and preview
- [x] KIMI K2.5 multimodal API integration
- [x] Display uploaded images in chat messages

### AI Consultation Flow (Feb 4)
- [x] Vet-like consultation process (gather info → understand concern → assess)
- [x] 1-2 questions at a time, not overwhelming
- [x] Emergency bypass for urgent situations
- [x] Client-side conversation history (fixed server session loss)

### UI/UX Updates (Feb 4)
- [x] Warm Cream (#F2F0ED) + Golden Amber (#BF8F54) theme
- [x] Minimal layout: invisible header, fixed input
- [x] PawPrint icon (Lucide) instead of emoji
- [x] Mobile-first: larger text & touch targets on phones
- [x] Typewriter effect for AI responses
- [x] Loader spinner (Lucide) instead of bouncing dots
- [x] iOS safe area support for keyboard
- [x] Consistent input styling (no color change on focus)

### Session Management
- [x] Client-side history management (reliable across hot reloads)
- [x] Multi-turn conversation memory

### UI/UX Redesign
- [x] ChatGPT-style layout (user bubble right, AI full-width)
- [x] Markdown rendering with react-markdown
- [x] Minimalist design (removed borders, dividers)
- [x] Pill-shaped input with embedded send button
- [x] Lucide React icons

### Design System
- [x] Geist font (English) + Noto Sans SC (Chinese)
- [x] Unified border-radius (1rem)

### Core Setup
- [x] Next.js 16 + TypeScript + Tailwind CSS 4
- [x] KIMI K2.5 AI integration (Moonshot API with vision)
- [x] shadcn/ui components
- [x] Emergency triage quick-action buttons

---

*Last updated: 2026-02-04 (late evening)*
