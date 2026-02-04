import { NextRequest, NextResponse } from 'next/server';
import { kimiService } from '@/services/kimi';
import { generateId } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json() as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Debug: Log conversation state
    console.log('[Chat API] Received message with', history.length, 'history messages');
    if (history.length > 0) {
      console.log('[Chat API] History preview:', history.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 40)}...`));
    }

    // Call KIMI with full conversation history from client
    const response = await kimiService.chat(message, history);

    return NextResponse.json({
      response,
      messageId: generateId(),
    });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'Service configuration error. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
