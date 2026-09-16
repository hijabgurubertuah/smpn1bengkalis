import React, { useState } from 'react';
import { SchoolConfig, EmbedsConfig } from '../../types';
import { Video, MapPin, Search, RotateCcw } from 'lucide-react';
import { buildGoogleMapsEmbedUrl, extractMapDetails } from '../../lib/embedHelper';

interface AdminEmbedsTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminEmbedsTab: React.FC<AdminEmbedsTabProps> = ({ config, onChange }) => {
  const { embeds, identity } = config;

  const initialDetails = extractMapDetails(
    embeds.mapIframeUrl,
    identity.name ? `${identity.name}, Bengkalis` : 'SMPN 1 Bengkalis'
  );

  const [searchLocation, setSearchLocation] = useState<string>(
    initialDetails.query || 'SMPN 1 Bengkalis'
  );
  const [previewMapUrl, setPreviewMapUrl] = useState<string>(
    embeds.mapIframeUrl || buildGoogleMapsEmbedUrl('SMPN 1 Bengkalis', 17)
  );

  const updateEmbed = (key: keyof EmbedsConfig, value: string) => {
    onChange({
      ...config,
      embeds: {
        ...embeds,
        [key]: value,
      },
    });
  };

  const handlePerformSearch = (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : searchLocation).trim();
    if (!q) return;
    const newUrl = buildGoogleMapsEmbedUrl(q, 17);
    setPreviewMapUrl(newUrl);
    onChange({
      ...config,
      embeds: {
        ...embeds,
        mapIframeUrl: newUrl,
      },
    });
  };

  const handleReset = () => {
    const defaultQuery = 'SMPN 1 Bengkalis';
    setSearchLocation(defaultQuery);
    const defaultUrl = buildGoogleMapsEmbedUrl(defaultQuery, 17);
    setPreviewMapUrl(defaultUrl);
    onChange({
      ...config,
      embeds: {
        ...embeds,
        mapIframeUrl: defaultUrl,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* YouTube Video Section */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Video className="w-4 h-4 text-red-600" />
          <span>Video Profil (YouTube)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Video
            </label>
            <input
              type="text"
              value={embeds.youtubeTitle}
              onChange={(e) => updateEmbed('youtubeTitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Video Profil Instansi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Video YouTube
            </label>
            <input
              type="text"
              value={embeds.youtubeUrl}
              onChange={(e) => updateEmbed('youtubeUrl', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* Video Preview */}
        {embeds.youtubeUrl && (
          <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <iframe
              src={
                embeds.youtubeUrl.includes('embed/')
                  ? embeds.youtubeUrl
                  : `https://www.youtube.com/embed/${
                      embeds.youtubeUrl.includes('watch?v=')
                        ? embeds.youtubeUrl.split('watch?v=')[1]?.split('&')[0]
                        : embeds.youtubeUrl.split('youtu.be/')[1]?.split('?')[0] || ''
                    }`
              }
              title="YouTube Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>

      {/* Google Maps Embed */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Peta Lokasi (Google Maps)</span>
          </h3>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Seksi
            </label>
            <input
              type="text"
              value={embeds.mapTitle}
              onChange={(e) => updateEmbed('mapTitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              placeholder="Lokasi Instansi"
            />
          </div>

          <div className="sm:col-span-8">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cari Lokasi / Alamat
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePerformSearch();
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                placeholder="SMPN 1 Bengkalis"
              />
              <button
                type="button"
                onClick={() => handlePerformSearch()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari</span>
              </button>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        <div className="w-full h-56 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
          {previewMapUrl && (
            <iframe
              src={previewMapUrl}
              title="Google Maps"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};
