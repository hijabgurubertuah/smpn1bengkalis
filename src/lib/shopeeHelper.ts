/**
 * Utility to ensure Shopee affiliate and product links open directly
 * in the native Shopee mobile app on Android & iOS devices.
 */

export const DEFAULT_SHOPEE_AFFILIATE_URL = 'https://s.shopee.co.id/7ptEQvnUyu';

/**
 * Checks if a given string or URL is a Shopee URL.
 */
export function isShopeeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return /(?:s\.shopee\.co\.id|shopee\.(?:co\.id|com|id|ph|my|sg|vn|th)|shp\.ee)/i.test(url);
}

/**
 * Checks if the current user agent is a mobile device (Android, iPhone, iPad, iPod).
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  return /android|iphone|ipad|ipod/i.test(userAgent);
}

/**
 * Opens a Shopee URL directly in the native Shopee app if on mobile.
 * - On Android: Uses the Android Intent URI (package com.shopee.id) with browser fallback.
 *   This explicitly tells the Android OS to launch the Shopee app directly.
 * - On iOS: Navigates using universal links with user-gesture anchor dispatch.
 * - On Desktop: COMPLETELY DISABLED as requested (does not open link, tab, or redirect).
 */
export function openShopeeLink(url: string = DEFAULT_SHOPEE_AFFILIATE_URL): void {
  if (typeof window === 'undefined') return;

  // STRICT REQUIREMENT: Disable opening Shopee on desktop entirely
  if (!isMobileDevice()) {
    return;
  }

  const targetUrl = url.trim() || DEFAULT_SHOPEE_AFFILIATE_URL;
  const userAgent = navigator.userAgent || '';
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  if (isAndroid) {
    // Strip http:// or https:// to obtain the host + path for Android Intent
    const cleanUrl = targetUrl.replace(/^https?:\/\//i, '');
    const fallbackEncoded = encodeURIComponent(targetUrl);

    // Android Intent URI:
    // Format: intent://<host_and_path>#Intent;scheme=https;package=com.shopee.id;S.browser_fallback_url=<fallback>;end;
    // When invoked on Android Chrome/Brave/Edge, Android OS directly opens the Shopee Indonesia native app.
    // If the Shopee app is not installed, it falls back seamlessly to the browser fallback URL.
    const intentUri = `intent://${cleanUrl}#Intent;scheme=https;package=com.shopee.id;S.browser_fallback_url=${fallbackEncoded};end;`;

    try {
      window.location.href = intentUri;
    } catch {
      window.location.href = targetUrl;
    }
    return;
  }

  if (isIOS) {
    // On iOS Safari, Universal Links work when dispatched via an anchor element click
    const anchor = document.createElement('a');
    anchor.href = targetUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (anchor.parentNode) {
        document.body.removeChild(anchor);
      }
    }, 100);
    return;
  }
}

/**
 * Global click interceptor to automatically open any Shopee link on the page
 * directly in the Shopee mobile app when clicked on a smartphone.
 */
export function initShopeeLinkInterceptors(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement)?.closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (href && isShopeeUrl(href)) {
      e.preventDefault();
      e.stopPropagation();
      if (isMobileDevice()) {
        openShopeeLink(href);
      }
      // On desktop, Shopee opening is completely disabled
    }
  };

  document.addEventListener('click', handleClick, { capture: true });
  return () => {
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
