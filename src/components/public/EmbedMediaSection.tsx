import React from 'react';
import { EmbedsConfig } from '../../types';
import { Video, MapPin, ExternalLink, Navigation } from 'lucide-react';
import { convertToGoogleMapsEmbedUrl } from '../../lib/embedHelper';

interface EmbedMediaSectionProps {
  embeds: EmbedsConfig;
  schoolAddress: string;
  showVideo: boolean;
  showMap: boolean;
}

export const EmbedMediaSection: React.FC<EmbedMediaSectionProps> = ({
  embeds,
  schoolAddress,
  showVideo,
  showMap,
}) => {
  if (!showVideo && !showMap) return null;

  // Safe Google Maps URL parsing
  const mapResult = convertToGoogleMapsEmbedUrl(embeds.mapIframeUrl, schoolAddress);
  const effectiveMapUrl = mapResult.embedUrl;

  // Convert standard YouTube watch URLs to embed URLs if needed
  const getCleanEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const cleanVideoUrl = getCleanEmbedUrl(embeds.youtubeUrl);

  const hasVideo = Boolean(showVideo && cleanVideoUrl);
  const hasMap = Boolean(showMap && effectiveMapUrl);

  if (!hasVideo && !hasMap) return null;

  const isTwoColumn = hasVideo && hasMap;

  return (
    <section id="media-lokasi" className="py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={
            isTwoColumn
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch'
              : 'max-w-3xl mx-auto'
          }
        >
          {/* KIRI (Desktop): Video Profil */}
          {hasVideo && (
            <div
              id="video-profil"
              className="flex flex-col h-full bg-slate-50/80 rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
                    <Video className="w-4 h-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {embeds.youtubeTitle || 'Video Profil'}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200/80 shrink-0 shadow-2xs">
                  YouTube
                </span>
              </div>

              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-950">
                <iframe
                  src={cleanVideoUrl}
                  title={embeds.youtubeTitle || 'Video Profil'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="truncate">Saksikan tayangan profil resmi dan liputan sekolah</span>
              </div>
            </div>
          )}

          {/* KANAN (Desktop): Peta Lokasi */}
          {hasMap && (
            <div
              id="lokasi"
              className={`flex flex-col h-full bg-slate-50/80 rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs transition-shadow hover:shadow-md ${
                !isTwoColumn ? 'mt-8 lg:mt-0' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {embeds.mapTitle || 'Peta Lokasi'}
                    </h2>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    mapResult.detectedLocation || schoolAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 border border-slate-200/80 shadow-2xs"
                  title="Buka di Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Buka Peta</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>

              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
                <iframe
                  src={effectiveMapUrl}
                  title={embeds.mapTitle || 'Peta Lokasi'}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full border-0"
                />
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate" title={schoolAddress}>
                  {schoolAddress || 'Lokasi Kampus / Sekolah'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
