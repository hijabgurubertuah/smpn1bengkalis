/**
 * Embed URL Parser and Converter
 * Supports:
 * - Google Apps Script Web Apps (e.g. https://script.google.com/macros/s/.../exec)
 * - YouTube Videos (converts watch/shorts/youtu.be to https://www.youtube.com/embed/...)
 * - Google Forms (converts to ?embedded=true)
 * - Google Drive Files & PDFs (converts /view to /preview)
 * - Raw <iframe> tags (extracts the src)
 * - General external websites & web apps
 */

export type EmbedKind = 'appscript' | 'youtube' | 'google-form' | 'google-drive' | 'general-web';

export interface ParsedEmbed {
  originalUrl: string;
  embedUrl: string;
  kind: EmbedKind;
  label: string;
  canOpenInNewTab: boolean;
}

export function parseEmbedUrl(input?: string): ParsedEmbed | null {
  if (!input || !input.trim()) return null;
  let raw = input.trim();

  // If user pasted an iframe tag like <iframe ... src="..." ...></iframe>
  const iframeSrcMatch = raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    raw = iframeSrcMatch[1];
  }

  // 1. Google Apps Script Web App
  if (raw.includes('script.google.com/macros/s/')) {
    return {
      originalUrl: raw,
      embedUrl: raw,
      kind: 'appscript',
      label: 'Google Apps Script Web App',
      canOpenInNewTab: true,
    };
  }

  // 2. YouTube
  const ytMatch = raw.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      originalUrl: raw,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      kind: 'youtube',
      label: 'Video YouTube',
      canOpenInNewTab: true,
    };
  }

  // 3. Google Forms
  if (raw.includes('docs.google.com/forms')) {
    const formUrl = raw.includes('embedded=true')
      ? raw
      : raw.includes('?')
      ? `${raw}&embedded=true`
      : `${raw}?embedded=true`;
    return {
      originalUrl: raw,
      embedUrl: formUrl,
      kind: 'google-form',
      label: 'Formulir Google Forms',
      canOpenInNewTab: true,
    };
  }

  // 4. Google Drive Files / Docs / Sheets
  if (raw.includes('drive.google.com/file/d/')) {
    const driveMatch = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return {
        originalUrl: raw,
        embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
        kind: 'google-drive',
        label: 'Dokumen Google Drive',
        canOpenInNewTab: true,
      };
    }
  }

  // 5. Google Sheets / Docs / Slides publish
  if (raw.includes('docs.google.com/spreadsheets') || raw.includes('docs.google.com/document') || raw.includes('docs.google.com/presentation')) {
    let docEmbed = raw;
    if (raw.includes('/edit')) {
      docEmbed = raw.replace(/\/edit.*$/, '/preview');
    }
    return {
      originalUrl: raw,
      embedUrl: docEmbed,
      kind: 'google-drive',
      label: 'Dokumen Google',
      canOpenInNewTab: true,
    };
  }

  // 6. General Web
  return {
    originalUrl: raw,
    embedUrl: raw,
    kind: 'general-web',
    label: 'Aplikasi / Tautan Tersemat',
    canOpenInNewTab: true,
  };
}

export const OFFICIAL_SMPN1_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.723145028092!2d102.1114250749658!3d1.4735999985122176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31d15fc2a5b8205f%3A0x296dbf2b26c6d2dc!2sSMP%20Negeri%201%20Bengkalis!5e0!3m2!1sid!2sid!4v1710000000000!5m2!1sid!2sid';

export interface ParsedGoogleMapResult {
  embedUrl: string;
  sourceType: 'iframe_code' | 'embed_url' | 'place_url' | 'search_url' | 'coordinates' | 'plain_address' | 'short_link';
  detectedLocation?: string;
  isValid: boolean;
  notes?: string;
}

/**
 * Universal Google Maps Link Parser & Normalizer.
 * Safely converts iframe codes, place links, coordinate links, search queries,
 * and addresses into a 100% embeddable Google Maps iframe URL.
 */
export function convertToGoogleMapsEmbedUrl(
  input?: string,
  fallbackAddress?: string
): ParsedGoogleMapResult {
  if (!input || !input.trim()) {
    const loc = fallbackAddress && fallbackAddress.trim() ? fallbackAddress.trim() : 'SMP Negeri 1 Bengkalis, Jl. Karimun, Bengkalis Kota';
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'plain_address',
      detectedLocation: loc,
      isValid: true,
      notes: 'Menggunakan alamat sekolah untuk peta.',
    };
  }

  const raw = input.trim();

  // 1. Check if user pasted an <iframe> snippet like: <iframe src="https://www.google.com/maps/embed?..." ...></iframe>
  const iframeMatch = raw.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    const extractedSrc = iframeMatch[1].trim();
    return {
      embedUrl: extractedSrc,
      sourceType: 'iframe_code',
      isValid: true,
      notes: 'Kode HTML <iframe> terdeteksi dan atribut src peta berhasil diekstrak.',
    };
  }

  // 2. Direct embed URL from Google Maps (google.com/maps/embed?pb=...)
  if (raw.includes('google.com/maps/embed') || raw.includes('google.co.id/maps/embed')) {
    return {
      embedUrl: raw,
      sourceType: 'embed_url',
      isValid: true,
      notes: 'URL Google Maps Embed resmi terverifikasi.',
    };
  }

  // 3. Already has output=embed and starts with http/https
  if (raw.includes('output=embed') && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    const qMatch = raw.match(/[?&]q=([^&]+)/i);
    const detectedLocation = qMatch ? decodeURIComponent(qMatch[1].replace(/\+/g, ' ')) : undefined;
    return {
      embedUrl: raw,
      sourceType: 'embed_url',
      detectedLocation,
      isValid: true,
      notes: 'URL Google Maps dengan parameter output=embed siap dimuat.',
    };
  }

  // 5. Google Maps Place URL: https://www.google.com/maps/place/Place+Name/@lat,lng,zoom/...
  const placeMatch = raw.match(/maps\/place\/([^/@?]+)/i);
  if (placeMatch && placeMatch[1]) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    // Check if coordinates exist in URL @lat,lng
    const coordMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const zMatch = raw.match(/\/@-?\d+\.\d+,-?\d+\.\d+,(\d+[z|m])/) || raw.match(/[?&]z=(\d+)/);
    let zoomVal = 16;
    if (zMatch && zMatch[1]) {
      const parsedZ = parseInt(zMatch[1], 10);
      if (!isNaN(parsedZ)) zoomVal = parsedZ;
    }
    const query = coordMatch ? `${coordMatch[1]},${coordMatch[2]}` : placeName;

    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=${zoomVal}&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'place_url',
      detectedLocation: placeName,
      isValid: true,
      notes: `Lokasi "${placeName}" terdeteksi dan otomatis dikonversi ke format peta embed.`,
    };
  }

  // 6. Google Maps Search or query URL (maps.google.com/?q=... or google.com/maps/search/...)
  const searchMatch = raw.match(/[?&]q=([^&]+)/i) || raw.match(/maps\/search\/([^/?]+)/i);
  if (searchMatch && searchMatch[1]) {
    const queryParam = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
    const zMatch = raw.match(/[?&]z=(\d+)/);
    const zoomVal = zMatch ? parseInt(zMatch[1], 10) || 16 : 16;
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(queryParam)}&t=&z=${zoomVal}&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'search_url',
      detectedLocation: queryParam,
      isValid: true,
      notes: `Pencarian "${queryParam}" terdeteksi dan dikonversi ke peta embed.`,
    };
  }

  // 7. Coordinates format directly (e.g. "-6.2345, 106.9876" or "1.4736, 102.114")
  const directCoordMatch = raw.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (directCoordMatch) {
    const lat = directCoordMatch[1];
    const lng = directCoordMatch[2];
    return {
      embedUrl: `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'coordinates',
      detectedLocation: `${lat}, ${lng}`,
      isValid: true,
      notes: `Koordinat GPS (${lat}, ${lng}) terdeteksi.`,
    };
  }

  // 8. Short links (maps.app.goo.gl/... or goo.gl/maps/...)
  if (raw.includes('maps.app.goo.gl') || raw.includes('goo.gl/maps')) {
    const loc = fallbackAddress && fallbackAddress.trim() ? fallbackAddress.trim() : raw;
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'short_link',
      detectedLocation: loc,
      isValid: true,
      notes: 'Tautan bagikan Google Maps terdeteksi. Peta interaktif diaktifkan.',
    };
  }

  // 9. If starts with http:// or https:// but not recognized Google Maps domain
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return {
      embedUrl: raw,
      sourceType: 'embed_url',
      isValid: true,
      notes: 'Tautan web eksternal.',
    };
  }

  // 10. Plain address or location name entered
  return {
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(raw)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
    sourceType: 'plain_address',
    detectedLocation: raw,
    isValid: true,
    notes: `Alamat "${raw}" dikonversi menjadi peta embed Google Maps interaktif.`,
  };
}

/**
 * Builds an interactive, responsive Google Maps embed URL with custom search query and zoom level.
 */
export function buildGoogleMapsEmbedUrl(query: string, zoom: number = 16): string {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return OFFICIAL_SMPN1_MAP_EMBED_URL;
  }
  const clampedZoom = Math.max(1, Math.min(21, Math.round(zoom)));
  return `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery)}&t=&z=${clampedZoom}&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Extracts query location name and zoom level from an existing Google Maps URL or config.
 */
export function extractMapDetails(url?: string, defaultFallbackQuery?: string): { query: string; zoom: number } {
  if (!url || !url.trim()) {
    return { query: defaultFallbackQuery || '', zoom: 16 };
  }
  const qMatch = url.match(/[?&]q=([^&]+)/i);
  const zMatch = url.match(/[?&]z=(\d+)/i);

  let query = qMatch ? decodeURIComponent(qMatch[1].replace(/\+/g, ' ')) : '';
  if (!query && defaultFallbackQuery) {
    query = defaultFallbackQuery;
  }
  const zoom = zMatch ? parseInt(zMatch[1], 10) : 16;
  return { query, zoom: isNaN(zoom) ? 16 : zoom };
}

export interface CoordinatesAndZoom {
  lat: number;
  lng: number;
  zoom: number;
}

/**
 * Parses coordinates and zoom level from any Google Maps URL, embed code, or coordinates string.
 */
export function parseCoordinatesAndZoom(url?: string): CoordinatesAndZoom {
  const defaultCoord: CoordinatesAndZoom = {
    lat: 1.473599,
    lng: 102.111425,
    zoom: 17,
  };

  if (!url || !url.trim()) return defaultCoord;

  const text = url.trim();

  // 1. Direct coordinates "lat, lng" or "lat,lng"
  const directMatch = text.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)(?:\s*,\s*(\d+))?$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    const zoom = directMatch[3] ? parseInt(directMatch[3], 10) : 17;
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, zoom: isNaN(zoom) ? 17 : zoom };
  }

  // 2. Query ?q=lat,lng
  const qMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  const zMatch = text.match(/[?&]z=(\d+)/i);
  const parsedZoom = zMatch ? parseInt(zMatch[1], 10) : undefined;

  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        zoom: parsedZoom && !isNaN(parsedZoom) ? parsedZoom : 17,
      };
    }
  }

  // 3. Google Maps URL @lat,lng,zoom
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+)z)?/i);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    const zoom = atMatch[3] ? parseInt(atMatch[3], 10) : (parsedZoom || 17);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, zoom: isNaN(zoom) ? 17 : zoom };
    }
  }

  // 4. PB parameters in embed URL (!2dlng !3dlat)
  const pbLngMatch = text.match(/!2d(-?\d+\.\d+)/);
  const pbLatMatch = text.match(/!3d(-?\d+\.\d+)/);
  if (pbLatMatch && pbLngMatch) {
    const lat = parseFloat(pbLatMatch[1]);
    const lng = parseFloat(pbLngMatch[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, zoom: parsedZoom || 17 };
    }
  }

  return defaultCoord;
}

/**
 * Builds standard Google Maps embed URL from latitude, longitude, and zoom.
 */
export function buildGoogleMapsUrlFromCoords(lat: number, lng: number, zoom: number = 17): string {
  const roundedLat = parseFloat(lat.toFixed(6));
  const roundedLng = parseFloat(lng.toFixed(6));
  const clampedZoom = Math.max(1, Math.min(21, Math.round(zoom)));
  return `https://maps.google.com/maps?q=${roundedLat},${roundedLng}&t=&z=${clampedZoom}&ie=UTF8&iwloc=&output=embed`;
}

