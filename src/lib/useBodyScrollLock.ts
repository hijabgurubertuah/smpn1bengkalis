import { useEffect } from 'react';

/**
 * Custom hook to lock body scrolling when a modal, drawer, or sidebar is active.
 * Prevents background content from scrolling behind overlays while preserving
 * scroll position and compensating for scrollbar layout shift on desktop.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Capture previous body inline styles
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const originalTouchAction = document.body.style.touchAction;

    // Calculate scrollbar width to prevent layout jump on desktop
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Apply strict scroll locking on body
    document.body.style.overflow = 'hidden';

    return () => {
      // Revert styles on cleanup / unmount
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isLocked]);
}
