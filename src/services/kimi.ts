import { PET_CARE_SYSTEM_PROMPT } from '@/lib/prompts';

// Text-only content
type TextContent = {
  type: 'text';
  text: string;
};

// Image content (base64 or URL)
type ImageContent = {
  type: 'image_url';
  image_url: {
    url: string; // data:image/xxx;base64,... or https://...
  };
};

// Multimodal content can be text, image, or array of both
type MessageContent = string | (TextContent | ImageContent)[];

// Chat message supporting both text-only and multimodal
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

// Simplified history message (text only for history)
interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Image data passed from client
interface ImageData {
  base64: string; // Full data URL: data:image/xxx;base64,...
}

interface KimiResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class KimiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private visionModel: string;

  constructor() {
    this.apiKey = process.env.KIMI_API_KEY || '';
    this.baseUrl = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1';
    this.model = 'kimi-k2.5'; // K2.5 supports vision
    this.visionModel = 'kimi-k2.5';
  }

  async chat(
    userMessage: string,
    conversationHistory: HistoryMessage[] = [],
    images?: ImageData[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('KIMI API key is not configured');
    }

    const hasImages = images && images.length > 0;

    // Build user content - multimodal if images present
    let userContent: MessageContent;
    if (hasImages) {
      const contentParts: (TextContent | ImageContent)[] = [];

      // Add images first
      for (const img of images) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img.base64 },
        });
      }

      // Add text message
      if (userMessage.trim()) {
        contentParts.push({
          type: 'text',
          text: userMessage,
        });
      }

      userContent = contentParts;
    } else {
      userContent = userMessage;
    }

    // Build messages array (filter out empty history messages)
    const messages: ChatMessage[] = [
      { role: 'system', content: PET_CARE_SYSTEM_PROMPT },
      ...conversationHistory
        .filter((m) => m.content.trim()) // Skip empty messages (e.g., image-only)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as MessageContent,
        })),
      { role: 'user', content: userContent },
    ];

    // Use vision model if images are present
    const modelToUse = hasImages ? this.visionModel : this.model;

    const requestBody = {
      model: modelToUse,
      messages,
      temperature: 1, // K2.5 requires temperature=1
      max_tokens: 1024,
    };

    // Debug: Log request details (without full base64)
    console.log('[KIMI Service] Request:', {
      model: modelToUse,
      messageCount: messages.length,
      hasImages,
      lastMessageType: typeof userContent === 'string' ? 'text' : 'multimodal',
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[KIMI Service] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`KIMI API error: ${response.status} - ${errorText}`);
    }

    const data: KimiResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from KIMI');
    }

    return data.choices[0].message.content;
  }
}

export const kimiService = new KimiService();
