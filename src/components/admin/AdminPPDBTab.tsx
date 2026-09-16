import React from 'react';
import { SchoolConfig, PPDBConfig } from '../../types';
import { GraduationCap } from 'lucide-react';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminPPDBTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminPPDBTab: React.FC<AdminPPDBTabProps> = ({ config, onChange }) => {
  const ppdb: PPDBConfig = config.ppdb || {
    enabled: false,
    buttonLabel: 'Info PPDB 2026',
    buttonLink: '#berita',
    openInNewTab: false,
    academicYear: '2026/2027',
    statusText: 'Pendaftaran Dibuka',
    badgeText: 'Tahun Ajaran 2026/2027',
    announcement: '',
    contactPerson: '',
    brochureUrl: '',
  };

  const updatePPDB = (updates: Partial<PPDBConfig>) => {
    onChange({
      ...config,
      ppdb: {
        ...ppdb,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Penerimaan Peserta Didik Baru (PPDB)</span>
          </h3>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-600">Tampilkan Tombol</span>
            <input
              type="checkbox"
              checked={ppdb.enabled}
              onChange={(e) => updatePPDB({ enabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teks Tombol</label>
            <input
              type="text"
              value={ppdb.buttonLabel}
              onChange={(e) => updatePPDB({ buttonLabel: e.target.value })}
              placeholder="Info PPDB 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Link Target</label>
            <input
              type="text"
              value={ppdb.buttonLink}
              onChange={(e) => updatePPDB({ buttonLink: e.target.value })}
              placeholder="#berita atau https://..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
            <input
              type="text"
              value={ppdb.academicYear}
              onChange={(e) => updatePPDB({ academicYear: e.target.value })}
              placeholder="2026/2027"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pendaftaran</label>
            <select
              value={ppdb.statusText}
              onChange={(e) => updatePPDB({ statusText: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="Pendaftaran Dibuka">Pendaftaran Dibuka</option>
              <option value="Segera Dibuka">Segera Dibuka</option>
              <option value="Tahap Seleksi Berkas">Tahap Seleksi Berkas</option>
              <option value="Pengumuman Hasil">Pengumuman Hasil</option>
              <option value="Pendaftaran Ditutup">Pendaftaran Ditutup</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kontak Panitia (WA/HP)</label>
            <input
              type="text"
              value={ppdb.contactPerson || ''}
              onChange={(e) => updatePPDB({ contactPerson: e.target.value })}
              placeholder="0812-xxxx-xxxx"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Link Brosur / Juknis</label>
            <input
              type="text"
              value={ppdb.brochureUrl || ''}
              onChange={(e) => updatePPDB({ brochureUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Jalur PPDB</label>
          <AutoResizeTextarea
            minRows={2}
            value={ppdb.announcement || ''}
            onChange={(e) => updatePPDB({ announcement: e.target.value })}
            placeholder="Jalur Zonasi, Afirmasi, Prestasi..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ppdb.openInNewTab || false}
              onChange={(e) => updatePPDB({ openInNewTab: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs text-slate-700 font-medium">Buka tautan di tab baru</span>
          </label>
        </div>
      </div>
    </div>
  );
};
