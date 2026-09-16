import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { SchoolConfig, NewsArticle } from '../types';
import { DEFAULT_SCHOOL_CONFIG, DEFAULT_NEWS_ARTICLES } from './defaultData';
import { getOfflineItem, setOfflineItem, clearOfflineStorage } from './offlineStorage';
import { saveStoredAppsScriptConfig } from './googleAppsScript';

// Silence internal retry and connection warning logs from Firestore in browser/iframe environments
try {
  setLogLevel('silent');
} catch {
  // ignore
}

const FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0999699449',
  appId: '1:319360539506:web:894f0f9c3612848f8a9beb',
  apiKey: 'AIzaSyCOZgLPjDQ61WyWptoYS1tVH_zZLsNVeFQ',
  authDomain: 'gen-lang-client-0999699449.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-e8590637-9651-4312-9d0c-eb416143de72',
  storageBucket: 'gen-lang-client-0999699449.firebasestorage.app',
  messagingSenderId: '319360539506',
};

// Dual Cache Keys: Separate storage for Public visitors vs Admin authenticated editors
export const PUBLIC_CONFIG_KEY = 'smpn1_public_config_v4';
export const PUBLIC_NEWS_KEY = 'smpn1_public_news_v4';
export const ADMIN_CONFIG_KEY = 'smpn1_admin_config_v4';
export const ADMIN_NEWS_KEY = 'smpn1_admin_news_v4';

// Dedicated Segregated Caches for Instant Hydration (Persistent across hard refresh)
export const DEDICATED_POSTS_CACHE_KEY = 'portal_dedicated_posts_v1';
export const DEDICATED_PRINCIPAL_CACHE_KEY = 'portal_dedicated_principal_v1';
export const DEDICATED_DOCK_CACHE_KEY = 'portal_dedicated_dock_v1';

// Backward compatibility legacy keys
const LEGACY_CONFIG_KEY = 'smpn1_bengkalis_config_v3';
const LEGACY_NEWS_KEY = 'smpn1_bengkalis_news_v3';

const CUSTOM_DEFAULT_CONFIG_KEY = 'smpn1_bengkalis_custom_default_config_v1';
const CUSTOM_DEFAULT_NEWS_KEY = 'smpn1_bengkalis_custom_default_news_v1';
const CUSTOM_DEFAULT_META_KEY = 'smpn1_bengkalis_custom_default_meta_v1';

export let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;

// Safe promise timeout helper to prevent hanging if connection is offline/slow
export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 3500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Normalizes SchoolConfig by deep merging with DEFAULT_SCHOOL_CONFIG to ensure all fields are populated
 */
export function normalizeSchoolConfig(raw: Partial<SchoolConfig> | null | undefined): SchoolConfig {
  if (!raw) return DEFAULT_SCHOOL_CONFIG;

  // Sanitize legacy default placeholders so they are never displayed if loaded from old cache/cloud
  const sanitizedRaw = { ...raw };
  if (sanitizedRaw.principal) {
    const p = { ...sanitizedRaw.principal };
    if (p.imageUrl && p.imageUrl.includes('photo-1560250097-0b93528c311a')) {
      p.imageUrl = '';
    }
    if (p.name && (p.name.includes('Syahrul') || p.name === 'Drs. H. Syahrul, M.Pd.')) {
      p.name = '';
    }
    sanitizedRaw.principal = p;
  }

  if (sanitizedRaw.identity) {
    const id = { ...sanitizedRaw.identity };
    if (id.logoUrl && id.logoUrl.includes('photo-1594608661623')) {
      id.logoUrl = '';
    }
    if (id.faviconUrl && id.faviconUrl.includes('photo-1546410531')) {
      id.faviconUrl = '';
    }
    sanitizedRaw.identity = id;
  }

  return {
    ...DEFAULT_SCHOOL_CONFIG,
    ...sanitizedRaw,
    identity: { ...DEFAULT_SCHOOL_CONFIG.identity, ...(sanitizedRaw.identity || {}) },
    importantAnnouncement: { ...DEFAULT_SCHOOL_CONFIG.importantAnnouncement, ...(sanitizedRaw.importantAnnouncement || {}) },
    header: { ...DEFAULT_SCHOOL_CONFIG.header, ...(sanitizedRaw.header || {}) },
    layoutSections: { ...DEFAULT_SCHOOL_CONFIG.layoutSections, ...(sanitizedRaw.layoutSections || {}) },
    mobileBottomNav: { ...DEFAULT_SCHOOL_CONFIG.mobileBottomNav, ...(sanitizedRaw.mobileBottomNav || {}) },
    themeConfig: { ...DEFAULT_SCHOOL_CONFIG.themeConfig, ...(sanitizedRaw.themeConfig || {}) },
    principal: { ...DEFAULT_SCHOOL_CONFIG.principal, ...(sanitizedRaw.principal || {}) },
    ppdb: { ...DEFAULT_SCHOOL_CONFIG.ppdb, ...(sanitizedRaw.ppdb || {}) },
    embeds: { ...DEFAULT_SCHOOL_CONFIG.embeds, ...(sanitizedRaw.embeds || {}) },
    footer: { ...DEFAULT_SCHOOL_CONFIG.footer, ...(sanitizedRaw.footer || {}) },
    googleAppsScript: { ...DEFAULT_SCHOOL_CONFIG.googleAppsScript, ...(sanitizedRaw.googleAppsScript || {}) },
    navMenus: Array.isArray(sanitizedRaw.navMenus) ? sanitizedRaw.navMenus : DEFAULT_SCHOOL_CONFIG.navMenus,
    facilities: Array.isArray(sanitizedRaw.facilities) ? sanitizedRaw.facilities : DEFAULT_SCHOOL_CONFIG.facilities,
    extracurriculars: Array.isArray(sanitizedRaw.extracurriculars) ? sanitizedRaw.extracurriculars : DEFAULT_SCHOOL_CONFIG.extracurriculars,
    agendas: Array.isArray(sanitizedRaw.agendas) ? sanitizedRaw.agendas : DEFAULT_SCHOOL_CONFIG.agendas,
  };
}

/**
 * Check if the browser currently has an authenticated admin session history
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem('admin_authenticated') === 'true' ||
      sessionStorage.getItem('admin_authenticated') === 'true'
    );
  } catch {
    return false;
  }
}

/**
 * Dedicated Cache: News Posts / Articles (Synchronous 0ms getter)
 */
export function getDedicatedPostsCacheSync(): NewsArticle[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEDICATED_POSTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

/**
 * Dedicated Cache: Save News Posts / Articles
 */
export async function saveDedicatedPostsCache(articles: NewsArticle[]): Promise<void> {
  if (typeof window === 'undefined' || !Array.isArray(articles)) return;
  try {
    localStorage.setItem(DEDICATED_POSTS_CACHE_KEY, JSON.stringify(articles));
    await setOfflineItem('dedicated_news_articles', articles);
  } catch (e) {
    console.warn('Error saving dedicated posts cache:', e);
  }
}

/**
 * Dedicated Cache: Sambutan Pimpinan (Synchronous 0ms getter)
 */
export function getDedicatedPrincipalCacheSync(): SchoolConfig['principal'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEDICATED_PRINCIPAL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.welcomeMessage) return parsed;
    }
  } catch {}
  return null;
}

/**
 * Dedicated Cache: Save Sambutan Pimpinan
 */
export async function saveDedicatedPrincipalCache(principal: SchoolConfig['principal']): Promise<void> {
  if (typeof window === 'undefined' || !principal) return;
  try {
    localStorage.setItem(DEDICATED_PRINCIPAL_CACHE_KEY, JSON.stringify(principal));
    await setOfflineItem('dedicated_principal', principal);
  } catch (e) {
    console.warn('Error saving dedicated principal cache:', e);
  }
}

/**
 * Dedicated Cache: Docker (Mobile Bottom Navigation) (Synchronous 0ms getter)
 */
export function getDedicatedDockCacheSync(): SchoolConfig['mobileBottomNav'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEDICATED_DOCK_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return null;
}

/**
 * Dedicated Cache: Save Docker
 */
export async function saveDedicatedDockCache(dock: SchoolConfig['mobileBottomNav']): Promise<void> {
  if (typeof window === 'undefined' || !dock) return;
  try {
    localStorage.setItem(DEDICATED_DOCK_CACHE_KEY, JSON.stringify(dock));
    await setOfflineItem('dedicated_dock', dock);
  } catch (e) {
    console.warn('Error saving dedicated dock cache:', e);
  }
}

/**
 * Retrieve cached SchoolConfig from IndexedDB or localStorage based on user role (Public vs Admin)
 */
export async function getCachedSchoolConfig(forceScope?: 'public' | 'admin'): Promise<SchoolConfig | null> {
  const scope = forceScope || (isAdminAuthenticated() ? 'admin' : 'public');
  const lsKey = scope === 'admin' ? ADMIN_CONFIG_KEY : PUBLIC_CONFIG_KEY;
  const idbKey = scope === 'admin' ? 'admin_school_config' : 'public_school_config';

  let resolvedConfig: SchoolConfig | null = null;

  // 1. Fast path: check synchronous localStorage first (instant 0ms)
  try {
    const lsData = localStorage.getItem(lsKey);
    if (lsData) resolvedConfig = normalizeSchoolConfig(JSON.parse(lsData) as SchoolConfig);
  } catch {
    // ignore
  }

  // 2. Check IndexedDB
  if (!resolvedConfig) {
    try {
      const idbData = await getOfflineItem<SchoolConfig>(idbKey);
      if (idbData) resolvedConfig = normalizeSchoolConfig(idbData);
    } catch {
      // ignore
    }
  }

  // Fallback to legacy key or global key if newly partitioned cache is not yet seeded
  if (!resolvedConfig) {
    try {
      const legacy = localStorage.getItem(LEGACY_CONFIG_KEY);
      if (legacy) resolvedConfig = normalizeSchoolConfig(JSON.parse(legacy) as SchoolConfig);
      if (!resolvedConfig) {
        const globalIdb = await getOfflineItem<SchoolConfig>('school_config');
        if (globalIdb) resolvedConfig = normalizeSchoolConfig(globalIdb);
      }
    } catch {
      // ignore
    }
  }

  if (resolvedConfig) {
    // Overlay dedicated principal and dock caches so they never get lost or stale on hard refresh
    const dedicatedPrincipal = getDedicatedPrincipalCacheSync();
    if (dedicatedPrincipal) {
      resolvedConfig.principal = { ...resolvedConfig.principal, ...dedicatedPrincipal };
    }
    const dedicatedDock = getDedicatedDockCacheSync();
    if (dedicatedDock) {
      resolvedConfig.mobileBottomNav = { ...resolvedConfig.mobileBottomNav, ...dedicatedDock };
    }
    return resolvedConfig;
  }

  return null;
}

/**
 * Retrieve cached NewsArticles from IndexedDB or localStorage based on user role (Public vs Admin)
 */
export async function getCachedNewsArticles(forceScope?: 'public' | 'admin'): Promise<NewsArticle[] | null> {
  // 1. Check dedicated posts cache first (isolated and persistent across hard refresh)
  const dedicated = getDedicatedPostsCacheSync();
  if (dedicated && Array.isArray(dedicated) && dedicated.length > 0) {
    return dedicated;
  }

  const scope = forceScope || (isAdminAuthenticated() ? 'admin' : 'public');
  const lsKey = scope === 'admin' ? ADMIN_NEWS_KEY : PUBLIC_NEWS_KEY;
  const idbKey = scope === 'admin' ? 'admin_news_articles' : 'public_news_articles';

  // 2. Fast path: check synchronous localStorage (instant 0ms)
  try {
    const lsData = localStorage.getItem(lsKey);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  // 3. Check IndexedDB dedicated cache & scoped cache
  try {
    const dedicatedIdb = await getOfflineItem<NewsArticle[]>('dedicated_news_articles');
    if (dedicatedIdb && Array.isArray(dedicatedIdb) && dedicatedIdb.length > 0) return dedicatedIdb;

    const idbData = await getOfflineItem<NewsArticle[]>(idbKey);
    if (idbData && Array.isArray(idbData) && idbData.length > 0) return idbData;
  } catch {
    // ignore
  }

  // Fallback to legacy key
  try {
    const legacy = localStorage.getItem(LEGACY_NEWS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const globalIdb = await getOfflineItem<NewsArticle[]>('news_articles');
    if (globalIdb && Array.isArray(globalIdb) && globalIdb.length > 0) return globalIdb;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Persist data to Public Cache (IndexedDB & localStorage)
 */
export async function saveToPublicCache(config: SchoolConfig, articles: NewsArticle[]): Promise<void> {
  try {
    localStorage.setItem(PUBLIC_CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(PUBLIC_NEWS_KEY, JSON.stringify(articles));
    await setOfflineItem('public_school_config', config);
    await setOfflineItem('public_news_articles', articles);
    // Also keep base key for service worker offline manifest
    await setOfflineItem('school_config', config);
    await setOfflineItem('news_articles', articles);

    // Save dedicated segregated caches (Postingan, Sambutan Pimpinan, Docker)
    if (Array.isArray(articles) && articles.length > 0) {
      await saveDedicatedPostsCache(articles);
    }
    if (config.principal) {
      await saveDedicatedPrincipalCache(config.principal);
    }
    if (config.mobileBottomNav) {
      await saveDedicatedDockCache(config.mobileBottomNav);
    }

    // Sync Google Apps Script configuration across browsers
    if (config.googleAppsScript?.webAppUrl) {
      saveStoredAppsScriptConfig(config.googleAppsScript);
    }
  } catch (e) {
    console.warn('Error saving to public cache:', e);
  }
}

/**
 * Persist data to Admin Cache (IndexedDB & localStorage)
 */
export async function saveToAdminCache(config: SchoolConfig, articles: NewsArticle[]): Promise<void> {
  try {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(ADMIN_NEWS_KEY, JSON.stringify(articles));
    await setOfflineItem('admin_school_config', config);
    await setOfflineItem('admin_news_articles', articles);

    // Save dedicated segregated caches (Postingan, Sambutan Pimpinan, Docker)
    if (Array.isArray(articles) && articles.length > 0) {
      await saveDedicatedPostsCache(articles);
    }
    if (config.principal) {
      await saveDedicatedPrincipalCache(config.principal);
    }
    if (config.mobileBottomNav) {
      await saveDedicatedDockCache(config.mobileBottomNav);
    }

    // Sync Google Apps Script configuration across browsers
    if (config.googleAppsScript?.webAppUrl) {
      saveStoredAppsScriptConfig(config.googleAppsScript);
    }
  } catch (e) {
    console.warn('Error saving to admin cache:', e);
  }
}

try {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: FIREBASE_CONFIG.apiKey,
      authDomain: FIREBASE_CONFIG.authDomain,
      projectId: FIREBASE_CONFIG.projectId,
      storageBucket: FIREBASE_CONFIG.storageBucket,
      messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
      appId: FIREBASE_CONFIG.appId,
    });
  } else {
    app = getApp();
  }

  // Use initializeFirestore with experimentalAutoDetectLongPolling (cannot be combined with experimentalForceLongPolling)
  const firestoreSettings = {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  };

  try {
    if (FIREBASE_CONFIG.firestoreDatabaseId) {
      db = initializeFirestore(app, firestoreSettings, FIREBASE_CONFIG.firestoreDatabaseId);
    } else {
      db = initializeFirestore(app, firestoreSettings);
    }
  } catch {
    // If already initialized, fallback gracefully
    db = FIREBASE_CONFIG.firestoreDatabaseId
      ? getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId)
      : getFirestore(app);
  }

  try {
    auth = getAuth(app);
  } catch {
    // ignore
  }
} catch (err) {
  console.info('Firebase running in local storage offline mode:', err);
}

export async function checkFirebaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  if (!db || typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      connected: false,
      message: 'Mode Offline Aktif (Data tersimpan aman di IndexedDB & browser)',
    };
  }
  try {
    const testDoc = doc(db, 'system_health', 'ping');
    // READ ONLY check to avoid consuming write quota on simple ping checks
    await withTimeout(getDoc(testDoc), 3000);
    return {
      connected: true,
      message: 'Terhubung ke Google Cloud Firebase Firestore',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Mode Offline Aktif (${message})`,
    };
  }
}

/**
 * Recursively sanitizes data to ensure NO raw base64 image data (data:image/...) is ever uploaded to Firebase.
 * Only external/cloud link URLs (https://, http://, //) are permitted.
 * If a base64 string is detected, it is stripped so Firebase never receives image binaries.
 */
export function sanitizeNoBase64<T>(data: T): T {
  if (!data) return data;
  if (typeof data === 'string') {
    if (data.startsWith('data:image/')) {
      console.warn('Deteksi data base64 gambar dicegah. Hanya link URL gambar yang diunggah ke Firebase.');
      return '' as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeNoBase64(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = sanitizeNoBase64(value);
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Save configuration purely to local browser storage (IndexedDB & localStorage).
 * STRICTLY ZERO writes to Firebase Firestore to prevent consuming database write quotas during typing/editing.
 * Stored in the Admin partition so that public visitors only see published changes.
 */
export async function saveLocalDraftConfig(config: SchoolConfig): Promise<void> {
  try {
    const articles = (await getCachedNewsArticles('admin')) || DEFAULT_NEWS_ARTICLES;
    await saveToAdminCache(config, articles);
  } catch (e) {
    console.error('Error saving school config locally', e);
  }
}

/**
 * Save ONLY the specific tab data that was edited to Firebase Firestore.
 * Ultra-lightweight payload (saving only the changed fields), ensuring fast network sync,
 * preventing database limit exhaustion, and strictly ensuring only image URL links are sent.
 */
export async function saveSchoolTabConfig(tab: string, config: SchoolConfig): Promise<boolean> {
  // Always update admin cache first so drafts are preserved instantly
  await saveLocalDraftConfig(config);

  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return true; // Saved locally
  }

  // Determine the granular payload for only this specific tab
  let tabPayload: Record<string, unknown> = {};

  switch (tab) {
    case 'header':
      tabPayload = {
        header: config.header,
        identity: config.identity,
      };
      break;
    case 'menus':
      tabPayload = {
        navMenus: config.navMenus,
      };
      break;
    case 'ppdb':
      tabPayload = {
        ppdb: config.ppdb,
      };
      break;
    case 'agenda':
      tabPayload = {
        agendas: config.agendas,
      };
      break;
    case 'facilities':
      tabPayload = {
        facilities: config.facilities,
        extracurriculars: config.extracurriculars,
      };
      break;
    case 'layout':
      tabPayload = {
        layoutSections: config.layoutSections,
        mobileBottomNav: config.mobileBottomNav,
      };
      break;
    case 'theme':
      tabPayload = {
        themeConfig: config.themeConfig,
      };
      break;
    case 'ticker':
      tabPayload = {
        identity: config.identity,
        importantAnnouncement: config.importantAnnouncement,
      };
      break;
    case 'principal':
      tabPayload = {
        principal: config.principal,
      };
      break;
    case 'embeds':
      tabPayload = {
        embeds: config.embeds,
      };
      break;
    case 'footer':
      tabPayload = {
        footer: config.footer,
      };
      break;
    case 'appscript':
      tabPayload = {
        googleAppsScript: config.googleAppsScript,
      };
      break;
    default:
      tabPayload = config as unknown as Record<string, unknown>;
  }

  // Ensure absolutely NO base64 image strings exist in the cloud payload (only link URLs allowed)
  const cleanedPayload = sanitizeNoBase64(tabPayload);

  try {
    const configDocRef = doc(db, 'school_portal', 'main_config');
    await withTimeout(setDoc(configDocRef, cleanedPayload, { merge: true }), 4000);
    // When saved to Firestore, also update public cache so public view is in sync
    const currentArticles = (await getCachedNewsArticles('public')) || DEFAULT_NEWS_ARTICLES;
    await saveToPublicCache(config, currentArticles);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('resource-exhausted') || msg.includes('Quota')) {
      console.warn('Kuota harian Firestore tercapai (Free Tier). Data tersimpan aman di penyimpanan lokal browser Anda.');
      return true;
    }
    console.info(`Tab ${tab} tersimpan secara lokal (sinkronisasi cloud ditunda):`, msg);
    return false;
  }
}

/**
 * Save school general configuration to Cloud Firestore.
 * Triggered ONLY when the user explicitly clicks a save/sync button.
 */
export async function saveSchoolConfig(config: SchoolConfig): Promise<boolean> {
  // Persist to Admin cache
  await saveLocalDraftConfig(config);

  // Sync to Firebase Firestore
  if (db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const cleanedConfig = sanitizeNoBase64(config);
      const jsonString = JSON.stringify(cleanedConfig);
      if (jsonString.length > 950 * 1024) {
        throw new Error('Ukuran data konfigurasi melebihi batas 1MB Firestore. Harap gunakan URL gambar eksternal (Google Drive / link publik) untuk foto kepala sekolah atau logo.');
      }
      const configDocRef = doc(db, 'school_portal', 'main_config');
      await withTimeout(setDoc(configDocRef, cleanedConfig, { merge: true }), 4000);
      
      // Update public cache as well
      const currentArticles = (await getCachedNewsArticles('public')) || DEFAULT_NEWS_ARTICLES;
      await saveToPublicCache(config, currentArticles);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('resource-exhausted') || msg.includes('Quota')) {
        console.warn('Kuota harian Firestore tercapai (Free Tier). Data tersimpan aman di penyimpanan lokal browser Anda.');
        return true;
      }
      console.info('Config tersimpan secara lokal (sinkronisasi cloud ditunda):', msg);
    }
  }
  return true;
}

/**
 * Load school general configuration from local partition (Public or Admin)
 */
export async function loadSchoolConfig(): Promise<SchoolConfig> {
  const cached = await getCachedSchoolConfig();
  if (cached) return cached;
  return DEFAULT_SCHOOL_CONFIG;
}

/**
 * Save an article ONLY locally on this device as a draft (0 Firebase operations, 0 quota used)
 * Stored strictly in the Admin cache.
 */
export async function saveNewsArticleLocally(article: NewsArticle): Promise<boolean> {
  const localArticle: NewsArticle = {
    ...article,
    isLocalDraft: true,
  };
  try {
    const articles = (await getCachedNewsArticles('admin')) || DEFAULT_NEWS_ARTICLES;
    const existingIndex = articles.findIndex((a) => a.id === localArticle.id);
    let updated: NewsArticle[];
    if (existingIndex >= 0) {
      updated = [...articles];
      updated[existingIndex] = localArticle;
    } else {
      updated = [localArticle, ...articles];
    }
    const currentConfig = (await getCachedSchoolConfig('admin')) || DEFAULT_SCHOOL_CONFIG;
    await saveToAdminCache(currentConfig, updated);
    return true;
  } catch (e) {
    console.error('Error saving article locally', e);
    return false;
  }
}

/**
 * Save or update a single news article to Cloud Firestore (and update local caches)
 */
export async function saveNewsArticle(article: NewsArticle): Promise<boolean> {
  const cloudArticle: NewsArticle = {
    ...article,
    isLocalDraft: false,
  };

  // Update admin cache first
  try {
    const articles = (await getCachedNewsArticles('admin')) || DEFAULT_NEWS_ARTICLES;
    const existingIndex = articles.findIndex((a) => a.id === cloudArticle.id);
    let updated: NewsArticle[];
    if (existingIndex >= 0) {
      updated = [...articles];
      updated[existingIndex] = cloudArticle;
    } else {
      updated = [cloudArticle, ...articles];
    }
    const currentConfig = (await getCachedSchoolConfig('admin')) || DEFAULT_SCHOOL_CONFIG;
    await saveToAdminCache(currentConfig, updated);

    // If published, also update public cache
    if (cloudArticle.status === 'published') {
      const pubConfig = (await getCachedSchoolConfig('public')) || DEFAULT_SCHOOL_CONFIG;
      const pubArticles = (await getCachedNewsArticles('public')) || DEFAULT_NEWS_ARTICLES;
      const pubIdx = pubArticles.findIndex((a) => a.id === cloudArticle.id);
      let pubUpdated: NewsArticle[];
      if (pubIdx >= 0) {
        pubUpdated = [...pubArticles];
        pubUpdated[pubIdx] = cloudArticle;
      } else {
        pubUpdated = [cloudArticle, ...pubArticles];
      }
      await saveToPublicCache(pubConfig, pubUpdated);
    }
  } catch (e) {
    console.error('Error saving article locally', e);
  }

  // Firestore sync - ensure strictly NO base64 images (only URL links)
  if (db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const cleanedArticle = sanitizeNoBase64(cloudArticle);
      const articleDoc = doc(db, 'news_articles', cloudArticle.id);
      await withTimeout(setDoc(articleDoc, cleanedArticle, { merge: true }), 3500);
      return true;
    } catch (err) {
      console.info('Firestore article sync deferred, saved locally:', err);
    }
  }

  return true;
}

/**
 * Delete a news article from Firestore, Admin cache, and Public cache
 */
export async function deleteNewsArticle(articleId: string): Promise<boolean> {
  try {
    const adminArticles = (await getCachedNewsArticles('admin')) || DEFAULT_NEWS_ARTICLES;
    const adminFiltered = adminArticles.filter((a) => a.id !== articleId);
    const adminConfig = (await getCachedSchoolConfig('admin')) || DEFAULT_SCHOOL_CONFIG;
    await saveToAdminCache(adminConfig, adminFiltered);

    const pubArticles = (await getCachedNewsArticles('public')) || DEFAULT_NEWS_ARTICLES;
    const pubFiltered = pubArticles.filter((a) => a.id !== articleId);
    const pubConfig = (await getCachedSchoolConfig('public')) || DEFAULT_SCHOOL_CONFIG;
    await saveToPublicCache(pubConfig, pubFiltered);
  } catch (e) {
    console.error('Error deleting article locally', e);
  }

  if (db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const articleDoc = doc(db, 'news_articles', articleId);
      await withTimeout(deleteDoc(articleDoc), 3500);
    } catch (err) {
      console.info('Firestore article delete deferred, applied locally:', err);
    }
  }

  return true;
}

/**
 * Load all news articles from the active partition (Public or Admin)
 */
export async function loadNewsArticles(): Promise<NewsArticle[]> {
  const cached = await getCachedNewsArticles();
  if (cached && Array.isArray(cached)) return cached;
  return DEFAULT_NEWS_ARTICLES;
}

/**
 * Get Custom Default metadata (timestamp and existence)
 */
export async function getCustomDefaultMeta(): Promise<{
  hasCustomDefault: boolean;
  savedAt?: string;
}> {
  // Check local meta
  try {
    const metaStr = localStorage.getItem(CUSTOM_DEFAULT_META_KEY);
    if (metaStr) {
      const parsed = JSON.parse(metaStr);
      return { hasCustomDefault: true, savedAt: parsed.savedAt };
    }
  } catch {
    // ignore
  }

  // Check IndexedDB
  try {
    const cachedMeta = await getOfflineItem<{ hasCustomDefault: boolean; savedAt?: string }>('custom_default_meta');
    if (cachedMeta && cachedMeta.hasCustomDefault) {
      return cachedMeta;
    }
  } catch {
    // ignore
  }

  // Check Firestore
  if (db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const docRef = doc(db, 'school_portal', 'custom_defaults');
      const snap = await withTimeout(getDoc(docRef), 2500);
      if (snap.exists()) {
        const data = snap.data();
        const savedAt = data.savedAt || new Date().toISOString();
        const meta = { hasCustomDefault: true, savedAt };
        localStorage.setItem(CUSTOM_DEFAULT_META_KEY, JSON.stringify(meta));
        await setOfflineItem('custom_default_meta', meta);
        return meta;
      }
    } catch {
      // ignore
    }
  }

  return { hasCustomDefault: false };
}

/**
 * "Jadikan Default" - Save current configuration & news as the new active default template.
 * Any old defaults are replaced. Future resets will revert to this exact snapshot.
 */
export async function saveCurrentAsNewDefault(
  config: SchoolConfig,
  articles: NewsArticle[]
): Promise<{ success: boolean; savedAt: string }> {
  const savedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const meta = { hasCustomDefault: true, savedAt };

  // 1. Save to localStorage
  try {
    localStorage.setItem(CUSTOM_DEFAULT_CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(CUSTOM_DEFAULT_NEWS_KEY, JSON.stringify(articles));
    localStorage.setItem(CUSTOM_DEFAULT_META_KEY, JSON.stringify(meta));

    // Also ensure current active storage is in sync
    await saveToPublicCache(config, articles);
    await saveToAdminCache(config, articles);
  } catch (e) {
    console.error('Error saving custom default to localStorage', e);
  }

  // 2. Save to IndexedDB
  try {
    await setOfflineItem('custom_default_config', config);
    await setOfflineItem('custom_default_articles', articles);
    await setOfflineItem('custom_default_meta', meta);
    await setOfflineItem('school_config', config);
    await setOfflineItem('news_articles', articles);
  } catch (e) {
    console.error('Error saving custom default to IndexedDB', e);
  }

  // 3. Save to Firestore Cloud
  if (db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      // Save custom default master document
      const defaultDocRef = doc(db, 'school_portal', 'custom_defaults');
      await withTimeout(
        setDoc(defaultDocRef, {
          config,
          articles,
          savedAt,
          updatedAt: Date.now(),
        }),
        3500
      );

      // Overwrite main active config
      const mainConfigRef = doc(db, 'school_portal', 'main_config');
      await withTimeout(setDoc(mainConfigRef, config), 3500);

      // Clean obsolete news in Firestore and write current articles
      const colRef = collection(db, 'news_articles');
      const currentSnap = await withTimeout(getDocs(colRef), 3000);
      const newArticleIds = new Set(articles.map((a) => a.id));

      for (const d of currentSnap.docs) {
        if (!newArticleIds.has(d.id)) {
          await withTimeout(deleteDoc(doc(db, 'news_articles', d.id)), 2000).catch(() => {});
        }
      }

      for (const art of articles) {
        await withTimeout(setDoc(doc(db, 'news_articles', art.id), art), 2000).catch(() => {});
      }
    } catch (err) {
      console.info('Custom default saved locally (cloud sync deferred):', err);
    }
  }

  return { success: true, savedAt };
}

/**
 * Reset data back to default template.
 * If user previously clicked "Jadikan Default", it resets to that last custom default snapshot!
 * Otherwise, it resets to the baseline SMP Negeri 1 Bengkalis default.
 */
export async function resetAllDataToDefault(): Promise<{
  config: SchoolConfig;
  articles: NewsArticle[];
  isCustomDefault: boolean;
  savedAt?: string;
}> {
  let targetConfig: SchoolConfig = DEFAULT_SCHOOL_CONFIG;
  let targetArticles: NewsArticle[] = DEFAULT_NEWS_ARTICLES;
  let isCustomDefault = false;
  let savedAt: string | undefined;

  // 1. Check IndexedDB custom default
  try {
    const customConfig = await getOfflineItem<SchoolConfig>('custom_default_config');
    const customArticles = await getOfflineItem<NewsArticle[]>('custom_default_articles');
    const customMeta = await getOfflineItem<{ hasCustomDefault: boolean; savedAt?: string }>('custom_default_meta');

    if (customConfig && customArticles && Array.isArray(customArticles)) {
      targetConfig = customConfig;
      targetArticles = customArticles;
      isCustomDefault = true;
      savedAt = customMeta?.savedAt;
    }
  } catch {
    // ignore
  }

  // 2. Check localStorage custom default if not found in IndexedDB
  if (!isCustomDefault) {
    try {
      const localCustomCfg = localStorage.getItem(CUSTOM_DEFAULT_CONFIG_KEY);
      const localCustomNews = localStorage.getItem(CUSTOM_DEFAULT_NEWS_KEY);
      const localMeta = localStorage.getItem(CUSTOM_DEFAULT_META_KEY);

      if (localCustomCfg && localCustomNews) {
        targetConfig = JSON.parse(localCustomCfg);
        targetArticles = JSON.parse(localCustomNews);
        isCustomDefault = true;
        if (localMeta) {
          savedAt = JSON.parse(localMeta).savedAt;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Check Firestore custom default if still not found
  if (!isCustomDefault && db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      const defaultDocRef = doc(db, 'school_portal', 'custom_defaults');
      const snap = await withTimeout(getDoc(defaultDocRef), 3000);
      if (snap.exists()) {
        const data = snap.data();
        if (data.config && Array.isArray(data.articles)) {
          targetConfig = data.config as SchoolConfig;
          targetArticles = data.articles as NewsArticle[];
          isCustomDefault = true;
          savedAt = data.savedAt;
        }
      }
    } catch {
      // ignore
    }
  }

  // Apply to both Public and Admin caches
  try {
    await saveToPublicCache(targetConfig, targetArticles);
    await saveToAdminCache(targetConfig, targetArticles);
  } catch (e) {
    console.error('Error overwriting local state on reset', e);
  }

  // Apply to active Firestore
  if (db && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      await withTimeout(setDoc(doc(db, 'school_portal', 'main_config'), targetConfig), 3500);

      const colRef = collection(db, 'news_articles');
      const snap = await withTimeout(getDocs(colRef), 3000);
      const targetIds = new Set(targetArticles.map((a) => a.id));

      for (const d of snap.docs) {
        if (!targetIds.has(d.id)) {
          await withTimeout(deleteDoc(doc(db, 'news_articles', d.id)), 2000).catch(() => {});
        }
      }

      for (const art of targetArticles) {
        await withTimeout(setDoc(doc(db, 'news_articles', art.id), art), 2000).catch(() => {});
      }
    } catch (err) {
      console.info('Reset Firestore applied locally:', err);
    }
  }

  return {
    config: targetConfig,
    articles: targetArticles,
    isCustomDefault,
    savedAt,
  };
}

/**
 * Helper to canonicalize objects for deterministic JSON comparison
 * ensuring key order differences do not cause false positives.
 */
function canonicalizeJson(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalizeJson((obj as Record<string, unknown>)[k])}`
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Check if two SchoolConfig objects are functionally equivalent
 */
export function areConfigsEqual(
  a: SchoolConfig | null | undefined,
  b: SchoolConfig | null | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return canonicalizeJson(sanitizeNoBase64(a)) === canonicalizeJson(sanitizeNoBase64(b));
}

/**
 * Check if two NewsArticle lists are functionally equivalent
 */
export function areArticlesEqual(
  a: NewsArticle[] | null | undefined,
  b: NewsArticle[] | null | undefined
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  const simplify = (list: NewsArticle[]) =>
    list
      .map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        summary: item.summary,
        content: item.content,
        author: item.author,
        coverImage: item.coverImage,
        galleryImages: item.galleryImages || [],
        embedUrl: item.embedUrl,
        category: item.category,
        actionLink: item.actionLink,
        slug: item.slug,
        isPinned: item.isPinned,
        status: item.status,
        isLocalDraft: Boolean(item.isLocalDraft),
      }))
      .sort((x, y) => x.id.localeCompare(y.id));

  return canonicalizeJson(simplify(a)) === canonicalizeJson(simplify(b));
}

/**
 * Directly fetch latest data from Cloud Firestore (bypassing local cache).
 */
export async function fetchLatestFromFirebase(): Promise<{
  success: boolean;
  config: SchoolConfig | null;
  articles: NewsArticle[] | null;
  customDefaultConfig?: SchoolConfig | null;
  customDefaultArticles?: NewsArticle[] | null;
  customDefaultMeta?: { hasCustomDefault: boolean; savedAt?: string };
  error?: string;
}> {
  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { success: false, config: null, articles: null, error: 'Offline atau database tidak terhubung' };
  }

  try {
    const configDocRef = doc(db, 'school_portal', 'main_config');
    const articlesColRef = collection(db, 'news_articles');
    const customDefaultDocRef = doc(db, 'school_portal', 'custom_defaults');

    const [configSnap, articlesSnap, customDefaultSnap] = await Promise.all([
      withTimeout(getDoc(configDocRef), 4000).catch(() => null),
      withTimeout(getDocs(articlesColRef), 4000).catch(() => null),
      withTimeout(getDoc(customDefaultDocRef), 4000).catch(() => null),
    ]);

    let cloudConfig: SchoolConfig | null = null;
    let cloudArticles: NewsArticle[] | null = null;
    let customDefaultConfig: SchoolConfig | null = null;
    let customDefaultArticles: NewsArticle[] | null = null;
    let customDefaultMeta: { hasCustomDefault: boolean; savedAt?: string } = { hasCustomDefault: false };

    if (customDefaultSnap && customDefaultSnap.exists()) {
      const data = customDefaultSnap.data();
      customDefaultMeta = {
        hasCustomDefault: true,
        savedAt: data.savedAt,
      };
      if (data.config) customDefaultConfig = normalizeSchoolConfig(data.config as SchoolConfig);
      if (Array.isArray(data.articles)) customDefaultArticles = data.articles as NewsArticle[];
    }

    if (configSnap && configSnap.exists()) {
      cloudConfig = normalizeSchoolConfig(configSnap.data() as SchoolConfig);
    } else if (customDefaultConfig) {
      cloudConfig = normalizeSchoolConfig(customDefaultConfig);
    } else {
      cloudConfig = DEFAULT_SCHOOL_CONFIG;
    }

    if (articlesSnap && !articlesSnap.empty) {
      const arts: NewsArticle[] = [];
      articlesSnap.forEach((d) => {
        arts.push(d.data() as NewsArticle);
      });
      arts.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      cloudArticles = arts;
    } else if (customDefaultArticles && customDefaultArticles.length > 0) {
      cloudArticles = customDefaultArticles;
    } else {
      cloudArticles = DEFAULT_NEWS_ARTICLES;
    }

    return {
      success: true,
      config: cloudConfig,
      articles: cloudArticles,
      customDefaultConfig,
      customDefaultArticles,
      customDefaultMeta,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, config: null, articles: null, error: msg };
  }
}

export interface CloudSyncResult {
  success: boolean;
  isDifferent: boolean;
  config: SchoolConfig;
  articles: NewsArticle[];
  message: string;
  source: 'cloud' | 'cache' | 'default';
}

/**
 * Direct fetch from Firebase Firestore, automatically updating appropriate cache (Public / Admin).
 * Used when page reloads / refreshes, or when user clicks the refresh button.
 */
export async function fetchAndSyncLatestData(forceScope?: 'public' | 'admin'): Promise<CloudSyncResult> {
  const scope = forceScope || (isAdminAuthenticated() ? 'admin' : 'public');
  const cachedConfig = (await getCachedSchoolConfig(scope)) || DEFAULT_SCHOOL_CONFIG;
  const cachedArticles = (await getCachedNewsArticles(scope)) || DEFAULT_NEWS_ARTICLES;

  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return {
      success: false,
      isDifferent: false,
      config: cachedConfig,
      articles: cachedArticles,
      message: 'Sedang dalam mode offline (menggunakan data lokal tersimpan).',
      source: 'cache',
    };
  }

  try {
    const latest = await fetchLatestFromFirebase();
    if (!latest.success || !latest.config) {
      return {
        success: false,
        isDifferent: false,
        config: cachedConfig,
        articles: cachedArticles,
        message: latest.error || 'Gagal memuat data dari Firebase.',
        source: 'cache',
      };
    }

    const cloudConfig = latest.config || cachedConfig;
    const cloudArticles = latest.articles || cachedArticles || DEFAULT_NEWS_ARTICLES;

    const configDiff = !areConfigsEqual(cachedConfig, cloudConfig);
    const articlesDiff = !areArticlesEqual(cachedArticles, cloudArticles);
    const isDifferent = configDiff || articlesDiff;

    if (scope === 'public') {
      // Update public cache with published cloud data
      await saveToPublicCache(cloudConfig, cloudArticles);
    } else {
      // Update admin cache with cloud data
      await saveToAdminCache(cloudConfig, cloudArticles);
    }

    // If custom defaults exist, ensure they're saved
    if (latest.customDefaultConfig && latest.customDefaultArticles) {
      try {
        localStorage.setItem(CUSTOM_DEFAULT_CONFIG_KEY, JSON.stringify(latest.customDefaultConfig));
        localStorage.setItem(CUSTOM_DEFAULT_NEWS_KEY, JSON.stringify(latest.customDefaultArticles));
        if (latest.customDefaultMeta) {
          localStorage.setItem(CUSTOM_DEFAULT_META_KEY, JSON.stringify(latest.customDefaultMeta));
          await setOfflineItem('custom_default_meta', latest.customDefaultMeta);
        }
        await setOfflineItem('custom_default_config', latest.customDefaultConfig);
        await setOfflineItem('custom_default_articles', latest.customDefaultArticles);
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      isDifferent,
      config: cloudConfig,
      articles: cloudArticles,
      message: isDifferent ? 'Data diperbarui' : 'Versi terbaru',
      source: 'cloud',
    };
  } catch (err: unknown) {
    return {
      success: false,
      isDifferent: false,
      config: cachedConfig,
      articles: cachedArticles,
      message: 'Gagal sinkron',
      source: 'cache',
    };
  }
}

export interface DeviceSyncResult {
  checked: boolean;
  isDifferent: boolean;
  synced: boolean;
  message: string;
  config?: SchoolConfig;
  articles?: NewsArticle[];
}

/**
 * Automatic cross-device synchronization check when entering Admin panel.
 * If offline local data differs from Firebase:
 * 1. Cleans local cache & stale drafts on this device
 * 2. Downloads and applies the latest Firebase data and defaults
 * 3. Prevents edit collision across devices/browsers
 */
export async function syncAdminWithFirebaseIfDifferent(
  localConfig: SchoolConfig,
  localArticles: NewsArticle[]
): Promise<DeviceSyncResult> {
  const latest = await fetchLatestFromFirebase();
  if (!latest.success || !latest.config) {
    return {
      checked: false,
      isDifferent: false,
      synced: false,
      message: 'Mode offline',
    };
  }

  const cloudConfig = latest.config;
  const cloudArticles = latest.articles || localArticles || DEFAULT_NEWS_ARTICLES;

  const configMatches = areConfigsEqual(localConfig, cloudConfig);
  const articlesMatch = areArticlesEqual(localArticles, cloudArticles);

  if (configMatches && articlesMatch) {
    return {
      checked: true,
      isDifferent: false,
      synced: true,
      message: 'Versi terbaru',
    };
  }

  // Data is different! Clean local cache and download latest from Firebase
  try {
    // Save to admin cache and public cache
    await saveToAdminCache(cloudConfig, cloudArticles);
    await saveToPublicCache(cloudConfig, cloudArticles);

    // Also sync custom defaults if available
    if (latest.customDefaultConfig && latest.customDefaultArticles) {
      localStorage.setItem(CUSTOM_DEFAULT_CONFIG_KEY, JSON.stringify(latest.customDefaultConfig));
      localStorage.setItem(CUSTOM_DEFAULT_NEWS_KEY, JSON.stringify(latest.customDefaultArticles));
      if (latest.customDefaultMeta) {
        localStorage.setItem(CUSTOM_DEFAULT_META_KEY, JSON.stringify(latest.customDefaultMeta));
        await setOfflineItem('custom_default_meta', latest.customDefaultMeta);
      }
      await setOfflineItem('custom_default_config', latest.customDefaultConfig);
      await setOfflineItem('custom_default_articles', latest.customDefaultArticles);
    }

    return {
      checked: true,
      isDifferent: true,
      synced: true,
      config: cloudConfig,
      articles: cloudArticles,
      message: 'Data diperbarui',
    };
  } catch (err: unknown) {
    return {
      checked: true,
      isDifferent: true,
      synced: false,
      message: 'Gagal sinkron',
    };
  }
}

/**
 * Manually force download latest data from Firebase and clean local cache
 */
export async function forceRefreshFromFirebase(): Promise<{
  success: boolean;
  config?: SchoolConfig;
  articles?: NewsArticle[];
  message: string;
}> {
  const latest = await fetchLatestFromFirebase();
  if (!latest.success || !latest.config) {
    return {
      success: false,
      message: 'Gagal mengambil data dari Firebase: ' + (latest.error || 'Koneksi terputus'),
    };
  }

  const finalArticles = latest.articles || DEFAULT_NEWS_ARTICLES;

  try {
    await clearOfflineStorage();
    localStorage.removeItem(LEGACY_CONFIG_KEY);
    localStorage.removeItem(LEGACY_NEWS_KEY);
    localStorage.removeItem('offline_school_config');
    localStorage.removeItem('offline_news_articles');
    localStorage.removeItem(PUBLIC_CONFIG_KEY);
    localStorage.removeItem(PUBLIC_NEWS_KEY);
    localStorage.removeItem(ADMIN_CONFIG_KEY);
    localStorage.removeItem(ADMIN_NEWS_KEY);

    await saveToAdminCache(latest.config, finalArticles);
    await saveToPublicCache(latest.config, finalArticles);

    if (latest.customDefaultConfig && latest.customDefaultArticles) {
      localStorage.setItem(CUSTOM_DEFAULT_CONFIG_KEY, JSON.stringify(latest.customDefaultConfig));
      localStorage.setItem(CUSTOM_DEFAULT_NEWS_KEY, JSON.stringify(latest.customDefaultArticles));
      if (latest.customDefaultMeta) {
        localStorage.setItem(CUSTOM_DEFAULT_META_KEY, JSON.stringify(latest.customDefaultMeta));
        await setOfflineItem('custom_default_meta', latest.customDefaultMeta);
      }
      await setOfflineItem('custom_default_config', latest.customDefaultConfig);
      await setOfflineItem('custom_default_articles', latest.customDefaultArticles);
    }

    return {
      success: true,
      config: latest.config,
      articles: latest.articles,
      message: 'Penyimpanan lokal berhasil dibersihkan dan data terbaru dari Firebase telah diunduh.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: 'Gagal menyimpan ke penyimpanan lokal: ' + msg,
    };
  }
}

/**
 * Subscribe to real-time changes of the main school configuration in Firestore.
 * Automatically triggers callback whenever an admin publishes changes from any device/browser.
 */
export function subscribeToCloudConfig(
  onUpdate: (config: SchoolConfig) => void
): () => void {
  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return () => {};
  }

  try {
    const configDocRef = doc(db, 'school_portal', 'main_config');
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          const normalized = normalizeSchoolConfig(cloudData as SchoolConfig);
          onUpdate(normalized);
        }
      },
      (error) => {
        console.info('Firestore realtime listener suspended:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.info('Failed to setup realtime cloud subscription:', err);
    return () => {};
  }
}

/**
 * Subscribe to real-time changes of news articles in Firestore.
 * Automatically triggers callback whenever an article is created, edited, or deleted.
 */
export function subscribeToCloudArticles(
  onUpdate: (articles: NewsArticle[]) => void
): () => void {
  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return () => {};
  }

  try {
    const articlesColRef = collection(db, 'news_articles');
    const unsubscribe = onSnapshot(
      articlesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const arts: NewsArticle[] = [];
          snapshot.forEach((d) => {
            arts.push(d.data() as NewsArticle);
          });
          arts.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
          // Save to dedicated posts cache immediately
          saveDedicatedPostsCache(arts);
          onUpdate(arts);
        }
      },
      (error) => {
        console.info('Firestore realtime articles listener suspended:', error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.info('Failed to setup realtime articles subscription:', err);
    return () => {};
  }
}


