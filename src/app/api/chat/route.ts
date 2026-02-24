import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/services/ai';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth.server';
import { eq } from 'drizzle-orm';

interface ImageData {
  base64: string;
  url?: string;
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

    const imageUrls = images?.map((img) => img.url).filter(Boolean) as string[] | undefined;
    await db.insert(messages).values({
      conversationId,
      role: 'user',
      content: message || '[image]',
      imageUrls: imageUrls?.length ? imageUrls : undefined,
    });

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

    const history = await db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    const historyForLLM = history.slice(0, -1).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const imageData = images?.map((img) => ({ base64: img.base64 }));
    const result = await aiService.chat(message || '', historyForLLM, imageData);

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
