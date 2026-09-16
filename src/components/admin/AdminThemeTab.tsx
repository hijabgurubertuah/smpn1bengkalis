import React from 'react';
import { SchoolConfig, ThemeConfig } from '../../types';
import { DEFAULT_THEME_CONFIG } from '../../lib/themePresets';
import { Palette, RotateCcw, Sparkles } from 'lucide-react';

interface AdminThemeTabProps {
  config: SchoolConfig;
  onChange: (newConfig: SchoolConfig) => void;
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const MinimalColorItem: React.FC<ColorFieldProps> = ({ id, label, value, onChange }) => {
  const safeHex = value?.startsWith('#') ? value : '#000000';

  return (
    <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs">
      <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
        {label}
      </span>
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider select-all">
          {safeHex}
        </span>
        <label
          htmlFor={id}
          className="relative w-10 h-10 rounded-xl border-2 border-slate-200/90 shadow-xs overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shrink-0 ring-1 ring-black/5"
          style={{ backgroundColor: safeHex }}
          title={`Pilih ${label}`}
        >
          <input
            id={id}
            type="color"
            value={safeHex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};

export const AdminThemeTab: React.FC<AdminThemeTabProps> = ({ config, onChange }) => {
  const theme: ThemeConfig = config.themeConfig || DEFAULT_THEME_CONFIG;

  const updateTheme = (updatedFields: Partial<ThemeConfig>) => {
    onChange({
      ...config,
      themeConfig: {
        ...theme,
        ...updatedFields,
      },
    });
  };

  const activePrimary = theme.primaryColor || '#2563eb';
  const activeHover = theme.primaryHoverColor || '#1d4ed8';
  const activeHeaderBg = theme.headerBgColor || '#0f172a';
  const activeNavbarBg = theme.navbarBgColor || '#ffffff';
  const activeNavbarText = theme.navbarTextColor || '#0f172a';
  const activeBtnBg = theme.buttonBgColor || '#2563eb';
  const activeBtnText = theme.buttonTextColor || '#ffffff';
  const activeFooterBg = theme.footerBgColor || '#0f172a';
  const activeAccent = theme.accentColor || '#f59e0b';
  const activeBannerColor = theme.bannerOverlayColor || '#0f172a';
  const activeBannerOpacity = typeof theme.bannerOverlayOpacity === 'number' ? theme.bannerOverlayOpacity : 45;
  const activeCardStroke = theme.cardStrokeColor || '#b45309';
  const activeCardStrokeWidth = typeof theme.cardStrokeWidth === 'number' ? theme.cardStrokeWidth : 2;
  const statCardUseGradient = typeof theme.statCardUseGradient === 'boolean' ? theme.statCardUseGradient : false;
  const statCardGradientFrom = theme.statCardGradientFrom || '#2563eb';
  const statCardGradientTo = theme.statCardGradientTo || '#7c3aed';

  const colorItems: ColorFieldProps[] = [
    {
      id: 'color-navbar-bg',
      label: 'Warna Bilah Menu Navigasi (Navbar)',
      value: activeNavbarBg,
      onChange: (val) => updateTheme({ navbarBgColor: val }),
    },
    {
      id: 'color-navbar-text',
      label: 'Warna Teks & Menu Navigasi',
      value: activeNavbarText,
      onChange: (val) => updateTheme({ navbarTextColor: val }),
    },
    {
      id: 'color-primary',
      label: 'Warna Utama Website (Primary)',
      value: activePrimary,
      onChange: (val) => updateTheme({ primaryColor: val }),
    },
    {
      id: 'color-hover',
      label: 'Warna Sorotan / Hover Utama',
      value: activeHover,
      onChange: (val) => updateTheme({ primaryHoverColor: val }),
    },
    {
      id: 'color-card-stroke',
      label: 'Warna Garis Tepi Kartu (Card Stroke)',
      value: activeCardStroke,
      onChange: (val) => updateTheme({ cardStrokeColor: val }),
    },
    {
      id: 'color-btn-bg',
      label: 'Warna Tombol Utama',
      value: activeBtnBg,
      onChange: (val) => updateTheme({ buttonBgColor: val }),
    },
    {
      id: 'color-btn-text',
      label: 'Warna Teks Tombol Utama',
      value: activeBtnText,
      onChange: (val) => updateTheme({ buttonTextColor: val }),
    },
    {
      id: 'color-banner-overlay',
      label: 'Warna Gradasi Latar Banner',
      value: activeBannerColor,
      onChange: (val) => updateTheme({ bannerOverlayColor: val }),
    },
    {
      id: 'color-header-bg',
      label: 'Warna Latar Header',
      value: activeHeaderBg,
      onChange: (val) => updateTheme({ headerBgColor: val }),
    },
    {
      id: 'color-footer-bg',
      label: 'Warna Latar Footer',
      value: activeFooterBg,
      onChange: (val) => updateTheme({ footerBgColor: val }),
    },
    {
      id: 'color-accent',
      label: 'Warna Aksen / Lencana',
      value: activeAccent,
      onChange: (val) => updateTheme({ accentColor: val }),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Reset Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-blue-600 shrink-0" />
          <h3 className="text-base font-extrabold text-slate-900">
            Warna & Tema Website
          </h3>
        </div>

        <button
          type="button"
          onClick={() => updateTheme(DEFAULT_THEME_CONFIG)}
          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Kebawaan</span>
        </button>
      </div>

      {/* Grid Kotak Warna Minimalis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {colorItems.map((item) => (
          <MinimalColorItem
            key={item.id}
            id={item.id}
            label={item.label}
            value={item.value}
            onChange={item.onChange}
          />
        ))}

        {/* Pengaturan Kegelapan Gradasi Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
              Tingkat Kegelapan Gradasi Banner
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {activeBannerOpacity}%
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-72">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">0% (Bening/Terang)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={activeBannerOpacity}
              onChange={(e) => updateTheme({ bannerOverlayOpacity: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <span className="text-[11px] text-slate-400 font-bold shrink-0">100% (Gelap)</span>
          </div>
        </div>

        {/* Pengaturan Ketebalan Garis Tepi Kartu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
              Ketebalan Garis Tepi Kartu (Card Stroke Width)
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {activeCardStrokeWidth}px
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-72">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">1px (Tipis)</span>
            <input
              type="range"
              min="1"
              max="6"
              value={activeCardStrokeWidth}
              onChange={(e) => updateTheme({ cardStrokeWidth: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <span className="text-[11px] text-slate-400 font-bold shrink-0">6px (Tebal)</span>
          </div>
        </div>

        {/* Pengaturan Warna Kartu Statistik Hero */}
        <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs col-span-1 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight block">
                Tema Warna Kartu Statistik Hero (4 Kartu Utama)
              </span>
              <p className="text-[11px] text-slate-500">
                Warna seragam untuk keempat kartu pencapaian/statistik di bagian banner utama (Hero).
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shrink-0">
              <input
                type="checkbox"
                checked={statCardUseGradient}
                onChange={(e) => updateTheme({ statCardUseGradient: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 select-none">Aktifkan Warna Gradasi</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 block">Warna Utama / Awal (From)</span>
                <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">{statCardGradientFrom}</span>
              </div>
              <input
                type="color"
                value={statCardGradientFrom}
                onChange={(e) => updateTheme({ statCardGradientFrom: e.target.value })}
                className="w-10 h-10 p-0.5 border border-slate-300 rounded-xl cursor-pointer bg-white shrink-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 block">Warna Gradasi Akhir (To)</span>
                <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase">{statCardGradientTo}</span>
              </div>
              <input
                type="color"
                disabled={!statCardUseGradient}
                value={statCardGradientTo}
                onChange={(e) => updateTheme({ statCardGradientTo: e.target.value })}
                className="w-10 h-10 p-0.5 border border-slate-300 rounded-xl cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              />
            </div>
          </div>

          {statCardUseGradient && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Template Gradasi:</span>
              <button
                type="button"
                onClick={() => updateTheme({ statCardGradientFrom: '#2563eb', statCardGradientTo: '#7c3aed' })}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer transition-colors"
              >
                Biru - Ungu
              </button>
              <button
                type="button"
                onClick={() => updateTheme({ statCardGradientFrom: '#059669', statCardGradientTo: '#0d9488' })}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer transition-colors"
              >
                Teal - Hijau
              </button>
              <button
                type="button"
                onClick={() => updateTheme({ statCardGradientFrom: '#ea580c', statCardGradientTo: '#e11d48' })}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 cursor-pointer transition-colors"
              >
                Merah - Oranye
              </button>
              <button
                type="button"
                onClick={() => updateTheme({ statCardGradientFrom: '#ec4899', statCardGradientTo: '#8b5cf6' })}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 cursor-pointer transition-colors"
              >
                Pink - Ungu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mini Simulasi Pratinjau Tampilan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Simulasi Tampilan Tema
          </h4>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-300 shadow-sm">
          {/* Mini Navbar */}
          <div
            className="p-3 border-b flex items-center justify-between transition-colors"
            style={{ backgroundColor: activeNavbarBg, color: activeNavbarText }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-[11px]"
                style={{ backgroundColor: activePrimary }}
              >
                S
              </div>
              <span className="text-xs font-bold truncate">SMP Negeri 1 Bengkalis</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span>Beranda</span>
              <span>Profil</span>
              <span
                className="px-2 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: activeBtnBg, color: activeBtnText }}
              >
                PPDB
              </span>
            </div>
          </div>

          {/* Mini Hero Banner */}
          <div
            className="p-5 relative overflow-hidden flex items-center justify-between"
            style={{ backgroundColor: activeHeaderBg }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: activeBannerColor,
                opacity: activeBannerOpacity / 100,
              }}
            />
            <div className="relative z-10 space-y-1.5 max-w-sm">
              <span
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-block"
                style={{ backgroundColor: activeAccent, color: '#ffffff' }}
              >
                Unggul & Berkarakter
              </span>
              <div className="text-sm font-black text-white">Selamat Datang di Portal Sekolah</div>
              <div className="pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-transform"
                  style={{ backgroundColor: activeBtnBg, color: activeBtnText }}
                >
                  Daftar Sekarang
                </button>
              </div>
            </div>

            {/* Mini Stat Card with Card Stroke */}
            <div className="relative z-10 hidden sm:flex items-center gap-2">
              <div
                className="p-[2px] rounded-xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${activeCardStroke}, #0f172a)`,
                }}
              >
                <div className="bg-slate-900/95 px-3 py-2 rounded-[10px] text-center">
                  <div className="text-[10px] font-bold" style={{ color: activeCardStroke }}>
                    Stroke Kartu
                  </div>
                  <div className="text-xs font-extrabold text-white">4 Kartu Hero</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Footer */}
          <div
            className="p-2.5 text-center text-[10px] text-white/80 transition-colors"
            style={{ backgroundColor: activeFooterBg }}
          >
            © SMP Negeri 1 Bengkalis • Hak Cipta Dilindungi
          </div>
        </div>
      </div>

    </div>
  );
};
