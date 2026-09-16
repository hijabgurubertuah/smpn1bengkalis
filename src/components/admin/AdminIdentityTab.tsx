import React from 'react';
import { SchoolConfig } from '../../types';
import { Sparkles, Globe, Check } from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminIdentityTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminIdentityTab: React.FC<AdminIdentityTabProps> = ({ config, onChange }) => {
  const { identity } = config;

  const updateIdentity = (key: keyof typeof identity, value: any) => {
    onChange({
      ...config,
      identity: {
        ...identity,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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

            <ImageUploadButton
              label="Unggah Berkas Favicon Baru"
              value={identity.faviconUrl || ''}
              onChange={(url) => updateIdentity('faviconUrl', url)}
              preset="favicon"
              aspectRatio="square"
              placeholder="Tempel tautan gambar atau upload file favicon..."
            />

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
    </div>
  );
};
