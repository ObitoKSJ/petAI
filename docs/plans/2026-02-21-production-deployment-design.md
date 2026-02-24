# Production Deployment Design

**Date:** 2026-02-21
**Goal:** Move petAI to Vercel production with persistent conversations, image storage, and simple auth.

## Stack Additions

- **Database:** Vercel Postgres via `@vercel/postgres`
- **ORM:** Drizzle ORM (lightweight, serverless-optimized)
- **Auth:** Custom JWT (bcrypt + httpOnly cookie)
- **Image Storage:** Vercel Blob
- **Deployment:** Vercel

## Database Schema

Three tables in Vercel Postgres:

```sql
users
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  username      VARCHAR(50) UNIQUE NOT NULL
  password_hash TEXT NOT NULL
  created_at    TIMESTAMP DEFAULT now()

conversations
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  title         VARCHAR(200)
  created_at    TIMESTAMP DEFAULT now()
  updated_at    TIMESTAMP DEFAULT now()

messages
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE
  role            VARCHAR(10) NOT NULL  -- 'user' | 'assistant'
  content         TEXT NOT NULL
  image_urls      TEXT[]               -- Vercel Blob URLs
  products        JSONB                -- product recommendation data
  created_at      TIMESTAMP DEFAULT now()
```

**Conversation cap:** 50 per user. On new conversation creation, if count >= 50, delete the oldest (and its messages via CASCADE).

## Authentication

Simple username/password with JWT:

1. **Signup:** `POST /api/auth/signup` - validate input, hash password with bcrypt, create user, return JWT cookie
2. **Login:** `POST /api/auth/login` - verify password, return JWT cookie
3. **Logout:** `POST /api/auth/logout` - clear cookie
4. **Middleware:** `middleware.ts` - check JWT on all routes except `/login` and `/api/auth/*`

JWT payload: `{ userId, username, exp }` signed with `JWT_SECRET` env var. 7-day expiry. httpOnly + secure cookie.

## Image Handling

**Upload flow:**
1. User attaches image in ChatInput
2. Client uploads to `POST /api/upload` -> Vercel Blob
3. Get back a public URL
4. Store URL in message's `image_urls` column
5. Send base64 to LLM API for analysis (same as current)
6. Display images from Blob URLs in chat history

## Conversation Flow

**New message flow:**
1. User sends message
2. `POST /api/chat` receives message + conversationId
3. Save user message to `messages` table
4. Load conversation history from DB (last N messages)
5. Send history + new message to LLM
6. Save assistant response to `messages` table
7. Return response to client

**Conversation management:**
- "New conversation" button in header
- Conversation list accessible via drawer/sidebar
- Auto-title from first user message (truncated to ~50 chars)
- Tap past conversation -> load messages from DB

## New Environment Variables

```bash
# Vercel Postgres (auto-configured by Vercel)
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...

# Auth
JWT_SECRET=...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...
```

## File Changes Summary

### New files:
- `src/db/schema.ts` - Drizzle schema definitions
- `src/db/index.ts` - DB connection
- `src/lib/auth.ts` - JWT sign/verify helpers
- `src/middleware.ts` - Auth middleware
- `src/app/login/page.tsx` - Login/signup page
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/upload/route.ts` - Vercel Blob upload
- `drizzle.config.ts` - Drizzle config

### Modified files:
- `src/hooks/useChat.ts` - Fetch from DB-backed API instead of local state
- `src/app/api/chat/route.ts` - Save/load messages from DB
- `src/components/layout/Header.tsx` - New conversation + history buttons
- `src/components/chat/ChatContainer.tsx` - Conversation switching
- `package.json` - New dependencies

### Removed/replaced:
- `src/services/session.ts` - Replaced by Drizzle DB queries
- In-memory session management - No longer needed

## What Stays Untouched
- `src/services/ai.ts` - AI provider abstraction
- `src/services/zilliz.ts` - Product vector search
- `src/lib/prompts.ts` - System prompt & quick prompts
- `src/components/chat/ChatMessage.tsx` - Message rendering
- `src/components/chat/ChatInput.tsx` - Input component
- `src/components/chat/EmergencyPrompts.tsx` - Quick actions
- `src/app/globals.css` - Design tokens
- All UI components in `src/components/ui/`

## New Dependencies
- `drizzle-orm` + `drizzle-kit` - ORM & migration tooling
- `@vercel/postgres` - Postgres driver for Vercel
- `@vercel/blob` - Blob storage SDK
- `bcryptjs` + `@types/bcryptjs` - Password hashing
- `jose` - JWT signing/verification (Edge-compatible)
