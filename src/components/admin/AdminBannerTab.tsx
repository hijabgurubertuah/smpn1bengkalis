import React from 'react';
import { SchoolConfig } from '../../types';
import { Sparkles, Image as ImageIcon, Sliders, Plus, Trash2, Layers, AlignLeft, AlignCenter, AlignRight, MoveVertical, Play } from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminBannerTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminBannerTab: React.FC<AdminBannerTabProps> = ({ config, onChange }) => {
  const { header } = config;

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

  // Carousel image helpers
  const carouselImages = header.carouselImages || [];
  const addCarouselImage = (url: string) => {
    if (!url) return;
    updateHeader('carouselImages', [...carouselImages, url]);
  };
  const removeCarouselImage = (index: number) => {
    const updated = carouselImages.filter((_, i) => i !== index);
    updateHeader('carouselImages', updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Modul Utama Banner (Header) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Pengaturan Modular Banner Utama (Hero)</span>
          </h3>
          <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
            Modul Khusus Banner
          </span>
        </div>

        {/* Tulisan & Subtitle */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tulisan / Judul Utama Banner
            </label>
            <AutoResizeTextarea
              minRows={1}
              value={header.heroTitle}
              onChange={(e) => updateHeader('heroTitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              placeholder="Masukkan judul banner utama..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi atau Subtitle
            </label>
            <AutoResizeTextarea
              minRows={2}
              value={header.heroSubtitle}
              onChange={(e) => updateHeader('heroSubtitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              placeholder="Masukkan deskripsi atau subtitle banner..."
            />
          </div>
        </div>

        {/* Background / Gambar Tunggal Banner */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Background / Gambar Utama Banner</span>
          </h4>
          <ImageUploadButton
            label="Gambar Latar Utama (Default)"
            value={header.heroImageUrl}
            onChange={(url) => updateHeader('heroImageUrl', url)}
            preset="banner"
            aspectRatio="banner"
            layout="vertical"
            placeholder="URL Gambar Banner Utama..."
          />
        </div>

        {/* Carousel Gambar & Pengaturan Otomatis */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Carousel Gambar (Rotasi Otomatis)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Tambahkan beberapa gambar untuk berjalan secara bergantian secara otomatis dan mandiri.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={header.carouselEnabled || false}
                onChange={(e) => updateHeader('carouselEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">Aktifkan Carousel</span>
            </label>
          </div>

          {header.carouselEnabled && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Pergantian Otomatis (Detik)
                  </label>
                  <select
                    value={header.carouselInterval || 5}
                    onChange={(e) => updateHeader('carouselInterval', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value={3}>3 Detik (Cepat)</option>
                    <option value={5}>5 Detik (Normal)</option>
                    <option value={7}>7 Detik (Santai)</option>
                    <option value={10}>10 Detik (Lambat)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <span className="text-xs text-slate-500 font-medium">
                    Total Gambar Carousel: <strong className="text-slate-800">{carouselImages.length}</strong> gambar
                  </span>
                </div>
              </div>

              {/* Add carousel image input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Tambah Gambar ke Carousel
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-carousel-img-url"
                    placeholder="URL gambar atau unggah menggunakan tombol di bawah..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-carousel-img-url') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        addCarouselImage(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
                <div className="pt-2">
                  <ImageUploadButton
                    label="Atau Unggah Berkas Gambar Carousel"
                    value=""
                    onChange={(url) => addCarouselImage(url)}
                    preset="banner"
                    aspectRatio="banner"
                    placeholder="Upload gambar untuk carousel..."
                  />
                </div>
              </div>

              {/* List of Carousel Images */}
              {carouselImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {carouselImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group bg-white border border-slate-200 rounded-lg p-2 space-y-2">
                      <div className="h-20 w-full rounded overflow-hidden bg-slate-900">
                        <img src={imgUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">Slide #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCarouselImage(idx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Hapus Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tombol Utama & Sekunder */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-blue-600" />
            <span>Pengaturan Tombol Aksi (CTA)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">Tombol Utama (Primary Button)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={header.showPrimaryButton !== false}
                    onChange={(e) => updateHeader('showPrimaryButton', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <input
                type="text"
                placeholder="Teks Tombol (Contoh: Profil Sekolah)"
                value={header.heroCtaText}
                onChange={(e) => updateHeader('heroCtaText', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              />
              <input
                type="text"
                placeholder="Link Target (Contoh: #sambutan atau URL)"
                value={header.heroCtaLink}
                onChange={(e) => updateHeader('heroCtaLink', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Tombol Sekunder (Secondary Button)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={header.showSecondaryButton !== false}
                    onChange={(e) => updateHeader('showSecondaryButton', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <input
                type="text"
                placeholder="Teks Tombol (Contoh: Tonton Video)"
                value={header.secondaryCtaText}
                onChange={(e) => updateHeader('secondaryCtaText', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              />
              <input
                type="text"
                placeholder="Link Target (Contoh: #video atau URL)"
                value={header.secondaryCtaLink}
                onChange={(e) => updateHeader('secondaryCtaLink', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Pengaturan Tampilan & Posisi Elemen */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MoveVertical className="w-3.5 h-3.5 text-blue-600" />
            <span>Pengaturan Tampilan & Posisi Elemen Banner</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Perataan Teks (Text Alignment)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateHeader('textAlign', 'left')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    (header.textAlign || 'left') === 'left'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Kiri</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateHeader('textAlign', 'center')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    header.textAlign === 'center'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>Tengah</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateHeader('textAlign', 'right')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    header.textAlign === 'right'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                  <span>Kanan</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Posisi Vertikal Konten (Vertical Position)
              </label>
              <select
                value={header.verticalPosition || 'center'}
                onChange={(e) => updateHeader('verticalPosition', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="top">Bagian Atas (Top)</option>
                <option value="center">Di Tengah (Center)</option>
                <option value="bottom">Bagian Bawah (Bottom)</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Kartu Statistik Hero (Hero Cards) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Kartu Statistik Hero ({header.highlights?.length || 0})</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Catatan: Warna dan gaya kartu ini diatur secara otomatis dari tab <strong className="text-blue-700">"Warna & Tema Website"</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={createDefaultHighlights}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer transition-colors"
            >
              <span>Gunakan 4 Default</span>
            </button>
            <button
              type="button"
              onClick={addHighlight}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
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
                Tampilkan pencapaian sekolah (misalnya Jumlah Siswa, Guru, Akreditasi) langsung di banner utama.
              </p>
            </div>
            <button
              type="button"
              onClick={createDefaultHighlights}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat 4 Kartu Statistik Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {header.highlights.map((item) => (
              <div key={item.id} className="relative p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between group/card pt-8">
                <button
                  type="button"
                  onClick={() => deleteHighlight(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors"
                  title="Hapus Kartu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Label (Contoh: Siswa Aktif)"
                    value={item.label}
                    onChange={(e) => updateHighlight(item.id, 'label', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Nilai (Contoh: 750+)"
                    value={item.value}
                    onChange={(e) => updateHighlight(item.id, 'value', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={item.icon || 'bookopen'}
                    onChange={(e) => updateHighlight(item.id, 'icon', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
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
  );
};
