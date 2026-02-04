import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai';
import { generateId } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ImageData {
  base64: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
  images?: ImageData[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], images } = await request.json() as ChatRequestBody;

    // Allow empty message if images are provided
    const hasImages = images && images.length > 0;
    if (!message && !hasImages) {
      return NextResponse.json(
        { error: 'Message or image is required' },
        { status: 400 }
      );
    }

    // Debug: Log conversation state
    console.log('[Chat API] Received message with', history.length, 'history messages');
    if (hasImages) {
      console.log('[Chat API] Includes', images.length, 'image(s)');
    }
    if (history.length > 0) {
      console.log('[Chat API] History preview:', history.slice(-4).map(m => `${m.role}: ${m.content.substring(0, 40)}...`));
    }

    // Call AI with full conversation history and optional images
    const result = await aiService.chat(message || '', history, images);

    return NextResponse.json({
      response: result.response,
      products: result.products,
      messageId: generateId(),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

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
