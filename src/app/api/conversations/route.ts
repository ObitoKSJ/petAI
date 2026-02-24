import { NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth.server';
import { eq, desc, count } from 'drizzle-orm';

const MAX_CONVERSATIONS = 50;

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

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
