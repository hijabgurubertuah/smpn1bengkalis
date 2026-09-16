import React, { useState, useEffect, useRef } from 'react';
import { SchoolConfig, NavMenu } from '../../types';
import {
  Menu,
  X,
  ChevronDown,
  School,
  ShieldCheck,
  Settings,
  Search,
  GraduationCap,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { hardResetAppCache } from '../../lib/offlineStorage';

interface NavbarProps {
  config: SchoolConfig;
  onOpenAdmin: () => void;
  onSearchClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onOpenAdmin,
  onSearchClick,
  onRefresh,
  isRefreshing,
}) => {
  const { identity, navMenus, themeConfig } = config;

  const navbarBg = themeConfig?.navbarBgColor;
  const navbarText = themeConfig?.navbarTextColor;
  const primaryColor = themeConfig?.primaryColor;
  const btnBg = themeConfig?.buttonBgColor || primaryColor;
  const btnText = themeConfig?.buttonTextColor;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isHardResetting, setIsHardResetting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside for desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Direct 1-click Hard Reset & Cache Clear
  const handleExecuteHardReset = async () => {
    setIsHardResetting(true);
    await hardResetAppCache();
  };

  // Auto-close mobile menu when tapping or clicking outside the mobile menu list
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // If clicked outside the entire nav bar or on the backdrop
      if (navRef.current && !navRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    setOpenDropdownId(null);
    if (path.startsWith('#')) {
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const activeMenus = navMenus.filter((m) => m.enabled);

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          onTouchStart={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-35 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <nav
        ref={navRef}
        id="main-navbar"
        style={navbarBg ? { backgroundColor: navbarBg } : undefined}
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'shadow-md border-b border-slate-200/80'
            : 'border-b border-slate-100 shadow-xs'
        } ${!navbarBg ? 'bg-white' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#beranda');
            }}
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-1 min-w-0 max-w-full lg:flex-initial"
          >
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden bg-white border border-slate-200/90 flex items-center justify-center shrink-0 shadow-xs p-0.5 sm:p-1 group-hover:scale-105 transition-transform">
              {identity.logoUrl ? (
                <img
                  src={identity.logoUrl}
                  alt={identity.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <School className="w-6 h-6 sm:w-7 sm:h-7 text-blue-700" />
              )}
            </div>

            <div className="flex flex-col min-w-0 overflow-hidden">
              {/* School Name strictly 1 line, enlarged font */}
              <span
                style={navbarText ? { color: navbarText } : undefined}
                className="font-black text-slate-900 text-base xs:text-lg sm:text-2xl tracking-tight leading-tight group-hover:opacity-80 transition-opacity whitespace-nowrap truncate"
              >
                {identity.name}
              </span>

              {/* Motto / Tagline Running Text Marquee */}
              {identity.tagline ? (
                <div
                  style={navbarText ? { color: navbarText, opacity: 0.8 } : undefined}
                  className="overflow-hidden whitespace-nowrap text-[10px] sm:text-xs text-slate-500 font-medium max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm"
                >
                  <div className="inline-block animate-marquee pl-0">
                    {identity.tagline}
                  </div>
                </div>
              ) : null}
            </div>
          </a>

          {/* Desktop Navigation */}
          <div ref={dropdownRef} className="hidden lg:flex items-center gap-1 xl:gap-2">
            {activeMenus.map((menu) => {
              const isDropdownOpen = openDropdownId === menu.id;

              if (menu.isDropdown && menu.dropdownItems && menu.dropdownItems.length > 0) {
                return (
                  <div
                    key={menu.id}
                    className="relative"
                    onMouseEnter={() => setOpenDropdownId(menu.id)}
                    onMouseLeave={() => setOpenDropdownId(null)}
                  >
                    <button
                      type="button"
                      id={`menu-${menu.id}`}
                      onClick={() => setOpenDropdownId(isDropdownOpen ? null : menu.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                        isDropdownOpen
                          ? 'text-blue-700 bg-blue-50/80'
                          : 'text-slate-700 hover:text-blue-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{menu.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isDropdownOpen ? 'rotate-180 text-blue-700' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu Container */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        {menu.dropdownItems.map((subItem) => (
                          <a
                            key={subItem.id}
                            href={subItem.path}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(subItem.path);
                            }}
                            className="block px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
                          >
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                              {subItem.label}
                            </div>
                            {subItem.description && (
                              <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                {subItem.description}
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={menu.id}
                  id={`menu-${menu.id}`}
                  href={menu.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(menu.path);
                  }}
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {menu.label}
                </a>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* PWA In-App Install Button */}
            <PWAInstallButton />

            <a
              href="#berita"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#berita');
              }}
              className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Cari Berita & Pengumuman"
            >
              <Search className="w-5 h-5" />
            </a>

            {/* Dynamic PPDB Button if enabled */}
            {config.ppdb?.enabled === true && (
              <a
                href={config.ppdb?.buttonLink || '#berita'}
                target={config.ppdb?.openInNewTab ? '_blank' : undefined}
                rel={config.ppdb?.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  const link = config.ppdb?.buttonLink || '#berita';
                  if (link.startsWith('#')) {
                    e.preventDefault();
                    handleNavClick(link);
                  }
                }}
                style={btnBg ? { backgroundColor: btnBg, color: btnText || '#ffffff' } : undefined}
                className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer ${
                  !btnBg ? 'bg-blue-700 hover:bg-blue-800 text-white' : ''
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{config.ppdb?.buttonLabel || 'Info PPDB'}</span>
              </a>
            )}

            {/* Direct 1-Click Hard Reset & Clear Cache Button (Right beside Settings) */}
            <button
              id="btn-navbar-refresh"
              type="button"
              onClick={handleExecuteHardReset}
              disabled={isHardResetting}
              className="p-2.5 border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Hard Reset: Bersihkan Seluruh Cache & Muat Ulang Penuh"
              aria-label="Hard Reset dan Bersihkan Cache"
            >
              <RefreshCw className={`w-4 h-4 ${isHardResetting ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            </button>

            {/* The single, unified admin panel button with gear icon */}
            <button
              id="btn-admin-gear"
              onClick={onOpenAdmin}
              className="p-2.5 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-slate-600 hover:text-blue-600 rounded-xl transition-all cursor-pointer shadow-xs group"
              title="Panel Pengelola Admin CMS (Dilindungi Password)"
              aria-label="Panel Admin"
            >
              <Settings className="w-5 h-5 text-slate-600 group-hover:text-blue-600 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Mobile Right Action Area */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />

            {/* Direct 1-Click Hard Reset Button on Mobile */}
            <button
              id="btn-navbar-refresh-mobile"
              type="button"
              onClick={handleExecuteHardReset}
              disabled={isHardResetting}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Hard Reset: Bersihkan Cache & Muat Ulang Penuh"
              aria-label="Hard Reset dan Bersihkan Cache"
            >
              <RefreshCw className={`w-4 h-4 ${isHardResetting ? 'animate-spin text-blue-600' : 'text-slate-700'}`} />
            </button>

            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-3 duration-200">
          {activeMenus.map((menu) => {
            const isDropdownOpen = openDropdownId === menu.id;

            if (menu.isDropdown && menu.dropdownItems && menu.dropdownItems.length > 0) {
              return (
                <div key={menu.id} className="border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setOpenDropdownId(isDropdownOpen ? null : menu.id)}
                    className="flex items-center justify-between w-full py-2 text-base font-semibold text-slate-800"
                  >
                    <span>{menu.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="pl-4 space-y-2 mt-1 bg-slate-50 rounded-lg p-2">
                      {menu.dropdownItems.map((subItem) => (
                        <a
                          key={subItem.id}
                          href={subItem.path}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(subItem.path);
                          }}
                          className="block py-1.5 text-sm text-slate-600 hover:text-blue-700 font-medium"
                        >
                          {subItem.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <a
                key={menu.id}
                href={menu.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(menu.path);
                }}
                className="block py-2 text-base font-semibold text-slate-800 hover:text-blue-700 border-b border-slate-100"
              >
                {menu.label}
              </a>
            );
          })}

          {config.ppdb?.enabled === true && (
            <div className="pt-2 space-y-2">
              <a
                href={config.ppdb?.buttonLink || '#berita'}
                target={config.ppdb?.openInNewTab ? '_blank' : undefined}
                rel={config.ppdb?.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  const link = config.ppdb?.buttonLink || '#berita';
                  if (link.startsWith('#')) {
                    e.preventDefault();
                    handleNavClick(link);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full bg-blue-700 text-white font-bold py-2.5 rounded-lg text-center text-sm"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{config.ppdb?.buttonLabel || 'Info PPDB'}</span>
              </a>
            </div>
          )}

          {/* Login Admin Menu Entry at Bottom of Mobile Menu */}
          <div className="pt-3 border-t border-slate-100">
            <button
              id="btn-login-admin-mobile-menu"
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer border border-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Login</span>
            </button>
          </div>
        </div>
      )}
    </nav>

    {/* Fullscreen Hard Reset Loading Screen */}
    {isHardResetting && (
      <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200">
        <style>{`
          @keyframes rotate-y-anim {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
          }
          .animate-rotate-y {
            animation: rotate-y-anim 2.5s linear infinite;
            transform-style: preserve-3d;
          }
        `}</style>
        <div style={{ perspective: '1000px' }} className="mb-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 p-2.5 flex items-center justify-center shadow-2xl animate-rotate-y">
            {identity.logoUrl ? (
              <img
                src={identity.logoUrl}
                alt={identity.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <School className="w-10 h-10 text-blue-400" />
            )}
          </div>
        </div>
        <h3 className="text-xl font-black text-white tracking-widest animate-pulse">
          Loading......
        </h3>
      </div>
    )}
    </>
  );
};
