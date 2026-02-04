# Pet Care Chat - Project Overview

## What We're Building

A 24/7 emergency chat assistant for **first-time pet parents**. Users can ask questions about their pets' health, nutrition, behavior, and get immediate guidance during stressful situations. The AI has a friendly, supportive persona - like a knowledgeable friend who happens to know a lot about pets.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS 4 with centralized design tokens
- **AI Backend:** Moonshot AI (KIMI) - OpenAI-compatible API
- **State Management:** React hooks (useChat custom hook)

## Project Structure

```
src/
├── app/
│   ├── api/chat/           # KIMI AI chat endpoint
│   ├── globals.css         # Design tokens & theme
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main chat page
├── components/
│   ├── chat/
│   │   ├── ChatContainer   # Main chat wrapper
│   │   ├── ChatMessage     # Message bubble (memoized)
│   │   ├── ChatInput       # Message input
│   │   └── EmergencyPrompts# Quick-action buttons
│   ├── layout/
│   │   └── Header          # App header
│   └── ui/                 # shadcn components
├── hooks/
│   ├── useChat.ts          # Chat state management
│   ├── useAutoScroll.ts    # ChatGPT-style anchor-to-top scrolling
│   └── useKeyboardHeight.ts # Mobile keyboard detection (visualViewport)
├── lib/
│   ├── utils.ts            # Utility functions
│   └── prompts.ts          # AI persona & emergency prompts
├── services/
│   ├── ai.ts               # Pluggable AI provider service
│   └── zilliz.ts           # Vector search for product recommendations
└── types/
    └── index.ts            # TypeScript interfaces
```

## Design System

Using shadcn/ui with custom pet-care themed design tokens:
- **Primary (Teal):** Calm, medical trust
- **Accent (Coral):** Friendly, inviting
- **Destructive (Red):** Emergency alerts

Design tokens are centralized in `globals.css` using CSS variables.

### Floating UI Pattern

We use a **Floating UI** (chromeless) design for fixed elements:

```jsx
{/* Container: invisible, only for positioning */}
<div className="fixed left-0 right-0 z-20 pb-safe">
  {/* Component: the only visible element */}
  <ChatInput />
</div>
```

**Principles:**
- Containers have **no visual presence** (no background, border, padding)
- Only the actual UI component (pill-shaped input, header bar) is visible
- Elements appear to "float" on the canvas independently
- Use `pb-safe` / `pt-safe` for iOS safe areas on fixed elements

This applies to:
- Header (fixed top, pill-shaped bar)
- Chat input (fixed bottom, pill-shaped input)
- Any floating action elements

## Key Features

- [x] Real-time chat interface
- [x] KIMI AI integration for pet care responses
- [x] Emergency triage quick-action buttons
- [x] Mobile-responsive design
- [x] Friendly, supportive AI persona
- [ ] Chat history persistence
- [ ] Dark mode support

## Environment Variables

```bash
KIMI_API_KEY=your_key_here
KIMI_BASE_URL=https://api.moonshot.cn/v1
```

## Commands

```bash
npm run dev    # Start development server
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

## Best Practices

Follow the Vercel React best practices in `.agents/skills/vercel-react-best-practices/`:
- Eliminate request waterfalls
- Optimize bundle size with dynamic imports
- Memoize expensive components
- Use proper loading states
