import { PET_CARE_SYSTEM_PROMPT } from '@/lib/prompts';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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

  constructor() {
    this.apiKey = process.env.KIMI_API_KEY || '';
    this.baseUrl = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1';
    this.model = 'moonshot-v1-8k';
  }

  async chat(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('KIMI API key is not configured');
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: PET_CARE_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`KIMI API error: ${response.status} - ${error}`);
    }

    const data: KimiResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from KIMI');
    }

    return data.choices[0].message.content;
  }
}

export const kimiService = new KimiService();
