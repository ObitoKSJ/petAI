'use client';

import { Menu } from 'lucide-react';

interface HeaderProps {
  onOpenDrawer?: () => void;
}

export function Header({ onOpenDrawer }: HeaderProps) {
  return (
    <header className="w-full px-4 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="w-full rounded-full bg-foreground/5 backdrop-blur-md py-3 px-4 flex items-center justify-between">
          <button
            onClick={onOpenDrawer}
            className="flex items-center justify-center text-foreground/60 hover:text-foreground/90 transition-colors p-1 rounded-full hover:bg-foreground/5"
            aria-label="Open menu"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <span className="font-[family-name:var(--font-playwrite)] text-lg text-foreground/80 italic">PetCare</span>
          <div className="size-7" />
        </div>
      </div>
    </header>
  );
}
