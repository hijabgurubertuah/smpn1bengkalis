import React from 'react';
import { SchoolConfig, NewsArticle } from '../../types';
import {
  RotateCcw,
  FileText,
  PenTool,
  Slash,
  Check,
} from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { RichTextEditorWithImages } from '../common/RichTextEditorWithImages';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminTickerTabProps {
  config: SchoolConfig;
  articles?: NewsArticle[];
  onChange: (newConfig: SchoolConfig) => void;
}

export const AdminTickerTab: React.FC<AdminTickerTabProps> = ({ config, articles = [], onChange }) => {
  const { identity } = config;

  const ann = config.importantAnnouncement || {
    enabled: true,
    badge: 'INFO PENTING',
    text: '📢 PEMBERITAHUAN KABUT ASAP: Kegiatan belajar tatap muka dialihkan secara Daring (PJJ) dari rumah.',
    theme: 'warning',
    speed: 'normal',
    customBgColor: '',
    isMarquee: true,
  };

  const activePopupTab: 'article' | 'custom' | 'none' =
    ann.popupMode || (ann.targetArticleId ? 'article' : (ann.detailContent || ann.detailTitle ? 'custom' : 'article'));

  const updateAnn = (field: string, value: any) => {
    onChange({
      ...config,
      importantAnnouncement: {
        ...ann,
        [field]: value,
      },
    });
  };

  const updateIdentity = (key: keyof typeof identity, value: any) => {
    onChange({
      ...config,
      identity: {
        ...identity,
        [key]: value,
      },
    });
  };

  const generateAccreditationTemplate = () => {
    const parts: string[] = [];
    if (identity.akreditasi) parts.push(`[AKREDITASI] Status: ${identity.akreditasi}`);
    if (identity.npsn) parts.push(`[NPSN] Nomor Pokok / Registrasi: ${identity.npsn}`);
    if (identity.name) parts.push(`[LEMBAGA] ${identity.name}`);
    return parts.length > 0 ? parts.join(' • ') : '';
  };

  const quickColorsAnn = ['#f59e0b', '#dc2626', '#059669', '#2563eb', '#0f172a', '#9333ea'];
  const quickColorsAccred = ['#0f172a', '#1e3a8a', '#991b1b', '#065f46', '#000000', '#581c87'];

  const selectedArticle = articles.find((a) => a.id === ann.targetArticleId);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      
      {/* 2 Kolom Minimalis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        
        {/* ========================================================================= */}
        {/* KOLOM 1: TEKS 1 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          
          {/* Header & Switch Murni */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Teks 1
            </h3>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={ann.enabled}
                onChange={(e) => updateAnn('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {ann.enabled && (
            <div className="space-y-3.5">
              
              {/* Warna */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Warna</label>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {ann.customBgColor || '#f59e0b'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {quickColorsAnn.map((color) => {
                      const activeColor = ann.customBgColor || '#f59e0b';
                      const isSelected = activeColor.toLowerCase() === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateAnn('customBgColor', color)}
                          className={`w-6 h-6 rounded-md cursor-pointer relative shadow-2xs flex items-center justify-center transition-transform ${
                            isSelected ? 'ring-2 ring-slate-800 ring-offset-1 scale-105' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && (
                            <Check
                              className="w-3.5 h-3.5"
                              style={{ color: color === '#f59e0b' ? '#0f172a' : '#ffffff' }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="relative w-6 h-6 rounded-md overflow-hidden border border-slate-300 shadow-2xs cursor-pointer">
                      <input
                        type="color"
                        value={ann.customBgColor || '#f59e0b'}
                        onChange={(e) => updateAnn('customBgColor', e.target.value)}
                        className="absolute -inset-2 w-10 h-10 cursor-pointer border-0 p-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={ann.customBgColor || ''}
                      onChange={(e) => updateAnn('customBgColor', e.target.value)}
                      placeholder="#f59e0b"
                      className="w-20 px-2 py-1 text-xs font-mono border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Lencana, Kecepatan, dan Sematkan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lencana
                  </label>
                  <input
                    type="text"
                    value={ann.badge || ''}
                    onChange={(e) => updateAnn('badge', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-800"
                    placeholder="INFO"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kecepatan
                  </label>
                  <div className="grid grid-cols-3 gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                    {(['slow', 'normal', 'fast'] as const).map((spd) => {
                      const isCurrent = (ann.speed || 'normal') === spd;
                      const label = spd === 'slow' ? 'Lambat' : spd === 'fast' ? 'Cepat' : 'Normal';
                      return (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => updateAnn('speed', spd)}
                          className={`py-1 rounded text-center cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-white text-amber-700 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Switch Sematkan Murni */}
                <div className="flex items-center justify-between p-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg h-[34px]">
                  <span className="text-xs font-semibold text-slate-700">Sematkan</span>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={ann.isSticky === true}
                      onChange={(e) => updateAnn('isSticky', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              {/* Isi Teks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pesan
                </label>
                <AutoResizeTextarea
                  minRows={2}
                  value={ann.text || ''}
                  onChange={(e) => updateAnn('text', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white text-slate-900"
                  placeholder="Ketik teks pengumuman..."
                />
              </div>

              {/* =============================================================== */}
              {/* TAB POPUP */}
              {/* =============================================================== */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Popup
                  </label>
                </div>

                {/* Tab Header */}
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/80 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateAnn('popupMode', 'article')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activePopupTab === 'article'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Berita</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAnn('popupMode', 'custom')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activePopupTab === 'custom'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <span>Teks Khusus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAnn('popupMode', 'none')}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activePopupTab === 'none'
                        ? 'bg-white text-slate-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Slash className="w-3.5 h-3.5 shrink-0" />
                    <span>Nonaktif</span>
                  </button>
                </div>

                {/* Tab Body */}
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  
                  {/* TAB 1: BERITA */}
                  {activePopupTab === 'article' && (
                    <div className="space-y-2">
                      <select
                        value={ann.targetArticleId || ''}
                        onChange={(e) => updateAnn('targetArticleId', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="">-- Pilih Berita --</option>
                        {articles.map((art) => (
                          <option key={art.id} value={art.id}>
                            [{art.category || 'Berita'}] {art.title}
                          </option>
                        ))}
                      </select>

                      {selectedArticle && (
                        <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-900 border border-blue-100">
                          <span className="font-semibold truncate">{selectedArticle.title}</span>
                          <span className="text-[10px] text-blue-600 font-bold shrink-0 ml-2">Tertaut</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: TEKS KHUSUS */}
                  {activePopupTab === 'custom' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Judul
                        </label>
                        <input
                          type="text"
                          value={ann.detailTitle || ''}
                          onChange={(e) => updateAnn('detailTitle', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                          placeholder="Judul pengumuman..."
                        />
                      </div>

                      <div>
                        <RichTextEditorWithImages
                          label="Konten"
                          value={ann.detailContent || ''}
                          onChange={(newVal) => updateAnn('detailContent', newVal)}
                          placeholder="Tuliskan rincian pengumuman..."
                          minRows={4}
                          articles={articles.map((a) => ({ id: a.id, title: a.title, category: a.category }))}
                        />
                      </div>

                      <div className="pt-1">
                        <ImageUploadButton
                          label="Gambar (Opsional)"
                          value={ann.detailImageUrl || ''}
                          onChange={(newUrl) => updateAnn('detailImageUrl', newUrl)}
                          preset="post"
                          placeholder="URL atau pilih gambar..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: NONAKTIF */}
                  {activePopupTab === 'none' && (
                    <div className="py-2.5 text-center text-xs text-slate-400">
                      Teks berjalan tanpa aksi klik popup.
                    </div>
                  )}

                </div>
              </div>

              {/* Pratinjau */}
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">Pratinjau</div>
                <div
                  className="py-2 px-3 rounded-lg flex items-center gap-2 overflow-hidden text-xs font-medium shadow-2xs border border-black/10"
                  style={{
                    backgroundColor: ann.customBgColor || '#f59e0b',
                    color: (ann.customBgColor || '#f59e0b') === '#f59e0b' ? '#0f172a' : '#ffffff',
                  }}
                >
                  <span className="px-1.5 py-0.5 rounded bg-slate-950 text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                    {ann.badge || 'INFO'}
                  </span>
                  <div className="overflow-hidden whitespace-nowrap text-xs flex-1">
                    <div className="inline-block animate-marquee hover:[animation-play-state:paused]">
                      {ann.text || 'Pengumuman...'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* KOLOM 2: TEKS 2 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          
          {/* Header & Switch Murni */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Teks 2
            </h3>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={identity.accreditationTickerEnabled !== false}
                onChange={(e) => updateIdentity('accreditationTickerEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {identity.accreditationTickerEnabled !== false && (
            <div className="space-y-3.5">
              
              {/* Warna */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Warna</label>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {identity.accreditationTickerBgColor || '#0f172a'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {quickColorsAccred.map((color) => {
                      const activeColor = identity.accreditationTickerBgColor || '#0f172a';
                      const isSelected = activeColor.toLowerCase() === color.toLowerCase();
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateIdentity('accreditationTickerBgColor', color)}
                          className={`w-6 h-6 rounded-md cursor-pointer relative shadow-2xs flex items-center justify-center transition-transform ${
                            isSelected ? 'ring-2 ring-slate-800 ring-offset-1 scale-105' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="relative w-6 h-6 rounded-md overflow-hidden border border-slate-300 shadow-2xs cursor-pointer">
                      <input
                        type="color"
                        value={identity.accreditationTickerBgColor || '#0f172a'}
                        onChange={(e) => updateIdentity('accreditationTickerBgColor', e.target.value)}
                        className="absolute -inset-2 w-10 h-10 cursor-pointer border-0 p-0"
                      />
                    </div>
                    <input
                      type="text"
                      value={identity.accreditationTickerBgColor || ''}
                      onChange={(e) => updateIdentity('accreditationTickerBgColor', e.target.value)}
                      placeholder="#0f172a"
                      className="w-20 px-2 py-1 text-xs font-mono border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Kecepatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecepatan
                </label>
                <div className="grid grid-cols-3 gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  {(['slow', 'normal', 'fast'] as const).map((spd) => {
                    const isCurrent = (identity.accreditationTickerSpeed || 'normal') === spd;
                    const label = spd === 'slow' ? 'Lambat' : spd === 'fast' ? 'Cepat' : 'Normal';
                    return (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => updateIdentity('accreditationTickerSpeed', spd)}
                        className={`py-1 rounded text-center cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-white text-blue-700 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teks Akreditasi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Pesan
                  </label>
                  <button
                    type="button"
                    onClick={() => updateIdentity('accreditationTickerText', generateAccreditationTemplate())}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                </div>
                <AutoResizeTextarea
                  minRows={3}
                  value={identity.accreditationTickerText || ''}
                  onChange={(e) => updateIdentity('accreditationTickerText', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white text-slate-900"
                  placeholder="Teks pesan berjalan..."
                />
              </div>

              {/* Pratinjau */}
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">Pratinjau</div>
                <div
                  className="py-2 px-3 rounded-lg text-white flex items-center gap-2 overflow-hidden text-xs font-medium shadow-2xs border border-white/10"
                  style={{ backgroundColor: identity.accreditationTickerBgColor || '#0f172a' }}
                >
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-bold uppercase tracking-wider shrink-0">
                    INFO
                  </span>
                  <div className="overflow-hidden whitespace-nowrap text-xs flex-1 text-slate-200">
                    <div className="inline-block animate-marquee hover:[animation-play-state:paused]">
                      {identity.accreditationTickerText || generateAccreditationTemplate() || 'Pesan berjalan akan tampil di sini'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
