import { convertGoogleDriveUrl } from './imageOptimizer';
import {
  getStoredAppsScriptConfig,
  listDriveFilesViaAppsScript,
} from './googleAppsScript';
import { db, withTimeout } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface DriveMediaItem {
  fileId: string;
  fileName: string;
  fileUrl: string; // Direct CDN URL: https://lh3.googleusercontent.com/d/{id}
  viewUrl?: string; // Google Drive Web View URL
  size?: number; // Size in bytes
  mimeType?: string;
  uploadedAt: string; // ISO date string
  folderName?: string;
  source?: 'upload' | 'synced' | 'scanned';
}

const STORAGE_KEY = 'smpn1_drive_media_history';
const LEGACY_KEY = 'gas_uploaded_images_history';

type MediaChangeListener = (items: DriveMediaItem[]) => void;
const listeners = new Set<MediaChangeListener>();

function notifyListeners(items: DriveMediaItem[]) {
  listeners.forEach((listener) => {
    try {
      listener(items);
    } catch (err) {
      console.error('Error notifying drive media listener:', err);
    }
  });
}

/**
 * Extract Google Drive file ID from standard drive URLs or direct CDN URLs
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const matchLh3 = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3) return matchLh3[1];

  const matchFileD = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD) return matchFileD[1];

  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam) return matchIdParam[1];

  const matchUc = url.match(/drive\.google\.com\/uc\?.*?id=([a-zA-Z0-9_-]+)/);
  if (matchUc) return matchUc[1];

  return null;
}

/**
 * Get stored Drive media from browser local storage
 */
export function getStoredDriveMedia(): DriveMediaItem[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Gagal membaca riwayat media Google Drive:', err);
  }
  return [];
}

/**
 * Fetch Drive Media catalog from Firestore Cloud Database
 */
export async function fetchFirestoreDriveMedia(): Promise<DriveMediaItem[]> {
  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return [];
  }
  try {
    const docRef = doc(db, 'school_portal', 'drive_media');
    const snap = await withTimeout(getDoc(docRef), 3500);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.items)) {
        return data.items as DriveMediaItem[];
      }
    }
  } catch (err) {
    console.info('Firestore media fetch skipped/offline:', err);
  }
  return [];
}

let saveFirestoreTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Persist Drive Media catalog to Firestore Cloud Database
 */
export async function saveToFirestoreDriveMedia(items: DriveMediaItem[]): Promise<void> {
  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return;
  }
  if (saveFirestoreTimeout) clearTimeout(saveFirestoreTimeout);
  saveFirestoreTimeout = setTimeout(async () => {
    try {
      // Limit to latest 300 items to keep doc under 60KB
      const toSave = items.slice(0, 300).map((i) => ({
        fileId: i.fileId,
        fileName: i.fileName,
        fileUrl: i.fileUrl,
        viewUrl: i.viewUrl || '',
        size: i.size || 0,
        mimeType: i.mimeType || 'image/jpeg',
        uploadedAt: i.uploadedAt || new Date().toISOString(),
        folderName: i.folderName || '',
        source: i.source || 'synced',
      }));

      const docRef = doc(db, 'school_portal', 'drive_media');
      await withTimeout(
        setDoc(
          docRef,
          {
            items: toSave,
            updatedAt: new Date().toISOString(),
            count: toSave.length,
          },
          { merge: true }
        ),
        4500
      );
    } catch (err) {
      console.info('Firestore media sync skipped:', err);
    }
  }, 1200);
}

/**
 * Save drive media items to localStorage and Firestore
 */
export function saveStoredDriveMedia(items: DriveMediaItem[]): void {
  try {
    // Sort newest first
    const sorted = [...items].sort((a, b) => {
      const timeA = new Date(a.uploadedAt || 0).getTime();
      const timeB = new Date(b.uploadedAt || 0).getTime();
      return timeB - timeA;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(sorted));
    notifyListeners(sorted);

    // Synchronize to Firestore so all browsers (Browser 1, Browser 2, mobile) have identical media
    saveToFirestoreDriveMedia(sorted);
  } catch (err) {
    console.error('Gagal menyimpan riwayat media Google Drive:', err);
  }
}

/**
 * Record a newly uploaded file to the Drive Media Storage
 */
export function recordUploadedDriveMedia(
  item: Omit<DriveMediaItem, 'uploadedAt'> & { uploadedAt?: string }
): DriveMediaItem {
  const current = getStoredDriveMedia();
  const fileId = item.fileId || extractDriveFileId(item.fileUrl) || `f_${Date.now()}`;
  const fileUrl = item.fileUrl.startsWith('http')
    ? item.fileUrl
    : `https://lh3.googleusercontent.com/d/${fileId}`;

  const newItem: DriveMediaItem = {
    fileId,
    fileName: item.fileName || `Foto_${new Date().toISOString().slice(0, 10)}.jpg`,
    fileUrl,
    viewUrl: item.viewUrl || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : fileUrl),
    size: item.size || 0,
    mimeType: item.mimeType || 'image/jpeg',
    uploadedAt: item.uploadedAt || new Date().toISOString(),
    folderName: item.folderName || '[SMPN 1 Bengkalis] Web Assets',
    source: item.source || 'upload',
  };

  // Remove any previous duplicate with same fileId or same fileUrl
  const filtered = current.filter(
    (existing) => existing.fileId !== fileId && existing.fileUrl !== fileUrl
  );

  const updated = [newItem, ...filtered];
  saveStoredDriveMedia(updated);
  return newItem;
}

/**
 * Remove an item from the Drive Media Storage
 */
export function removeStoredDriveMedia(fileIdOrUrl: string): void {
  const current = getStoredDriveMedia();
  const updated = current.filter(
    (item) => item.fileId !== fileIdOrUrl && item.fileUrl !== fileIdOrUrl
  );
  saveStoredDriveMedia(updated);
}

/**
 * Scan website data in local storage for any existing Google Drive images
 * (from articles, headers, banners, facilities, etc.)
 */
export function scanAppForDriveImages(): DriveMediaItem[] {
  const foundItems: DriveMediaItem[] = [];
  const foundUrls = new Set<string>();

  const checkAndAddUrl = (url: string, suggestedName?: string) => {
    if (!url || typeof url !== 'string') return;
    if (
      url.includes('lh3.googleusercontent.com/d/') ||
      url.includes('drive.google.com')
    ) {
      const fileId = extractDriveFileId(url);
      if (fileId && !foundUrls.has(fileId)) {
        foundUrls.add(fileId);
        const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        foundItems.push({
          fileId,
          fileName: suggestedName || `Asset_Drive_${fileId.slice(0, 8)}.jpg`,
          fileUrl: cdnUrl,
          viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
          uploadedAt: new Date().toISOString(),
          source: 'scanned',
        });
      }
    }
  };

  // Check all localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (!raw || (!raw.includes('drive.google.com') && !raw.includes('lh3.googleusercontent.com'))) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw);
        // If it's an array of news articles
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item?.coverImage) checkAndAddUrl(item.coverImage, `${item.title || 'Artikel'}_Sampul.jpg`);
            if (Array.isArray(item?.galleryImages)) {
              item.galleryImages.forEach((gUrl: string, idx: number) => {
                checkAndAddUrl(gUrl, `${item.title || 'Artikel'}_Galeri_${idx + 1}.jpg`);
              });
            }
          });
        } else if (typeof parsed === 'object' && parsed !== null) {
          // School config object
          if (parsed?.identity?.logoUrl) checkAndAddUrl(parsed.identity.logoUrl, 'Logo_Sekolah.png');
          if (parsed?.identity?.faviconUrl) checkAndAddUrl(parsed.identity.faviconUrl, 'Favicon.png');
          if (parsed?.header?.heroImageUrl) checkAndAddUrl(parsed.header.heroImageUrl, 'Banner_Hero.jpg');
          if (parsed?.principal?.photoUrl) checkAndAddUrl(parsed.principal.photoUrl, 'Foto_Kepala_Sekolah.jpg');
        }
      } catch {
        // Not JSON, search directly via regex
        const matches = raw.match(/https:\/\/(?:lh3\.googleusercontent\.com\/d\/|drive\.google\.com\/[^\s"')]+)/g);
        if (matches) {
          matches.forEach((m) => checkAndAddUrl(m));
        }
      }
    }
  } catch (e) {
    console.error('Error scanning app for Drive images:', e);
  }

  return foundItems;
}

/**
 * Synchronize media: combine stored media, scanned media, and live Apps Script drive folder listing
 */
export async function syncDriveMediaFiles(options?: {
  webAppUrl?: string;
  folderId?: string;
  forceScan?: boolean;
}): Promise<DriveMediaItem[]> {
  const current = getStoredDriveMedia();
  const fileMap = new Map<string, DriveMediaItem>();

  // 1. Put current local storage items in map
  current.forEach((item) => {
    fileMap.set(item.fileId, item);
  });

  // 2. Fetch shared cloud media from Firestore (bridges Browser 1, Browser 2, and mobile devices)
  try {
    const cloudItems = await fetchFirestoreDriveMedia();
    cloudItems.forEach((item) => {
      const existing = fileMap.get(item.fileId);
      if (!existing) {
        fileMap.set(item.fileId, item);
      } else {
        // Keep the richest metadata
        fileMap.set(item.fileId, {
          ...item,
          ...existing,
          fileName: existing.fileName || item.fileName,
          size: existing.size || item.size,
        });
      }
    });
  } catch (cloudErr) {
    console.info('Firestore media merge skipped:', cloudErr);
  }

  // 3. Scan app for any Drive images in articles or layout configs
  const scanned = scanAppForDriveImages();
  scanned.forEach((item) => {
    if (!fileMap.has(item.fileId)) {
      fileMap.set(item.fileId, item);
    }
  });

  // 4. Query Google Apps Script Web App for live folder contents directly from Google Drive
  const config = getStoredAppsScriptConfig();
  const webAppUrl = options?.webAppUrl || config.webAppUrl;
  const folderId = options?.folderId ?? config.folderId;

  if (webAppUrl && webAppUrl.trim().startsWith('https://script.google.com/')) {
    try {
      const liveFiles = await listDriveFilesViaAppsScript({
        webAppUrl,
        folderId,
      });

      if (Array.isArray(liveFiles) && liveFiles.length > 0) {
        liveFiles.forEach((f) => {
          const existing = fileMap.get(f.fileId);
          fileMap.set(f.fileId, {
            fileId: f.fileId,
            fileName: f.fileName || existing?.fileName || `Foto_${f.fileId.slice(0, 8)}.jpg`,
            fileUrl: f.fileUrl,
            viewUrl: f.viewUrl || existing?.viewUrl || `https://drive.google.com/file/d/${f.fileId}/view`,
            size: f.size || existing?.size || 0,
            mimeType: f.mimeType || existing?.mimeType || 'image/jpeg',
            uploadedAt: f.uploadedAt || existing?.uploadedAt || new Date().toISOString(),
            folderName: f.folderName || existing?.folderName,
            source: 'synced',
          });
        });
      }
    } catch (liveErr) {
      // If Apps Script doesn't support listFiles or fails, we gracefully keep local + scanned items
      console.warn('Live fetch from Google Apps Script skipped or unavailable:', liveErr);
    }
  }

  const merged = Array.from(fileMap.values());
  saveStoredDriveMedia(merged);
  return merged;
}

/**
 * Subscribe to drive media storage changes
 */
export function subscribeDriveMedia(listener: MediaChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
