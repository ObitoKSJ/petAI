import { NextRequest, NextResponse } from 'next/server';
import { sessionService } from '@/services/session';

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { petInfo } = body;

    const session = sessionService.createSession(petInfo);

    return NextResponse.json({
      sessionId: session.id,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// GET /api/sessions - List active sessions (debug)
export async function GET() {
  return NextResponse.json({
    count: sessionService.getActiveSessionCount(),
    sessionIds: sessionService.getAllSessionIds(),
  });
}
