import React, { useState } from 'react';
import { EmbedsConfig } from '../../types';
import { Video, MapPin, ExternalLink, Navigation, Compass, Loader2 } from 'lucide-react';
import { convertToGoogleMapsEmbedUrl, OFFICIAL_SMPN1_MAP_EMBED_URL } from '../../lib/embedHelper';

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
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapLoadTimeout, setMapLoadTimeout] = useState(false);

  React.useEffect(() => {
    // If iframe doesn't trigger onLoad after 7 seconds (e.g. adblocker or cookie policy),
    // display the interactive fallback bar so user is never stranded
    const timer = setTimeout(() => {
      setMapLoadTimeout(true);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  if (!showVideo && !showMap) return null;

  // Safe Google Maps URL parsing
  const mapResult = convertToGoogleMapsEmbedUrl(
    embeds.mapIframeUrl || OFFICIAL_SMPN1_MAP_EMBED_URL,
    schoolAddress || 'Jl. Karimun, Bengkalis Kota, Kab. Bengkalis, Riau 28712'
  );
  const effectiveMapUrl = mapResult.embedUrl || OFFICIAL_SMPN1_MAP_EMBED_URL;

  // Direct Google Maps web link
  const directMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'SMP Negeri 1 Bengkalis, Jl. Karimun, Bengkalis Kota'
  )}`;
  const directRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    '1.4736,102.114'
  )}`;

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
                      {embeds.mapTitle || 'Lokasi SMP Negeri 1 Bengkalis'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={directRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center"
                    title="Petunjuk Rute ke Sekolah"
                  >
                    <Compass className="w-4 h-4" />
                  </a>
                  <a
                    href={directMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl transition-colors cursor-pointer border border-slate-200/80 shadow-2xs flex items-center justify-center"
                    title="Buka di Google Maps Langsung"
                  >
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>

              {/* Map Iframe Container (Non-clickable via transparent overlay pointer-events-none) */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
                {!isMapLoaded && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs font-medium">Memuat peta lokasi...</span>
                  </div>
                )}

                <iframe
                  key={effectiveMapUrl}
                  src={effectiveMapUrl}
                  title={embeds.mapTitle || 'Lokasi SMP Negeri 1 Bengkalis'}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  onLoad={() => setIsMapLoaded(true)}
                  className="w-full h-full border-0 relative z-20 pointer-events-none"
                />
                {/* Transparent overlay that completely intercepts mouse/touch clicks so map cannot be interacted with directly */}
                <div className="absolute inset-0 z-30 pointer-events-auto bg-transparent" />
              </div>

              {/* Address Bar */}
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium text-slate-700" title={schoolAddress || 'Jl. Karimun, Bengkalis Kota, Riau 28712'}>
                    {schoolAddress || 'Jl. Karimun, Bengkalis Kota, Kab. Bengkalis, Riau 28712'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
