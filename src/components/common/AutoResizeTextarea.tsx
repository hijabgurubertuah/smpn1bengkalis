import React, { useEffect, useRef, useLayoutEffect } from 'react';

export interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

/**
 * Auto-expanding Textarea component.
 * Automatically wraps words down without horizontal scrolling and increases its
 * vertical height dynamically as the user types or pastes long text.
 */
export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  minRows = 2,
  maxRows,
  value,
  onChange,
  className = '',
  rows,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset height momentarily to measure actual scrollHeight
    el.style.height = 'auto';
    const computedStyle = window.getComputedStyle(el);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 10;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 10;
    
    const minHeight = (minRows || 1) * lineHeight + paddingTop + paddingBottom;
    const maxHeight = maxRows ? maxRows * lineHeight + paddingTop + paddingBottom : Infinity;
    
    const targetHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${targetHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const defaultClasses = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-slate-800 leading-relaxed';
  const combinedClasses = className.includes('border') || className.includes('px-') || className.includes('p-')
    ? `w-full resize-none break-words whitespace-pre-wrap ${className}`
    : `${defaultClasses} resize-none break-words whitespace-pre-wrap ${className}`;

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        adjustHeight();
      }}
      className={combinedClasses}
      {...props}
    />
  );
};

