'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface UseAutoScrollOptions {
  /** Threshold in pixels to consider "at bottom" */
  bottomThreshold?: number;
  /** Whether streaming is currently active */
  isStreaming?: boolean;
  /** Offset from top to position anchor (e.g., header height) */
  topOffset?: number;
}

interface UseAutoScrollReturn {
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Ref to attach to the anchor element (last user message) */
  anchorRef: React.RefObject<HTMLDivElement | null>;
  /** Whether user is currently at the bottom */
  isAtBottom: boolean;
  /** Whether auto-scroll is enabled (user hasn't scrolled up) */
  autoScrollEnabled: boolean;
  /** Scroll to the anchor (user message near top) */
  scrollToAnchor: () => void;
  /** Scroll to the bottom of the container */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** Re-enable auto-scroll (when user clicks scroll button) */
  enableAutoScroll: () => void;
}

/**
 * Hook implementing ChatGPT/Claude-style "anchor to top" scroll behavior.
 *
 * On send: Scrolls so user's message appears near the top of viewport.
 * During streaming: Keeps anchor stable, response grows below.
 * User control: Disables auto-scroll if user scrolls up manually.
 */
export function useAutoScroll({
  bottomThreshold = 100,
  isStreaming = false,
  topOffset = 0,
}: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const containerRef = useRef<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const userScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  // Check if container is scrolled to bottom
  const checkIsAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < bottomThreshold;
  }, [bottomThreshold]);

  // Handle scroll events - detect if user scrolled up manually
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const atBottom = checkIsAtBottom();
      setIsAtBottom(atBottom);

      // If streaming and user scrolled UP (not down), disable auto-scroll
      if (isStreaming && currentScrollTop < lastScrollTopRef.current - 10) {
        userScrolledRef.current = true;
        setAutoScrollEnabled(false);
      }

      // If user scrolled back to bottom, re-enable
      if (atBottom && userScrolledRef.current) {
        userScrolledRef.current = false;
        setAutoScrollEnabled(true);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIsAtBottom, isStreaming]);

  // Scroll to anchor (user message right below header)
  const scrollToAnchor = useCallback(() => {
    const anchor = anchorRef.current;
    const container = containerRef.current;
    if (!anchor || !container) return;

    // Reset auto-scroll state
    userScrolledRef.current = false;
    setAutoScrollEnabled(true);

    // Calculate position to place anchor right below the header
    const anchorRect = anchor.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Current scroll + anchor position relative to container - topOffset (header height + small padding)
    const targetScrollTop =
      container.scrollTop +
      (anchorRect.top - containerRect.top) -
      topOffset -
      8; // Small padding below header

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }, [topOffset]);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    userScrolledRef.current = false;
    setAutoScrollEnabled(true);

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  // Re-enable auto-scroll manually
  const enableAutoScroll = useCallback(() => {
    userScrolledRef.current = false;
    setAutoScrollEnabled(true);
    scrollToBottom();
  }, [scrollToBottom]);

  return {
    containerRef,
    anchorRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToAnchor,
    scrollToBottom,
    enableAutoScroll,
  };
}
