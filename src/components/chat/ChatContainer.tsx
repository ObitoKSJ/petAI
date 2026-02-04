'use client';

import { useRef, useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmergencyPrompts } from './EmergencyPrompts';
import { Header } from '@/components/layout/Header';
import { useChat } from '@/hooks/useChat';

const ANALYZING_PHRASES = [
  'Analyzing image',
  'Examining details',
  'Looking closely',
  'Processing visuals',
  'Studying the photo',
];

function AnalyzingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ANALYZING_PHRASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="ml-3 text-sm text-muted-foreground/70 animate-pulse">
      {ANALYZING_PHRASES[index]}...
    </span>
  );
}

export function ChatContainer() {
  const { messages, isLoading, isAnalyzingImage, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typedMessages, setTypedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track newly typed messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !typedMessages.has(lastMessage.id)) {
      // Mark as typed after a brief delay to allow typewriter to start
      const timer = setTimeout(() => {
        setTypedMessages((prev) => new Set([...prev, lastMessage.id]));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, typedMessages]);

  return (
    <div className="relative h-full overflow-y-auto bg-background">
      {/* Header - sticky at top */}
      <div className="sticky top-0 z-10">
        <Header onClearChat={messages.length > 0 ? clearMessages : undefined} />
      </div>

      {/* Messages area */}
      <main className="min-h-[calc(100%-7rem)]">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[50vh] flex-col items-center justify-center p-4">
            <h1 className="text-center mb-8 sm:mb-6 font-[family-name:var(--font-playwrite)] text-2xl sm:text-xl italic">
              <span className="text-foreground/80"> How can I help you now?</span>
            </h1>
            <EmergencyPrompts onSelect={sendMessage} disabled={isLoading} />
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isNew={message.role === 'assistant' && !typedMessages.has(message.id)}
              />
            ))}
            {isLoading && (
              <div className="w-full px-4 py-4">
                <div className="mx-auto max-w-3xl flex items-center">
                  <Loader className="size-5 animate-spin text-accent" />
                  {isAnalyzingImage && <AnalyzingText />}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input area - sticky at bottom */}
      <div className="sticky bottom-0 z-10 pb-safe">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
