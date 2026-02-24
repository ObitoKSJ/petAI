# Production Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move petAI from in-memory prototype to Vercel production with persistent conversations, image storage, and simple username/password auth.

**Architecture:** Drizzle ORM with Vercel Postgres for data persistence, custom JWT auth (jose + bcryptjs), Vercel Blob for image uploads. The existing AI service and Zilliz product search remain untouched.

**Tech Stack:** Drizzle ORM, @vercel/postgres, @vercel/blob, jose (JWT), bcryptjs

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

Run:
```bash
npm install drizzle-orm @vercel/postgres @vercel/blob jose bcryptjs
```

**Step 2: Install dev dependencies**

Run:
```bash
npm install -D drizzle-kit @types/bcryptjs
```

**Step 3: Verify install succeeded**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add drizzle, vercel postgres/blob, jose, bcryptjs"
```

---

### Task 2: Database Schema & Connection

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`

**Step 1: Create Drizzle schema**

Create `src/db/schema.ts`:

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 10 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  imageUrls: text('image_urls').array(),
  products: jsonb('products'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Step 2: Create DB connection**

Create `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
```

**Step 3: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
```

**Step 4: Add db:generate and db:push scripts to package.json**

In `package.json`, add to `"scripts"`:
```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

**Step 5: Commit**

```bash
git add src/db/ drizzle.config.ts package.json
git commit -m "feat: add drizzle schema with users, conversations, messages tables"
```

---

### Task 3: Auth Utilities (JWT + Password Hashing)

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create auth helper module**

Create `src/lib/auth.ts`:

```typescript
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
const COOKIE_NAME = 'petcare-token';
const EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}
```

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add JWT auth utilities with bcrypt password hashing"
```

---

### Task 4: Auth API Routes

**Files:**
- Create: `src/app/api/auth/signup/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

**Step 1: Create signup route**

Create `src/app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: 'Username must be 3-50 characters' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check if username already exists
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({ username, passwordHash }).returning();

    const token = await createToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({ userId: user.id, username: user.username });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
```

**Step 2: Create login route**

Create `src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({ userId: user.id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
```

**Step 3: Create logout route**

Create `src/app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
```

**Step 4: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add signup, login, logout API routes"
```

---

### Task 5: Auth Middleware

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.match(/\.(jpg|png|svg|ico)$/)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('petcare-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Pass userId to API routes via header
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-username', payload.username);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Important note:** The `verifyToken` import in middleware needs to use `jose` directly since Next.js middleware runs in the Edge runtime and cannot import from files that use Node.js APIs (like `cookies()` from `next/headers`). You may need to extract the JWT verification logic into a separate edge-compatible file, or inline the `jose` verify call in the middleware. Check during implementation if the import works — if not, inline the `jwtVerify` call directly in middleware.

**Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware protecting all routes except /login"
```

---

### Task 6: Login Page

**Files:**
- Create: `src/app/login/page.tsx`

**Step 1: Create login/signup page**

Create `src/app/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <PawPrint className="size-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-[family-name:var(--font-playwrite)] text-2xl italic text-foreground/80">
            PetCare
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl bg-foreground/5 px-4 py-3 text-base outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-foreground/5 px-4 py-3 text-base outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className={cn(
              'w-full rounded-xl py-3 text-base font-medium transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? '...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/login/
git commit -m "feat: add login/signup page"
```

---

### Task 7: Image Upload API Route (Vercel Blob)

**Files:**
- Create: `src/app/api/upload/route.ts`

**Step 1: Create upload route**

Create `src/app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const blob = await put(`chat-images/${user.userId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/upload/
git commit -m "feat: add Vercel Blob image upload endpoint"
```

---

### Task 8: Conversation API Routes

**Files:**
- Modify: `src/app/api/chat/route.ts` (rewrite)
- Create: `src/app/api/conversations/route.ts`
- Create: `src/app/api/conversations/[conversationId]/route.ts`
- Create: `src/app/api/conversations/[conversationId]/messages/route.ts`

**Step 1: Create conversations list/create route**

Create `src/app/api/conversations/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, desc, count } from 'drizzle-orm';

const MAX_CONVERSATIONS = 50;

// GET /api/conversations - list user's conversations
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db
    .select({ id: conversations.id, title: conversations.title, updatedAt: conversations.updatedAt })
    .from(conversations)
    .where(eq(conversations.userId, user.userId))
    .orderBy(desc(conversations.updatedAt));

  return NextResponse.json(result);
}

// POST /api/conversations - create new conversation
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Enforce 50 conversation cap - delete oldest if at limit
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(conversations)
    .where(eq(conversations.userId, user.userId));

  if (total >= MAX_CONVERSATIONS) {
    const oldest = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.userId, user.userId))
      .orderBy(conversations.createdAt)
      .limit(1);

    if (oldest.length > 0) {
      await db.delete(conversations).where(eq(conversations.id, oldest[0].id));
    }
  }

  const [convo] = await db.insert(conversations).values({
    userId: user.userId,
  }).returning();

  return NextResponse.json(convo);
}
```

**Step 2: Create single conversation route (delete)**

Create `src/app/api/conversations/[conversationId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// DELETE /api/conversations/[conversationId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { conversationId } = await params;
  await db.delete(conversations).where(
    and(eq(conversations.id, conversationId), eq(conversations.userId, user.userId))
  );

  return NextResponse.json({ success: true });
}
```

**Step 3: Create messages route (get history)**

Create `src/app/api/conversations/[conversationId]/messages/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// GET /api/conversations/[conversationId]/messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { conversationId } = await params;

  // Verify ownership
  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, user.userId)))
    .limit(1);

  if (!convo) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return NextResponse.json(result);
}
```

**Step 4: Rewrite chat route to persist messages**

Modify `src/app/api/chat/route.ts` — full rewrite:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

interface ImageData {
  base64: string;
  url?: string; // Blob URL for storage
}

interface ChatRequestBody {
  message: string;
  conversationId: string;
  images?: ImageData[];
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, conversationId, images } = await request.json() as ChatRequestBody;

    const hasImages = images && images.length > 0;
    if (!message && !hasImages) {
      return NextResponse.json({ error: 'Message or image is required' }, { status: 400 });
    }

    // Save user message to DB
    const imageUrls = images?.map((img) => img.url).filter(Boolean) as string[] | undefined;
    await db.insert(messages).values({
      conversationId,
      role: 'user',
      content: message || '[image]',
      imageUrls: imageUrls?.length ? imageUrls : undefined,
    });

    // Auto-title: set conversation title from first message
    const [convo] = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (convo && !convo.title && message) {
      await db.update(conversations)
        .set({ title: message.slice(0, 100), updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } else if (convo) {
      await db.update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
    }

    // Load conversation history from DB for LLM context
    const history = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    // Remove the last message (the one we just inserted) from history —
    // it will be sent as the current message
    const historyForLLM = history.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Call AI
    const imageData = images?.map((img) => ({ base64: img.base64 }));
    const result = await aiService.chat(message || '', historyForLLM, imageData);

    // Save assistant response to DB
    await db.insert(messages).values({
      conversationId,
      role: 'assistant',
      content: result.response,
      products: result.products?.length ? result.products : undefined,
    });

    return NextResponse.json({
      response: result.response,
      products: result.products,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
```

**Step 5: Commit**

```bash
git add src/app/api/chat/route.ts src/app/api/conversations/
git commit -m "feat: add conversation CRUD routes and DB-backed chat endpoint"
```

---

### Task 9: Update Client-Side useChat Hook

**Files:**
- Modify: `src/hooks/useChat.ts` (rewrite)

**Step 1: Rewrite useChat to work with DB-backed API**

The hook now manages a `conversationId` and fetches/sends through the conversation API. Replace entire file:

```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, ImageAttachment, Product } from '@/types';
import { generateId } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface SendMessageOptions {
  images?: ImageAttachment[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { t } = useTranslation();

  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  // Upload images to Vercel Blob, return URLs
  const uploadImages = useCallback(async (images: ImageAttachment[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      // Convert base64 data URL to File
      const res = await fetch(img.base64);
      const blob = await res.blob();
      const file = new File([blob], img.name || 'image.jpg', { type: img.mimeType });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        urls.push(url);
      }
    }
    return urls;
  }, []);

  // Ensure we have a conversation, create one if needed
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;

    const res = await fetch('/api/conversations', { method: 'POST' });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, options?: SendMessageOptions) => {
    const { images } = options || {};

    const messageContent = content || (images?.length ? t('chat.sharedImage') : '');

    const userMessage: Message = {
      id: generateId(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      images,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsAnalyzingImage(!!images?.length);
    setError(null);

    try {
      const convoId = await ensureConversation();

      // Upload images to Blob if present
      let imageUrls: string[] = [];
      if (images?.length) {
        imageUrls = await uploadImages(images);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: convoId,
          images: images?.map((img, i) => ({
            base64: img.base64,
            url: imageUrls[i],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('chat.requestFailed'));
      }

      const assistantMessage: Message = {
        id: generateId(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        products: data.products,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('chat.sendFailed');
      console.error('Failed to send message:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsAnalyzingImage(false);
    }
  }, [t, ensureConversation, uploadImages]);

  // Load an existing conversation's messages
  const loadConversation = useCallback(async (convoId: string) => {
    setConversationId(convoId);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${convoId}/messages`);
      const data = await res.json();

      const loaded: Message[] = data.map((m: { id: string; role: string; content: string; imageUrls?: string[]; products?: Product[]; createdAt: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt),
        imageUrls: m.imageUrls,
        products: m.products,
      }));

      setMessages(loaded);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isAnalyzingImage,
    error,
    conversationId,
    sendMessage,
    loadConversation,
    newConversation,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useChat.ts
git commit -m "feat: rewrite useChat hook for DB-backed conversations"
```

---

### Task 10: Update ChatContainer for Conversation Management

**Files:**
- Modify: `src/components/chat/ChatContainer.tsx`
- Modify: `src/components/layout/Header.tsx`

**Step 1: Update Header to support new conversation + history + logout**

In `src/components/layout/Header.tsx`, update to add:
- A "new conversation" button (replaces the old PawPrint/clear behavior)
- A history button to open conversation list
- A logout button

Key changes:
- Add `onNewChat`, `onOpenHistory`, `onLogout` props
- Replace the left PawPrint button logic with `onNewChat`
- Add a small history icon (MessageSquare or similar from lucide) and logout icon

**Step 2: Update ChatContainer**

In `src/components/chat/ChatContainer.tsx`:
- Replace `clearMessages` usage with `newConversation` from the updated `useChat`
- Add state for showing a conversation list drawer/panel
- Fetch conversations via `GET /api/conversations`
- Wire up `loadConversation` for selecting past conversations
- Add a logout handler that calls `POST /api/auth/logout` then redirects to `/login`

**Step 3: Commit**

```bash
git add src/components/chat/ChatContainer.tsx src/components/layout/Header.tsx
git commit -m "feat: add conversation history, new chat, and logout to UI"
```

---

### Task 11: Clean Up Old Session Code

**Files:**
- Delete: `src/services/session.ts`
- Delete: `src/app/api/sessions/route.ts`
- Delete: `src/app/api/sessions/[sessionId]/route.ts`
- Delete: `src/app/api/sessions/[sessionId]/messages/route.ts`
- Modify: `src/types/index.ts` - Remove `ServerSession`, `ServerMessage`, `SessionConfig`, `CreateSessionResponse`, `SessionHistoryResponse` types

**Step 1: Delete old session files**

```bash
rm src/services/session.ts
rm -rf src/app/api/sessions/
```

**Step 2: Clean up types**

In `src/types/index.ts`, remove the server-side session types that are no longer used (lines 46-95). Keep `Message`, `Product`, `ImageAttachment`, `PetInfo`, `ChatSession`, `ChatResponse`.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove in-memory session service, replaced by DB"
```

---

### Task 12: Environment Setup & Database Migration

**Files:**
- Modify: `.env.local` (add new vars)

**Step 1: Set up Vercel Postgres**

On Vercel dashboard:
1. Go to project → Storage → Create Database → Postgres
2. Copy the connection strings into `.env.local`:

```bash
POSTGRES_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."
```

**Step 2: Set up Vercel Blob**

On Vercel dashboard:
1. Go to project → Storage → Create Blob Store
2. Copy token to `.env.local`:

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

**Step 3: Add JWT secret**

```bash
JWT_SECRET="generate-a-random-64-char-string-here"
```

**Step 4: Push schema to database**

Run:
```bash
npm run db:push
```
Expected: Tables `users`, `conversations`, `messages` created.

**Step 5: Verify with Drizzle Studio**

Run:
```bash
npm run db:studio
```
Expected: Opens browser showing empty tables.

**Step 6: Build & test**

Run: `npm run build`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add drizzle.config.ts package.json
git commit -m "chore: configure Vercel Postgres and Blob storage"
```

---

### Task 13: Vercel Deployment

**Step 1: Push to GitHub**

```bash
git push origin main
```

**Step 2: Connect to Vercel**

1. Go to vercel.com → Import project from GitHub
2. Select the petAI repo
3. Vercel auto-detects Next.js

**Step 3: Add environment variables in Vercel dashboard**

All env vars from `.env.local`:
- `AI_PROVIDER`, `KIMI_API_KEY`, `KIMI_BASE_URL`
- `OPENAI_API_KEY` (for Zilliz embeddings)
- `ZILLIZ_ENDPOINT`, `ZILLIZ_API_KEY`
- `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` (auto-set if using Vercel Storage)
- `BLOB_READ_WRITE_TOKEN` (auto-set if using Vercel Blob)
- `JWT_SECRET`

**Step 4: Deploy & verify**

1. Trigger deploy
2. Visit deployed URL
3. Should redirect to `/login`
4. Create account, start chatting
5. Refresh page — conversation persists
6. Close browser, return — history is accessible

---

## Execution Order Summary

| Task | What | Files | Depends On |
|------|------|-------|------------|
| 1 | Install deps | package.json | - |
| 2 | DB schema & connection | src/db/*, drizzle.config.ts | 1 |
| 3 | Auth utilities | src/lib/auth.ts | 1 |
| 4 | Auth API routes | src/app/api/auth/* | 2, 3 |
| 5 | Auth middleware | src/middleware.ts | 3 |
| 6 | Login page | src/app/login/page.tsx | - |
| 7 | Image upload route | src/app/api/upload/route.ts | 3 |
| 8 | Conversation API routes | src/app/api/conversations/*, chat/route.ts | 2, 3 |
| 9 | Rewrite useChat hook | src/hooks/useChat.ts | 7, 8 |
| 10 | Update UI (Header, ChatContainer) | components/* | 9 |
| 11 | Clean up old session code | services/session.ts, api/sessions/* | 8, 10 |
| 12 | Env setup & DB migration | .env.local, drizzle push | 2 |
| 13 | Deploy to Vercel | - | all |
