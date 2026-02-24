import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth.server';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { conversationId } = await params;

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
