/**
 * Centralized Cache Module for SMP Negeri 1 Bengkalis Portal
 * Uses versioned localStorage & IndexedDB keys.
 * Strictly stores text, link URLs, and JSON data — NEVER stores raw base64 or image files.
 * Handles QuotaExceededError defensively.
 */

export const CACHE_VERSION = 'smpn1-cache-v1';

export const CACHE_KEYS = {
  CONFIG: `${CACHE_VERSION}_school_config`,
  ARTICLES: `${CACHE_VERSION}_news_articles`,
  LAST_SYNC: `${CACHE_VERSION}_last_sync`,
  CONFIG_LAST_SYNC: `${CACHE_VERSION}_config_last_sync`,
  NEW_ARTICLES_BUFFER: `${CACHE_VERSION}_articles_buffer`,
  ADMIN_CONFIG: `${CACHE_VERSION}_admin_school_config`,
  ADMIN_ARTICLES: `${CACHE_VERSION}_admin_news_articles`,
};

// Safe synchronous getter for localStorage with fallback and try/catch
export function getLocalCacheSync<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.warn(`[Cache] Error reading key "${key}":`, err);
    return fallback;
  }
}

// Safe synchronous setter for localStorage with QuotaExceededError protection
export function setLocalCacheSync<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)
    ) {
      console.warn('[Cache] LocalStorage quota exceeded. Cleaning obsolete cache keys...');
      try {
        // Clean non-versioned or legacy keys to free space
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && !k.startsWith(CACHE_VERSION) && !k.includes('admin_authenticated')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (cleanupErr) {
        console.error('[Cache] Cleanup failed, quota still full:', cleanupErr);
      }
    } else {
      console.warn(`[Cache] Error writing key "${key}":`, err);
    }
    return false;
  }
}

// Clear versioned cache items
export function clearVersionedCache(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(CACHE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('[Cache] Failed to clear versioned cache:', e);
  }
}
