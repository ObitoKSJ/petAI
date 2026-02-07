'use client';

import Image from 'next/image';
import { QUICK_PROMPTS } from '@/lib/prompts';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface EmergencyPromptsProps {
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function EmergencyPrompts({ onSelect, disabled }: EmergencyPromptsProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(t(`prompt.${prompt.tKey}.message`))}
            className={cn(
              'flex-shrink-0 snap-start w-32',
              'transition-all duration-200',
              'active:scale-95',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-foreground/10">
              <Image
                src={prompt.image}
                alt={t(`prompt.${prompt.tKey}.label`)}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <p className="mt-2 text-xs font-medium text-foreground/70 text-center">
              {t(`prompt.${prompt.tKey}.label`)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
