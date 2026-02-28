'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, Languages, LogOut, User, SquarePen } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmergencyPrompts } from './EmergencyPrompts';
import { Header } from '@/components/layout/Header';
import { useChat } from '@/hooks/useChat';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

const ANALYZING_PHRASE_COUNT = 5;

function AnalyzingText() {
  const [index, setIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % ANALYZING_PHRASE_COUNT);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="ml-3 text-sm text-muted-foreground/70 animate-pulse">
      {t(`analyzing.${index}`)}...
    </span>
  );
}

// Fixed element heights
const HEADER_HEIGHT = 64;
const INPUT_HEIGHT = 80;

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export function ChatContainer() {
  const { messages, isLoading, isAnalyzingImage, conversationId, sendMessage, loadConversation, newConversation } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typedMessages, setTypedMessages] = useState<Set<string>>(new Set());
  const keyboardHeight = useKeyboardHeight();
  const prevMessageCountRef = useRef(0);
  const { t } = useTranslation();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [username, setUsername] = useState<string>('');
  const { locale, setLocale } = useTranslation();

  // Auto-scroll hook with anchor-to-top pattern
  const { containerRef, anchorRef, isAtBottom, scrollToAnchor } = useAutoScroll({
    isStreaming: isLoading,
    topOffset: HEADER_HEIGHT,
  });

  // Find the last user message index (this will be our anchor)
  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === 'user');

  // Scroll to anchor when a NEW user message is added
  useEffect(() => {
    const currentCount = messages.length;
    const lastMessage = messages[messages.length - 1];

    // Only trigger on new user message (not on assistant response)
    if (
      currentCount > prevMessageCountRef.current &&
      lastMessage?.role === 'user'
    ) {
      // Small delay to let DOM update, then scroll to anchor
      requestAnimationFrame(() => {
        scrollToAnchor();
      });
    }

    prevMessageCountRef.current = currentCount;
  }, [messages, scrollToAnchor]);

  // Scroll to bottom when keyboard opens (but only if already at bottom)
  useEffect(() => {
    if (keyboardHeight > 0 && isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [keyboardHeight, isAtBottom]);

  // Track newly typed messages for typewriter effect
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && !typedMessages.has(lastMessage.id)) {
      const timer = setTimeout(() => {
        setTypedMessages((prev) => new Set([...prev, lastMessage.id]));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, typedMessages]);

  // Calculate bottom padding for messages to account for fixed input
  const bottomPadding = INPUT_HEIGHT + keyboardHeight;

  // Wrap sendMessage to handle scroll behavior
  const handleSendMessage = useCallback(
    (message: string, options?: { images?: Array<{ id: string; base64: string; mimeType: string; name?: string }> }) => {
      sendMessage(message, options);
    },
    [sendMessage]
  );

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, []);

  // Fetch username on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.username) setUsername(data.username); })
      .catch(() => {});
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    requestAnimationFrame(() => setDrawerVisible(true));
    fetchConversations();
  }, [fetchConversations]);

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false);
    setTimeout(() => setDrawerOpen(false), 300);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    loadConversation(id);
    closeDrawer();
  }, [loadConversation, closeDrawer]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, [router]);

  return (
    <div className="relative h-full bg-background">
      {/* Left Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex">
          {/* Backdrop */}
          <div
            className={cn(
              'absolute inset-0 bg-black/30 transition-opacity duration-300',
              drawerVisible ? 'opacity-100' : 'opacity-0'
            )}
            onClick={closeDrawer}
          />
          {/* Drawer */}
          <div
            className={cn(
              'relative w-72 max-w-[80vw] h-full bg-background shadow-xl flex flex-col pt-safe',
              'transition-transform duration-300 ease-out',
              drawerVisible ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Top: New Chat + History */}
            <div className="flex-1 overflow-y-auto px-2 pt-4">
              {/* New Chat Button */}
              <button
                onClick={() => { newConversation(); closeDrawer(); }}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-foreground/70 hover:bg-foreground/5 active:bg-foreground/8 transition-colors mb-3"
              >
                <SquarePen className="size-4" strokeWidth={1.5} />
                <span>{locale === 'zh' ? '新对话' : 'New chat'}</span>
              </button>

              {/* History Label */}
              <h2 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2 px-2">
                {t('history.title') || 'Chat History'}
              </h2>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">{t('history.empty') || 'No conversations yet'}</p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => handleSelectConversation(convo.id)}
                      className={cn(
                        'text-left px-2 py-2.5 rounded-lg text-sm transition-colors',
                        'hover:bg-foreground/5 active:bg-foreground/8',
                        convo.id === conversationId && 'bg-primary/10 text-primary'
                      )}
                    >
                      <p className="truncate font-medium">
                        {convo.title || 'New conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(convo.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="px-2 py-4 pb-safe space-y-1">
              {/* Language Switch */}
              <button
                onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-foreground/60 hover:bg-foreground/5 active:bg-foreground/8 transition-colors"
              >
                <Languages className="size-4" strokeWidth={1.5} />
                <span>{locale === 'zh' ? 'English' : '中文'}</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-foreground/60 hover:bg-foreground/5 active:bg-foreground/8 transition-colors"
              >
                <LogOut className="size-4" strokeWidth={1.5} />
                <span>{locale === 'zh' ? '登出' : 'Log out'}</span>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3 px-2 py-3">
                <User className="size-4 text-primary flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm font-medium text-foreground/80 truncate">
                  {username || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-20 pt-safe">
        <Header onOpenDrawer={openDrawer} />
      </div>

      {/* Messages area - scrollable with elastic overscroll */}
      <main
        ref={containerRef as React.RefObject<HTMLElement>}
        className="h-full overflow-y-auto"
        style={{ paddingTop: HEADER_HEIGHT, paddingBottom: bottomPadding }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[60vh] flex-col items-center p-4">
            <h1 className="mt-8 text-center font-[family-name:var(--font-playwrite)] text-xl italic whitespace-nowrap">
              <span className="text-foreground/80">{t('welcome')}</span>
            </h1>
            <div className="flex-1" />
            <EmergencyPrompts onSelect={handleSendMessage} disabled={isLoading} />
            <div className="flex-1" />
          </div>
        ) : (
          <div className="pt-4 pb-4">
            {/* Top spacer for overscroll room */}
            <div className="h-8" />
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={index === lastUserMessageIndex ? anchorRef : undefined}
              >
                <ChatMessage
                  message={message}
                  isNew={message.role === 'assistant' && !typedMessages.has(message.id)}
                />
              </div>
            ))}
            {isLoading && (
              <div className="w-full px-4 py-4">
                <div className="mx-auto max-w-3xl flex items-center">
                  <Loader className="size-5 animate-spin text-muted-foreground/60" />
                  {isAnalyzingImage && <AnalyzingText />}
                </div>
              </div>
            )}
            {/* Spacer to allow anchor to scroll near top */}
            <div className="min-h-[50vh]" />
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input area - fixed at bottom, moves with keyboard */}
      <div
        className="fixed left-0 right-0 z-20 pb-safe"
        style={{ bottom: keyboardHeight }}
      >
        <ChatInput onSend={handleSendMessage} disabled={isLoading} isLoading={isLoading} />
      </div>
    </div>
  );
}
