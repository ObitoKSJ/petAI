'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect mobile virtual keyboard height using the visualViewport API.
 * Returns the keyboard height so the chat input can be positioned above it.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const updateKeyboardHeight = useCallback(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;
    // Calculate keyboard height as the difference between window height and visual viewport height
    // Plus account for any offset (scroll position of the visual viewport)
    const keyboardH = window.innerHeight - viewport.height - viewport.offsetTop;

    // Only set positive values (keyboard is visible)
    setKeyboardHeight(Math.max(0, keyboardH));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const viewport = window.visualViewport;

    // Initial calculation
    updateKeyboardHeight();

    // Listen for viewport changes (keyboard show/hide)
    viewport.addEventListener('resize', updateKeyboardHeight);
    viewport.addEventListener('scroll', updateKeyboardHeight);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardHeight);
      viewport.removeEventListener('scroll', updateKeyboardHeight);
    };
  }, [updateKeyboardHeight]);

  return keyboardHeight;
}
