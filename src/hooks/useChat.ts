'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, ImageAttachment } from '@/types';
import { generateId } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface SendMessageOptions {
  images?: ImageAttachment[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Use ref to always have access to current messages in sendMessage
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const sendMessage = useCallback(async (content: string, options?: SendMessageOptions) => {
    const { images } = options || {};

    // Use placeholder for image-only messages (for history context)
    const messageContent = content || (images?.length ? t('chat.sharedImage') : '');

    const userMessage: Message = {
      id: generateId(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      images, // Store images in message for display
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsAnalyzingImage(!!images?.length);
    setError(null);

    try {
      // Build history from current messages (text only - images are not repeated)
      const history = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Prepare images for API (just the base64 data)
      const imageData = images?.map((img) => ({ base64: img.base64 }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history,
          images: imageData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('chat.requestFailed'));
      }

      const assistantMessage: Message = {
        id: data.messageId || generateId(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        products: data.products, // Include product recommendations
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : t('chat.sendFailed');
      console.error('Failed to send message:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsAnalyzingImage(false);
    }
  }, [t]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isAnalyzingImage,
    error,
    sendMessage,
    clearMessages,
  };
}
