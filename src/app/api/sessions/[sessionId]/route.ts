import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '@/services/session';

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

// GET /api/sessions/[sessionId] - Get session details
export async function GET(request: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  const session = sessionService.getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: session.id,
    petInfo: session.petInfo,
    messageCount: session.messages.length,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
}

// DELETE /api/sessions/[sessionId] - End session
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  const deleted = sessionService.deleteSession(sessionId);

  if (!deleted) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/sessions/[sessionId] - Update pet info
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;
  const { petInfo } = await request.json();

  const updated = sessionService.updatePetInfo(sessionId, petInfo);

  if (!updated) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
