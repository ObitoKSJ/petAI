'use client';

import { PawPrint } from 'lucide-react';

interface HeaderProps {
  onClearChat?: () => void;
}

export function Header({ onClearChat }: HeaderProps) {
  return (
    <header className="w-full px-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="w-full rounded-full bg-foreground/5 backdrop-blur-md py-3 px-4 flex items-center justify-between">
          {onClearChat ? (
            <button
              onClick={onClearChat}
              className="hover:scale-110 transition-transform text-primary"
              aria-label="Return to home"
            >
              <PawPrint className="size-6" />
            </button>
          ) : (
            <PawPrint className="size-6 text-primary" />
          )}
          <span className="font-[family-name:var(--font-playwrite)] text-lg text-foreground/80 italic">PetCare AI</span>
        </div>
      </div>
    </header>
  );
}
