'use client';

import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask about your pet...',
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !disabled) {
        onSend(trimmed);
        setInput('');
      }
    },
    [input, disabled, onSend]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as FormEvent);
      }
    },
    [handleSubmit]
  );

  const canSend = input.trim() && !disabled;

  return (
    <div className="w-full px-4 pb-2 pt-2">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full rounded-full bg-foreground/10 backdrop-blur-md py-4 pl-5 pr-14 sm:py-3 sm:pl-4 sm:pr-12',
              'text-base sm:text-sm placeholder:text-muted-foreground/60',
              'outline-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={!canSend}
            className={cn(
              'absolute right-2.5 sm:right-2 flex size-10 sm:size-8 items-center justify-center rounded-full',
              'transition-all duration-200',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted-foreground/20 text-muted-foreground/40'
            )}
            aria-label="Send message"
          >
            <ArrowUp className="size-5 sm:size-4" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
