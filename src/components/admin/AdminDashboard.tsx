import React, { useState, useEffect } from 'react';
import { SchoolConfig, NewsArticle } from '../../types';
import {
  Sparkles,
  Palette,
  Layers,
  FileText,
  Layout,
  Award,
  Video,
  Share2,
  Database,
  ArrowLeft,
  Save,
  CheckCircle2,
  Eye,
  ShieldCheck,
  LogOut,
  X,
  ChevronRight,
  ChevronDown,
  Menu,
  Calendar,
  Building2,
  GraduationCap,
  FileSpreadsheet,
  CloudDownload,
  RefreshCw,
  AlertCircle,
  Volume2,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { AdminIdentityTab } from './AdminIdentityTab';
import { AdminBannerTab } from './AdminBannerTab';
import { AdminThemeTab } from './AdminThemeTab';
import { AdminTickerTab } from './AdminTickerTab';
import { AdminMenusTab } from './AdminMenusTab';
import { AdminPPDBTab } from './AdminPPDBTab';
import { AdminPostsTab } from './AdminPostsTab';
import { AdminCommentsTab } from './AdminCommentsTab';
import { AdminAgendaTab } from './AdminAgendaTab';
import { AdminFacilitiesEkskulTab } from './AdminFacilitiesEkskulTab';
import { AdminLayoutTab } from './AdminLayoutTab';
import { AdminPrincipalTab } from './AdminPrincipalTab';
import { AdminEmbedsTab } from './AdminEmbedsTab';
import { AdminFooterTab } from './AdminFooterTab';
import { AdminSyncTab } from './AdminSyncTab';
import { AdminGoogleAppsScriptTab } from './AdminGoogleAppsScriptTab';
import { AdminUsersTab } from './AdminUsersTab';
import {
  saveSchoolTabConfig,
  syncAdminWithFirebaseIfDifferent,
} from '../../lib/firebase';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';

interface AdminDashboardProps {
  config: SchoolConfig;
  articles: NewsArticle[];
  onChangeConfig: (newConfig: SchoolConfig) => void;
  onSaveArticle: (article: NewsArticle) => Promise<void>;
  onSaveArticleLocally?: (article: NewsArticle) => Promise<void>;
  onDeleteArticle: (articleId: string) => Promise<void>;
  onCloseAdmin: () => void;
  onLogout: () => void;
  onDataRestored: (newConfig: SchoolConfig, newArticles: NewsArticle[]) => void;
  onSyncFromCloud?: (newConfig: SchoolConfig, newArticles: NewsArticle[]) => void;
}

export type AdminTab =
  | 'banner'
  | 'identity'
  | 'theme'
  | 'ticker'
  | 'menus'
  | 'ppdb'
  | 'posts'
  | 'comments'
  | 'agenda'
  | 'facilities'
  | 'layout'
  | 'principal'
  | 'embeds'
  | 'footer'
  | 'appscript'
  | 'sync'
  | 'users';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  config,
  articles,
  onChangeConfig,
  onSaveArticle,
  onSaveArticleLocally,
  onDeleteArticle,
  onCloseAdmin,
  onLogout,
  onDataRestored,
  onSyncFromCloud,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('posts');
  const [savingTab, setSavingTab] = useState(false);
  const [unsavedTabs, setUnsavedTabs] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Perubahan Tersimpan!');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSystemCategoryOpen, setIsSystemCategoryOpen] = useState(false);

  const [adminRole, setAdminRole] = useState<'superadmin' | 'admin'>('admin');
  const [adminName, setAdminName] = useState<string>('Admin Utama');

  useEffect(() => {
    const role = localStorage.getItem('admin_role') as 'superadmin' | 'admin';
    const name = localStorage.getItem('admin_user_name');
    if (role) setAdminRole(role);
    if (name) setAdminName(name);
  }, []);

  // Cross-device synchronization state
  const [isCrossDeviceSyncing, setIsCrossDeviceSyncing] = useState(false);
  const [crossDeviceNotice, setCrossDeviceNotice] = useState<{
    type: 'updated' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Lock body scroll when mobile sidebar drawer is open to prevent background scrolling
  useBodyScrollLock(isMobileSidebarOpen);

  // Automatic cross-device synchronization check when entering the Admin Panel.
  // If offline local data differs from Firebase (e.g. edited from another device/browser):
  // Clean local stale cache, download the latest from Firebase, and clear unsaved draft flags.
  useEffect(() => {
    let isMounted = true;
    async function checkCrossDeviceSync() {
      setIsCrossDeviceSyncing(true);
      try {
        const res = await syncAdminWithFirebaseIfDifferent(config, articles);
        if (!isMounted) return;
        if (res.isDifferent && res.synced && res.config && res.articles) {
          if (onSyncFromCloud) {
            onSyncFromCloud(res.config, res.articles);
          } else {
            onDataRestored(res.config, res.articles);
          }
          setUnsavedTabs({});
          setCrossDeviceNotice({
            type: 'updated',
            text: res.message || 'Data diperbarui',
          });
          setToastMessage('Data disinkronkan');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 1000);
        }
      } catch (err) {
        console.info('Pemeriksaan sinkronisasi antar perangkat ditunda:', err);
      } finally {
        if (isMounted) {
          setIsCrossDeviceSyncing(false);
        }
      }
    }

    checkCrossDeviceSync();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualCrossDeviceSync = async () => {
    setIsCrossDeviceSyncing(true);
    try {
      const res = await syncAdminWithFirebaseIfDifferent(config, articles);
      if (res.isDifferent && res.synced && res.config && res.articles) {
        if (onSyncFromCloud) {
          onSyncFromCloud(res.config, res.articles);
        } else {
          onDataRestored(res.config, res.articles);
        }
        setUnsavedTabs({});
        setCrossDeviceNotice({
          type: 'updated',
          text: res.message || 'Data diperbarui',
        });
        setToastMessage('Data diperbarui');
      } else {
        setCrossDeviceNotice({
          type: 'info',
          text: res.message || 'Versi terbaru',
        });
        setToastMessage('Versi terbaru');
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1000);
    } catch (err) {
      setCrossDeviceNotice({
        type: 'error',
        text: 'Gagal sinkron',
      });
    } finally {
      setIsCrossDeviceSyncing(false);
    }
  };

  const localDraftsCount = articles.filter((a) => Boolean(a.isLocalDraft)).length;

  // Kategori 1: Konten Utama & Informasi Sekolah
  const contentTabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'posts', label: 'Postingan Berita', icon: <FileText className="w-4 h-4" /> },
    { id: 'comments', label: 'Pengelola Komentar', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'agenda', label: 'Agenda & Jadwal', icon: <Calendar className="w-4 h-4" /> },
    { id: 'ppdb', label: 'PPDB Online', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'principal', label: 'Sambutan Pimpinan', icon: <Award className="w-4 h-4" /> },
  ];

  if (adminRole === 'superadmin') {
    contentTabs.push({ id: 'users', label: 'Kelola Pengguna', icon: <ShieldCheck className="w-4 h-4 text-purple-500" /> });
  }

  // Kategori 2: Sistem (Sub-Sistem Website & Konfigurasi Modul)
  const systemTabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'banner', label: 'Banner Utama', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { id: 'identity', label: 'Identitas Instansi', icon: <Building2 className="w-4 h-4" /> },
    { id: 'menus', label: 'Menu & Dropdown', icon: <Layers className="w-4 h-4" /> },
    { id: 'facilities', label: 'Fasilitas & Ekskul', icon: <Building2 className="w-4 h-4" /> },
    { id: 'embeds', label: 'Video Profil dan Peta', icon: <Video className="w-4 h-4" /> },
    { id: 'footer', label: 'Footer & Kontak', icon: <Share2 className="w-4 h-4" /> },
    { id: 'theme', label: 'Warna & Tema Website', icon: <Palette className="w-4 h-4" /> },
    { id: 'ticker', label: 'Teks Berjalan (Ticker)', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'layout', label: 'Tata Letak', icon: <Layout className="w-4 h-4" /> },
    { id: 'appscript', label: 'Google Drive & Sheets', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'sync', label: 'Firebase & Backup', icon: <Database className="w-4 h-4 text-blue-400" /> },
  ];

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    ...contentTabs,
    ...systemTabs,
  ];

  const systemTabIds = new Set<AdminTab>([
    'banner',
    'identity',
    'menus',
    'facilities',
    'embeds',
    'footer',
    'theme',
    'ticker',
    'layout',
    'appscript',
    'sync',
  ]);
  const isSystemActive = systemTabIds.has(activeTab);
  const systemUnsavedCount = systemTabs.filter((t) => Boolean(unsavedTabs[t.id])).length;

  // Auto-expand system dropdown if the active tab is within system tabs
  useEffect(() => {
    if (systemTabIds.has(activeTab)) {
      setIsSystemCategoryOpen(true);
    }
  }, [activeTab]);

  // Scroll to the absolute top of the viewport when entering the Admin Panel or switching tabs.
  // This guarantees that the user is positioned at the very top of "Tambah Berita" / "Tulis Berita Baru" on entrance.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    
    // Also handle possible scroll containers
    const elementsToScroll = [
      document.documentElement,
      document.body,
      document.getElementById('admin-main-container'),
    ];
    elementsToScroll.forEach((el) => {
      if (el) el.scrollTop = 0;
    });
  }, [activeTab]);

  const handleConfigUpdate = (newConfig: SchoolConfig) => {
    // Mark only the active tab as having local unsaved changes
    setUnsavedTabs((prev) => ({ ...prev, [activeTab]: true }));
    onChangeConfig(newConfig);
  };

  const handleSaveTab = async (tabToSave: AdminTab = activeTab) => {
    setSavingTab(true);
    try {
      const success = await saveSchoolTabConfig(tabToSave, config);
      if (success) {
        setUnsavedTabs((prev) => ({ ...prev, [tabToSave]: false }));
        setToastMessage('Tersimpan');
      } else {
        setToastMessage('Tersimpan lokal');
      }
    } catch (err) {
      setToastMessage('Gagal simpan');
    } finally {
      setSavingTab(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 1000);
    }
  };

  const unsavedCount =
    Object.values(unsavedTabs).filter(Boolean).length + (localDraftsCount > 0 ? 1 : 0);

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="font-bold text-xs">{toastMessage}</div>
        </div>
      )}

      {/* Admin Top Appbar */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Left Actions & Mobile Menu Toggle */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={onCloseAdmin}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                <Eye className="w-4 h-4" />
                <span>Lihat Website</span>
              </button>

              <div className="hidden sm:flex items-center gap-2.5">
                {config.identity.logoUrl && (
                  <img
                    src={config.identity.logoUrl}
                    alt={config.identity.name || 'Logo'}
                    className="w-8 h-8 object-contain rounded-lg bg-white/10 p-0.5 border border-slate-700/70 shrink-0"
                  />
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base tracking-tight">
                      Portal Admin
                    </span>
                    <span className="inline-flex items-center gap-1 bg-blue-900/80 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-700">
                      <ShieldCheck className="w-3 h-3" />
                      {adminRole === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </span>
                    <span className="text-[11px] text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md font-bold truncate max-w-[150px]" title={adminName}>
                      {adminName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium truncate max-w-xs">
                    {config.identity.name || 'Nama Instansi'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleManualCrossDeviceSync}
                disabled={isCrossDeviceSyncing}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                title="Periksa apakah ada data terbaru di Firebase dari perangkat lain"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isCrossDeviceSyncing ? 'animate-spin' : ''}`} />
                <span>{isCrossDeviceSyncing ? 'Menyelaraskan...' : 'Sinkron Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('sync');
                  setIsSystemCategoryOpen(true);
                }}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'sync'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Buka Diagnostik Penyimpanan Firestore"
              >
                <Database className="w-4 h-4 text-blue-400" />
                <span>Diagnostik DB</span>
              </button>

              <button
                type="button"
                onClick={onCloseAdmin}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Buka tampilan publik"
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Pratinjau Live</span>
              </button>

              {unsavedCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>{unsavedCount} Tab Belum Disinkron</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Semua Tab Tersinkron</span>
                </span>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Kunci & Keluar dari sesi admin"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Kunci / Keluar</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Floating Trigger Button on the Middle-Left of Mobile Screen (HP) */}
      <button
        type="button"
        id="mobile-sidebar-middle-trigger"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="fixed top-1/2 -translate-y-1/2 left-0 z-40 md:hidden w-[28px] h-[120px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white border-y border-r border-blue-500/70 rounded-r-xl shadow-2xl shadow-blue-950/80 flex flex-col items-center justify-center gap-3 group transition-all duration-200 active:scale-95 cursor-pointer hover:bg-slate-800 animate-in slide-in-from-left"
        title="Buka Menu Tab Admin"
        aria-label="Buka Menu Tab Admin"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
        <Menu className="w-4 h-4 text-blue-200 stroke-[2.5] group-hover:text-white transition-transform group-hover:scale-110" />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></span>
      </button>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 transition-opacity md:hidden overscroll-contain touch-none animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sliding Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900 text-white z-50 flex flex-col shadow-2xl border-r border-slate-800 overscroll-contain transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {config.identity.logoUrl ? (
              <img
                src={config.identity.logoUrl}
                alt={config.identity.name || 'Logo Instansi'}
                className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1 border border-slate-700/80 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                Portal Admin
              </h2>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[170px]">
                {config.identity.name || 'Nama Instansi'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tab Navigation List */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3 space-y-3">
          
          {/* Kategori 1: Konten & Informasi */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Konten & Informasi</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                {contentTabs.length} Menu
              </span>
            </div>

            {contentTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isUnsaved = tab.id === 'posts' ? localDraftsCount > 0 : Boolean(unsavedTabs[tab.id]);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {isUnsaved ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {tab.id === 'posts' ? `${localDraftsCount} Draf` : 'Lokal'}
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Tersinkron" />
                    )}
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Kategori 2: Sistem (Dropdown / Collapsible) - HANYA UNTUK SUPERADMIN */}
          {adminRole === 'superadmin' && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <button
                type="button"
                onClick={() => setIsSystemCategoryOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left select-none ${
                  isSystemActive
                    ? 'bg-blue-950/70 border border-blue-800/80 text-blue-200 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-expanded={isSystemCategoryOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSystemActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-extrabold uppercase tracking-wider text-xs">Sistem</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                      {systemTabs.length} Menu
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isSystemCategoryOpen && systemUnsavedCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {systemUnsavedCount} Lokal
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isSystemCategoryOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Items (Header, Warna & Tema, Teks Berjalan, Tata Letak, Google Drive & Sheets, Firebase) */}
              {isSystemCategoryOpen && (
                <div className="pl-2 space-y-1 border-l-2 border-blue-500/40 ml-3.5 pt-1 animate-in slide-in-from-top-2 duration-150">
                  {systemTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isUnsaved = Boolean(unsavedTabs[tab.id]);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {tab.icon}
                          </span>
                          <span className="truncate">{tab.label}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {tab.id !== 'sync' && (
                            isUnsaved ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Lokal
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Tersinkron" />
                            )
                          )}
                          {isActive ? (
                            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                onCloseAdmin();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Lihat Web</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileSidebarOpen(false);
                onLogout();
              }}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-semibold border border-red-500/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container: Desktop Persistent Sidebar + Workspace Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8 items-start">
        
        {/* Desktop Persistent Sidebar (Un-hidden on >= md screens) */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 sticky top-24 space-y-4 self-start">
          
          {/* Navigation Card */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-3">
            
            {/* Kategori 1: Konten & Informasi */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Konten & Informasi</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  {contentTabs.length} Tab
                </span>
              </div>

              {contentTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isUnsaved = tab.id === 'posts' ? localDraftsCount > 0 : Boolean(unsavedTabs[tab.id]);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {tab.icon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isUnsaved ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                          title="Hanya tersimpan di lokal (belum disinkronkan ke Firebase)"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          {tab.id === 'posts' ? `${localDraftsCount} Draf` : 'Lokal'}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center"
                          title="Tersinkron dengan Firebase"
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kategori 2: Sistem (Dropdown Collapsible) - HANYA UNTUK SUPERADMIN */}
            {adminRole === 'superadmin' && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <button
                  type="button"
                  onClick={() => setIsSystemCategoryOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    isSystemActive
                      ? 'bg-blue-50 text-blue-900 font-extrabold border border-blue-200 shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-expanded={isSystemCategoryOpen}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isSystemActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate tracking-wide text-xs">Sistem</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 font-semibold border border-slate-200">
                        {systemTabs.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {!isSystemCategoryOpen && systemUnsavedCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Ada tab sistem belum disinkronkan" />
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isSystemCategoryOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Items (Header, Warna & Tema, Teks Berjalan, Tata Letak, Google Drive & Sheets, Firebase) */}
                {isSystemCategoryOpen && (
                  <div className="space-y-1 pl-2 ml-2.5 border-l-2 border-blue-200/70 pt-1 animate-in slide-in-from-top-2 duration-150">
                    {systemTabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const isUnsaved = Boolean(unsavedTabs[tab.id]);
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={isActive ? 'text-white' : 'text-slate-500'}>
                              {tab.icon}
                            </span>
                            <span className="truncate">{tab.label}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            {tab.id !== 'sync' && (
                              isUnsaved ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                    isActive
                                      ? 'bg-amber-400 text-amber-950'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                  title="Hanya tersimpan di lokal (belum disinkronkan ke Firebase)"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                  Lokal
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center"
                                  title="Tersinkron dengan Firebase"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                                </span>
                              )
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 w-full">

          {/* Dedicated Tab Header with Status for Current Tab (Save button is placed ONLY at the bottom) */}
          {activeTab !== 'sync' && activeTab !== 'posts' && activeTab !== 'comments' && (
            <div className="mb-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  {tabs.find((t) => t.id === activeTab)?.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {tabs.find((t) => t.id === activeTab)?.label}
                    </h3>
                    {unsavedTabs[activeTab] ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        Draf Belum Disinkron
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Tersinkron
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Tab Views */}
          {activeTab === 'banner' && (
            <AdminBannerTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'identity' && (
            <AdminIdentityTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'theme' && (
            <AdminThemeTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'ticker' && (
            <AdminTickerTab config={config} articles={articles} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'menus' && (
            <AdminMenusTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'ppdb' && (
            <AdminPPDBTab config={config} onChange={handleConfigUpdate} />
          )}

          {/* Keep AdminPostsTab mounted so in-progress post editing/drafting is preserved when switching tabs */}
          <div className={activeTab === 'posts' ? 'block' : 'hidden'}>
            <AdminPostsTab
              articles={articles}
              categories={config.newsCategories}
              onSaveArticle={onSaveArticle}
              onSaveArticleLocally={onSaveArticleLocally}
              onDeleteArticle={onDeleteArticle}
              onUpdateCategories={(newCats) => handleConfigUpdate({ ...config, newsCategories: newCats })}
            />
          </div>

          {activeTab === 'comments' && (
            <AdminCommentsTab articles={articles} />
          )}

          {activeTab === 'agenda' && (
            <AdminAgendaTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'facilities' && (
            <AdminFacilitiesEkskulTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'layout' && (
            <AdminLayoutTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'principal' && (
            <AdminPrincipalTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'embeds' && (
            <AdminEmbedsTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'footer' && (
            <AdminFooterTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'appscript' && (
            <AdminGoogleAppsScriptTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'users' && (
            <AdminUsersTab config={config} onChange={handleConfigUpdate} />
          )}

          {activeTab === 'sync' && (
            <AdminSyncTab
              config={config}
              articles={articles}
              onChangeConfig={handleConfigUpdate}
              onDataRestored={onDataRestored}
              onSyncFromCloud={onSyncFromCloud}
            />
          )}

          {/* Granular Quick-Save Bar for Non-Sync, Non-Posts, and Non-Comments Tabs */}
          {activeTab !== 'sync' && activeTab !== 'posts' && activeTab !== 'comments' && (
            <div className="mt-8 flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleSaveTab(activeTab)}
                disabled={savingTab}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all text-xs sm:text-sm cursor-pointer disabled:opacity-50 tracking-wider"
              >
                <Save className={`w-4 h-4 ${savingTab ? 'animate-spin' : ''}`} />
                <span>{savingTab ? 'MENYIMPAN...' : 'SIMPAN'}</span>
              </button>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};

