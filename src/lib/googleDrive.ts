import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';

const FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0999699449',
  appId: '1:319360539506:web:894f0f9c3612848f8a9beb',
  apiKey: 'AIzaSyCOZgLPjDQ61WyWptoYS1tVH_zZLsNVeFQ',
  authDomain: 'gen-lang-client-0999699449.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-e8590637-9651-4312-9d0c-eb416143de72',
  storageBucket: 'gen-lang-client-0999699449.firebasestorage.app',
  messagingSenderId: '319360539506',
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(FIREBASE_CONFIG);
} else {
  app = getApp();
}

export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token in memory (never in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Tidak berhasil mendapatkan token akses Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Sign in Google Drive error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Find or create dedicated folder in Google Drive for website assets
 */
async function getOrCreateSchoolFolder(token: string): Promise<string | null> {
  const folderName = '[SMPN 1 Bengkalis] Web Assets';
  try {
    const q = encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
    );
    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.files && listData.files.length > 0) {
        return listData.files[0].id;
      }
    }

    // Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Folder penyimpanan otomatis foto website SMP Negeri 1 Bengkalis',
      }),
    });

    if (createRes.ok) {
      const createData = await createRes.json();
      if (createData.id) {
        // Set folder public reader
        await fetch(`https://www.googleapis.com/drive/v3/files/${createData.id}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }).catch(() => {});

        return createData.id;
      }
    }
  } catch (err) {
    console.warn('Folder check skipped, uploading to root Drive folder:', err);
  }
  return null;
}

export interface DriveUploadResult {
  fileId: string;
  cdnUrl: string;
  directUrl: string;
  fileName: string;
  size: number;
}

/**
 * Upload image file directly to Google Drive and configure public CDN access
 */
export async function uploadImageToDrive(
  file: File | Blob,
  fileName: string,
  onStatusUpdate?: (status: string) => void
): Promise<DriveUploadResult> {
  let token = cachedAccessToken;
  if (!token) {
    if (onStatusUpdate) onStatusUpdate('Menghubungkan ke Google Drive...');
    const authResult = await signInWithGoogleDrive();
    if (!authResult) {
      throw new Error('Otentikasi Google Drive dibatalkan.');
    }
    token = authResult.accessToken;
  }

  if (onStatusUpdate) onStatusUpdate('Menyiapkan folder penyimpanan di Google Drive...');
  const folderId = await getOrCreateSchoolFolder(token);

  if (onStatusUpdate) onStatusUpdate('Mengunggah gambar ke Google Drive...');

  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const metadata = {
    name: cleanFileName,
    mimeType: file.type || 'image/jpeg',
    description: 'Diunggah melalui Admin CMS SMP Negeri 1 Bengkalis',
    parents: folderId ? [folderId] : undefined,
  };

  const boundary = 'SMPN1_BENGKALIS_DRIVE_UPLOAD_' + Date.now();
  const fileArrayBuffer = await file.arrayBuffer();

  const metadataHeader = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;
  const fileHeader = `--${boundary}\r\nContent-Type: ${file.type || 'image/jpeg'}\r\n\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = new Blob(
    [metadataHeader, fileHeader, fileArrayBuffer, closeDelimiter],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    const errorBody = await uploadRes.text();
    throw new Error(`Gagal mengunggah ke Google Drive (${uploadRes.status}): ${errorBody}`);
  }

  const uploadData = await uploadRes.json();
  const fileId = uploadData.id;

  if (onStatusUpdate) onStatusUpdate('Mengatur izin tayang publik otomatis...');

  // Set file permission to anyone with link (reader)
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Set permission warning:', permErr);
  }

  // Fast direct CDN URL format for Google Drive files
  const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

  if (onStatusUpdate) onStatusUpdate('Selesai! Gambar siap tayang.');

  return {
    fileId,
    cdnUrl,
    directUrl,
    fileName: uploadData.name || fileName,
    size: Number(uploadData.size) || file.size,
  };
}
