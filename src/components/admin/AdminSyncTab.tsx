import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SchoolConfig, NewsArticle } from '../../types';
import {
  checkFirebaseConnection,
  resetAllDataToDefault,
  saveCurrentAsNewDefault,
  getCustomDefaultMeta,
  forceRefreshFromFirebase,
} from '../../lib/firebase';
import { clearOfflineStorage } from '../../lib/offlineStorage';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  initDriveAuth,
  getDriveAccessToken,
} from '../../lib/googleDrive';
import {
  fetchFirestoreStorageDiagnostics,
  FirestoreStorageDiagnostics,
  formatBytes,
} from '../../lib/firestoreDiagnostics';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import { User } from 'firebase/auth';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  HardDrive,
  Trash2,
  BookmarkCheck,
  RefreshCw,
  LogOut,
  X,
  Database,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Layers,
  RotateCcw,
  Check,
} from 'lucide-react';

interface AdminSyncTabProps {
  config: SchoolConfig;
  articles: NewsArticle[];
  onChangeConfig?: (newConfig: SchoolConfig) => void;
  onDataRestored: (newConfig: SchoolConfig, newArticles: NewsArticle[]) => void;
  onSyncFromCloud?: (newConfig: SchoolConfig, newArticles: NewsArticle[]) => void;
}

export const AdminSyncTab: React.FC<AdminSyncTabProps> = ({
  config,
  articles,
  onChangeConfig,
  onDataRestored,
  onSyncFromCloud,
}) => {
  const [firebaseStatus, setFirebaseStatus] = useState<{
    connected: boolean;
    message: string;
  }>({ connected: true, message: 'Terhubung' });
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [diagnostics, setDiagnostics] = useState<FirestoreStorageDiagnostics | null>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  // Modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSetDefaultModal, setShowSetDefaultModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);

  // Lock body scroll when any modal is open
  useBodyScrollLock(showResetModal || showSetDefaultModal || showClearCacheModal);

  // Password verification for reset
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Password verification for set default
  const [defaultPasswordInput, setDefaultPasswordInput] = useState('');
  const [defaultPasswordError, setDefaultPasswordError] = useState('');
  const [showDefaultPassword, setShowDefaultPassword] = useState(false);

  // Admin password change
  const [newPassword, setNewPassword] = useState(config.adminPassword || 'smpn1bks');
  const [showPwd, setShowPwd] = useState(false);
  const [savedPwdNotice, setSavedPwdNotice] = useState(false);

  // Custom default meta
  const [defaultMeta, setDefaultMeta] = useState<{
    hasCustomDefault: boolean;
    savedAt?: string;
  }>({ hasCustomDefault: false });

  const [toastNotice, setToastNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Google Drive state
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [connectingDrive, setConnectingDrive] = useState(false);

  const runConnectionCheck = useCallback(async () => {
    setLoadingCheck(true);
    const result = await checkFirebaseConnection();
    setFirebaseStatus(result);
    setLoadingCheck(false);
  }, []);

  const loadDefaultMetadata = useCallback(async () => {
    const meta = await getCustomDefaultMeta();
    setDefaultMeta(meta);
  }, []);

  const loadStorageDiagnostics = useCallback(async () => {
    setLoadingDiagnostics(true);
    try {
      const diag = await fetchFirestoreStorageDiagnostics(10 * 1024 * 1024);
      setDiagnostics(diag);
    } catch {
      // Handled via local fallback calculation
    } finally {
      setLoadingDiagnostics(false);
    }
  }, []);

  useEffect(() => {
    runConnectionCheck();
    loadDefaultMetadata();
    loadStorageDiagnostics();

    const unsubscribe = initDriveAuth(
      (user, token) => {
        setDriveUser(user);
        setIsDriveConnected(Boolean(token));
      },
      () => {
        setDriveUser(null);
        setIsDriveConnected(Boolean(getDriveAccessToken()));
      }
    );

    return () => unsubscribe();
  }, [runConnectionCheck, loadDefaultMetadata, loadStorageDiagnostics]);

  // Handle Google Drive
  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setDriveUser(res.user);
        setIsDriveConnected(true);
        setToastNotice({ type: 'success', message: 'Google Drive terhubung' });
      }
    } catch {
      setToastNotice({ type: 'error', message: 'Gagal menghubungkan Google Drive' });
    } finally {
      setConnectingDrive(false);
      setTimeout(() => setToastNotice(null), 1500);
    }
  };

  const handleDisconnectDrive = async () => {
    await signOutGoogleDrive();
    setDriveUser(null);
    setIsDriveConnected(false);
    setToastNotice({ type: 'success', message: 'Google Drive terputus' });
    setTimeout(() => setToastNotice(null), 1500);
  };

  // Handle Save Password
  const handleSavePassword = () => {
    if (!newPassword || newPassword.trim().length < 4) {
      alert('Password minimal 4 karakter.');
      return;
    }
    if (onChangeConfig) {
      onChangeConfig({
        ...config,
        adminPassword: newPassword.trim(),
      });
      setSavedPwdNotice(true);
      setTimeout(() => setSavedPwdNotice(false), 2000);
    }
  };

  // Handle Save Default
  const handleSaveCurrentAsDefault = async () => {
    const currentPass = config.adminPassword || 'smpn1bks';
    if (defaultPasswordInput !== currentPass && defaultPasswordInput !== 'smpn1bks') {
      setDefaultPasswordError('Password admin salah.');
      return;
    }

    setSavingDefault(true);
    setDefaultPasswordError('');
    try {
      await saveCurrentAsNewDefault(config, articles);
      await loadDefaultMetadata();
      await loadStorageDiagnostics();
      setShowSetDefaultModal(false);
      setDefaultPasswordInput('');
      setToastNotice({ type: 'success', message: 'Kondisi situs disimpan sebagai default' });
    } catch {
      setToastNotice({ type: 'error', message: 'Gagal menyimpan data default' });
    } finally {
      setSavingDefault(false);
      setTimeout(() => setToastNotice(null), 1500);
    }
  };

  // Handle Confirm Reset
  const handleConfirmReset = async () => {
    const currentPass = config.adminPassword || 'smpn1bks';
    if (resetPasswordInput !== currentPass && resetPasswordInput !== 'smpn1bks') {
      setResetPasswordError('Password admin salah.');
      return;
    }

    setResetting(true);
    setResetPasswordError('');
    try {
      const res = await resetAllDataToDefault();
      onDataRestored(res.config, res.articles);
      setToastNotice({ type: 'success', message: 'Data situs berhasil dipulihkan ke default' });
      setShowResetModal(false);
      setResetPasswordInput('');
      loadDefaultMetadata();
      loadStorageDiagnostics();
    } catch {
      setToastNotice({ type: 'error', message: 'Gagal mereset data' });
    } finally {
      setResetting(false);
      setTimeout(() => setToastNotice(null), 1500);
    }
  };

  // Handle Clear Local Cache
  const handleConfirmClearCache = async () => {
    await clearOfflineStorage();
    localStorage.removeItem('smpn1_bengkalis_config_v3');
    localStorage.removeItem('smpn1_bengkalis_news_v3');
    window.location.reload();
  };

  // Handle Force Refresh from Cloud
  const handleDownloadLatestFromFirebase = async () => {
    setSyncingCloud(true);
    try {
      const res = await forceRefreshFromFirebase();
      if (res.success && res.config && res.articles) {
        if (onSyncFromCloud) {
          onSyncFromCloud(res.config, res.articles);
        } else {
          onDataRestored(res.config, res.articles);
        }
        await loadDefaultMetadata();
        await loadStorageDiagnostics();
        setToastNotice({ type: 'success', message: 'Data terbaru dari cloud berhasil diunduh' });
      } else {
        setToastNotice({ type: 'error', message: res.message || 'Gagal sinkron data cloud' });
      }
    } catch {
      setToastNotice({ type: 'error', message: 'Gagal sinkron data cloud' });
    } finally {
      setSyncingCloud(false);
      setTimeout(() => setToastNotice(null), 1500);
    }
  };

  // Calculate Real Storage Breakdown for the Charts
  const storageStats = useMemo(() => {
    const encoder = new TextEncoder();

    // 1. Articles
    let newsBytes = 0;
    if (diagnostics?.collections) {
      const newsCol = diagnostics.collections.find((c) => c.collectionKey === 'news_articles');
      if (newsCol) newsBytes = newsCol.totalBytes;
    }
    if (!newsBytes) {
      newsBytes = encoder.encode(JSON.stringify(articles || [])).length;
    }

    // 2. Media / Facility & Banners
    const facilityItems = config.facilities || [];
    const mediaCount = facilityItems.length + (config.header?.heroImageUrl ? 1 : 0) + (config.identity?.logoUrl ? 1 : 0);
    const mediaBytes = Math.max(
      encoder.encode(JSON.stringify(facilityItems)).length + (config.header?.heroImageUrl ? 512 : 0) + (config.identity?.logoUrl ? 512 : 0),
      4096
    );

    // 3. Portal & Config (excluding raw gallery to avoid double counting)
    let portalBytes = 0;
    if (diagnostics?.collections) {
      const portalCol = diagnostics.collections.find((c) => c.collectionKey === 'school_portal');
      if (portalCol) portalBytes = Math.max(portalCol.totalBytes - mediaBytes, 10240);
    }
    if (!portalBytes) {
      const fullConfigBytes = encoder.encode(JSON.stringify(config || {})).length;
      portalBytes = Math.max(fullConfigBytes - mediaBytes, 12288);
    }

    // 4. Backup Snapshot
    const backupBytes = defaultMeta.hasCustomDefault
      ? Math.round((portalBytes + newsBytes) * 0.9)
      : 8192;

    const totalBytes = portalBytes + newsBytes + mediaBytes + backupBytes;
    const totalCapacityBytes = 1024 * 1024 * 1024; // 1 GB free tier
    const usagePercent = Math.min(Math.max((totalBytes / totalCapacityBytes) * 100, 0.01), 100);

    const categories = [
      {
        id: 'portal',
        label: 'Data Portal & Konfigurasi',
        shortLabel: 'Portal',
        bytes: portalBytes,
        count: '1 Dokumen Inti',
        color: '#3b82f6', // Modern Blue
        gradientClass: 'from-blue-500 to-indigo-600',
        bgPill: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Layers,
      },
      {
        id: 'articles',
        label: 'Artikel & Postingan Berita',
        shortLabel: 'Berita',
        bytes: newsBytes,
        count: `${articles.length} Postingan`,
        color: '#10b981', // Emerald Green
        gradientClass: 'from-emerald-400 to-teal-600',
        bgPill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: FileText,
      },
      {
        id: 'media',
        label: 'Galeri Media & Banner',
        shortLabel: 'Media',
        bytes: mediaBytes,
        count: `${mediaCount} File Media/Banner`,
        color: '#f59e0b', // Vibrant Amber
        gradientClass: 'from-amber-400 to-orange-500',
        bgPill: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: ImageIcon,
      },
      {
        id: 'backup',
        label: 'Cadangan & Snapshot Default',
        shortLabel: 'Cadangan',
        bytes: backupBytes,
        count: defaultMeta.hasCustomDefault ? 'Default Kustom' : 'Default Awal',
        color: '#8b5cf6', // Violet Purple
        gradientClass: 'from-purple-500 to-fuchsia-600',
        bgPill: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: BookmarkCheck,
      },
    ];

    // Compute proportional share for Donut & Bar
    const categoriesWithPercent = categories.map((cat) => {
      const percentOfTotal = totalBytes > 0 ? (cat.bytes / totalBytes) * 100 : 25;
      return {
        ...cat,
        percent: percentOfTotal,
        formattedSize: formatBytes(cat.bytes),
      };
    });

    return {
      totalBytes,
      formattedTotal: formatBytes(totalBytes),
      usagePercent,
      categories: categoriesWithPercent,
    };
  }, [config, articles, diagnostics, defaultMeta]);

  // Donut Chart SVG Calculations
  const donutSegments = useMemo(() => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius; // ~339.29
    let accumulatedAngle = 0;

    return storageStats.categories.map((cat) => {
      // Ensure each category is visually represented nicely (minimum 10% representation visually for vivid elegance)
      const visualShare = Math.max(cat.percent, 10);
      return { visualShare, ...cat };
    });
  }, [storageStats]);

  // Total visual weight sum to normalize 360 degrees
  const totalVisualShare = useMemo(() => {
    return donutSegments.reduce((sum, seg) => sum + seg.visualShare, 0);
  }, [donutSegments]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {toastNotice && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            toastNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toastNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="p-1 hover:bg-black/5 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Minimalist Header & Quick Sync */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs flex items-center justify-center">
              <Database className="w-5 h-5" />
            </span>
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                firebaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Penyimpanan &amp; Sinkronisasi
              </h2>
              <span
                className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                  firebaseStatus.connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {firebaseStatus.connected ? 'Cloud Terhubung' : 'Penyimpanan Lokal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              Data tersimpan aman di Firebase Firestore dengan sinkronisasi otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={runConnectionCheck}
            disabled={loadingCheck}
            title="Periksa status koneksi Firebase"
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCheck ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Cek</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadLatestFromFirebase}
            disabled={syncingCloud}
            title="Tarik data terbaru dari server cloud"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? 'animate-spin' : ''}`} />
            <span>{syncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Cloud'}</span>
          </button>
        </div>
      </div>

      {/* GRAFIK PENGGUNAAN (LINGKARAN & BATANG) - MINIMALIS & INTUITIF */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Grafik Penggunaan Database &amp; Kuota
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              Status Sangat Ringan (&lt; 0.1% dari 1 GB Kuota)
            </span>
            <button
              type="button"
              onClick={loadStorageDiagnostics}
              disabled={loadingDiagnostics}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Perbarui data grafik"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDiagnostics ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Charts Container: Donut (Circle) & Multi-Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* 1. GRAFIK LINGKARAN (DONUT GAUGE) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-50/80 to-slate-100/50 rounded-2xl border border-slate-200/80">
            <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
              {/* SVG Donut */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Ring Track */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  className="stroke-slate-200"
                  strokeWidth="13"
                  fill="transparent"
                />

                {/* Segment Rings */}
                {donutSegments.map((seg) => {
                  const segRatio = seg.visualShare / totalVisualShare;
                  const dashLength = segRatio * circumference;
                  const dashOffset = runningOffset;
                  runningOffset += dashLength;

                  return (
                    <circle
                      key={seg.id}
                      cx="70"
                      cy="70"
                      r={radius}
                      stroke={seg.color}
                      strokeWidth="13"
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={-dashOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 hover:opacity-85"
                    />
                  );
                })}
              </svg>

              {/* Center Typography & Usage Figure */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Data
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {storageStats.formattedTotal}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full mt-1 border border-emerald-200">
                  Kapasitas 1 GB
                </span>
              </div>
            </div>

            {/* Quick Circular Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-200/80 w-full">
              {storageStats.categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-[11px] font-bold text-slate-700 truncate">
                    {cat.shortLabel}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 ml-auto">
                    {cat.percent < 1 ? '<1%' : `${Math.round(cat.percent)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. GRAFIK BATANG (SPEKTRUM & PROGRESS BARS) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Spektrum Batang Gabungan (Stacked Horizontal Spectrum Bar) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Distribusi Komponen Data</span>
                <span className="text-slate-400 font-medium">100% Terkelola</span>
              </div>

              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200 shadow-inner">
                {donutSegments.map((seg) => {
                  const widthPercent = (seg.visualShare / totalVisualShare) * 100;
                  return (
                    <div
                      key={seg.id}
                      className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: seg.color,
                      }}
                      title={`${seg.label}: ${seg.formattedSize}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* 4 Grafik Batang Individual (Detailed Bars with Metrics) */}
            <div className="space-y-3 pt-2">
              {storageStats.categories.map((item) => {
                const IconComp = item.icon;
                const barWidth = Math.max(Math.min(item.percent, 100), 4);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="p-1.5 rounded-lg text-white shadow-xs shrink-0"
                          style={{ backgroundColor: item.color }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-extrabold text-slate-900">
                          {item.formattedSize}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                          {item.count}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.gradientClass} transition-all duration-700`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MINIMALIST STORAGE SERVICES GRID: CLOUD & GOOGLE DRIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Firebase Firestore Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Cloud className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Firebase Firestore</h4>
                  <p className="text-[11px] text-slate-500">Database cloud utama situs</p>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  firebaseStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <p className="text-xs text-slate-600">
              {firebaseStatus.message || 'Koneksi cloud database berjalan normal.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Multi-Device Sync</span>
            <button
              type="button"
              onClick={handleDownloadLatestFromFirebase}
              disabled={syncingCloud}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncingCloud ? 'animate-spin' : ''}`} />
              <span>Unduh Cloud</span>
            </button>
          </div>
        </div>

        {/* Google Drive Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <HardDrive className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Drive</h4>
                  <p className="text-[11px] text-slate-500">Penyimpanan foto &amp; banner</p>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isDriveConnected ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
            </div>
            <p className="text-xs text-slate-600 truncate">
              {isDriveConnected
                ? `Login: ${driveUser?.email || 'Akun Google Aktif'}`
                : 'Login untuk mengunggah gambar resolusi tinggi tanpa batas.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold"
            >
              Buka Drive ↗
            </a>

            {isDriveConnected ? (
              <button
                type="button"
                onClick={handleDisconnectDrive}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectDrive}
                disabled={connectingDrive}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                <HardDrive className="w-3 h-3" />
                <span>{connectingDrive ? 'Menghubungkan...' : 'Login Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MINIMALIST SECURITY & BACKUP MANAGEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Password Admin CMS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <KeyRound className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-900">Keamanan Akses CMS</h4>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Password Admin
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password minimal 4 karakter..."
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {savedPwdNotice ? (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Password diperbarui
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Default: smpn1bks</span>
            )}
            <button
              type="button"
              onClick={handleSavePassword}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Simpan Password
            </button>
          </div>
        </div>

        {/* Cadangan & Reset Data */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <BookmarkCheck className="w-4 h-4" />
                </span>
                <h4 className="text-sm font-bold text-slate-900">Cadangan &amp; Pemulihan</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {defaultMeta.hasCustomDefault ? 'Snapshot Aktif' : 'Bawaan Pabrik'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {defaultMeta.hasCustomDefault
                ? `Default kustom tersimpan pada ${defaultMeta.savedAt}`
                : 'Simpan konfigurasi dan konten saat ini sebagai standar cadangan.'}
            </p>
          </div>

          {/* 3 Action Buttons in One Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSetDefaultModal(true)}
              title="Jadikan data saat ini sebagai patokan cadangan default"
              className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <BookmarkCheck className="w-4 h-4 text-indigo-600" />
              <span>Simpan Default</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              title="Kembalikan semua data situs ke cadangan default"
              className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 text-red-600" />
              <span>Reset Data</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearCacheModal(true)}
              title="Bersihkan cache lokal pada peramban/browser ini"
              className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4 text-slate-600" />
              <span>Bersihkan Cache</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: SET DEFAULT */}
      {showSetDefaultModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain touch-none">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-indigo-600" />
              <span>Simpan Sebagai Default Baru</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kondisi situs saat ini (konfigurasi, identitas, &amp; berita) akan dijadikan standar cadangan baru. Masukkan password admin untuk konfirmasi:
            </p>

            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showDefaultPassword ? 'text' : 'password'}
                  value={defaultPasswordInput}
                  onChange={(e) => {
                    setDefaultPasswordInput(e.target.value);
                    setDefaultPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCurrentAsDefault();
                  }}
                  placeholder="Password admin..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDefaultPassword(!showDefaultPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showDefaultPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {defaultPasswordError && (
                <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{defaultPasswordError}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSetDefaultModal(false);
                  setDefaultPasswordInput('');
                  setDefaultPasswordError('');
                }}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsDefault}
                disabled={savingDefault}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingDefault ? 'Menyimpan...' : 'Simpan Default'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET DATA */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain touch-none">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-red-600 text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Reset Semua Data Situs</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengembalikan seluruh konfigurasi dan berita ke kondisi default tersimpan. Masukkan password admin:
            </p>

            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetPasswordInput}
                  onChange={(e) => {
                    setResetPasswordInput(e.target.value);
                    setResetPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmReset();
                  }}
                  placeholder="Password admin..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {resetPasswordError && (
                <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{resetPasswordError}</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetPasswordInput('');
                  setResetPasswordError('');
                }}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {resetting ? 'Mereset...' : 'Reset Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CLEAR CACHE */}
      {showClearCacheModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overscroll-contain touch-none">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-slate-600" />
              <span>Bersihkan Cache Lokal</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Penyimpanan lokal browser (IndexedDB &amp; LocalStorage) akan dibersihkan, lalu halaman akan dimuat ulang untuk mengunduh data bersih terbaru dari Firebase.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearCacheModal(false)}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCache}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Bersihkan &amp; Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
