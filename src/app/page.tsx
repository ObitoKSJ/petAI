'use client';

import { ChatContainer } from '@/components/chat';
import { LocaleProvider } from '@/i18n';

export default function Home() {
  return (
    <LocaleProvider>
      <main className="h-dvh bg-background">
        <ChatContainer />
      </main>
    </LocaleProvider>
  );
}
