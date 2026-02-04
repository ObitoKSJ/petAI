# Pet Care Chat - TODO

## Current Sprint

- [ ] Add dark mode toggle
- [ ] Optimize AI response length (shorter, more concise)

## Backlog

- [ ] Pet profile creation (name, type, breed, age)
- [ ] Chat history sidebar with localStorage
- [ ] Message copy functionality
- [ ] Image upload for pet photos
- [ ] Voice input support

## Technical Debt

- [ ] Add unit tests
- [ ] Add E2E tests with Playwright
- [ ] Implement rate limiting on API

## Completed

### UI/UX Updates (Feb 4)
- [x] Warm Cream (#F2F0ED) + Golden Amber (#BF8F54) theme
- [x] Minimal layout: invisible header, fixed input
- [x] Paw button (🐾) to return home / new chat
- [x] Mobile-first: larger text & touch targets on phones
- [x] Typewriter effect for AI responses
- [x] Loader spinner (Lucide) instead of bouncing dots
- [x] iOS safe area support for keyboard

### Session Management
- [x] Server-side session service with memory storage
- [x] Multi-turn conversation memory
- [x] Auto session creation and token truncation
- [x] Sessions API endpoints (CRUD)

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
- [x] KIMI AI integration (Moonshot API)
- [x] shadcn/ui components
- [x] Emergency triage quick-action buttons

---

*Last updated: 2026-02-04*
