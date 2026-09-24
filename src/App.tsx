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
  fetchArticleByIdOrSlug,
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
import { RotateYLoadingScreen } from './components/common/RotateYLoadingScreen';
import { StandaloneGTKFormPage } from './components/common/datagtk';
import { GTKCarouselSection } from './components/public/GTKCarouselSection';
import { ShieldCheck, Sparkles, CheckCircle2, RefreshCw, School } from 'lucide-react';
import { syncPWAManifest } from './lib/usePWAInstall';
import { openShopeeLink, DEFAULT_SHOPEE_AFFILIATE_URL, initShopeeLinkInterceptors, isMobileDevice } from './lib/shopeeHelper';

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
    // Pre-seed local cache if not set yet for 0ms subsequent load
    try {
      if (!localStorage.getItem(lsKey)) {
        localStorage.setItem(lsKey, JSON.stringify(base));
      }
    } catch {}

    return base;
  } catch {}
  return DEFAULT_SCHOOL_CONFIG;
};

const getInitialNewsArticles = (): NewsArticle[] => {
  if (typeof window === 'undefined') return DEFAULT_NEWS_ARTICLES;
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

    // Pre-seed local articles cache if not set yet
    try {
      if (!localStorage.getItem(lsKey)) {
        localStorage.setItem(lsKey, JSON.stringify(DEFAULT_NEWS_ARTICLES));
      }
    } catch {}
  } catch {}
  return DEFAULT_NEWS_ARTICLES;
};

const getInitialAdminMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const isAuth =
      localStorage.getItem('admin_authenticated') === 'true' ||
      sessionStorage.getItem('admin_authenticated') === 'true';
    if (!isAuth) return false;

    const params = new URLSearchParams(window.location.search);
    if (params.has('admin') || params.has('tab') || params.has('edit')) return true;

    return sessionStorage.getItem('admin_mode_active') === 'true';
  } catch {}
  return false;
};

export default function App() {
  const [config, setConfig] = useState<SchoolConfig>(() => getInitialSchoolConfig());
  const [articles, setArticles] = useState<NewsArticle[]>(() => getInitialNewsArticles());
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => getInitialAdminMode());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Determine if the fullscreen rotate-Y loading screen should be active (only for explicit manual refresh or admin restore)
  const isScreenLoading = isRefreshing || isLoading;

  // Sync admin mode to sessionStorage and URL query params
  useEffect(() => {
    if (isAdminMode) {
      try {
        sessionStorage.setItem('admin_mode_active', 'true');
        const url = new URL(window.location.href);
        if (!url.searchParams.has('admin')) {
          url.searchParams.set('admin', '1');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
        }
      } catch {}
    }
  }, [isAdminMode]);

  // Auto-open article from URL permalink (/berita/:idOrSlug) or query parameter (?post=... or ?berita=...)
  useEffect(() => {
    const parseUrlForPostId = (): string | null => {
      try {
        const pathname = window.location.pathname;
        const match = pathname.match(/^\/berita\/([^/?#]+)/i);
        if (match && match[1]) {
          return decodeURIComponent(match[1]);
        }
        const params = new URLSearchParams(window.location.search);
        const qPost = params.get('post') || params.get('berita') || params.get('id');
        if (qPost) return qPost;
      } catch {}
      return null;
    };

    const targetPostId = parseUrlForPostId();
    if (!targetPostId) return;

    // 1. Check in already loaded articles
    const found = articles.find(
      (a) =>
        a.id === targetPostId ||
        (a.slug && a.slug.toLowerCase() === targetPostId.toLowerCase()) ||
        a.id.toLowerCase() === targetPostId.toLowerCase()
    );

    if (found) {
      if (!selectedArticle || selectedArticle.id !== found.id) {
        setSelectedArticle(found);
      }
    } else {
      // 2. Fetch directly from Firestore / offline storage if not in list yet
      let isCancelled = false;
      fetchArticleByIdOrSlug(targetPostId).then((fetched) => {
        if (!isCancelled && fetched) {
          setSelectedArticle(fetched);
          setArticles((prev) => (prev.some((a) => a.id === fetched.id) ? prev : [fetched, ...prev]));
        }
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [articles, selectedArticle]);

  // Handle browser back and forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const pathname = window.location.pathname;
        const match = pathname.match(/^\/berita\/([^/?#]+)/i);
        if (match && match[1]) {
          const targetId = decodeURIComponent(match[1]);
          const found = articles.find(
            (a) =>
              a.id === targetId ||
              (a.slug && a.slug.toLowerCase() === targetId.toLowerCase()) ||
              a.id.toLowerCase() === targetId.toLowerCase()
          );
          if (found) {
            setSelectedArticle(found);
          } else {
            fetchArticleByIdOrSlug(targetId).then((fetched) => {
              if (fetched) {
                setSelectedArticle(fetched);
                setArticles((prev) => (prev.some((a) => a.id === fetched.id) ? prev : [fetched, ...prev]));
              }
            });
          }
        } else {
          // If navigated back to home or other non-berita route
          setSelectedArticle(null);
        }
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles]);

  // Initialize data: Fast render from offline partition, followed immediately by live Firebase sync and realtime subscription
  useEffect(() => {
    let isMounted = true;

    // Clean up hard_reset query param from URL if present so it doesn't linger
    if (typeof window !== 'undefined' && window.location.search.includes('hard_reset=')) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('hard_reset');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
      } catch {}
    }

    async function initAndSyncData() {
      setIsSyncingData(true);
      // 1. Instant local hydration from local cache (without erasing anything)
      try {
        const [localConfig, localArticles] = await Promise.all([
          loadSchoolConfig(),
          loadNewsArticles(),
        ]);
        if (isMounted) {
          if (localConfig) setConfig(localConfig);
          if (localArticles && localArticles.length > 0) {
            setArticles(localArticles);
          }
          setIsLoading(false);
          setIsInitialSyncing(false);
        }
      } catch (err) {
        console.warn('Init cache error, using defaults:', err);
        if (isMounted) setIsLoading(false);
      }

      // 2. Fetch fresh updates from Firebase on every page reload/refresh (differential sync without clearing cache)
      try {
        const syncRes = await fetchAndSyncLatestData();
        if (!isMounted) return;

        if (syncRes.success && syncRes.config) {
          if (syncRes.isDifferent) {
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
        if (isMounted) {
          setIsInitialSyncing(false);
          setIsSyncingData(false);
        }
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

  // Shopee Affiliate Auto-Redirect (Temporarily Disabled by User Request)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for any clicks on Shopee links and open in native app on mobile
    const cleanupInterceptor = initShopeeLinkInterceptors();

    // Disable opening Shopee automatically
    return () => {
      cleanupInterceptor();
    };
  }, []);

  // Manual refresh trigger for public and admin views (Differential sync without clearing local cache)
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setIsSyncingData(true);
    try {
      const res = await fetchAndSyncLatestData(isAdminMode ? 'admin' : 'public');
      if (res.success) {
        if (res.isDifferent && res.config) {
          setConfig(res.config);
          if (res.articles) {
            setArticles(res.articles);
            saveDedicatedPostsCache(res.articles);
          }
          if (res.config.principal) saveDedicatedPrincipalCache(res.config.principal);
          if (res.config.mobileBottomNav) saveDedicatedDockCache(res.config.mobileBottomNav);
          setSyncToast({
            message: 'Data diperbarui dari cloud',
            type: 'success',
          });
        } else {
          setSyncToast({
            message: 'Konten sudah versi terbaru',
            type: 'success',
          });
        }
      } else {
        setSyncToast({
          message: res.message || 'Mode offline (menggunakan cache lokal)',
          type: 'info',
        });
      }
    } catch (err) {
      setSyncToast({
        message: 'Gagal memeriksa pembaruan',
        type: 'info',
      });
    } finally {
      setIsRefreshing(false);
      setIsSyncingData(false);
      setTimeout(() => setSyncToast(null), 1500);
    }
  };

  // Request open admin mode with password protection
  const handleOpenAdmin = () => {
    const isAuth =
      localStorage.getItem('admin_authenticated') === 'true' ||
      sessionStorage.getItem('admin_authenticated') === 'true';
    if (isAuth) {
      try {
        sessionStorage.setItem('admin_mode_active', 'true');
      } catch {}
      setIsAdminMode(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Close admin view and return to public portal
  const handleCloseAdmin = () => {
    setIsAdminMode(false);
    try {
      sessionStorage.removeItem('admin_mode_active');
      sessionStorage.removeItem('admin_active_tab');
      sessionStorage.removeItem('admin_editing_article_id');
      sessionStorage.removeItem('admin_posts_main_tab');
      sessionStorage.removeItem('admin_post_draft_state');
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.searchParams.delete('tab');
      url.searchParams.delete('edit');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    } catch {}
  };

  // Logout and lock admin session
  const handleLogoutAdmin = () => {
    localStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_authenticated');
    handleCloseAdmin();
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

  // Check if current URL is the isolated shareable GTK form link
  const isGTKFormRoute =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('form') === 'gtk' ||
      new URLSearchParams(window.location.search).get('form') === 'datagtk' ||
      window.location.hash === '#datagtk');

  if (isGTKFormRoute) {
    return (
      <>
        <RotateYLoadingScreen
          isVisible={isScreenLoading}
          schoolName={config.identity.name || 'SMPN 1 BENGKALIS'}
          schoolLogo={config.identity.logoUrl}
        />
        <StandaloneGTKFormPage config={config} />
      </>
    );
  }

  // Admin CMS Mode View
  if (isAdminMode) {
    return (
      <>
        <RotateYLoadingScreen
          isVisible={isScreenLoading}
          schoolName={config.identity.name || 'SMPN 1 BENGKALIS'}
          schoolLogo={config.identity.logoUrl}
        />
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
          onCloseAdmin={handleCloseAdmin}
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
      
      {/* Fullscreen Rotate-Y Loading Screen while downloading/syncing assets & data */}
      <RotateYLoadingScreen
        isVisible={isScreenLoading}
        schoolName={config.identity.name || 'SMPN 1 BENGKALIS'}
        schoolLogo={config.identity.logoUrl}
      />

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
          try {
            sessionStorage.setItem('admin_mode_active', 'true');
          } catch {}
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
          visi={config.visi}
          misi={config.misi}
          visiMisiTitle={config.visiMisiTitle}
          visiMisiSubtitle={config.visiMisiSubtitle}
          showVisiMisi={layoutSections.showVisiMisi}
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

      {/* Guru & Tenaga Kependidikan (GTK) Carousel */}
      {layoutSections.showGTK !== false && (
        <GTKCarouselSection config={config} />
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
          onRefreshMap={async () => {
            const syncRes = await fetchAndSyncLatestData();
            if (syncRes.success && syncRes.config) {
              setConfig(syncRes.config);
              setSyncToast({
                message: 'Peta diperbarui dari cloud',
                type: 'success',
              });
              setTimeout(() => {
                setSyncToast(null);
              }, 1500);
            }
          }}
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
