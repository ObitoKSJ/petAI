'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterTextProps {
  content: string;
  speed?: number; // characters per frame
  onComplete?: () => void;
}

export function TypewriterText({
  content,
  speed = 3,
  onComplete,
}: TypewriterTextProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedContent('');
    setIsComplete(false);

    const animate = () => {
      if (indexRef.current < content.length) {
        // Add multiple characters per frame for smoother feel
        const nextIndex = Math.min(indexRef.current + speed, content.length);
        setDisplayedContent(content.slice(0, nextIndex));
        indexRef.current = nextIndex;
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [content, speed, onComplete]);

  return (
    <div className="transition-opacity duration-150">
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
        {displayedContent}
      </ReactMarkdown>
    </div>
  );
}
