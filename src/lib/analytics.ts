import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const ANALYTICS_DOC_REF = 'analytics/visitors';
const ACTIVE_SESSIONS_COLLECTION = 'active_sessions';
const LOCAL_TOTAL_VISITS_KEY = 'real_total_visits_v1';

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('real_visitor_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('real_visitor_session_id', id);
    }
    return id;
  } catch {
    return 'sess_' + Math.random().toString(36).substring(2, 11);
  }
}

/**
 * Initialize real-time visitor count and online user session tracking synced via Firebase Firestore
 */
export function initRealtimeVisitorCounter(
  onUpdate: (stats: { totalVisits: number; onlineUsers: number }) => void
): () => void {
  const sessionId = getSessionId();
  let unsubVisitorSnapshot: (() => void) | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let pollOnlineInterval: ReturnType<typeof setInterval> | null = null;

  let currentTotalVisits = 15420;
  let currentOnlineUsers = 1;

  // Read local storage cache if available
  try {
    const cachedTotal = localStorage.getItem(LOCAL_TOTAL_VISITS_KEY);
    if (cachedTotal) {
      currentTotalVisits = Math.max(15420, parseInt(cachedTotal, 10));
    }
  } catch {
    // ignore
  }

  const notify = () => {
    onUpdate({
      totalVisits: currentTotalVisits,
      onlineUsers: currentOnlineUsers,
    });
  };

  // Immediate initial notification
  notify();

  if (!db) {
    return () => {};
  }

  const firestoreDb = db;
  const analyticsRef = doc(firestoreDb, ANALYTICS_DOC_REF);
  const sessionRef = doc(firestoreDb, ACTIVE_SESSIONS_COLLECTION, sessionId);

  // 1. Increment total visits ONCE per browser session in Firebase
  const incrementSessionKey = 'real_visit_incremented_' + sessionId;
  if (!sessionStorage.getItem(incrementSessionKey)) {
    sessionStorage.setItem(incrementSessionKey, '1');

    getDoc(analyticsRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return setDoc(analyticsRef, { totalVisits: 15421 });
        } else {
          return updateDoc(analyticsRef, { totalVisits: increment(1) });
        }
      })
      .catch(() => {
        currentTotalVisits += 1;
        localStorage.setItem(LOCAL_TOTAL_VISITS_KEY, String(currentTotalVisits));
        notify();
      });
  }

  // 2. Listen to real-time updates for total visitors from Firestore
  try {
    unsubVisitorSnapshot = onSnapshot(
      analyticsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (typeof data.totalVisits === 'number') {
            currentTotalVisits = data.totalVisits;
            localStorage.setItem(LOCAL_TOTAL_VISITS_KEY, String(currentTotalVisits));
            notify();
          }
        }
      },
      () => {
        // Error fallback silently
      }
    );
  } catch {
    // ignore
  }

  // 3. Heartbeat for active online session
  const sendHeartbeat = () => {
    setDoc(
      sessionRef,
      {
        lastActive: Date.now(),
        sessionId,
      },
      { merge: true }
    ).catch(() => {});
  };

  sendHeartbeat();
  heartbeatInterval = setInterval(sendHeartbeat, 15000); // 15 seconds heartbeat

  // 4. Calculate active online users (active within last 40 seconds)
  const sessionsCol = collection(firestoreDb, ACTIVE_SESSIONS_COLLECTION);

  const updateOnlineCount = async () => {
    try {
      const activeThreshold = Date.now() - 40000;
      const q = query(sessionsCol, where('lastActive', '>=', activeThreshold));
      const snap = await getDocs(q);
      currentOnlineUsers = Math.max(1, snap.size);
      notify();
    } catch {
      // ignore
    }
  };

  updateOnlineCount();
  pollOnlineInterval = setInterval(updateOnlineCount, 10000); // Check every 10s

  const handleUnload = () => {
    deleteDoc(sessionRef).catch(() => {});
  };
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    if (unsubVisitorSnapshot) unsubVisitorSnapshot();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (pollOnlineInterval) clearInterval(pollOnlineInterval);
    window.removeEventListener('beforeunload', handleUnload);
    deleteDoc(sessionRef).catch(() => {});
  };
}
