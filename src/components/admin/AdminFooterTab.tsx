import React from 'react';
import { SchoolConfig, FooterConfig } from '../../types';
import { Share2 } from 'lucide-react';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminFooterTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminFooterTab: React.FC<AdminFooterTabProps> = ({ config, onChange }) => {
  const { footer } = config;

  const updateFooter = (key: keyof FooterConfig, value: any) => {
    onChange({
      ...config,
      footer: {
        ...footer,
        [key]: value,
      },
    });
  };

  const updateSocial = (key: keyof typeof footer.socialLinks, value: string) => {
    onChange({
      ...config,
      footer: {
        ...footer,
        socialLinks: {
          ...footer.socialLinks,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Share2 className="w-4 h-4 text-blue-600" />
          <span>Footer &amp; Kontak</span>
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Singkat (Tentang Kami)
            </label>
            <AutoResizeTextarea
              minRows={2}
              value={footer.aboutText}
              onChange={(e) => updateFooter('aboutText', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap
            </label>
            <AutoResizeTextarea
              minRows={2}
              value={footer.address}
              onChange={(e) => updateFooter('address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telepon Kantor
              </label>
              <input
                type="text"
                value={footer.phone}
                onChange={(e) => updateFooter('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={footer.whatsapp}
                onChange={(e) => updateFooter('whatsapp', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={footer.email}
                onChange={(e) => updateFooter('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam Operasional
              </label>
              <input
                type="text"
                value={footer.openingHours}
                onChange={(e) => updateFooter('openingHours', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="font-semibold text-slate-800 text-xs">Media Sosial</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Instagram</label>
                <input
                  type="text"
                  value={footer.socialLinks.instagram}
                  onChange={(e) => updateSocial('instagram', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">YouTube</label>
                <input
                  type="text"
                  value={footer.socialLinks.youtube}
                  onChange={(e) => updateSocial('youtube', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Facebook</label>
                <input
                  type="text"
                  value={footer.socialLinks.facebook}
                  onChange={(e) => updateSocial('facebook', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">Twitter / X</label>
                <input
                  type="text"
                  value={footer.socialLinks.twitter}
                  onChange={(e) => updateSocial('twitter', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  placeholder="https://x.com/..."
                />
              </div>
            </div>
          </div>

          {/* Copyright text */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hak Cipta (Copyright)
            </label>
            <input
              type="text"
              value={footer.copyright}
              onChange={(e) => updateFooter('copyright', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
