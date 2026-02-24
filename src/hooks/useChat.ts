'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, ImageAttachment, Product } from '@/types';
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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { t } = useTranslation();

  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const uploadImages = useCallback(async (images: ImageAttachment[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      const res = await fetch(img.base64);
      const blob = await res.blob();
      const file = new File([blob], img.name || 'image.jpg', { type: img.mimeType });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        urls.push(url);
      }
    }
    return urls;
  }, []);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId;

    const res = await fetch('/api/conversations', { method: 'POST' });
    const data = await res.json();
    setConversationId(data.id);
    return data.id;
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string, options?: SendMessageOptions) => {
    const { images } = options || {};

    const messageContent = content || (images?.length ? t('chat.sharedImage') : '');

    const userMessage: Message = {
      id: generateId(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      images,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsAnalyzingImage(!!images?.length);
    setError(null);

    try {
      const convoId = await ensureConversation();

      let imageUrls: string[] = [];
      if (images?.length) {
        imageUrls = await uploadImages(images);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: convoId,
          images: images?.map((img, i) => ({
            base64: img.base64,
            url: imageUrls[i],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('chat.requestFailed'));
      }

      const assistantMessage: Message = {
        id: generateId(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        products: data.products,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('chat.sendFailed');
      console.error('Failed to send message:', err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsAnalyzingImage(false);
    }
  }, [t, ensureConversation, uploadImages]);

  const loadConversation = useCallback(async (convoId: string) => {
    setConversationId(convoId);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${convoId}/messages`);
      const data = await res.json();

      const loaded: Message[] = data.map((m: { id: string; role: string; content: string; imageUrls?: string[]; products?: Product[]; createdAt: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt),
        imageUrls: m.imageUrls,
        products: m.products,
      }));

      setMessages(loaded);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isAnalyzingImage,
    error,
    conversationId,
    sendMessage,
    loadConversation,
    newConversation,
  };
}
