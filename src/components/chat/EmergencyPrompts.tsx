'use client';

import { EMERGENCY_PROMPTS } from '@/lib/prompts';
import { cn } from '@/lib/utils';

interface EmergencyPromptsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function EmergencyPrompts({ onSelect, disabled }: EmergencyPromptsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-2">
        {EMERGENCY_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt.message)}
            className={cn(
              'flex items-center gap-2 rounded-2xl px-4 py-3 sm:px-3 sm:py-2',
              'bg-foreground/5 backdrop-blur-md transition-colors',
              'hover:bg-foreground/10 active:bg-foreground/10',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-lg sm:text-base" role="img" aria-label={prompt.label}>
              {prompt.icon}
            </span>
            <span className="text-sm sm:text-xs font-medium text-foreground/80 leading-tight">
              {prompt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
