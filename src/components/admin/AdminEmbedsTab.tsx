import React, { useState, useEffect, useRef } from 'react';
import { SchoolConfig, EmbedsConfig } from '../../types';
import { Video, MapPin, Search, Compass, ZoomIn } from 'lucide-react';
import L from 'leaflet';
import {
  parseCoordinatesAndZoom,
  buildGoogleMapsUrlFromCoords,
  OFFICIAL_SMPN1_MAP_EMBED_URL,
} from '../../lib/embedHelper';

interface AdminEmbedsTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminEmbedsTab: React.FC<AdminEmbedsTabProps> = ({ config, onChange }) => {
  const { embeds } = config;

  const [mapInput, setMapInput] = useState<string>(
    embeds.mapIframeUrl || OFFICIAL_SMPN1_MAP_EMBED_URL
  );

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const configRef = useRef(config);
  const onChangeRef = useRef(onChange);

  // Keep latest refs to prevent stale closures in leaflet event listeners
  useEffect(() => {
    configRef.current = config;
    onChangeRef.current = onChange;
  }, [config, onChange]);

  const [currentCoords, setCurrentCoords] = useState(() =>
    parseCoordinatesAndZoom(embeds.mapIframeUrl || OFFICIAL_SMPN1_MAP_EMBED_URL)
  );

  // Initialize interactive Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initial = parseCoordinatesAndZoom(embeds.mapIframeUrl || OFFICIAL_SMPN1_MAP_EMBED_URL);

    const map = L.map(mapContainerRef.current, {
      center: [initial.lat, initial.lng],
      zoom: initial.zoom,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom SVG center pin that moves with map center
    const customPin = L.divIcon({
      className: 'custom-map-center-pin',
      html: `
        <div style="transform: translate(-50%, -100%); pointer-events: none;">
          <div style="background-color: #047857; color: white; border-radius: 9999px; padding: 6px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35); border: 2px solid white; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div style="width: 2px; height: 6px; background-color: #047857; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([initial.lat, initial.lng], {
      icon: customPin,
      interactive: false,
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    const handleMapMove = () => {
      const center = map.getCenter();
      marker.setLatLng(center);
      setCurrentCoords({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    };

    const handleMapMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      marker.setLatLng(center);
      setCurrentCoords({ lat: center.lat, lng: center.lng, zoom });

      const newUrl = buildGoogleMapsUrlFromCoords(center.lat, center.lng, zoom);
      setMapInput(newUrl);

      onChangeRef.current({
        ...configRef.current,
        embeds: {
          ...configRef.current.embeds,
          mapIframeUrl: newUrl,
        },
      });
    };

    map.on('move', handleMapMove);
    map.on('moveend', handleMapMoveEnd);
    map.on('zoomend', handleMapMoveEnd);

    // Invalidate map size after DOM mount
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.off('move', handleMapMove);
      map.off('moveend', handleMapMoveEnd);
      map.off('zoomend', handleMapMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const updateEmbed = (key: keyof EmbedsConfig, value: string) => {
    onChange({
      ...config,
      embeds: {
        ...embeds,
        [key]: value,
      },
    });
  };

  const handleApplyMap = (customValue?: string) => {
    const val = (customValue !== undefined ? customValue : mapInput).trim();
    if (!val) return;

    const parsed = parseCoordinatesAndZoom(val);
    const finalUrl = buildGoogleMapsUrlFromCoords(parsed.lat, parsed.lng, parsed.zoom);

    setMapInput(finalUrl);
    setCurrentCoords(parsed);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([parsed.lat, parsed.lng], parsed.zoom, {
        animate: true,
        duration: 1,
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([parsed.lat, parsed.lng]);
      }
    }

    onChange({
      ...config,
      embeds: {
        ...embeds,
        mapIframeUrl: finalUrl,
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
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Peta Lokasi (Google Maps)</span>
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Seksi Peta
            </label>
            <input
              type="text"
              value={embeds.mapTitle}
              onChange={(e) => updateEmbed('mapTitle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              placeholder="Lokasi Instansi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Url Lokasi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mapInput}
                onChange={(e) => setMapInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyMap();
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono text-slate-800"
                placeholder="Tempelkan URL lokasi atau koordinat..."
              />
              <button
                type="button"
                onClick={() => handleApplyMap()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Terapkan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Pratinjau Peta Interaktif</span>
              <span className="text-[11px] font-normal text-slate-500">(Geser / Zoom langsung)</span>
            </span>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                <Compass className="w-3 h-3 text-emerald-600" />
                <span>{currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                <ZoomIn className="w-3 h-3 text-blue-600" />
                <span>Zoom {currentCoords.zoom}</span>
              </span>
            </div>
          </div>

          <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner relative z-0">
            <div
              ref={mapContainerRef}
              className="w-full h-full relative z-0"
              style={{ minHeight: '320px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
