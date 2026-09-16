import { GoogleAppsScriptConfig } from '../types';

const APPS_SCRIPT_STORAGE_KEY = 'school_apps_script_config';

export const DEFAULT_FOLDER_NAME = '[SMPN 1 Bengkalis] Web Assets';

/**
 * Hardcoded Default Google Apps Script Web App Deployment URL & Folder ID
 * Tertanam langsung ke baris kode agar aktif otomatis di perangkat & browser baru
 * atau setelah reset cache. Tetap bisa diganti kapan saja dari tab "Google Drive & Sheets".
 */
export const DEFAULT_APPS_SCRIPT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzDwgMpuYfhYLKXwKZx1i03NliLZnCGf_17Fnra29JE7TyoToQ6PKpdp7z6lRcOq1VJ/exec';

export const DEFAULT_APPS_SCRIPT_FOLDER_ID = '1IZHlhQxAREuthdmf5M5QCSqDFQPDyq6s';

/**
 * Complete, ready-to-use Google Apps Script (.gs) source code.
 * Users can copy and paste this directly into script.google.com!
 */
export const SAMPLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * API GOOGLE APPS SCRIPT: UPLOAD GAMBAR/FILE KE GOOGLE DRIVE & SPREADSHEET
 * SMP NEGERI 1 BENGKALIS
 * =========================================================================
 * 
 * PANDUAN PENERAPAN (DEPLOY):
 * 1. Buka https://script.google.com (atau dari Google Spreadsheet: Ekstensi > Apps Script)
 * 2. Buat project baru dan tempel seluruh kode ini ke 'Code.gs'.
 * 3. Klik tombol 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru).
 * 4. Pilih tipe: 'Web app' (Aplikasi web).
 * 5. Atur konfigurasi:
 *    - Description: "SMPN 1 Bengkalis Drive & Sheet API"
 *    - Execute as (Jalankan sebagai): "Me" (Akun Google saya)  <--- SANGAT PENTING!
 *    - Who has access (Siapa yang memiliki akses): "Anyone" (Siapa saja)  <--- SANGAT PENTING!
 * 6. Klik 'Deploy' dan izinkan akses Google Drive/Spreadsheet akun Anda.
 * 7. Salin 'Web App URL' (akhiran /exec) lalu tempel ke Dashboard Admin website sekolah.
 * 
 * KELUARAN:
 * Mengunggah file langsung ke Drive tanpa pop-up login browser dan menghasilkan link CDN cepat!
 */

function doGet(e) {
  var output = {
    status: "success",
    message: "Google Apps Script Web App SMPN 1 Bengkalis aktif dan siap digunakan!",
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Data permintaan kosong (No post data received)");
    }

    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action || 'uploadFile';

    // 1. PING / TEST CONNECTION
    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Koneksi Google Apps Script berhasil! Web App terhubung aktif.",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. UPLOAD FILE TO GOOGLE DRIVE
    if (action === 'uploadFile') {
      var rawBase64 = requestData.fileData;
      if (!rawBase64) {
        throw new Error("Data file (fileData base64) tidak ditemukan.");
      }

      // Bersihkan prefix data URL jika ada (cth: data:image/png;base64,...)
      var base64Clean = rawBase64;
      if (base64Clean.indexOf('base64,') > -1) {
        base64Clean = base64Clean.split('base64,')[1];
      }

      var fileName = requestData.fileName || ('foto_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss') + '.jpg');
      var mimeType = requestData.mimeType || 'image/jpeg';
      var folderId = requestData.folderId;
      var spreadsheetId = requestData.spreadsheetId;

      // Konversi data base64 ke Blob
      var decodedBytes = Utilities.base64Decode(base64Clean);
      var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      // Tentukan folder tujuan di Google Drive
      var targetFolder;
      if (folderId && folderId.trim() !== '') {
        try {
          targetFolder = DriveApp.getFolderById(folderId.trim());
        } catch (fErr) {
          // Jika ID folder tidak valid, gunakan folder default
          targetFolder = getOrCreateDefaultFolder();
        }
      } else {
        targetFolder = getOrCreateDefaultFolder();
      }

      // Buat file di Google Drive
      var driveFile = targetFolder.createFile(blob);
      var fileId = driveFile.getId();

      // Atur izin publik agar gambar dapat tampil langsung di website sekolah
      try {
        driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (permErr) {
        Logger.log("Warning: Gagal mengatur sharing otomatis: " + permErr);
      }

      // URL CDN Gambar Google berkecepatan tinggi (lh3.googleusercontent.com)
      var directCdnUrl = "https://lh3.googleusercontent.com/d/" + fileId;
      var driveViewUrl = driveFile.getUrl();
      var fileSize = driveFile.getSize();

      // 3. LOGGING KE GOOGLE SPREADSHEET (OPSIONAL)
      var sheetLogged = false;
      if (spreadsheetId && spreadsheetId.trim() !== '') {
        try {
          var ss = SpreadsheetApp.openById(spreadsheetId.trim());
          var sheet = ss.getSheetByName("Log Upload Web") || ss.getActiveSheet();
          
          // Jika sheet baru kosong, buat baris header
          if (sheet.getLastRow() === 0) {
            sheet.appendRow([
              "Waktu (WIB)",
              "Nama File",
              "Tipe File",
              "Ukuran (KB)",
              "Link Gambar (CDN)",
              "Link Google Drive",
              "File ID",
              "Folder"
            ]);
            sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#e2e8f0");
          }

          var waktuWib = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
          var sizeKb = Math.round(fileSize / 1024);

          sheet.appendRow([
            waktuWib,
            fileName,
            mimeType,
            sizeKb + " KB",
            directCdnUrl,
            driveViewUrl,
            fileId,
            targetFolder.getName()
          ]);
          sheetLogged = true;
        } catch (sErr) {
          Logger.log("Peringatan log spreadsheet: " + sErr);
        }
      }

      var result = {
        status: "success",
        fileId: fileId,
        fileName: fileName,
        fileUrl: directCdnUrl,
        viewUrl: driveViewUrl,
        size: fileSize,
        mimeType: mimeType,
        folderName: targetFolder.getName(),
        sheetLogged: sheetLogged
      };

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. DAFTAR GAMBAR/FILE DI FOLDER GOOGLE DRIVE (GALERI TAMPILAN SENDIRI)
    if (action === 'listFiles' || action === 'getFiles') {
      var listFolderId = requestData.folderId;
      var listTargetFolder;
      if (listFolderId && listFolderId.trim() !== '') {
        try {
          listTargetFolder = DriveApp.getFolderById(listFolderId.trim());
        } catch (fErr) {
          listTargetFolder = getOrCreateDefaultFolder();
        }
      } else {
        listTargetFolder = getOrCreateDefaultFolder();
      }

      var driveFiles = listTargetFolder.getFiles();
      var fileItems = [];
      while (driveFiles.hasNext() && fileItems.length < 150) {
        var dFile = driveFiles.next();
        var dMime = dFile.getMimeType();
        var dId = dFile.getId();
        // Sertakan file gambar untuk galeri
        if (dMime.indexOf('image/') === 0 || dMime === 'application/octet-stream') {
          fileItems.push({
            fileId: dId,
            fileName: dFile.getName(),
            fileUrl: "https://lh3.googleusercontent.com/d/" + dId,
            viewUrl: dFile.getUrl(),
            size: dFile.getSize(),
            mimeType: dMime,
            uploadedAt: dFile.getDateCreated().toISOString()
          });
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        folderName: listTargetFolder.getName(),
        files: fileItems
      })).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Aksi tidak dikenali: " + action);

  } catch (error) {
    var errorOutput = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Mencari atau membuat folder default untuk aset web di root Google Drive
 */
function getOrCreateDefaultFolder() {
  var folderName = "[SMPN 1 Bengkalis] Web Assets";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var newFolder = DriveApp.createFolder(folderName);
  try {
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return newFolder;
}
`;

/**
 * Get cached/stored Google Apps Script configuration with multi-tier fallback:
 * Tier 1: Local browser storage (custom configuration on this device)
 * Tier 2: Synced school config from Firebase Firestore (cached in smpn1_admin_config_v4 / smpn1_public_config_v4)
 * Tier 3: Hardcoded code default (DEFAULT_APPS_SCRIPT_WEB_APP_URL)
 */
export function getStoredAppsScriptConfig(): GoogleAppsScriptConfig {
  let stored: Partial<GoogleAppsScriptConfig> | null = null;

  // 1. Check direct Apps Script key in localStorage
  try {
    const raw = localStorage.getItem(APPS_SCRIPT_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // 2. Check if general school config cached from Firebase contains googleAppsScript
  if (!stored?.webAppUrl || stored.webAppUrl.trim() === '') {
    try {
      const configRaw =
        localStorage.getItem('admin_school_config') ||
        localStorage.getItem('public_school_config') ||
        localStorage.getItem('school_config') ||
        localStorage.getItem('custom_default_config') ||
        localStorage.getItem('smpn1_admin_config_v4') ||
        localStorage.getItem('smpn1_public_config_v4');
      if (configRaw) {
        const parsed = JSON.parse(configRaw);
        if (parsed?.googleAppsScript?.webAppUrl && parsed.googleAppsScript.webAppUrl.trim() !== '') {
          stored = {
            ...(stored || {}),
            ...parsed.googleAppsScript,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback to hardcoded default in code if webAppUrl is still empty
  const activeWebAppUrl =
    (stored?.webAppUrl && stored.webAppUrl.trim() !== '')
      ? stored.webAppUrl.trim()
      : (DEFAULT_APPS_SCRIPT_WEB_APP_URL || '').trim();

  const activeFolderId =
    (stored?.folderId && stored.folderId.trim() !== '')
      ? stored.folderId.trim()
      : (DEFAULT_APPS_SCRIPT_FOLDER_ID || '').trim();

  return {
    enabled: stored?.enabled ?? true,
    webAppUrl: activeWebAppUrl,
    folderId: activeFolderId,
    spreadsheetId: stored?.spreadsheetId || '',
    autoCreateFolder: stored?.autoCreateFolder ?? true,
    lastTestedAt: stored?.lastTestedAt,
    testStatus: stored?.testStatus || 'untested',
    testMessage: stored?.testMessage,
  };
}

/**
 * Save Google Apps Script configuration locally
 */
export function saveStoredAppsScriptConfig(config: GoogleAppsScriptConfig): void {
  try {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save apps script config locally:', err);
  }
}

/**
 * Convert a browser File object to a clean Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file gambar sebagai Base64.'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface AppsScriptUploadResult {
  status: 'success' | 'error';
  fileId: string;
  fileName: string;
  fileUrl: string; // Direct CDN URL for <img> tags: https://lh3.googleusercontent.com/d/{id}
  viewUrl: string;
  size: number;
  mimeType: string;
  folderName?: string;
  sheetLogged?: boolean;
  uploadedAt?: string;
  message?: string;
}

/**
 * Upload a file directly to Google Drive via Google Apps Script Web App
 * NO Google Auth Popup required! NO CORS preflight failures!
 */
export async function uploadFileViaAppsScript(
  file: File,
  options?: {
    webAppUrl?: string;
    folderId?: string;
    spreadsheetId?: string;
    onProgress?: (message: string) => void;
  }
): Promise<AppsScriptUploadResult> {
  const storedConfig = getStoredAppsScriptConfig();
  const webAppUrl = options?.webAppUrl || storedConfig?.webAppUrl;

  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error(
      'URL Google Apps Script belum dikonfigurasi. Buka tab "Google Drive & Sheets" di Admin untuk memasukkan URL Web App Anda.'
    );
  }

  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl.startsWith('https://script.google.com/')) {
    throw new Error(
      'Format URL tidak valid. URL harus dimulai dengan https://script.google.com/macros/s/.../exec'
    );
  }

  options?.onProgress?.('Membaca data file...');
  const base64Data = await fileToBase64(file);

  const payload = {
    action: 'uploadFile',
    fileData: base64Data,
    fileName: file.name,
    mimeType: file.type || 'image/jpeg',
    folderId: (options?.folderId ?? storedConfig?.folderId ?? '').trim(),
    spreadsheetId: (options?.spreadsheetId ?? storedConfig?.spreadsheetId ?? '').trim(),
  };

  options?.onProgress?.('Mengunggah ke Google Drive via Apps Script...');

  // Use text/plain;charset=utf-8 to avoid browser CORS preflight OPTIONS request
  const response = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Gagal menghubungi Google Apps Script (HTTP ${response.status})`);
  }

  const data = await response.json();

  if (data.status !== 'success') {
    throw new Error(data.message || 'Terjadi kesalahan saat memproses file di Google Apps Script.');
  }

  // Record this newly uploaded file to persistent Drive Media storage
  try {
    const { recordUploadedDriveMedia } = await import('./driveMediaStorage');
    recordUploadedDriveMedia({
      fileId: data.fileId,
      fileName: data.fileName || file.name,
      fileUrl: data.fileUrl,
      viewUrl: data.viewUrl,
      size: data.size || file.size,
      mimeType: data.mimeType || file.type,
      folderName: data.folderName,
      source: 'upload',
    });
  } catch (recErr) {
    console.warn('Gagal mencatat file ke riwayat galeri:', recErr);
  }

  return data as AppsScriptUploadResult;
}

/**
 * List files in the Google Drive folder via Google Apps Script Web App
 */
export async function listDriveFilesViaAppsScript(options?: {
  webAppUrl?: string;
  folderId?: string;
}): Promise<AppsScriptUploadResult[]> {
  const storedConfig = getStoredAppsScriptConfig();
  const webAppUrl = options?.webAppUrl || storedConfig?.webAppUrl;
  if (!webAppUrl || !webAppUrl.trim() || !webAppUrl.startsWith('https://script.google.com/')) {
    return [];
  }

  const payload = {
    action: 'listFiles',
    folderId: (options?.folderId ?? storedConfig?.folderId ?? '').trim(),
  };

  const response = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.status === 'success' && Array.isArray(data.files)) {
    return data.files.map((f: any) => ({
      status: 'success' as const,
      fileId: f.fileId || '',
      fileName: f.fileName || 'Foto Google Drive',
      fileUrl: f.fileUrl || `https://lh3.googleusercontent.com/d/${f.fileId}`,
      viewUrl: f.viewUrl || (f.fileId ? `https://drive.google.com/file/d/${f.fileId}/view` : ''),
      size: typeof f.size === 'number' ? f.size : 0,
      mimeType: f.mimeType || 'image/jpeg',
      uploadedAt: f.uploadedAt || new Date().toISOString(),
      folderName: data.folderName,
    }));
  }
  return [];
}


/**
 * Test ping connection to Google Apps Script Web App
 */
export async function testAppsScriptConnection(
  webAppUrl: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const cleanUrl = webAppUrl.trim();
  if (!cleanUrl) {
    return { success: false, message: 'URL Web App tidak boleh kosong.' };
  }
  if (!cleanUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'Format URL tidak valid. URL harus dimulai dengan https://script.google.com/macros/s/.../exec',
    };
  }

  const startTime = Date.now();
  try {
    const payload = { action: 'ping' };
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: Periksa apakah Web App telah di-deploy dengan opsi "Who has access: Anyone".`,
        latencyMs,
      };
    }

    const data = await response.json();
    if (data.status === 'success') {
      return {
        success: true,
        message: data.message || 'Koneksi berhasil! Google Apps Script siap digunakan.',
        latencyMs,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Respon error dari Apps Script.',
        latencyMs,
      };
    }
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menghubungkan: ${msg}. Pastikan "Who has access" disetel ke "Anyone" saat deploy.`,
      latencyMs,
    };
  }
}
