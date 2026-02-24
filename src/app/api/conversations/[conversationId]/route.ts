import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth.server';
import { eq, and } from 'drizzle-orm';

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
