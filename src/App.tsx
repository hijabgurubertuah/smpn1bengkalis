/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SchoolConfig, NewsArticle } from './types';
import { DEFAULT_SCHOOL_CONFIG, DEFAULT_NEWS_ARTICLES } from './lib/defaultData';
import {
  loadSchoolConfig,
  saveSchoolConfig,
  saveLocalDraftConfig,
  loadNewsArticles,
  saveNewsArticle,
  saveNewsArticleLocally,
  deleteNewsArticle,
  fetchAndSyncLatestData,
  subscribeToCloudConfig,
  subscribeToCloudArticles,
  normalizeSchoolConfig,
  getDedicatedPostsCacheSync,
  saveDedicatedPostsCache,
  getDedicatedPrincipalCacheSync,
  saveDedicatedPrincipalCache,
  getDedicatedDockCacheSync,
  saveDedicatedDockCache,
  PUBLIC_CONFIG_KEY,
  ADMIN_CONFIG_KEY,
  PUBLIC_NEWS_KEY,
  ADMIN_NEWS_KEY,
} from './lib/firebase';
import { TopBar } from './components/public/TopBar';
import { Navbar } from './components/public/Navbar';
import { ImportantNoticeBanner } from './components/public/ImportantNoticeBanner';
import { HeroSection } from './components/public/HeroSection';
import { PrincipalSection } from './components/public/PrincipalSection';
import { NewsSection } from './components/public/NewsSection';
import { AgendaSection } from './components/public/AgendaSection';
import { FacilitiesAndEkskul } from './components/public/FacilitiesAndEkskul';
import { EmbedMediaSection } from './components/public/EmbedMediaSection';
import { FooterSection } from './components/public/FooterSection';
import { AccreditationRibbon } from './components/public/AccreditationRibbon';
import { OfflineIndicator } from './components/public/OfflineIndicator';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { MobileBottomNav } from './components/public/MobileBottomNav';
import { NewsDetailModal } from './components/public/NewsDetailModal';
import { ShieldCheck, Sparkles, CheckCircle2, RefreshCw, School } from 'lucide-react';
import { syncPWAManifest } from './lib/usePWAInstall';

const getInitialSchoolConfig = (): SchoolConfig => {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_CONFIG;
  try {
    const scope = localStorage.getItem('admin_authenticated') === 'true' ? 'admin' : 'public';
    const lsKey = scope === 'admin' ? ADMIN_CONFIG_KEY : PUBLIC_CONFIG_KEY;
    const raw =
      localStorage.getItem(lsKey) ||
      localStorage.getItem('admin_school_config') ||
      localStorage.getItem('public_school_config') ||
      localStorage.getItem('school_config') ||
      localStorage.getItem('smpn1_bengkalis_config_v3') ||
      localStorage.getItem('smpn1_bengkalis_custom_default_config_v1');
    let base = DEFAULT_SCHOOL_CONFIG;
    if (raw) {
      base = normalizeSchoolConfig(JSON.parse(raw));
    }
    // Overlay dedicated principal message cache if present
    const dedicatedPrincipal = getDedicatedPrincipalCacheSync();
    if (dedicatedPrincipal) {
      base = {
        ...base,
        principal: { ...base.principal, ...dedicatedPrincipal },
      };
    }
    // Overlay dedicated mobile bottom dock cache if present
    const dedicatedDock = getDedicatedDockCacheSync();
    if (dedicatedDock) {
      base = {
        ...base,
        mobileBottomNav: { ...base.mobileBottomNav, ...dedicatedDock },
      };
    }
    return base;
  } catch {}
  return DEFAULT_SCHOOL_CONFIG;
};

const getInitialNewsArticles = (): NewsArticle[] => {
  if (typeof window === 'undefined') return [];
  try {
    // 1. Dedicated posts cache (isolated, persistent across hard refresh)
    const dedicated = getDedicatedPostsCacheSync();
    if (dedicated && Array.isArray(dedicated) && dedicated.length > 0) {
      return dedicated;
    }

    // 2. Scoped cache check
    const scope = localStorage.getItem('admin_authenticated') === 'true' ? 'admin' : 'public';
    const lsKey = scope === 'admin' ? ADMIN_NEWS_KEY : PUBLIC_NEWS_KEY;
    const raw =
      localStorage.getItem(lsKey) ||
      localStorage.getItem('public_news_articles') ||
      localStorage.getItem('admin_news_articles') ||
      localStorage.getItem('news_articles') ||
      localStorage.getItem('smpn1_bengkalis_news_v3') ||
      localStorage.getItem('smpn1_bengkalis_custom_default_news_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [];
};

export default function App() {
  const [config, setConfig] = useState<SchoolConfig>(() => getInitialSchoolConfig());
  const [articles, setArticles] = useState<NewsArticle[]>(() => getInitialNewsArticles());
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(() => articles.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Auto-open article from URL parameter or popstate (?post=... or ?berita=...)
  useEffect(() => {
    if (!articles || articles.length === 0) return;

    const checkUrlForPost = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const postId = params.get('post') || params.get('berita') || params.get('id');
        if (postId) {
          const found = articles.find(
            (a) =>
              a.id === postId ||
              (a.slug && a.slug.toLowerCase() === postId.toLowerCase()) ||
              String(a.id).toLowerCase() === postId.toLowerCase()
          );
          if (found) {
            setSelectedArticle(found);
          }
        }
      } catch {}
    };

    checkUrlForPost();
    window.addEventListener('popstate', checkUrlForPost);
    return () => window.removeEventListener('popstate', checkUrlForPost);
  }, [articles]);

  // Initialize data: Fast render from offline partition, followed immediately by live Firebase sync and realtime subscription
  useEffect(() => {
    let isMounted = true;

    async function initAndSyncData() {
      // 1. Instant local hydration from local cache
      try {
        const [localConfig, localArticles] = await Promise.all([
          loadSchoolConfig(),
          loadNewsArticles(),
        ]);
        if (isMounted) {
          setConfig(localConfig);
          if (localArticles && localArticles.length > 0) {
            setArticles(localArticles);
            setIsInitialSyncing(false);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Init cache error, using defaults:', err);
        if (isMounted) setIsLoading(false);
      }

      // 2. Fetch fresh updates from Firebase on every page reload/refresh
      try {
        const syncRes = await fetchAndSyncLatestData();
        if (!isMounted) return;

        if (syncRes.success && syncRes.config) {
          setConfig(syncRes.config);
          if (syncRes.articles) {
            setArticles(syncRes.articles);
            saveDedicatedPostsCache(syncRes.articles);
          }
          if (syncRes.config.principal) {
            saveDedicatedPrincipalCache(syncRes.config.principal);
          }
          if (syncRes.config.mobileBottomNav) {
            saveDedicatedDockCache(syncRes.config.mobileBottomNav);
          }
          setIsInitialSyncing(false);

          if (syncRes.isDifferent) {
            setSyncToast({
              message: 'Data diperbarui dari cloud',
              type: 'success',
            });
            setTimeout(() => {
              if (isMounted) setSyncToast(null);
            }, 1200);
          }
        }
      } catch (err) {
        console.info('Live sync on reload skipped:', err);
      } finally {
        if (isMounted) setIsInitialSyncing(false);
      }
    }

    initAndSyncData();

    // 3. Realtime Firestore listener for School Config (updates immediately when admin saves on any device)
    const unsubscribeCloudConfig = subscribeToCloudConfig((newCloudConfig) => {
      if (isMounted && !isAdminMode) {
        setConfig(newCloudConfig);
        if (newCloudConfig.principal) saveDedicatedPrincipalCache(newCloudConfig.principal);
        if (newCloudConfig.mobileBottomNav) saveDedicatedDockCache(newCloudConfig.mobileBottomNav);
      }
    });

    // 4. Realtime Firestore listener for News Articles (updates immediately when news is created/edited/deleted)
    const unsubscribeCloudArticles = subscribeToCloudArticles((newArticles) => {
      if (isMounted && !isAdminMode) {
        setArticles(newArticles);
        saveDedicatedPostsCache(newArticles);
        setIsInitialSyncing(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeCloudConfig();
      unsubscribeCloudArticles();
    };
  }, [isAdminMode]);

  // Synchronize document title, favicon, and PWA Manifest
  useEffect(() => {
    syncPWAManifest(config.identity);
  }, [config.identity]);

  // Synchronize Theme Colors to CSS Root Variables
  useEffect(() => {
    if (config.themeConfig) {
      const root = document.documentElement;
      const t = config.themeConfig;
      if (t.primaryColor) root.style.setProperty('--primary-color', t.primaryColor);
      if (t.primaryHoverColor) root.style.setProperty('--primary-hover-color', t.primaryHoverColor);
      if (t.headerBgColor) root.style.setProperty('--header-bg-color', t.headerBgColor);
      if (t.navbarBgColor) root.style.setProperty('--navbar-bg-color', t.navbarBgColor);
      if (t.navbarTextColor) root.style.setProperty('--navbar-text-color', t.navbarTextColor);
      if (t.buttonBgColor) root.style.setProperty('--button-bg-color', t.buttonBgColor);
      if (t.buttonTextColor) root.style.setProperty('--button-text-color', t.buttonTextColor);
      if (t.footerBgColor) root.style.setProperty('--footer-bg-color', t.footerBgColor);
    }
  }, [config.themeConfig]);

  // Shopee Affiliate Auto-Redirect after 5 minutes once a day
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SHOPEE_LINK = 'https://s.shopee.co.id/7ptEQvnUyu';
    const FIVE_MINUTES = 5 * 60 * 1000; // 300,000 ms (5 minutes)
    const STORAGE_KEY = 'shopee_last_opened_date';
    const SESSION_START_KEY = 'shopee_session_start_time';

    // Store session start time in sessionStorage if not already set
    let sessionStartStr = sessionStorage.getItem(SESSION_START_KEY);
    if (!sessionStartStr) {
      sessionStartStr = Date.now().toString();
      sessionStorage.setItem(SESSION_START_KEY, sessionStartStr);
    }
    const sessionStartTime = parseInt(sessionStartStr, 10);

    const tryOpenShopeeLink = () => {
      const today = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD reliably in local time
      const lastOpened = localStorage.getItem(STORAGE_KEY);

      // If already opened today, skip
      if (lastOpened === today) {
        return;
      }

      // Mark as opened today in localStorage
      localStorage.setItem(STORAGE_KEY, today);

      // Redirect window.location.href to open Shopee (handles native app deep-linking directly on mobile)
      window.location.href = SHOPEE_LINK;
    };

    const checkTimeElapsed = () => {
      const elapsed = Date.now() - sessionStartTime;
      if (elapsed >= FIVE_MINUTES) {
        tryOpenShopeeLink();
      }
    };

    // Run check initially and on an interval (every 10 seconds)
    checkTimeElapsed();
    const intervalId = setInterval(checkTimeElapsed, 10000);

    // Visibility change handler to handle background/minimize resume perfectly
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeElapsed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Manual refresh trigger for public and admin views
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchAndSyncLatestData(isAdminMode ? 'admin' : 'public');
      if (res.success) {
        setConfig(res.config);
        setArticles(res.articles);
        setSyncToast({
          message: res.isDifferent ? 'Data diperbarui' : 'Versi terbaru',
          type: 'success',
        });
      } else {
        setSyncToast({
          message: res.message || 'Mode offline',
          type: 'info',
        });
      }
    } catch (err) {
      setSyncToast({
        message: 'Gagal refresh',
        type: 'info',
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setSyncToast(null), 1000);
    }
  };

  // Request open admin mode with password protection
  const handleOpenAdmin = () => {
    const isAuth =
      localStorage.getItem('admin_authenticated') === 'true' ||
      sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuth) {
      setIsAdminMode(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Logout and lock admin session
  const handleLogoutAdmin = () => {
    localStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_authenticated');
    setIsAdminMode(false);
  };

  // Handle configuration update from Admin
  const handleConfigChange = (newConfig: SchoolConfig) => {
    setConfig(newConfig);
    saveLocalDraftConfig(newConfig);
  };

  // Handle article save to Cloud from Admin
  const handleSaveArticle = async (article: NewsArticle) => {
    await saveNewsArticle(article);
    const updated = await loadNewsArticles();
    setArticles(updated);
  };

  // Handle article save to Local Draft only from Admin (0 Firebase writes)
  const handleSaveArticleLocally = async (article: NewsArticle) => {
    await saveNewsArticleLocally(article);
    const updated = await loadNewsArticles();
    setArticles(updated);
  };

  // Handle article delete from Admin
  const handleDeleteArticle = async (articleId: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    await deleteNewsArticle(articleId);
  };

  // Handle backup restore / reset
  const handleDataRestored = (newConfig: SchoolConfig, newArticles: NewsArticle[]) => {
    setConfig(newConfig);
    setArticles(newArticles);
    saveSchoolConfig(newConfig);
  };

  // Synchronize state when downloaded from Firebase without re-uploading
  const handleSyncFromCloud = (newConfig: SchoolConfig, newArticles: NewsArticle[]) => {
    setConfig(newConfig);
    setArticles(newArticles);
  };

  if (isLoading) {
    const schoolLogo = config.identity.logoUrl;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute w-72 h-72 bg-blue-600/10 rounded-full blur-3xl -top-10 -left-10 pointer-events-none" />
        <div className="absolute w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl -bottom-10 -right-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* School Logo */}
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 shadow-2xl flex items-center justify-center animate-pulse">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={config.identity.name || 'Logo Sekolah'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <School className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
              )}
            </div>
            <div className="absolute -inset-1.5 rounded-3xl bg-blue-500/20 blur-md -z-10 animate-pulse" />
          </div>

          {/* Spinner & Italic Loading Text */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="italic text-base sm:text-lg font-semibold text-slate-100 tracking-wide">
              Memuat Portal Sekolah...
            </p>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {config.identity.name || 'Portal Resmi Sekolah'}
          </p>
        </div>
      </div>
    );
  }

  // Admin CMS Mode View
  if (isAdminMode) {
    return (
      <>
        {syncToast && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{syncToast.message}</span>
          </div>
        )}
        <AdminDashboard
          config={config}
          articles={articles}
          onChangeConfig={handleConfigChange}
          onSaveArticle={handleSaveArticle}
          onSaveArticleLocally={handleSaveArticleLocally}
          onDeleteArticle={handleDeleteArticle}
          onCloseAdmin={() => setIsAdminMode(false)}
          onLogout={handleLogoutAdmin}
          onDataRestored={handleDataRestored}
          onSyncFromCloud={handleSyncFromCloud}
        />
      </>
    );
  }

  // Public School Portal View
  const { layoutSections } = config;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 relative pb-20 md:pb-0 w-full max-w-full overflow-x-clip">
      
      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{syncToast.message}</span>
        </div>
      )}

      {/* Admin Password Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setIsAdminMode(true);
        }}
        configuredPassword={config.adminPassword || 'smpn1bks'}
        schoolName={config.identity.name}
        users={config.users || []}
      />

      {/* Main Navigation Bar with Dynamic Dropdown Menus and Single Gear Admin Button */}
      <Navbar
        config={config}
        onOpenAdmin={handleOpenAdmin}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Important Announcement / Info Penting Banner (Placed directly BELOW Navbar menu) */}
      <ImportantNoticeBanner
        config={config}
        articles={articles}
        onSelectArticle={setSelectedArticle}
      />

      {/* Hero Banner Section */}
      {layoutSections.showHero && <HeroSection config={config} />}

      {/* Akreditasi A Unggul Bar (Placed Directly Below Header) */}
      {layoutSections.showAccreditation !== false && (
        <AccreditationRibbon config={config} />
      )}

      {/* Sambutan Kepala Sekolah */}
      {layoutSections.showPrincipalSpeech && (
        <PrincipalSection
          principal={config.principal}
          schoolName={config.identity.name}
          logoUrl={config.identity.logoUrl}
          articles={articles}
          onSelectArticle={setSelectedArticle}
        />
      )}

      {/* Berita, Prestasi & Pengumuman Sekolah */}
      {layoutSections.showNews && (
        <NewsSection
          articles={articles}
          isInitialSyncing={isInitialSyncing}
          onSelectArticle={setSelectedArticle}
        />
      )}

      {/* Agenda & Kalender Kegiatan */}
      {layoutSections.showAgenda && (
        <AgendaSection agendas={config.agendas || []} />
      )}

      {/* Fasilitas & Ekstrakurikuler */}
      {(layoutSections.showFacilities || layoutSections.showExtracurriculars) && (
        <FacilitiesAndEkskul
          facilities={config.facilities || []}
          extracurriculars={config.extracurriculars || []}
          facilitiesTabTitle={config.facilitiesTabTitle}
          ekskulTabTitle={config.ekskulTabTitle}
          facilitiesSectionTitle={config.facilitiesSectionTitle}
          facilitiesSectionSubtitle={config.facilitiesSectionSubtitle}
        />
      )}

      {/* Embed Media: YouTube Video & Google Maps */}
      {(layoutSections.showVideoEmbed || layoutSections.showMapEmbed) && (
        <EmbedMediaSection
          embeds={config.embeds}
          schoolAddress={config.footer.address}
          showVideo={layoutSections.showVideoEmbed}
          showMap={layoutSections.showMapEmbed}
        />
      )}

      {/* Footer Section */}
      <FooterSection config={config} />

      {/* Modern Mobile Bottom Navigation Bar (Floating Dock) */}
      <MobileBottomNav
        config={config}
        onOpenContact={() => {
          const el = document.getElementById('kontak') || document.getElementById('footer');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
          }
        }}
      />

      {/* Single Centralized News Detail Modal */}
      {selectedArticle && (
        <NewsDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* Offline Status Notification Indicator for PWA */}
      <OfflineIndicator />

    </div>
  );
}
