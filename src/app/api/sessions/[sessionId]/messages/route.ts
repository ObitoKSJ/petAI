import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '@/services/session';

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

// GET /api/sessions/[sessionId]/messages - Get conversation history
export async function GET(request: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  const session = sessionService.getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: session.id,
    messages: session.messages,
    petInfo: session.petInfo,
  });
}
