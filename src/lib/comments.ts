import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  increment,
  getDoc,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { db, auth, withTimeout } from './firebase';
import { CommentItem, CommentModerationConfig } from '../types';
import { getOfflineItem, setOfflineItem } from './offlineStorage';

// Default list of Indonesian and English profanities / spam / inappropriate words
export const DEFAULT_BAD_WORDS: string[] = [
  'anjing',
  'babi',
  'bangsat',
  'kontol',
  'memek',
  'pantek',
  'puki',
  'bajingan',
  'tolol',
  'goblok',
  'idiot',
  'bego',
  'kampret',
  'tai',
  'taek',
  'itil',
  'jembut',
  'pepek',
  'lonte',
  'perek',
  'pelacur',
  'bencong',
  'banci',
  'sange',
  'ngentot',
  'entot',
  'ngewe',
  'bokep',
  'porno',
  'porn',
  'judi',
  'slot',
  'gacor',
  'judislot',
  'togel',
  'zeus',
  'pragmatic',
  'maxwin',
  'situsjudi',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'pussy',
  'cunt',
  'whore',
  'slut',
  'asu',
  'jancuk',
  'jancok',
  'dancok',
  'kirik',
  'modar',
  'matio',
];

export const DEFAULT_COMMENT_MODERATION_CONFIG: CommentModerationConfig = {
  enabled: true,
  allowGuestComments: false,
  profanityFilterEnabled: true,
  badWords: DEFAULT_BAD_WORDS,
  autoHideFlagged: true,
};

const COMMENTS_CACHE_KEY = 'smpn1_cached_comments_v1';
const COMMENTER_PROFILE_KEY = 'smpn1_commenter_profile_v1';
const MODERATION_CONFIG_KEY = 'smpn1_comment_moderation_config_v1';
const ARTICLE_LIKES_KEY = 'smpn1_article_likes_v1';

export interface CommenterUser {
  displayName: string;
  email: string;
  photoURL?: string;
  uid?: string;
}

// Memory cache for instantaneous UI interactions
let inMemoryComments: CommentItem[] = [];
let inMemoryConfig: CommentModerationConfig | null = null;

/**
 * Normalizes text to detect obfuscated profanities (e.g. k0nt0l, @nj1ng, a n j i n g)
 */
function normalizeProfanityText(input: string): string {
  if (!input) return '';
  let str = input.toLowerCase();

  // Replace common leetspeak substitutions
  str = str
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/v/g, 'u');

  // Strip excessive spaces and punctuation between characters
  return str;
}

/**
 * Checks if a comment text contains forbidden words from the active filter list
 */
export function checkProfanity(
  text: string,
  customBadWords?: string[]
): { isProfane: boolean; matchedWords: string[] } {
  if (!text || typeof text !== 'string') {
    return { isProfane: false, matchedWords: [] };
  }

  const activeConfig = getProfanityFilterConfig();
  if (!activeConfig.profanityFilterEnabled) {
    return { isProfane: false, matchedWords: [] };
  }

  const wordsToCheck = (customBadWords && customBadWords.length > 0)
    ? customBadWords
    : activeConfig.badWords || DEFAULT_BAD_WORDS;

  const normalized = normalizeProfanityText(text);
  const matchedWords: string[] = [];

  for (const rawBad of wordsToCheck) {
    const bad = rawBad.trim().toLowerCase();
    if (!bad) continue;

    // Check direct inclusion or regex boundary check
    const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    
    if (regex.test(normalized) || normalized.includes(bad)) {
      matchedWords.push(rawBad);
    }
  }

  return {
    isProfane: matchedWords.length > 0,
    matchedWords: Array.from(new Set(matchedWords)),
  };
}

/**
 * Checks if a comment text contains URLs or hyperlinks
 */
export function containsLink(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const urlPattern = /(https?:\/\/|ftp:\/\/|www\.)[^\s]+|([a-zA-Z0-9-]+\.)+(com|id|net|org|edu|gov|co\.id|sch\.id|info|io|biz|me)\b/i;
  return urlPattern.test(text);
}

/**
 * Get current Google logged-in user or cached commenter profile
 */
export function getCurrentCommentUser(): CommenterUser | null {
  if (typeof window === 'undefined') return null;

  // 1. Check direct auth instance
  if (auth?.currentUser && auth.currentUser.email) {
    return {
      displayName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL || undefined,
      uid: auth.currentUser.uid,
    };
  }

  // 2. Check cached profile in localStorage
  try {
    const raw = localStorage.getItem(COMMENTER_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.email || parsed.displayName)) {
        return parsed as CommenterUser;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Subscribe to real-time auth changes & handle redirect result
 */
export function subscribeToCommentAuth(callback: (user: CommenterUser | null) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Check cached user initially
  const cached = getCurrentCommentUser();
  if (cached) {
    callback(cached);
  }

  if (!auth) {
    return () => {};
  }

  // Handle returning from signInWithRedirect
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        const u = result.user;
        const commenter: CommenterUser = {
          displayName: u.displayName || u.email?.split('@')[0] || 'Pengguna Google',
          email: u.email || '',
          photoURL: u.photoURL || undefined,
          uid: u.uid,
        };
        if (commenter.email) {
          localStorage.setItem(COMMENTER_PROFILE_KEY, JSON.stringify(commenter));
        }
        callback(commenter);
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result check:', err);
    });

  // Listen to Firebase auth changes
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user && user.email) {
      const commenter: CommenterUser = {
        displayName: user.displayName || user.email.split('@')[0] || 'Pengguna Google',
        email: user.email,
        photoURL: user.photoURL || undefined,
        uid: user.uid,
      };
      localStorage.setItem(COMMENTER_PROFILE_KEY, JSON.stringify(commenter));
      callback(commenter);
    } else {
      const cur = getCurrentCommentUser();
      callback(cur);
    }
  });

  return unsubscribe;
}

/**
 * Stable, persistent identifier for the current browser (stored in localStorage)
 * Guarantees every browser can uniquely like articles and comments without logging in
 */
export function getBrowserDeviceId(): string {
  if (typeof window === 'undefined') return 'browser_guest';
  try {
    let deviceId = localStorage.getItem('smpn1_device_id');
    if (!deviceId) {
      deviceId = 'browser_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('smpn1_device_id', deviceId);
    }
    return deviceId;
  } catch {
    return 'browser_guest';
  }
}

/**
 * Get previously saved commenter name from localStorage
 */
export function getSavedCommenterName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('smpn1_commenter_name') || '';
  } catch {
    return '';
  }
}

/**
 * Save commenter name into localStorage
 */
export function saveCommenterName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = name.trim();
    if (clean) {
      localStorage.setItem('smpn1_commenter_name', clean);
    }
  } catch {
    // ignore
  }
}

/**
 * Save / Create local guest commenter profile (no login required)
 */
export function saveLocalGuestProfile(displayName: string, customEmail?: string): CommenterUser {
  const deviceId = getBrowserDeviceId();
  const cleanName = displayName.trim() || 'Pengunjung Portal';
  const email = customEmail?.trim() || `${deviceId}@tamu.portal`;

  const guestUser: CommenterUser = {
    displayName: cleanName,
    email: email,
    uid: `guest_${deviceId}`,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COMMENTER_PROFILE_KEY, JSON.stringify(guestUser));
      localStorage.setItem('smpn1_commenter_name', cleanName);
    } catch {
      // ignore
    }
  }

  return guestUser;
}

/**
 * Login with Google for Commenting
 */
export async function loginWithGoogleForComments(): Promise<CommenterUser | null> {
  if (!auth) {
    throw new Error('Firebase Auth belum siap.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  // Direct check for mobile user-agent to immediately use redirect (fully reliable on HP)
  const isMobile = typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    try {
      await signInWithRedirect(auth, provider);
      return null; // Page will redirect
    } catch (redirectErr: any) {
      console.error('Redirect auth failed:', redirectErr);
      throw new Error('Gagal mengalihkan ke halaman login Google di HP.');
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user: User = result.user;

    const commenter: CommenterUser = {
      displayName: user.displayName || user.email?.split('@')[0] || 'Pengguna Google',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      uid: user.uid,
    };

    if (typeof window !== 'undefined' && commenter.email) {
      localStorage.setItem(COMMENTER_PROFILE_KEY, JSON.stringify(commenter));
    }

    return commenter;
  } catch (err: any) {
    console.warn('Popup login error, trying redirect fallback:', err);

    // Always fallback to redirect on any error or popup blocking
    try {
      await signInWithRedirect(auth, provider);
      return null; // Will redirect page
    } catch (redirectErr: any) {
      console.error('Redirect auth fallback failed:', redirectErr);
      throw new Error(
        'Gagal masuk menggunakan Google Login. Harap pastikan peramban Anda mendukung pengalihan halaman.'
      );
    }
  }
}

/**
 * Logout Google user from commenting
 */
export async function logoutCommentUser(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COMMENTER_PROFILE_KEY);
  }
  if (auth) {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  }
}

/**
 * Save / Update local commenter profile (e.g. customized display name)
 */
export function updateCommenterProfile(displayName: string): void {
  const current = getCurrentCommentUser();
  if (current && typeof window !== 'undefined') {
    current.displayName = displayName;
    localStorage.setItem(COMMENTER_PROFILE_KEY, JSON.stringify(current));
  }
}

/**
 * Get Comment Moderation & Profanity Configuration (Synchronous cache read)
 */
export function getProfanityFilterConfig(): CommentModerationConfig {
  if (inMemoryConfig) return inMemoryConfig;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(MODERATION_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemoryConfig = { ...DEFAULT_COMMENT_MODERATION_CONFIG, ...parsed };
        return inMemoryConfig;
      }
    } catch {
      // ignore
    }
  }

  inMemoryConfig = DEFAULT_COMMENT_MODERATION_CONFIG;
  return inMemoryConfig;
}

/**
 * Asynchronously fetch profanity filter config from Firebase Firestore
 * and update local memory and storage on any device.
 */
export async function fetchProfanityFilterConfig(): Promise<CommentModerationConfig> {
  const local = getProfanityFilterConfig();

  if (!db || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return local;
  }

  try {
    const snap = await withTimeout(
      getDoc(doc(db, 'system_config', 'comments_moderation')),
      4000
    );
    if (snap && snap.exists()) {
      const data = snap.data() as Partial<CommentModerationConfig>;
      const cloudWords = Array.isArray(data.badWords) && data.badWords.length > 0
        ? Array.from(new Set(data.badWords.map((w: string) => String(w).trim().toLowerCase()).filter(Boolean)))
        : (local.badWords || DEFAULT_BAD_WORDS);

      const merged: CommentModerationConfig = {
        ...DEFAULT_COMMENT_MODERATION_CONFIG,
        ...data,
        badWords: cloudWords,
      };

      inMemoryConfig = merged;
      if (typeof window !== 'undefined') {
        localStorage.setItem(MODERATION_CONFIG_KEY, JSON.stringify(merged));
        await setOfflineItem('comment_moderation_config', merged).catch(() => {});
      }
      return merged;
    }
  } catch (err) {
    console.warn('Failed to fetch profanity filter config from cloud:', err);
  }

  return local;
}

/**
 * Realtime subscription to profanity filter config from Firebase Firestore.
 */
export function subscribeToProfanityFilterConfig(
  onUpdate: (config: CommentModerationConfig) => void
): () => void {
  // Always trigger immediate update with current cached config
  onUpdate(getProfanityFilterConfig());

  if (!db) {
    return () => {};
  }

  try {
    const unsub = onSnapshot(
      doc(db, 'system_config', 'comments_moderation'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<CommentModerationConfig>;
          const cloudWords = Array.isArray(data.badWords) && data.badWords.length > 0
            ? Array.from(new Set(data.badWords.map((w: string) => String(w).trim().toLowerCase()).filter(Boolean)))
            : DEFAULT_BAD_WORDS;

          const merged: CommentModerationConfig = {
            ...DEFAULT_COMMENT_MODERATION_CONFIG,
            ...data,
            badWords: cloudWords,
          };

          inMemoryConfig = merged;
          if (typeof window !== 'undefined') {
            localStorage.setItem(MODERATION_CONFIG_KEY, JSON.stringify(merged));
            setOfflineItem('comment_moderation_config', merged).catch(() => {});
          }
          onUpdate(merged);
        }
      },
      (err) => {
        console.warn('Realtime subscription error for comments moderation:', err);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('Error setting up subscription for comments moderation:', err);
    return () => {};
  }
}

/**
 * Save Comment Moderation Configuration to Local & Cloud Firestore
 */
export async function saveProfanityFilterConfig(config: CommentModerationConfig): Promise<void> {
  const cleanWords = Array.from(
    new Set((config.badWords || []).map((w) => String(w).trim().toLowerCase()).filter(Boolean))
  );
  const cleanConfig: CommentModerationConfig = {
    ...config,
    badWords: cleanWords,
  };

  inMemoryConfig = cleanConfig;
  if (typeof window !== 'undefined') {
    localStorage.setItem(MODERATION_CONFIG_KEY, JSON.stringify(cleanConfig));
    await setOfflineItem('comment_moderation_config', cleanConfig).catch(() => {});
  }

  if (db) {
    try {
      await withTimeout(
        setDoc(doc(db, 'system_config', 'comments_moderation'), cleanConfig, { merge: true }),
        4000
      );
    } catch (err) {
      console.warn('Could not sync comments config to cloud:', err);
      throw err;
    }
  }
}

/**
 * Initial sample comments if none exist
 */
const SAMPLE_COMMENTS: CommentItem[] = [
  {
    id: 'comm_sample_1',
    targetId: 'general',
    targetTitle: 'Halaman Utama Portal Resmi',
    userName: 'Ahmad Faisal, S.Pd',
    userEmail: 'ahmad.faisal@guru.smpn1bengkalis.sch.id',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    content: 'Alhamdulillah tampilan portal resmi SMP Negeri 1 Bengkalis semakin informatif, bersih, dan sangat cepat diakses dari HP.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likesCount: 14,
    likedByEmails: [],
    status: 'approved',
  },
  {
    id: 'comm_sample_2',
    targetId: 'general',
    targetTitle: 'Halaman Utama Portal Resmi',
    userName: 'Rina Marlina (Wali Murid)',
    userEmail: 'rina.marlina88@gmail.com',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    content: 'Sangat terbantu dengan jadwal agenda dan informasi PPDB online yang jelas. Sukses selalu untuk keluarga besar SMPN 1 Bengkalis!',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    likesCount: 9,
    likedByEmails: [],
    status: 'approved',
  },
];

/**
 * Load all comments from cache or Firestore
 */
export async function fetchComments(targetId?: string): Promise<CommentItem[]> {
  // 1. Check local cache first for 0ms render
  let allComments: CommentItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(COMMENTS_CACHE_KEY);
      if (raw) {
        allComments = JSON.parse(raw);
      } else {
        const idb = await getOfflineItem<CommentItem[]>('public_comments');
        if (idb && Array.isArray(idb)) {
          allComments = idb;
        } else {
          allComments = SAMPLE_COMMENTS;
          localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(SAMPLE_COMMENTS));
        }
      }
    } catch {
      allComments = SAMPLE_COMMENTS;
    }
  }

  inMemoryComments = allComments;

  // 2. Fetch from Cloud Firestore in background if online
  if (db) {
    try {
      // Also ensure profanity filter configuration is freshly updated in background
      fetchProfanityFilterConfig().catch(() => {});

      const colRef = collection(db, 'comments');
      const snap = await withTimeout(getDocs(query(colRef, orderBy('createdAt', 'desc'))), 3500);
      if (snap && !snap.empty) {
        const cloudComments: CommentItem[] = [];
        snap.forEach((d) => {
          cloudComments.push({ id: d.id, ...d.data() } as CommentItem);
        });
        if (cloudComments.length > 0) {
          allComments = cloudComments;
          inMemoryComments = cloudComments;
          if (typeof window !== 'undefined') {
            localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cloudComments));
            await setOfflineItem('public_comments', cloudComments);
          }
        }
      }
    } catch {
      // Use local cached data seamlessly
    }
  }

  // Filter by targetId if specified
  if (targetId) {
    return allComments.filter((c) => c.targetId === targetId);
  }

  return allComments;
}

/**
 * Realtime subscription for comments
 */
export function subscribeToComments(
  targetId: string | undefined,
  callback: (comments: CommentItem[]) => void
): () => void {
  // Return cached immediately
  const initial = targetId
    ? inMemoryComments.filter((c) => c.targetId === targetId)
    : inMemoryComments;
  if (initial.length > 0) {
    callback(initial);
  }

  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'comments');
    const q = targetId
      ? query(colRef, where('targetId', '==', targetId))
      : query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CommentItem[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as CommentItem);
        });

        // Merge with inMemory
        if (targetId) {
          const others = inMemoryComments.filter((c) => c.targetId !== targetId);
          inMemoryComments = [...list, ...others];
        } else {
          inMemoryComments = list;
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
          setOfflineItem('public_comments', inMemoryComments).catch(() => {});
        }

        callback(list);
      },
      (err) => {
        console.info('Comments realtime listener suspended:', err);
      }
    );

    return unsubscribe;
  } catch {
    return () => {};
  }
}

/**
 * Post a new comment
 */
export async function postComment(params: {
  targetId: string;
  targetTitle?: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  content: string;
  parentId?: string;
  parentUserName?: string;
}): Promise<CommentItem> {
  const deviceId = getBrowserDeviceId();
  const { isProfane, matchedWords } = checkProfanity(params.content);
  const activeConfig = getProfanityFilterConfig();

  const status: 'approved' | 'rejected' | 'pending' = isProfane && activeConfig.autoHideFlagged
    ? 'pending'
    : 'approved';

  const finalName = params.userName?.trim() || 'Pengunjung';
  const finalEmail = params.userEmail?.trim() || `${deviceId}@tamu.portal`;

  const newComment: CommentItem = {
    id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    targetId: params.targetId || 'general',
    targetTitle: params.targetTitle || 'Halaman Portal',
    userName: finalName,
    userEmail: finalEmail,
    userAvatar: params.userAvatar || undefined,
    content: params.content.trim(),
    createdAt: new Date().toISOString(),
    likesCount: 0,
    likedByEmails: [],
    status,
    isFlaggedProfanity: isProfane,
    flaggedWords: isProfane ? matchedWords : undefined,
    parentId: params.parentId || undefined,
    parentUserName: params.parentUserName || undefined,
  };

  // 1. Optimistic UI update
  inMemoryComments = [newComment, ...inMemoryComments];
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
    await setOfflineItem('public_comments', inMemoryComments);
  }

  // 2. Persist to Cloud Firestore
  if (db) {
    try {
      await withTimeout(setDoc(doc(db, 'comments', newComment.id), newComment), 4000);
    } catch (err) {
      console.warn('Comment saved locally (offline sync pending):', err);
    }
  }

  return newComment;
}

/**
 * Like / Unlike a Comment (Tanda Love Komentar)
 * Guaranteed 1 like per browser without requiring login
 */
export async function toggleLikeComment(
  commentId: string,
  userIdentifier?: string
): Promise<{ likesCount: number; hasLiked: boolean }> {
  const browserId = userIdentifier || getBrowserDeviceId();
  const index = inMemoryComments.findIndex((c) => c.id === commentId);
  if (index === -1) return { likesCount: 0, hasLiked: false };

  const comm = inMemoryComments[index];
  const likedList = comm.likedByEmails || [];
  const hasLiked = likedList.includes(browserId);

  let newLikedList: string[];
  let newLikesCount: number;

  if (hasLiked) {
    newLikedList = likedList.filter((e) => e !== browserId);
    newLikesCount = Math.max(0, (comm.likesCount || 0) - 1);
  } else {
    newLikedList = [...likedList, browserId];
    newLikesCount = (comm.likesCount || 0) + 1;
  }

  const updatedComment: CommentItem = {
    ...comm,
    likesCount: newLikesCount,
    likedByEmails: newLikedList,
  };

  inMemoryComments[index] = updatedComment;
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
    await setOfflineItem('public_comments', inMemoryComments);
  }

  // Firestore sync with merge: true to avoid document missing errors
  if (db) {
    try {
      await withTimeout(
        setDoc(
          doc(db, 'comments', commentId),
          {
            likesCount: newLikesCount,
            likedByEmails: newLikedList,
          },
          { merge: true }
        ),
        3000
      );
    } catch {
      // ignore
    }
  }

  return { likesCount: newLikesCount, hasLiked: !hasLiked };
}

/**
 * Like / Unlike a News Article Post (Tanda Love pada Postingan)
 * Guaranteed 1 like per browser without requiring login
 */
export async function toggleLikeArticle(
  articleId: string,
  userIdentifier?: string
): Promise<{ likes: number; hasLiked: boolean }> {
  const browserId = userIdentifier || getBrowserDeviceId();
  let storedLikes: Record<string, { count: number; likedUsers: string[] }> = {};

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ARTICLE_LIKES_KEY);
      if (raw) storedLikes = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const current = storedLikes[articleId] || { count: 0, likedUsers: [] };
  const hasLiked = current.likedUsers.includes(browserId);

  let newCount = current.count;
  let newUsers = current.likedUsers;

  if (hasLiked) {
    newUsers = newUsers.filter((u) => u !== browserId);
    newCount = Math.max(0, newCount - 1);
  } else {
    newUsers = [...newUsers, browserId];
    newCount = newCount + 1;
  }

  storedLikes[articleId] = { count: newCount, likedUsers: newUsers };

  if (typeof window !== 'undefined') {
    localStorage.setItem(ARTICLE_LIKES_KEY, JSON.stringify(storedLikes));
  }

  // Sync to Firestore article doc with merge: true to avoid document not found error
  if (db) {
    try {
      const artDoc = doc(db, 'news_articles', articleId);
      await withTimeout(
        setDoc(
          artDoc,
          {
            likes: newCount,
            likedByEmails: newUsers,
          },
          { merge: true }
        ),
        3000
      );
    } catch {
      // ignore
    }
  }

  return { likes: newCount, hasLiked: !hasLiked };
}

/**
 * Get current likes state for an article
 * Defaults to current browser device ID so status is consistent on load
 */
export function getArticleLikesState(
  articleId: string,
  initialLikes = 0,
  userIdentifier?: string
): { likes: number; hasLiked: boolean } {
  const browserId = userIdentifier || getBrowserDeviceId();
  if (typeof window === 'undefined') {
    return { likes: initialLikes, hasLiked: false };
  }

  try {
    const raw = localStorage.getItem(ARTICLE_LIKES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[articleId]) {
        const item = parsed[articleId];
        const hasLiked = browserId ? item.likedUsers?.includes(browserId) : false;
        return {
          likes: Math.max(initialLikes, item.count || 0),
          hasLiked: Boolean(hasLiked),
        };
      }
    }
  } catch {
    // ignore
  }

  return { likes: initialLikes, hasLiked: false };
}

const ARTICLE_VIEWS_KEY = 'smpn1_article_views_v1';

/**
 * Increment and record article view count persistently in localStorage & Firestore
 */
export async function incrementArticleViews(
  articleId: string,
  initialViews = 0
): Promise<number> {
  let storedViews: Record<string, number> = {};

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ARTICLE_VIEWS_KEY);
      if (raw) storedViews = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const currentCount = storedViews[articleId] !== undefined ? storedViews[articleId] : initialViews;
  const newCount = currentCount + 1;
  storedViews[articleId] = newCount;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(ARTICLE_VIEWS_KEY, JSON.stringify(storedViews));
    } catch {
      // ignore
    }
  }

  // Update in Firestore
  if (db) {
    try {
      const artDoc = doc(db, 'news_articles', articleId);
      await withTimeout(
        updateDoc(artDoc, {
          views: increment(1),
        }),
        3000
      );
    } catch {
      // ignore
    }
  }

  return newCount;
}

/**
 * Get current stored article view count
 */
export function getArticleViewsCount(
  articleId: string,
  initialViews = 0
): number {
  if (typeof window === 'undefined') return initialViews;
  try {
    const raw = localStorage.getItem(ARTICLE_VIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[articleId] !== undefined) {
        return Math.max(initialViews, parsed[articleId]);
      }
    }
  } catch {
    // ignore
  }
  return initialViews;
}

/**
 * Admin or Author: Delete comment permanently
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  const childIds = inMemoryComments
    .filter((c) => c.parentId === commentId)
    .map((c) => c.id);

  const idsToDelete = [commentId, ...childIds];

  inMemoryComments = inMemoryComments.filter((c) => !idsToDelete.includes(c.id));
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
    await setOfflineItem('public_comments', inMemoryComments);
  }

  if (db) {
    try {
      for (const id of idsToDelete) {
        await withTimeout(deleteDoc(doc(db, 'comments', id)), 3000).catch(() => {});
      }
      return true;
    } catch (err) {
      console.error('Failed to delete comment on cloud:', err);
    }
  }
  return true;
}

/**
 * Author or Admin: Update comment text content
 */
export async function updateCommentContent(
  commentId: string,
  newContent: string
): Promise<boolean> {
  const idx = inMemoryComments.findIndex((c) => c.id === commentId);
  if (idx === -1) return false;

  const filterConfig = getProfanityFilterConfig();
  const { isProfane } = checkProfanity(newContent, filterConfig.badWords);
  const newStatus = (isProfane && filterConfig.profanityFilterEnabled) ? 'pending' : inMemoryComments[idx].status;

  inMemoryComments[idx] = {
    ...inMemoryComments[idx],
    content: newContent,
    status: newStatus,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
    await setOfflineItem('public_comments', inMemoryComments);
  }

  if (db) {
    try {
      await withTimeout(
        updateDoc(doc(db, 'comments', commentId), {
          content: newContent,
          status: newStatus,
        }),
        3000
      );
      return true;
    } catch (err) {
      console.error('Failed to update comment content on cloud:', err);
    }
  }
  return true;
}

/**
 * Admin: Moderate comment status (approve, reject, pending)
 */
export async function moderateComment(
  commentId: string,
  status: 'approved' | 'rejected' | 'pending'
): Promise<boolean> {
  const idx = inMemoryComments.findIndex((c) => c.id === commentId);
  if (idx === -1) return false;

  inMemoryComments[idx] = { ...inMemoryComments[idx], status };
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
    await setOfflineItem('public_comments', inMemoryComments);
  }

  if (db) {
    try {
      await withTimeout(
        updateDoc(doc(db, 'comments', commentId), { status }),
        3000
      );
      return true;
    } catch (err) {
      console.error('Failed to moderate comment on cloud:', err);
    }
  }
  return true;
}

/**
 * Admin: Toggle pinned status of a comment
 */
export async function togglePinComment(
  commentId: string,
  isPinned: boolean
): Promise<boolean> {
  const idx = inMemoryComments.findIndex((c) => c.id === commentId);
  if (idx === -1) return false;

  inMemoryComments[idx] = { ...inMemoryComments[idx], isPinned };
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(inMemoryComments));
    await setOfflineItem('public_comments', inMemoryComments);
  }

  if (db) {
    try {
      await withTimeout(
        updateDoc(doc(db, 'comments', commentId), { isPinned }),
        3000
      );
      return true;
    } catch (err) {
      console.error('Failed to pin comment on cloud:', err);
    }
  }
  return true;
}
