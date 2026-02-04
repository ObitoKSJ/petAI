import { PET_CARE_SYSTEM_PROMPT } from '@/lib/prompts';
import { ALL_TOOLS, executeToolCall, type ToolCall } from '@/lib/tools';
import type { Product } from '@/types';

// Response type including collected products
export interface ChatResult {
  response: string;
  products: Product[];
}

// =============================================================================
// Provider Configuration
// =============================================================================

type ProviderConfig = {
  baseUrl: string;
  model: string;
  visionModel: string;
  temperature?: number; // Some models require specific temperature
  supportsVision: boolean;
};

const PROVIDERS: Record<string, ProviderConfig> = {
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'kimi-k2.5',
    visionModel: 'kimi-k2.5',
    temperature: 1, // K2.5 requires temperature=1
    supportsVision: true,
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    visionModel: 'gpt-4o',
    supportsVision: true,
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    visionModel: 'deepseek-chat',
    supportsVision: false,
  },
  // Add more providers as needed:
  // anthropic: { baseUrl: 'https://api.anthropic.com/v1', ... },
  // groq: { baseUrl: 'https://api.groq.com/openai/v1', ... },
};

// =============================================================================
// Types
// =============================================================================

type TextContent = {
  type: 'text';
  text: string;
};

type ImageContent = {
  type: 'image_url';
  image_url: {
    url: string;
  };
};

type MessageContent = string | (TextContent | ImageContent)[];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ImageData {
  base64: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
      reasoning_content?: string; // KIMI K2.5 thinking content
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =============================================================================
// AI Service
// =============================================================================

export class AIService {
  private provider: string;
  private config: ProviderConfig;
  private apiKey: string;

  constructor() {
    // Read provider from env, default to 'kimi'
    this.provider = process.env.AI_PROVIDER || 'kimi';

    const config = PROVIDERS[this.provider];
    if (!config) {
      throw new Error(`Unknown AI provider: ${this.provider}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
    }
    this.config = config;

    // API key: try provider-specific first, then generic
    this.apiKey = process.env.AI_API_KEY || process.env[`${this.provider.toUpperCase()}_API_KEY`] || '';

    // Allow base URL override
    if (process.env.AI_BASE_URL) {
      this.config = { ...this.config, baseUrl: process.env.AI_BASE_URL };
    }
  }

  async chat(
    userMessage: string,
    conversationHistory: HistoryMessage[] = [],
    images?: ImageData[]
  ): Promise<ChatResult> {
    // Collect products from tool calls
    const collectedProducts: Product[] = [];
    if (!this.apiKey) {
      throw new Error(`API key not configured. Set AI_API_KEY or ${this.provider.toUpperCase()}_API_KEY`);
    }

    const hasImages = images && images.length > 0;

    // Warn if trying to use vision with unsupported provider
    if (hasImages && !this.config.supportsVision) {
      console.warn(`[AI Service] Provider '${this.provider}' does not support vision. Images will be ignored.`);
    }

    // Build user content
    let userContent: MessageContent;
    if (hasImages && this.config.supportsVision) {
      const contentParts: (TextContent | ImageContent)[] = [];

      for (const img of images) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img.base64 },
        });
      }

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

    // Build messages array (mutable for tool call loop)
    const messages: ChatMessage[] = [
      { role: 'system', content: PET_CARE_SYSTEM_PROMPT },
      ...conversationHistory
        .filter((m) => m.content.trim())
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as MessageContent,
        })),
      { role: 'user', content: userContent },
    ];

    const modelToUse = hasImages && this.config.supportsVision
      ? this.config.visionModel
      : this.config.model;

    // Tool call loop - AI may call tools multiple times
    const MAX_TOOL_ITERATIONS = 3;
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const requestBody: Record<string, unknown> = {
        model: modelToUse,
        messages,
        max_tokens: 1024,
        tools: ALL_TOOLS,
        tool_choice: 'auto',
      };

      // Add temperature if provider requires it
      if (this.config.temperature !== undefined) {
        requestBody.temperature = this.config.temperature;
      }

      console.log(`[AI Service] Request to ${this.provider} (iteration ${i + 1}):`, {
        model: modelToUse,
        messageCount: messages.length,
        hasImages: hasImages && this.config.supportsVision,
        hasTools: true,
      });

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI Service] ${this.provider} API Error:`, {
          status: response.status,
          error: errorText,
        });
        throw new Error(`${this.provider} API error: ${response.status} - ${errorText}`);
      }

      const data: ChatCompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from AI');
      }

      const assistantMessage = data.choices[0].message;

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log(`[AI Service] AI requested ${assistantMessage.tool_calls.length} tool call(s)`);

        // Add assistant message with tool calls to history
        // KIMI K2.5 requires reasoning_content to be preserved
        const assistantMsgForHistory: Record<string, unknown> = {
          role: 'assistant',
          content: assistantMessage.content || '',
          tool_calls: assistantMessage.tool_calls,
        };

        // Preserve reasoning_content if present (required by KIMI K2.5)
        if ('reasoning_content' in assistantMessage) {
          assistantMsgForHistory.reasoning_content = assistantMessage.reasoning_content;
        }

        messages.push(assistantMsgForHistory as unknown as ChatMessage);

        // Execute each tool call and add results
        for (const toolCall of assistantMessage.tool_calls) {
          console.log(`[AI Service] Executing tool: ${toolCall.function.name}`);
          const result = await executeToolCall(toolCall);

          // Collect products from search_products tool
          if (toolCall.function.name === 'search_products') {
            try {
              const parsed = JSON.parse(result);
              if (parsed.success && parsed.products?.length > 0) {
                collectedProducts.push(...parsed.products);
              }
            } catch {
              // Ignore parse errors
            }
          }

          // Add tool result to messages (cast to any for tool message format)
          messages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
          } as unknown as ChatMessage);
        }

        // Continue loop to get AI's response with tool results
        continue;
      }

      // No tool calls - return the response with collected products
      return {
        response: assistantMessage.content || '',
        products: collectedProducts,
      };
    }

    throw new Error('Max tool iterations reached');
  }
}

export const aiService = new AIService();
