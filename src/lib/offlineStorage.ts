/**
 * Offline Storage Engine for School Portal
 * Uses IndexedDB to store configurations, articles, and high-resolution images locally
 * so that subsequent visits are instant, 100% offline-capable, and consume zero bandwidth.
 */

const DB_NAME = 'SchoolPortalOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'portal_cache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function setOfflineItem(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback to localStorage if IndexedDB fails
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
}

export async function getOfflineItem<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    // Fallback to localStorage
    try {
      const item = localStorage.getItem(`offline_${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
}

export async function clearOfflineStorage(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch {
    // ignore
  }
}

/**
 * Performs a complete Hard Reset:
 * 1. Unregisters all PWA Service Workers
 * 2. Clears CacheStorage (Workbox cached scripts and html)
 * 3. Clears IndexedDB offline database
 * 4. Clears localStorage & sessionStorage cache keys
 * 5. Forces browser reload bypassing HTTP cache
 */
export async function hardResetAppCache(): Promise<void> {
  // 1. Unregister all service workers
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch (e) {
      console.warn('ServiceWorker unregister failed:', e);
    }
  }

  // 2. Clear all CacheStorage (PWA Workbox assets)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (e) {
      console.warn('CacheStorage delete failed:', e);
    }
  }

  // 3. Clear IndexedDB offline storage
  try {
    await clearOfflineStorage();
  } catch (e) {
    console.warn('clearOfflineStorage failed:', e);
  }

  // 4. Clear data cache keys in localStorage & sessionStorage (preserve admin authentication)
  try {
    const adminAuth = localStorage.getItem('admin_authenticated');
    const keysToRemove = [
      'public_school_config',
      'public_news_articles',
      'school_config',
      'news_articles',
      'admin_school_config',
      'admin_news_articles',
      'custom_default_config',
      'custom_default_articles',
      'custom_default_meta',
      'offline_public_school_config',
      'offline_public_news_articles',
      'offline_school_config',
      'offline_news_articles',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Remove any leftover offline_* entries
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('offline_')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));

    sessionStorage.clear();

    if (adminAuth) {
      localStorage.setItem('admin_authenticated', adminAuth);
    }
  } catch (e) {
    console.warn('LocalStorage clear failed:', e);
  }

  // 5. Force hard reload with timestamp query param to bypass browser HTTP cache
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin + window.location.pathname;
    window.location.replace(`${baseUrl}?hard_reset=${Date.now()}`);
  }
}

