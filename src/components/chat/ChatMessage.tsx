'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { TypewriterText } from './TypewriterText';
import { ProductCards } from './ProductCard';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  isNew?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isNew = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    const hasImages = message.images && message.images.length > 0;

    // User message: right-aligned bubble
    return (
      <div className="flex w-full justify-end px-4 py-2">
        <div className="max-w-[85%] sm:max-w-[70%]">
          {/* Image attachments */}
          {hasImages && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {message.images!.map((img) => (
                <img
                  key={img.id}
                  src={img.base64}
                  alt={img.name || 'Uploaded image'}
                  className="max-h-32 max-w-[200px] rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {/* Text content */}
          {message.content && (
            <div className="rounded-3xl bg-primary px-4 py-2.5 text-sm text-primary-foreground sm:text-base">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message: full width, markdown rendered
  // Use typewriter effect for new messages
  if (isNew) {
    return (
      <div className="w-full px-4 py-4">
        <div className="mx-auto max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base">
          <TypewriterText content={message.content} speed={4} />
          {message.products && message.products.length > 0 && (
            <ProductCards products={message.products} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4">
      <div className="mx-auto max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="mb-3 last:mb-0">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="pl-1">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            h1: ({ children }) => (
              <h1 className="mb-3 text-xl font-bold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-2 text-lg font-semibold">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 font-semibold">{children}</h3>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="mb-3 last:mb-0">{children}</pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mb-3 border-l-4 border-primary/50 pl-4 italic last:mb-0">
                {children}
              </blockquote>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
        {message.products && message.products.length > 0 && (
          <ProductCards products={message.products} />
        )}
      </div>
    </div>
  );
});
