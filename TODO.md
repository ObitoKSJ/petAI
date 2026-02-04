# Pet Care Chat - TODO

## Current Sprint

- [ ] Add dark mode toggle
- [ ] Test image upload with various pet photos
- [ ] Fine-tune AI consultation flow

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

*Last updated: 2026-02-04*
