import React from 'react';
import { SchoolConfig, LayoutSections, MobileBottomNavConfig } from '../../types';
import {
  Layout,
  Smartphone,
  Home,
  Newspaper,
  Trophy,
  Activity,
  PhoneCall,
  Sparkles,
  Check,
  Eye,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AdminLayoutTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminLayoutTab: React.FC<AdminLayoutTabProps> = ({ config, onChange }) => {
  const { layoutSections } = config;

  const bottomNavConfig: MobileBottomNavConfig = config.mobileBottomNav || {
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

  const toggleSection = (key: keyof LayoutSections) => {
    onChange({
      ...config,
      layoutSections: {
        ...layoutSections,
        [key]: !layoutSections[key],
      },
    });
  };

  const updateBottomNav = (partial: Partial<MobileBottomNavConfig>) => {
    onChange({
      ...config,
      mobileBottomNav: {
        ...bottomNavConfig,
        ...partial,
      },
    });
  };

  const sectionsList: Array<{
    key: keyof LayoutSections;
    title: string;
  }> = [
    { key: 'showHero', title: 'Banner Utama (Hero)' },
    { key: 'showAccreditation', title: 'Pita Akreditasi & NPSN' },
    { key: 'showQuickStats', title: 'Kartu Statistik Hero' },
    { key: 'showPrincipalSpeech', title: 'Sambutan Pimpinan' },
    { key: 'showNews', title: 'Berita & Pengumuman' },
    { key: 'showAgenda', title: 'Agenda & Kegiatan' },
    { key: 'showFacilities', title: 'Fasilitas Instansi' },
    { key: 'showExtracurriculars', title: 'Ekstrakurikuler' },
    { key: 'showVideoEmbed', title: 'Video Profil (YouTube)' },
    { key: 'showMapEmbed', title: 'Peta Lokasi (Google Maps)' },
    { key: 'showPublicComments', title: 'Komentar & Aspirasi Publik (Bawah Halaman)' },
  ];

  const themePresets = [
    { id: 'dark-slate', name: 'Dark Slate', bg: 'bg-slate-900', border: 'border-slate-700' },
    { id: 'deep-navy', name: 'Deep Navy', bg: 'bg-slate-950', border: 'border-blue-900' },
    { id: 'royal-indigo', name: 'Royal Indigo', bg: 'bg-indigo-950', border: 'border-indigo-800' },
    { id: 'emerald-green', name: 'Emerald', bg: 'bg-emerald-950', border: 'border-emerald-800' },
    { id: 'light-modern', name: 'White Glass', bg: 'bg-white', border: 'border-slate-300' },
    { id: 'pastel-pink', name: 'Pastel Rose', bg: 'bg-pink-100', border: 'border-pink-300' },
    { id: 'ocean-gradient', name: 'Ocean Sky', bg: 'bg-gradient-to-r from-sky-500 to-indigo-600', border: 'border-blue-400' },
    { id: 'sunset-magenta', name: 'Sunset Magenta', bg: 'bg-slate-950', border: 'border-pink-800' },
    { id: 'custom', name: 'Kustom', bg: 'bg-gradient-to-r from-blue-600 to-purple-600', border: 'border-slate-400' },
  ];

  const accentColors = [
    { id: 'blue', name: 'Biru', class: 'bg-blue-600' },
    { id: 'indigo', name: 'Indigo', class: 'bg-indigo-600' },
    { id: 'emerald', name: 'Hijau', class: 'bg-emerald-600' },
    { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
    { id: 'rose', name: 'Rose', class: 'bg-rose-600' },
    { id: 'purple', name: 'Ungu', class: 'bg-purple-600' },
    { id: 'cyan', name: 'Cyan', class: 'bg-cyan-600' },
  ];

  const buttonShapes = [
    { id: 'circle', label: 'Bulat', icon: '●' },
    { id: 'rounded-square', label: 'Squircle', icon: '■' },
    { id: 'diamond', label: 'Diamond', icon: '◆' },
    { id: 'pill', label: 'Kapsul', icon: '⬭' },
    { id: 'flat', label: 'Datar', icon: '▬' },
  ];

  const isFullBottom = bottomNavConfig.positionMode === 'full-bottom';

  return (
    <div className="space-y-6">
      
      {/* 1. Mobile Bottom Dock Customizer */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-5">
        
        {/* Header Toggle */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Docker</h3>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              id="toggle-mobile-bottom-nav"
              checked={bottomNavConfig.enabled !== false}
              onChange={(e) => updateBottomNav({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {bottomNavConfig.enabled !== false && (
          <div className="space-y-5">
            
            {/* 1. Live Visual Preview Mockup (Placed at top) */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  Pratinjau Docker
                </span>
                <span className="font-mono text-[11px]">
                  {isFullBottom ? 'Bawah Penuh' : 'Melayang'} • {bottomNavConfig.centerButtonShape || 'circle'}
                </span>
              </div>

              {/* Realistic Container with transparent backdrop */}
              <div className="bg-gradient-to-b from-slate-950/60 to-slate-900/90 rounded-xl p-6 border border-slate-800/80 flex items-center justify-center min-h-[110px] relative overflow-hidden">
                
                {/* Subtle Grid / Content Mockup Behind to verify 100% transparency */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Dock Mockup */}
                <div
                  className={`transition-all duration-200 flex items-center justify-between px-3 py-2 border shadow-2xl relative z-10 ${
                    isFullBottom
                      ? 'w-full max-w-sm rounded-none border-x-0 border-t'
                      : 'w-full max-w-xs rounded-full'
                  } ${
                    bottomNavConfig.themeColor === 'light-modern'
                      ? 'bg-white text-slate-800 border-slate-200 shadow-slate-300/80'
                      : bottomNavConfig.themeColor === 'pastel-pink'
                      ? 'bg-pink-50 text-pink-900 border-pink-200'
                      : bottomNavConfig.themeColor === 'ocean-gradient'
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border-white/20'
                      : bottomNavConfig.themeColor === 'deep-navy'
                      ? 'bg-slate-950 text-blue-50 border-blue-900'
                      : bottomNavConfig.themeColor === 'royal-indigo'
                      ? 'bg-indigo-950 text-indigo-50 border-indigo-800'
                      : bottomNavConfig.themeColor === 'emerald-green'
                      ? 'bg-emerald-950 text-emerald-50 border-emerald-800'
                      : 'bg-slate-900 text-white border-slate-700/80'
                  }`}
                  style={
                    bottomNavConfig.themeColor === 'custom' && bottomNavConfig.customBgColor
                      ? { backgroundColor: bottomNavConfig.customBgColor }
                      : undefined
                  }
                >
                  {/* News (Active Highlight Example) */}
                  {bottomNavConfig.showNews !== false && (
                    <div className="flex-1 flex flex-col items-center justify-center p-1">
                      <div className={`p-1.5 rounded-xl ${
                        bottomNavConfig.themeColor === 'light-modern'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : bottomNavConfig.themeColor === 'pastel-pink'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : bottomNavConfig.themeColor === 'ocean-gradient'
                          ? 'bg-white/25 text-white shadow-xs'
                          : 'bg-blue-500/25 border border-blue-400/40 text-blue-300 shadow-inner'
                      }`}>
                        <Newspaper className="w-4 h-4" />
                      </div>
                      {bottomNavConfig.showLabels && (
                        <span className={`text-[9px] font-bold mt-1 ${
                          bottomNavConfig.themeColor === 'light-modern'
                            ? 'text-blue-600'
                            : bottomNavConfig.themeColor === 'pastel-pink'
                            ? 'text-pink-600'
                            : 'text-blue-300'
                        }`}>
                          Berita
                        </span>
                      )}
                    </div>
                  )}

                  {/* Achievements */}
                  {bottomNavConfig.showAchievements !== false && (
                    <div className="flex-1 flex flex-col items-center justify-center p-1 text-slate-400/70">
                      <div className="p-1.5 rounded-xl">
                        <Trophy className="w-4 h-4" />
                      </div>
                      {bottomNavConfig.showLabels && (
                        <span className="text-[9px] font-semibold mt-1">Prestasi</span>
                      )}
                    </div>
                  )}

                  {/* Center Home */}
                  {bottomNavConfig.showHome !== false && (
                    <div className="px-1 shrink-0 flex items-center justify-center">
                      {bottomNavConfig.elevatedCenterButton !== false ? (
                        <div
                          className={`-top-3 relative w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg border border-white/30 ${
                            bottomNavConfig.centerButtonShape === 'diamond'
                              ? 'rotate-45 rounded-xl'
                              : bottomNavConfig.centerButtonShape === 'rounded-square'
                              ? 'rounded-2xl'
                              : bottomNavConfig.centerButtonShape === 'pill'
                              ? 'rounded-full px-3'
                              : bottomNavConfig.centerButtonShape === 'flat'
                              ? 'rounded-xl top-0'
                              : 'rounded-full'
                          }`}
                        >
                          <Home
                            className={`w-4 h-4 ${
                              bottomNavConfig.centerButtonShape === 'diamond' ? '-rotate-45' : ''
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-1 text-slate-400/70">
                          <div className="p-1.5 rounded-xl">
                            <Home className="w-4 h-4" />
                          </div>
                          {bottomNavConfig.showLabels && (
                            <span className="text-[9px] font-semibold mt-1">Beranda</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ekskul */}
                  {bottomNavConfig.showExtracurriculars !== false && (
                    <div className="flex-1 flex flex-col items-center justify-center p-1 text-slate-400/70">
                      <div className="p-1.5 rounded-xl">
                        <Activity className="w-4 h-4" />
                      </div>
                      {bottomNavConfig.showLabels && (
                        <span className="text-[9px] font-semibold mt-1">Ekskul</span>
                      )}
                    </div>
                  )}

                  {/* Contact */}
                  {bottomNavConfig.showContact !== false && (
                    <div className="flex-1 flex flex-col items-center justify-center p-1 text-slate-400/70">
                      <div className="p-1.5 rounded-xl">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      {bottomNavConfig.showLabels && (
                        <span className="text-[9px] font-semibold mt-1">Kontak</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* 2. Mode Posisi */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Mode Posisi</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateBottomNav({ positionMode: 'full-bottom', styleVariant: 'glass-bar' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isFullBottom
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Bawah Penuh</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateBottomNav({ positionMode: 'floating', styleVariant: 'floating-dock' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    !isFullBottom
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Melayang (Floating)</span>
                </button>
              </div>
            </div>

            {/* 3. Bentuk Tombol Utama */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Bentuk Tombol Utama</span>
              <div className="grid grid-cols-5 gap-1.5">
                {buttonShapes.map((shape) => {
                  const isSelected = (bottomNavConfig.centerButtonShape || 'circle') === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => updateBottomNav({ centerButtonShape: shape.id as any })}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={shape.label}
                    >
                      <div className="text-sm leading-none mb-1">{shape.icon}</div>
                      <div className="text-[10px] truncate">{shape.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Warna Latar dan Aksen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tema Latar */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Warna Latar</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {themePresets.map((tp) => {
                    const isSelected = (bottomNavConfig.themeColor || 'dark-slate') === tp.id;
                    return (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => updateBottomNav({ themeColor: tp.id as any })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform relative flex items-center justify-center ${tp.bg} ${tp.border} ${
                          isSelected ? 'scale-115 ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        title={tp.name}
                      >
                        {isSelected && <Check className={`w-3.5 h-3.5 ${tp.id === 'light-modern' || tp.id === 'pastel-pink' ? 'text-slate-900' : 'text-white'}`} />}
                      </button>
                    );
                  })}

                  {bottomNavConfig.themeColor === 'custom' && (
                    <input
                      type="color"
                      value={bottomNavConfig.customBgColor || '#0f172a'}
                      onChange={(e) => updateBottomNav({ customBgColor: e.target.value })}
                      className="w-7 h-7 rounded-full cursor-pointer border border-slate-300 p-0 ml-1"
                      title="Pilih Warna Hex"
                    />
                  )}
                </div>
              </div>

              {/* Warna Aksen */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Warna Aksen</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {accentColors.map((ac) => {
                    const isSelected = (bottomNavConfig.accentColor || 'blue') === ac.id;
                    return (
                      <button
                        key={ac.id}
                        type="button"
                        onClick={() => updateBottomNav({ accentColor: ac.id as any })}
                        className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${ac.class} ${
                          isSelected ? 'scale-115 ring-2 ring-slate-800 ring-offset-2 shadow-xs' : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        title={ac.name}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 5. Ikon */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700">Ikon</span>

              <div className="flex flex-wrap gap-2">
                {/* Menu items */}
                {[
                  { key: 'showNews', label: 'Berita', icon: Newspaper, checked: bottomNavConfig.showNews !== false },
                  { key: 'showAchievements', label: 'Prestasi', icon: Trophy, checked: bottomNavConfig.showAchievements !== false },
                  { key: 'showHome', label: 'Beranda', icon: Home, checked: bottomNavConfig.showHome !== false },
                  { key: 'showExtracurriculars', label: 'Ekskul', icon: Activity, checked: bottomNavConfig.showExtracurriculars !== false },
                  { key: 'showContact', label: 'Kontak', icon: PhoneCall, checked: bottomNavConfig.showContact !== false },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateBottomNav({ [item.key]: !item.checked })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        item.checked
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* Effect options */}
                <button
                  type="button"
                  onClick={() => updateBottomNav({ glowEffect: bottomNavConfig.glowEffect === false })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    bottomNavConfig.glowEffect !== false
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Efek Glow</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateBottomNav({ elevatedCenterButton: bottomNavConfig.elevatedCenterButton === false })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    bottomNavConfig.elevatedCenterButton !== false
                      ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>Tombol Menonjol</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateBottomNav({ showLabels: !bottomNavConfig.showLabels })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                    bottomNavConfig.showLabels
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>Label Teks</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 2. Main Page Layout Sections Toggles */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-blue-600" />
          <span>Seksi Halaman Web</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {sectionsList.map((sec) => {
            const isEnabled = layoutSections[sec.key];
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => toggleSection(sec.key)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                  isEnabled
                    ? 'bg-blue-50/60 border-blue-200 text-blue-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-xs truncate">{sec.title}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

