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
    // If fallback mentions Bengkalis or SMPN 1, use verified official embed
    if (!fallbackAddress || /smp\s*n(?:egeri)?\s*1|bengkalis/i.test(fallbackAddress)) {
      return {
        embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
        sourceType: 'embed_url',
        detectedLocation: 'SMP Negeri 1 Bengkalis, Jl. Karimun',
        isValid: true,
        notes: 'Menggunakan peta embed resmi SMP Negeri 1 Bengkalis terverifikasi.',
      };
    }
    const loc = fallbackAddress.trim();
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'plain_address',
      detectedLocation: loc,
      isValid: true,
      notes: 'Menggunakan alamat resmi sekolah untuk peta.',
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

  // 3. If it's for SMP Negeri 1 Bengkalis (including old legacy output=embed that failed on desktop)
  if (/smp\s*n(?:egeri)?\s*1.*bengkalis|bengkalis.*smp\s*n(?:egeri)?\s*1/i.test(raw)) {
    return {
      embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
      sourceType: 'embed_url',
      detectedLocation: 'SMP Negeri 1 Bengkalis, Jl. Karimun',
      isValid: true,
      notes: 'Dikonversi otomatis ke URL embed resmi Google Maps SMP Negeri 1 Bengkalis.',
    };
  }

  // 4. Already has output=embed
  if (raw.includes('output=embed')) {
    const qMatch = raw.match(/[?&]q=([^&]+)/i);
    const detectedLocation = qMatch ? decodeURIComponent(qMatch[1].replace(/\+/g, ' ')) : undefined;
    if (detectedLocation && /smp\s*n(?:egeri)?\s*1|bengkalis/i.test(detectedLocation)) {
      return {
        embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
        sourceType: 'embed_url',
        detectedLocation: 'SMP Negeri 1 Bengkalis',
        isValid: true,
        notes: 'Peta resmi SMP Negeri 1 Bengkalis aktif.',
      };
    }
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
    if (/smp\s*n(?:egeri)?\s*1|bengkalis/i.test(placeName)) {
      return {
        embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
        sourceType: 'embed_url',
        detectedLocation: 'SMP Negeri 1 Bengkalis',
        isValid: true,
        notes: 'Peta resmi SMP Negeri 1 Bengkalis aktif.',
      };
    }
    // Check if coordinates exist in URL @lat,lng
    const coordMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const query = coordMatch ? `${coordMatch[1]},${coordMatch[2]}` : placeName;

    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
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
    if (/smp\s*n(?:egeri)?\s*1|bengkalis/i.test(queryParam)) {
      return {
        embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
        sourceType: 'embed_url',
        detectedLocation: 'SMP Negeri 1 Bengkalis',
        isValid: true,
        notes: 'Peta resmi SMP Negeri 1 Bengkalis aktif.',
      };
    }
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(queryParam)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
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
    if (/smp\s*n(?:egeri)?\s*1|bengkalis/i.test(loc)) {
      return {
        embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
        sourceType: 'embed_url',
        detectedLocation: 'SMP Negeri 1 Bengkalis',
        isValid: true,
        notes: 'Peta resmi SMP Negeri 1 Bengkalis aktif.',
      };
    }
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(loc)}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
      sourceType: 'short_link',
      detectedLocation: loc,
      isValid: true,
      notes: 'Tautan bagikan Google Maps terdeteksi. Peta interaktif diaktifkan menggunakan alamat/lokasi sekolah.',
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
  if (/smp\s*n(?:egeri)?\s*1|bengkalis/i.test(raw)) {
    return {
      embedUrl: OFFICIAL_SMPN1_MAP_EMBED_URL,
      sourceType: 'embed_url',
      detectedLocation: 'SMP Negeri 1 Bengkalis',
      isValid: true,
      notes: 'Peta resmi SMP Negeri 1 Bengkalis aktif.',
    };
  }

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
  if (!cleanQuery || /smp\s*n(?:egeri)?\s*1|bengkalis/i.test(cleanQuery)) {
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

