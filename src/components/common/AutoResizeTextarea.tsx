import React, { useLayoutEffect, useEffect, useRef, useCallback } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  defaultValue,
  onChange,
  onInput,
  rows = 1,
  minRows = 1,
  maxRows,
  className = '',
  placeholder,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastWidthRef = useRef<number>(-1);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // If element is not in DOM or not displayed at all, don't break
    if (el.offsetWidth === 0 && el.offsetHeight === 0 && el.clientWidth === 0) {
      return;
    }

    // Reset height to 'auto' to recalculate true scrollHeight based on current content & width
    el.style.height = 'auto';

    // Account for box-sizing: border-box borders in Tailwind
    let extraBorder = 0;
    try {
      const computed = window.getComputedStyle(el);
      if (computed.boxSizing === 'border-box') {
        const borderTop = parseFloat(computed.borderTopWidth) || 0;
        const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
        extraBorder = borderTop + borderBottom;
      }
    } catch {
      // Fallback if window is unavailable
    }

    const calculatedHeight = el.scrollHeight + extraBorder;
    if (calculatedHeight > 0) {
      el.style.height = `${calculatedHeight}px`;
    }
  }, []);

  // 1. Synchronous layout adjustment right after DOM mutation
  useLayoutEffect(() => {
    adjustHeight();
  }, [value, defaultValue, adjustHeight]);

  // 2. Asynchronous frames and timeouts for modals, tab animations, and initial render
  useEffect(() => {
    adjustHeight();

    const rafId = requestAnimationFrame(() => {
      adjustHeight();
    });

    const timer50 = setTimeout(adjustHeight, 50);
    const timer150 = setTimeout(adjustHeight, 150);
    const timer300 = setTimeout(adjustHeight, 300);

    // If web fonts load later and change text dimensions
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        adjustHeight();
      }).catch(() => {});
    }

    // 3. ResizeObserver: Trigger whenever container width changes (e.g. modal opens, screen rotates)
    const el = textareaRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width > 0 && Math.abs(width - lastWidthRef.current) > 0.5) {
            lastWidthRef.current = width;
            adjustHeight();
          }
        }
      });
      observer.observe(el);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer50);
      clearTimeout(timer150);
      clearTimeout(timer300);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [value, defaultValue, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => {
        adjustHeight();
        if (onChange) onChange(e);
      }}
      onInput={(e) => {
        adjustHeight();
        if (onInput) onInput(e);
      }}
      placeholder={placeholder}
      className={`resize-none overflow-hidden break-words ${className}`}
      {...props}
    />
  );
};

