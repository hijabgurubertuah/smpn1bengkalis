import {
  doc,
  getDoc,
  collection,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { db, withTimeout } from './firebase';
import { getOfflineItem } from './offlineStorage';
import { SchoolConfig, NewsArticle } from '../types';

export interface FirestoreDocItem {
  id: string;
  path: string;
  name: string;
  collection: string;
  bytes: number;
  formattedSize: string;
  percentOfDocLimit: number; // vs 1,048,576 bytes (1 MB)
  warningLevel: 'safe' | 'warning' | 'danger';
  details?: string;
}

export interface CollectionSummary {
  name: string;
  collectionKey: string;
  docCount: number;
  totalBytes: number;
  formattedSize: string;
  docs: FirestoreDocItem[];
}

export interface FirestoreStorageDiagnostics {
  fetchedAt: string;
  isLiveFromCloud: boolean;
  totalBytes: number;
  formattedTotalSize: string;
  totalDocuments: number;
  freeTierCapacityBytes: number; // 1 GB = 1,073,741,824 bytes
  percentOfTotalCapacity: number;
  maxDocSizeBytes: number; // 1 MB = 1,048,576 bytes
  singleDocWarningThresholdBytes: number; // e.g. 500 KB = 512,000 bytes
  largestDoc: FirestoreDocItem | null;
  collections: CollectionSummary[];
  thresholdBytes: number; // User-defined or preset storage threshold (e.g. 10 MB)
  formattedThreshold: string;
  isExceedingThreshold: boolean;
  warningLevel: 'safe' | 'warning' | 'danger';
  warningMessage: string;
  recommendations: string[];
}

/**
 * Format bytes to readable size string (B, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate Firestore document size in bytes according to official Firestore specs:
 * 32 bytes overhead + document path + field names + field values.
 */
export function calculateFirestoreDocSize(docPath: string, data: unknown): number {
  // Document base overhead
  let bytes = 32 + 16 + (docPath ? new TextEncoder().encode(docPath).length : 0);

  function calculateValueSize(val: unknown): number {
    if (val === null || val === undefined) return 1;
    if (typeof val === 'boolean') return 1;
    if (typeof val === 'number') return 8;
    if (typeof val === 'string') {
      return new TextEncoder().encode(val).length + 1;
    }
    if (val instanceof Date) return 8;
    if (Array.isArray(val)) {
      return val.reduce((acc, item) => acc + calculateValueSize(item), 0);
    }
    if (typeof val === 'object') {
      let objBytes = 0;
      for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
        objBytes += new TextEncoder().encode(key).length + 1;
        objBytes += calculateValueSize(value);
      }
      return objBytes;
    }
    return 0;
  }

  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      bytes += new TextEncoder().encode(key).length + 1;
      bytes += calculateValueSize(value);
    }
  }

  return bytes;
}

const FIRESTORE_1MB_LIMIT = 1024 * 1024; // 1,048,576 bytes
const FIRESTORE_1GB_LIMIT = 1024 * 1024 * 1024; // 1,073,741,824 bytes

function determineDocWarningLevel(bytes: number): 'safe' | 'warning' | 'danger' {
  if (bytes >= 800 * 1024) return 'danger'; // > 800 KB
  if (bytes >= 400 * 1024) return 'warning'; // > 400 KB
  return 'safe';
}

/**
 * Fetch and analyze current storage usage in Firestore
 */
export async function fetchFirestoreStorageDiagnostics(
  thresholdBytes: number = 10 * 1024 * 1024
): Promise<FirestoreStorageDiagnostics> {
  const allDocs: FirestoreDocItem[] = [];
  let isLiveFromCloud = false;

  // 1. Fetch from Firestore if available & online
  if (db && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      // A. Main Config Document
      const mainConfigRef = doc(db, 'school_portal', 'main_config');
      const mainConfigSnap = await withTimeout(getDoc(mainConfigRef), 3500);
      if (mainConfigSnap.exists()) {
        const data = mainConfigSnap.data();
        const path = 'school_portal/main_config';
        const bytes = calculateFirestoreDocSize(path, data);
        allDocs.push({
          id: 'main_config',
          path,
          name: 'Konfigurasi Utama Portal (Identitas, Header, Menu, Layout, Sambutan, Kontak)',
          collection: 'school_portal',
          bytes,
          formattedSize: formatBytes(bytes),
          percentOfDocLimit: (bytes / FIRESTORE_1MB_LIMIT) * 100,
          warningLevel: determineDocWarningLevel(bytes),
          details: 'Dokumen master konfigurasi sekolah',
        });
      }

      // B. Custom Defaults Document (if exists)
      try {
        const customDefaultRef = doc(db, 'school_portal', 'custom_defaults');
        const customDefaultSnap = await withTimeout(getDoc(customDefaultRef), 2500);
        if (customDefaultSnap.exists()) {
          const data = customDefaultSnap.data();
          const path = 'school_portal/custom_defaults';
          const bytes = calculateFirestoreDocSize(path, data);
          allDocs.push({
            id: 'custom_defaults',
            path,
            name: 'Snapshot Template Default Kustom',
            collection: 'school_portal',
            bytes,
            formattedSize: formatBytes(bytes),
            percentOfDocLimit: (bytes / FIRESTORE_1MB_LIMIT) * 100,
            warningLevel: determineDocWarningLevel(bytes),
            details: `Snapshot disimpan pada ${data.savedAt || 'waktu sebelumnya'}`,
          });
        }
      } catch {
        // optional document
      }

      // C. News Articles Collection
      try {
        const newsColRef = collection(db, 'news_articles');
        const newsSnap = await withTimeout(getDocs(newsColRef), 3500);
        newsSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const path = `news_articles/${docSnap.id}`;
          const bytes = calculateFirestoreDocSize(path, data);
          allDocs.push({
            id: docSnap.id,
            path,
            name: data.title || `Artikel ${docSnap.id}`,
            collection: 'news_articles',
            bytes,
            formattedSize: formatBytes(bytes),
            percentOfDocLimit: (bytes / FIRESTORE_1MB_LIMIT) * 100,
            warningLevel: determineDocWarningLevel(bytes),
            details: `Kategori: ${data.category || 'Umum'} | Status: ${data.status || 'published'}`,
          });
        });
      } catch {
        // fallback for news collection
      }

      // D. System Health Ping Document (if exists)
      try {
        const pingRef = doc(db, 'system_health', 'ping');
        const pingSnap = await withTimeout(getDoc(pingRef), 2000);
        if (pingSnap.exists()) {
          const path = 'system_health/ping';
          const bytes = calculateFirestoreDocSize(path, pingSnap.data());
          allDocs.push({
            id: 'ping',
            path,
            name: 'Pemeriksaan Koneksi (Health Ping)',
            collection: 'system_health',
            bytes,
            formattedSize: formatBytes(bytes),
            percentOfDocLimit: (bytes / FIRESTORE_1MB_LIMIT) * 100,
            warningLevel: 'safe',
            details: 'Dokumen uji latensi koneksi',
          });
        }
      } catch {
        // ignore ping errors
      }

      isLiveFromCloud = allDocs.length > 0;
    } catch (cloudErr) {
      console.info('Live Firestore diagnostics fetch deferred, using cached snapshot:', cloudErr);
    }
  }

  // 2. Offline / Local fallback if cloud could not be reached
  if (allDocs.length === 0) {
    try {
      const localConfig = await getOfflineItem<SchoolConfig>('school_config');
      if (localConfig) {
        const path = 'school_portal/main_config';
        const bytes = calculateFirestoreDocSize(path, localConfig);
        allDocs.push({
          id: 'main_config',
          path,
          name: 'Konfigurasi Utama Portal (Cache Lokal)',
          collection: 'school_portal',
          bytes,
          formattedSize: formatBytes(bytes),
          percentOfDocLimit: (bytes / FIRESTORE_1MB_LIMIT) * 100,
          warningLevel: determineDocWarningLevel(bytes),
          details: 'Perkiraan ukuran dari salinan lokal IndexedDB',
        });
      }

      const localArticles = await getOfflineItem<NewsArticle[]>('news_articles');
      if (localArticles && Array.isArray(localArticles)) {
        localArticles.forEach((art) => {
          const path = `news_articles/${art.id}`;
          const bytes = calculateFirestoreDocSize(path, art);
          allDocs.push({
            id: art.id,
            path,
            name: art.title || `Artikel ${art.id}`,
            collection: 'news_articles',
            bytes,
            formattedSize: formatBytes(bytes),
            percentOfDocLimit: (bytes / FIRESTORE_1MB_LIMIT) * 100,
            warningLevel: determineDocWarningLevel(bytes),
            details: `Kategori: ${art.category || 'Umum'} (Cache Lokal)`,
          });
        });
      }
    } catch (localErr) {
      console.error('Error generating fallback diagnostic snapshot', localErr);
    }
  }

  // 3. Compute Aggregations
  const totalBytes = allDocs.reduce((sum, d) => sum + d.bytes, 0);
  const totalDocuments = allDocs.length;
  const percentOfTotalCapacity = (totalBytes / FIRESTORE_1GB_LIMIT) * 100;

  // Group by collection
  const collectionMap = new Map<string, FirestoreDocItem[]>();
  allDocs.forEach((d) => {
    const list = collectionMap.get(d.collection) || [];
    list.push(d);
    collectionMap.set(d.collection, list);
  });

  const collections: CollectionSummary[] = [];
  collectionMap.forEach((docs, colName) => {
    const colTotal = docs.reduce((acc, item) => acc + item.bytes, 0);
    // Sort descending by size
    docs.sort((a, b) => b.bytes - a.bytes);
    collections.push({
      name:
        colName === 'school_portal'
          ? 'Portal Sekolah (Konfigurasi & Default)'
          : colName === 'news_articles'
          ? 'Koleksi Berita & Informasi'
          : colName === 'system_health'
          ? 'Sistem & Latensi'
          : colName,
      collectionKey: colName,
      docCount: docs.length,
      totalBytes: colTotal,
      formattedSize: formatBytes(colTotal),
      docs,
    });
  });

  // Sort collections by total bytes descending
  collections.sort((a, b) => b.totalBytes - a.totalBytes);

  // Find largest single document
  let largestDoc: FirestoreDocItem | null = null;
  if (allDocs.length > 0) {
    largestDoc = [...allDocs].sort((a, b) => b.bytes - a.bytes)[0];
  }

  // 4. Warning and threshold analysis
  const isExceedingThreshold = totalBytes > thresholdBytes;
  let warningLevel: 'safe' | 'warning' | 'danger' = 'safe';
  let warningMessage = 'Penggunaan penyimpanan Firestore sangat aman dan jauh di bawah batas kuota.';

  // Check if any single doc is dangerous (> 800 KB)
  const dangerDocs = allDocs.filter((d) => d.bytes >= 800 * 1024);
  const warningDocs = allDocs.filter((d) => d.bytes >= 400 * 1024 && d.bytes < 800 * 1024);

  if (dangerDocs.length > 0) {
    warningLevel = 'danger';
    warningMessage = `PERINGATAN KRITIS: Ditemukan ${dangerDocs.length} dokumen mendekati batas mutlak 1 MB Firestore! Dokumen "${dangerDocs[0].name}" berukuran ${dangerDocs[0].formattedSize}. Segera gunakan URL Google Drive untuk gambar.`;
  } else if (isExceedingThreshold) {
    warningLevel = 'warning';
    warningMessage = `PERINGATAN AMBANG BATAS: Total penyimpanan Firestore (${formatBytes(totalBytes)}) telah melampaui batas yang Anda tetapkan (${formatBytes(thresholdBytes)}).`;
  } else if (warningDocs.length > 0) {
    warningLevel = 'warning';
    warningMessage = `PERHATIAN: Ada dokumen yang mencapai ${warningDocs[0].formattedSize} (mendekati 50% kapasitas dokumen tunggal Firestore). Disarankan memantau media di dalamnya.`;
  }

  // 5. Intelligent actionable recommendations
  const recommendations: string[] = [];
  if (dangerDocs.length > 0 || warningDocs.length > 0) {
    recommendations.push(
      'Gunakan tautan Google Drive atau link CDN publik untuk gambar header, banner, atau galeri agar data Base64 tidak membebani dokumen Firestore.'
    );
  }
  recommendations.push(
    'Batas dokumen tunggal Firestore adalah 1 MB (1.024 KB). Dokumen terbesar Anda saat ini berukuran ' +
      (largestDoc ? `${largestDoc.formattedSize} (${largestDoc.percentOfDocLimit.toFixed(1)}% dari batas)` : '0 KB') +
      '.'
  );
  recommendations.push(
    `Total kapasitas Free Tier database adalah 1 GB (1.024 MB). Total data Anda saat ini baru terpakai ${percentOfTotalCapacity.toFixed(4)}%.`
  );

  return {
    fetchedAt: new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    isLiveFromCloud,
    totalBytes,
    formattedTotalSize: formatBytes(totalBytes),
    totalDocuments,
    freeTierCapacityBytes: FIRESTORE_1GB_LIMIT,
    percentOfTotalCapacity,
    maxDocSizeBytes: FIRESTORE_1MB_LIMIT,
    singleDocWarningThresholdBytes: 500 * 1024,
    largestDoc,
    collections,
    thresholdBytes,
    formattedThreshold: formatBytes(thresholdBytes),
    isExceedingThreshold,
    warningLevel,
    warningMessage,
    recommendations,
  };
}
