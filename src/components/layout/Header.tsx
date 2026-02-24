'use client';

import { PawPrint, Languages, MessageSquare, LogOut } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface HeaderProps {
  onNewChat?: () => void;
  onOpenHistory?: () => void;
  onLogout?: () => void;
}

export function Header({ onNewChat, onOpenHistory, onLogout }: HeaderProps) {
  const { locale, setLocale } = useTranslation();

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className="w-full px-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="w-full rounded-full bg-foreground/5 backdrop-blur-md py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {onNewChat ? (
              <button
                onClick={onNewChat}
                className="hover:scale-110 transition-transform text-primary"
                aria-label="New chat"
              >
                <PawPrint className="size-6" strokeWidth={1.5} />
              </button>
            ) : (
              <PawPrint className="size-6 text-primary" strokeWidth={1.5} />
            )}
          </div>
          <span className="font-[family-name:var(--font-playwrite)] text-lg text-foreground/80 italic">PetCare</span>
          <div className="flex items-center gap-1">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center justify-center text-foreground/60 hover:text-foreground/90 transition-colors p-1 rounded-full hover:bg-foreground/5"
                aria-label="Chat history"
              >
                <MessageSquare className="size-4" strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={toggleLocale}
              className="flex items-center text-foreground/60 hover:text-foreground/90 transition-colors p-1 rounded-full hover:bg-foreground/5"
            >
              <Languages className="size-4" strokeWidth={1.5} />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center text-foreground/60 hover:text-foreground/90 transition-colors p-1 rounded-full hover:bg-foreground/5"
                aria-label="Log out"
              >
                <LogOut className="size-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
