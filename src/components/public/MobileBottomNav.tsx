import React, { useState, useEffect } from 'react';
import { SchoolConfig } from '../../types';
import {
  Home,
  Newspaper,
  Trophy,
  Activity,
  PhoneCall,
} from 'lucide-react';

interface MobileBottomNavProps {
  config: SchoolConfig;
  onOpenContact?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  config,
  onOpenContact,
}) => {
  const bottomNavConfig = config.mobileBottomNav || {
    enabled: true,
    positionMode: 'floating',
    showHome: true,
    showNews: true,
    showAchievements: true,
    showExtracurriculars: true,
    showContact: true,
    styleVariant: 'floating-dock',
    themeColor: 'dark-slate',
    accentColor: 'blue',
    centerButtonShape: 'circle',
    glowEffect: true,
    showLabels: false,
    elevatedCenterButton: true,
    showActiveIndicator: true,
  };

  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'achievements' | 'ekskul' | 'contact'>('home');

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Check if near bottom of page (Kontak / Footer)
      if (window.scrollY + windowHeight >= docHeight - 350) {
        setActiveTab('contact');
        return;
      }

      const ekskulEl = document.getElementById('fasilitas') || document.getElementById('ekskul');
      const newsEl = document.getElementById('berita');

      if (ekskulEl && scrollPos >= ekskulEl.offsetTop - 120 && scrollPos < (ekskulEl.offsetTop + ekskulEl.offsetHeight)) {
        setActiveTab('ekskul');
      } else if (newsEl && scrollPos >= newsEl.offsetTop - 120 && scrollPos < (newsEl.offsetTop + newsEl.offsetHeight)) {
        setActiveTab((prev) => (prev === 'achievements' ? 'achievements' : 'news'));
      } else if (window.scrollY < 400) {
        setActiveTab('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (bottomNavConfig.enabled === false) {
    return null;
  }

  const scrollToElement = (elementId: string) => {
    const el = document.getElementById(elementId) || (elementId === 'kontak' ? document.getElementById('footer') : null);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (elementId === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (elementId === 'kontak') {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    setActiveTab('home');
    scrollToElement('beranda');
  };

  const handleNewsClick = () => {
    setActiveTab('news');
    window.dispatchEvent(new CustomEvent('select-news-category', { detail: 'Semua' }));
    scrollToElement('berita');
  };

  const handleAchievementsClick = () => {
    setActiveTab('achievements');
    window.dispatchEvent(new CustomEvent('select-news-category', { detail: 'Prestasi' }));
    scrollToElement('berita');
  };

  const handleEkskulClick = () => {
    setActiveTab('ekskul');
    window.dispatchEvent(new CustomEvent('select-facility-tab', { detail: 'ekskul' }));
    scrollToElement('fasilitas');
  };

  const handleContactClick = () => {
    setActiveTab('contact');
    if (onOpenContact) {
      onOpenContact();
    } else {
      scrollToElement('kontak');
    }
  };

  // Determine Dock Theme Classes & Styles
  const theme = bottomNavConfig.themeColor || 'dark-slate';
  const accent = bottomNavConfig.accentColor || 'blue';
  const variant = bottomNavConfig.styleVariant || 'floating-dock';
  const positionMode = bottomNavConfig.positionMode || (variant === 'glass-bar' || variant === 'curved-notch' ? 'full-bottom' : 'floating');
  const isFullBottom = positionMode === 'full-bottom';
  const isLight = theme === 'light-modern' || theme === 'pastel-pink';
  const centerShape = bottomNavConfig.centerButtonShape || 'circle';
  const hasGlow = bottomNavConfig.glowEffect !== false;
  const isElevatedCenter = bottomNavConfig.elevatedCenterButton !== false;
  const showLabels = Boolean(bottomNavConfig.showLabels);

  // Theme container classes
  let containerBgClass = 'bg-slate-900/95 backdrop-blur-xl border-slate-700/80 text-white shadow-slate-950/70';
  if (theme === 'deep-navy') {
    containerBgClass = 'bg-slate-950/96 backdrop-blur-xl border-blue-900/80 text-blue-50 shadow-blue-950/70';
  } else if (theme === 'royal-indigo') {
    containerBgClass = 'bg-indigo-950/96 backdrop-blur-xl border-indigo-800/80 text-indigo-50 shadow-indigo-950/70';
  } else if (theme === 'emerald-green') {
    containerBgClass = 'bg-emerald-950/96 backdrop-blur-xl border-emerald-800/80 text-emerald-50 shadow-emerald-950/70';
  } else if (theme === 'light-modern') {
    containerBgClass = 'bg-white/96 backdrop-blur-xl border-slate-200/90 text-slate-800 shadow-slate-300/80';
  } else if (theme === 'pastel-pink') {
    containerBgClass = 'bg-pink-50/96 backdrop-blur-xl border-pink-200/90 text-pink-900 shadow-pink-200/60';
  } else if (theme === 'ocean-gradient') {
    containerBgClass = 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 border-white/20 text-white shadow-blue-900/50';
  } else if (theme === 'sunset-magenta') {
    containerBgClass = 'bg-slate-950/96 backdrop-blur-xl border-pink-900/70 text-slate-100 shadow-purple-950/70';
  }

  // Accent color active classes (Color change from dark/muted to bright luminous)
  const getAccentTextClass = (isActive: boolean) => {
    if (!isActive) {
      if (theme === 'ocean-gradient') return 'text-white/60 hover:text-white';
      return isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400/70 hover:text-slate-200';
    }
    if (theme === 'ocean-gradient') return 'text-white font-bold drop-shadow-sm';
    if (isLight) return 'text-white font-bold';
    
    switch (accent) {
      case 'indigo': return 'text-indigo-300 font-bold drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]';
      case 'emerald': return 'text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]';
      case 'amber': return 'text-amber-300 font-bold drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]';
      case 'rose': return 'text-rose-300 font-bold drop-shadow-[0_0_8px_rgba(253,164,175,0.6)]';
      case 'purple': return 'text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(216,180,254,0.6)]';
      case 'cyan': return 'text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]';
      default: return 'text-blue-300 font-bold drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]';
    }
  };

  const getAccentBgClass = (isActive: boolean) => {
    if (!isActive) {
      if (theme === 'ocean-gradient') return 'group-hover:bg-white/10';
      return isLight ? 'group-hover:bg-slate-100' : 'group-hover:bg-slate-800/50';
    }
    if (theme === 'ocean-gradient') return 'bg-white/25 text-white shadow-sm border border-white/30';
    
    if (isLight) {
      switch (accent) {
        case 'indigo': return 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30';
        case 'emerald': return 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30';
        case 'amber': return 'bg-amber-500 text-white shadow-md shadow-amber-500/30';
        case 'rose': return 'bg-rose-600 text-white shadow-md shadow-rose-600/30';
        case 'purple': return 'bg-purple-600 text-white shadow-md shadow-purple-600/30';
        case 'cyan': return 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30';
        default: return 'bg-blue-600 text-white shadow-md shadow-blue-600/30';
      }
    }

    switch (accent) {
      case 'indigo': return 'bg-indigo-500/25 border border-indigo-400/40 shadow-inner shadow-indigo-500/20';
      case 'emerald': return 'bg-emerald-500/25 border border-emerald-400/40 shadow-inner shadow-emerald-500/20';
      case 'amber': return 'bg-amber-500/25 border border-amber-400/40 shadow-inner shadow-amber-500/20';
      case 'rose': return 'bg-rose-500/25 border border-rose-400/40 shadow-inner shadow-rose-500/20';
      case 'purple': return 'bg-purple-500/25 border border-purple-400/40 shadow-inner shadow-purple-500/20';
      case 'cyan': return 'bg-cyan-500/25 border border-cyan-400/40 shadow-inner shadow-cyan-500/20';
      default: return 'bg-blue-500/25 border border-blue-400/40 shadow-inner shadow-blue-500/20';
    }
  };

  const getHomeCenterBgClass = (isActive: boolean) => {
    if (theme === 'ocean-gradient') {
      return 'bg-white text-blue-600 shadow-lg shadow-blue-900/40';
    }
    if (!isActive) {
      return isLight
        ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-400/40'
        : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-200 hover:text-white shadow-slate-950/60';
    }
    switch (accent) {
      case 'indigo': return 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-indigo-600/50 ring-2 ring-indigo-400/40';
      case 'emerald': return 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 text-white shadow-emerald-600/50 ring-2 ring-emerald-400/40';
      case 'amber': return 'bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 text-white shadow-amber-600/50 ring-2 ring-amber-400/40';
      case 'rose': return 'bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 text-white shadow-rose-600/50 ring-2 ring-rose-400/40';
      case 'purple': return 'bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 text-white shadow-purple-600/50 ring-2 ring-purple-400/40';
      case 'cyan': return 'bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-500 text-white shadow-cyan-600/50 ring-2 ring-cyan-400/40';
      default: return 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-blue-600/50 ring-2 ring-blue-400/40';
    }
  };

  const getGlowShadowStyle = () => {
    if (!hasGlow) return {};
    let glowColor = 'rgba(59, 130, 246, 0.55)'; // blue
    if (accent === 'indigo') glowColor = 'rgba(99, 102, 241, 0.6)';
    if (accent === 'emerald') glowColor = 'rgba(16, 185, 129, 0.6)';
    if (accent === 'amber') glowColor = 'rgba(245, 158, 11, 0.65)';
    if (accent === 'rose') glowColor = 'rgba(244, 63, 94, 0.6)';
    if (accent === 'purple') glowColor = 'rgba(168, 85, 247, 0.65)';
    if (accent === 'cyan') glowColor = 'rgba(6, 182, 212, 0.65)';

    return {
      boxShadow: `0 8px 24px -2px ${glowColor}, 0 2px 8px ${glowColor}`,
    };
  };

  const isPill = variant === 'minimal-pill';
  const isCurvedNotch = variant === 'curved-notch';

  const customStyle: React.CSSProperties = {};
  if (theme === 'custom' && bottomNavConfig.customBgColor) {
    customStyle.backgroundColor = bottomNavConfig.customBgColor;
  }

  // Determine shape class for center button
  let centerShapeClass = 'rounded-2xl';
  if (centerShape === 'circle') centerShapeClass = 'rounded-full';
  else if (centerShape === 'diamond') centerShapeClass = 'rounded-xl rotate-45';
  else if (centerShape === 'pill') centerShapeClass = 'rounded-full px-4';
  else if (centerShape === 'flat') centerShapeClass = 'rounded-xl';

  return (
    <nav
      id="mobile-bottom-nav-dock"
      aria-label="Navigasi Bawah Mobile"
      className={`md:hidden fixed z-40 inset-x-0 ${
        !isFullBottom
          ? 'bottom-3 px-3 flex justify-center pointer-events-none'
          : 'bottom-0 w-full pointer-events-none'
      }`}
    >
      {/* Main Bar / Dock Wrapper */}
      <div
        style={customStyle}
        className={`pointer-events-auto transition-all duration-200 ${
          isFullBottom
            ? `w-full border-t shadow-2xl px-4 py-2 ${containerBgClass}`
            : `max-w-md mx-auto flex items-center justify-between w-full border shadow-2xl ${
                isPill ? 'rounded-full px-3 py-1.5' : 'rounded-2xl p-2'
              } ${containerBgClass} ring-1 ring-white/10`
        }`}
      >
        <div className={`flex items-center justify-between w-full ${isFullBottom ? 'max-w-md mx-auto' : ''}`}>
          
          {/* Item 1: Berita */}
          {bottomNavConfig.showNews !== false && (
            <button
              type="button"
              id="mobile-nav-btn-news"
              onClick={handleNewsClick}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${getAccentTextClass(
                activeTab === 'news'
              )}`}
              title="Berita & Informasi"
              aria-label="Berita & Informasi"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${getAccentBgClass(
                  activeTab === 'news'
                )} ${activeTab === 'news' ? 'scale-105' : ''}`}
              >
                <Newspaper className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'news' ? 'scale-105' : ''}`} />
              </div>
              {showLabels && (
                <span className="text-[10px] font-semibold tracking-tight leading-none mt-1">
                  Berita
                </span>
              )}
            </button>
          )}

          {/* Item 2: Prestasi */}
          {bottomNavConfig.showAchievements !== false && (
            <button
              type="button"
              id="mobile-nav-btn-achievements"
              onClick={handleAchievementsClick}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${getAccentTextClass(
                activeTab === 'achievements'
              )}`}
              title="Prestasi Siswa"
              aria-label="Prestasi Siswa"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${getAccentBgClass(
                  activeTab === 'achievements'
                )} ${activeTab === 'achievements' ? 'scale-105' : ''}`}
              >
                <Trophy className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'achievements' ? 'scale-105' : ''}`} />
              </div>
              {showLabels && (
                <span className="text-[10px] font-semibold tracking-tight leading-none mt-1">
                  Prestasi
                </span>
              )}
            </button>
          )}

          {/* CENTER ITEM: Home (Beranda) */}
          {bottomNavConfig.showHome !== false && (
            <div className="flex items-center justify-center px-1.5 shrink-0">
              {isElevatedCenter ? (
                <button
                  type="button"
                  id="mobile-nav-btn-home-center"
                  onClick={handleHomeClick}
                  style={getGlowShadowStyle()}
                  className={`relative ${
                    isFullBottom ? '-top-4' : '-top-3'
                  } w-12 h-12 flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer border border-white/30 shadow-lg group ${centerShapeClass} ${getHomeCenterBgClass(
                    activeTab === 'home'
                  )} ${activeTab === 'home' ? 'scale-105' : ''}`}
                  title="Beranda (Home)"
                  aria-label="Beranda"
                >
                  <div className={centerShape === 'diamond' ? '-rotate-45' : ''}>
                    <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  id="mobile-nav-btn-home"
                  onClick={handleHomeClick}
                  className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${getAccentTextClass(
                    activeTab === 'home'
                  )}`}
                  title="Beranda"
                  aria-label="Beranda"
                >
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-200 ${getAccentBgClass(
                      activeTab === 'home'
                    )} ${activeTab === 'home' ? 'scale-105' : ''}`}
                  >
                    <Home className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'home' ? 'scale-105' : ''}`} />
                  </div>
                  {showLabels && (
                    <span className="text-[10px] font-semibold tracking-tight leading-none mt-1">
                      Beranda
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Item 3: Ekstrakurikuler */}
          {bottomNavConfig.showExtracurriculars !== false && (
            <button
              type="button"
              id="mobile-nav-btn-ekskul"
              onClick={handleEkskulClick}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${getAccentTextClass(
                activeTab === 'ekskul'
              )}`}
              title="Ekstrakurikuler & Fasilitas"
              aria-label="Ekstrakurikuler & Fasilitas"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${getAccentBgClass(
                  activeTab === 'ekskul'
                )} ${activeTab === 'ekskul' ? 'scale-105' : ''}`}
              >
                <Activity className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'ekskul' ? 'scale-105' : ''}`} />
              </div>
              {showLabels && (
                <span className="text-[10px] font-semibold tracking-tight leading-none mt-1">
                  Ekskul
                </span>
              )}
            </button>
          )}

          {/* Item 4: Kontak (Langsung Mengarah ke Footer / Kontak) */}
          {bottomNavConfig.showContact !== false && (
            <button
              type="button"
              id="mobile-nav-btn-contact"
              onClick={handleContactClick}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer relative group ${getAccentTextClass(
                activeTab === 'contact'
              )}`}
              title="Kontak & Lokasi Sekolah"
              aria-label="Kontak & Lokasi Sekolah"
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${getAccentBgClass(
                  activeTab === 'contact'
                )} ${activeTab === 'contact' ? 'scale-105' : ''}`}
              >
                <PhoneCall className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'contact' ? 'scale-105' : ''}`} />
              </div>
              {showLabels && (
                <span className="text-[10px] font-semibold tracking-tight leading-none mt-1">
                  Kontak
                </span>
              )}
            </button>
          )}

        </div>
      </div>
    </nav>
  );
};
