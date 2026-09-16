import React from 'react';
import { SchoolConfig, PrincipalConfig } from '../../types';
import { Award } from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { RichTextEditorWithImages } from '../common/RichTextEditorWithImages';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminPrincipalTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminPrincipalTab: React.FC<AdminPrincipalTabProps> = ({ config, onChange }) => {
  const { principal } = config;

  const updatePrincipal = (key: keyof PrincipalConfig, value: string) => {
    onChange({
      ...config,
      principal: {
        ...principal,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-4 h-4 text-blue-600" />
          <span>Sambutan &amp; Profil Pimpinan / Kepala</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap &amp; Gelar
            </label>
            <input
              type="text"
              value={principal.name}
              onChange={(e) => updatePrincipal('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Nama Pimpinan / Kepala..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jabatan Resmi
            </label>
            <input
              type="text"
              value={principal.title}
              onChange={(e) => updatePrincipal('title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Pimpinan / Kepala Instansi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              NIP / Identitas Pegawai
            </label>
            <input
              type="text"
              value={principal.nip}
              onChange={(e) => updatePrincipal('nip', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Nomor NIP / ID..."
            />
          </div>

          <div className="sm:col-span-2">
            <ImageUploadButton
              label="Foto Pimpinan / Kepala"
              value={principal.imageUrl}
              onChange={(url) => updatePrincipal('imageUrl', url)}
              preset="avatar"
              aspectRatio="square"
              placeholder="URL Foto..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Kutipan Singkat (Quote)
          </label>
          <AutoResizeTextarea
            minRows={2}
            value={principal.quote}
            onChange={(e) => updatePrincipal('quote', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none italic bg-white"
            placeholder="Kutipan inspiratif..."
          />
        </div>

        <RichTextEditorWithImages
          value={principal.fullSpeech}
          onChange={(val) => updatePrincipal('fullSpeech', val)}
          label="Teks Sambutan Lengkap"
          placeholder="Tuliskan isi sambutan lengkap..."
          minRows={6}
        />
      </div>
    </div>
  );
};
