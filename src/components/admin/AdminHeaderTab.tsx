import React from 'react';
import { SchoolConfig } from '../../types';
import { Sparkles, Image as ImageIcon, Sliders, Globe, RefreshCw, Check, Plus, Trash2 } from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

const DEFAULT_FAVICON_FALLBACK = 'https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png';

interface AdminHeaderTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminHeaderTab: React.FC<AdminHeaderTabProps> = ({ config, onChange }) => {
  const { identity, header } = config;

  const updateIdentity = (key: keyof typeof identity, value: any) => {
    onChange({
      ...config,
      identity: {
        ...identity,
        [key]: value,
      },
    });
  };

  const updateHeader = (key: keyof typeof header, value: any) => {
    onChange({
      ...config,
      header: {
        ...header,
        [key]: value,
      },
    });
  };

  const updateHighlight = (id: string, field: string, value: any) => {
    const updated = header.highlights.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateHeader('highlights', updated);
  };

  const addHighlight = () => {
    const newId = 'hl-' + Date.now();
    const newItem = {
      id: newId,
      label: 'Statistik Baru',
      value: '0',
      icon: 'bookopen',
      useCustomGradient: false,
      bgGradientFrom: '#2563eb',
      bgGradientTo: '#7c3aed',
    };
    updateHeader('highlights', [...(header.highlights || []), newItem]);
  };

  const deleteHighlight = (id: string) => {
    const updated = (header.highlights || []).filter((item) => item.id !== id);
    updateHeader('highlights', updated);
  };

  const createDefaultHighlights = () => {
    const defaults = [
      { id: 'hl-1', label: 'Guru & Staf', value: '45+', icon: 'users', useCustomGradient: false, bgGradientFrom: '#2563eb', bgGradientTo: '#7c3aed' },
      { id: 'hl-2', label: 'Siswa Aktif', value: '720+', icon: 'graduationcap', useCustomGradient: false, bgGradientFrom: '#059669', bgGradientTo: '#0d9488' },
      { id: 'hl-3', label: 'Ekstrakurikuler', value: '18+', icon: 'award', useCustomGradient: false, bgGradientFrom: '#ea580c', bgGradientTo: '#e11d48' },
      { id: 'hl-4', label: 'Ruang Belajar', value: '24', icon: 'bookopen', useCustomGradient: false, bgGradientFrom: '#4f46e5', bgGradientTo: '#06b6d4' },
    ];
    updateHeader('highlights', defaults);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Identitas Instansi */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Identitas Instansi</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Instansi
            </label>
            <AutoResizeTextarea
              minRows={1}
              value={identity.name}
              onChange={(e) => updateIdentity('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              placeholder="Nama instansi / lembaga..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Singkat
            </label>
            <AutoResizeTextarea
              minRows={1}
              value={identity.shortName || ''}
              onChange={(e) => updateIdentity('shortName', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              placeholder="Singkatan nama..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tagline / Visi Singkat
            </label>
            <AutoResizeTextarea
              minRows={1}
              value={identity.tagline}
              onChange={(e) => updateIdentity('tagline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              placeholder="Motto instansi..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPSN / Kode Registrasi
              </label>
              <input
                type="text"
                value={identity.npsn}
                onChange={(e) => updateIdentity('npsn', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="NPSN / Kode Registrasi..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Akreditasi / Status
              </label>
              <input
                type="text"
                value={identity.akreditasi}
                onChange={(e) => updateIdentity('akreditasi', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Akreditasi A"
              />
            </div>
          </div>

          <div>
            <ImageUploadButton
              label="Logo Instansi (Header & Navbar)"
              value={identity.logoUrl}
              onChange={(url) => {
                onChange({
                  ...config,
                  identity: {
                    ...identity,
                    logoUrl: url,
                    faviconUrl:
                      !identity.faviconUrl || identity.faviconUrl === identity.logoUrl
                        ? url
                        : identity.faviconUrl,
                  },
                });
              }}
              preset="logo"
              aspectRatio="square"
              placeholder="URL Logo..."
            />
          </div>

          {/* Dedicated Custom Favicon Upload Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">
                  Favicon Kustom (Ikon Tab Browser & PWA)
                </span>
              </div>
              <span className="text-[10px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Multi-Format (PNG, ICO, SVG)
              </span>
            </div>

            {/* Live Browser Tab Preview Mockup */}
            <div className="bg-slate-200/70 p-2.5 rounded-lg border border-slate-300 flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Pratinjau Tab Browser:</span>
              <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-t-md border-t border-x border-slate-300 shadow-xs max-w-xs truncate">
                {identity.faviconUrl || identity.logoUrl ? (
                  <img
                    src={identity.faviconUrl || identity.logoUrl}
                    alt="Favicon"
                    className="w-4 h-4 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {identity.shortName || identity.name || 'Portal Resmi'} - Portal Resmi
                </span>
              </div>
            </div>

            {/* Favicon Upload Component */}
            <ImageUploadButton
              label="Unggah Berkas Favicon Baru"
              value={identity.faviconUrl || ''}
              onChange={(url) => updateIdentity('faviconUrl', url)}
              preset="favicon"
              aspectRatio="square"
              placeholder="Tempel tautan gambar atau upload file favicon..."
            />

            {/* Quick Action Helpers */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80">
              {identity.logoUrl && identity.faviconUrl !== identity.logoUrl && (
                <button
                  type="button"
                  onClick={() => updateIdentity('faviconUrl', identity.logoUrl)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Gunakan Logo Sekolah Sebagai Favicon
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Banner Utama (Hero) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <span>Banner Utama (Hero)</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Banner
            </label>
            <AutoResizeTextarea
              minRows={1}
              value={header.heroTitle}
              onChange={(e) => updateHeader('heroTitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subjudul Banner
            </label>
            <AutoResizeTextarea
              minRows={2}
              value={header.heroSubtitle}
              onChange={(e) => updateHeader('heroSubtitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
          </div>

          <div>
            <ImageUploadButton
              label="Gambar Latar Banner"
              value={header.heroImageUrl}
              onChange={(url) => updateHeader('heroImageUrl', url)}
              preset="banner"
              aspectRatio="banner"
              layout="vertical"
              placeholder="URL Gambar Banner..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-blue-700 block">Tombol Utama</span>
              <input
                type="text"
                placeholder="Teks Tombol"
                value={header.heroCtaText}
                onChange={(e) => updateHeader('heroCtaText', e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Link Target"
                value={header.heroCtaLink}
                onChange={(e) => updateHeader('heroCtaLink', e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Tombol Sekunder</span>
              <input
                type="text"
                placeholder="Teks Tombol"
                value={header.secondaryCtaText}
                onChange={(e) => updateHeader('secondaryCtaText', e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
              <input
                type="text"
                placeholder="Link Target"
                value={header.secondaryCtaLink}
                onChange={(e) => updateHeader('secondaryCtaLink', e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* 4 Kartu Statistik Ringkas */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Kartu Statistik Hero ({header.highlights?.length || 0})</span>
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={createDefaultHighlights}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-300 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Gunakan 4 Default</span>
              </button>
              <button
                type="button"
                onClick={addHighlight}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kartu</span>
              </button>
            </div>
          </div>

          {!header.highlights || header.highlights.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-3">
              <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Belum Ada Kartu Statistik Hero</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Tampilkan pencapaian sekolah (misalnya Jumlah Siswa, Guru, Akreditasi) langsung di banner utama halaman depan dengan mengaktifkan tombol statistik.
                </p>
              </div>
              <button
                type="button"
                onClick={createDefaultHighlights}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat 4 Kartu Statistik Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {header.highlights.map((item) => (
                <div key={item.id} className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 flex flex-col justify-between group/card pt-7">
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => deleteHighlight(item.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
                    title="Hapus Kartu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Label (Contoh: Siswa Aktif)"
                      value={item.label}
                      onChange={(e) => updateHighlight(item.id, 'label', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Nilai (Contoh: 750+)"
                      value={item.value}
                      onChange={(e) => updateHighlight(item.id, 'value', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={item.icon || 'bookopen'}
                      onChange={(e) => updateHighlight(item.id, 'icon', e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 text-[10px] bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                    >
                      <option value="bookopen">📖 Buku / Pelajaran</option>
                      <option value="users">👥 Pengguna / Siswa</option>
                      <option value="graduationcap">🎓 Topi Toga / Lulusan</option>
                      <option value="award">🏆 Piala / Prestasi</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
