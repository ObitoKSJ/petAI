'use client';

import { PawPrint, Languages } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface HeaderProps {
  onClearChat?: () => void;
}

export function Header({ onClearChat }: HeaderProps) {
  const { t, locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className="w-full px-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="w-full rounded-full bg-foreground/5 backdrop-blur-md py-3 px-4 flex items-center justify-between">
          {onClearChat ? (
            <button
              onClick={onClearChat}
              className="hover:scale-110 transition-transform text-primary"
              aria-label={t('header.returnHome')}
            >
              <PawPrint className="size-6" strokeWidth={1.5} />
            </button>
          ) : (
            <PawPrint className="size-6 text-primary" strokeWidth={1.5} />
          )}
          <span className="font-[family-name:var(--font-playwrite)] text-lg text-foreground/80 italic">PetCare</span>
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-foreground/90 transition-colors px-2 py-1 rounded-full hover:bg-foreground/5"
          >
            <Languages className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
