import { ThemePreset, ThemeConfig } from '../types';

export const BUILTIN_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'blue_classic',
    name: 'Biru Khas Sekolah (Default)',
    primaryColor: '#2563eb',
    primaryHoverColor: '#1d4ed8',
    headerBgColor: '#0f172a',
    navbarBgColor: '#ffffff',
    navbarTextColor: '#0f172a',
    buttonBgColor: '#2563eb',
    buttonTextColor: '#ffffff',
    accentColor: '#f59e0b',
    footerBgColor: '#0f172a',
  },
  {
    id: 'emerald_islami',
    name: 'Hijau Depag / Islami',
    primaryColor: '#059669',
    primaryHoverColor: '#047857',
    headerBgColor: '#022c22',
    navbarBgColor: '#f0fdf4',
    navbarTextColor: '#064e3b',
    buttonBgColor: '#059669',
    buttonTextColor: '#ffffff',
    accentColor: '#fbbf24',
    footerBgColor: '#022c22',
  },
  {
    id: 'maroon_gold',
    name: 'Merah Marun & Emas',
    primaryColor: '#be123c',
    primaryHoverColor: '#9f1239',
    headerBgColor: '#4c0519',
    navbarBgColor: '#fff1f2',
    navbarTextColor: '#881337',
    buttonBgColor: '#be123c',
    buttonTextColor: '#ffffff',
    accentColor: '#f59e0b',
    footerBgColor: '#4c0519',
  },
  {
    id: 'navy_premium',
    name: 'Navy & Dark Premium',
    primaryColor: '#3b82f6',
    primaryHoverColor: '#2563eb',
    headerBgColor: '#020617',
    navbarBgColor: '#0f172a',
    navbarTextColor: '#f8fafc',
    buttonBgColor: '#2563eb',
    buttonTextColor: '#ffffff',
    accentColor: '#eab308',
    footerBgColor: '#020617',
  },
  {
    id: 'teal_cyan',
    name: 'Teal & Cyan Modern',
    primaryColor: '#0d9488',
    primaryHoverColor: '#0f766e',
    headerBgColor: '#042f2e',
    navbarBgColor: '#f0fdfa',
    navbarTextColor: '#134e4a',
    buttonBgColor: '#0d9488',
    buttonTextColor: '#ffffff',
    accentColor: '#f59e0b',
    footerBgColor: '#042f2e',
  },
  {
    id: 'royal_purple',
    name: 'Ungu Royal & Silver',
    primaryColor: '#7e22ce',
    primaryHoverColor: '#6b21a8',
    headerBgColor: '#2e1065',
    navbarBgColor: '#faf5ff',
    navbarTextColor: '#581c87',
    buttonBgColor: '#7e22ce',
    buttonTextColor: '#ffffff',
    accentColor: '#fbbf24',
    footerBgColor: '#2e1065',
  },
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  presetId: 'blue_classic',
  primaryColor: '#2563eb',
  primaryHoverColor: '#1d4ed8',
  headerBgColor: '#0f172a',
  navbarBgColor: '#ffffff',
  navbarTextColor: '#0f172a',
  buttonBgColor: '#2563eb',
  buttonTextColor: '#ffffff',
  accentColor: '#f59e0b',
  footerBgColor: '#0f172a',
  bannerOverlayColor: '#0f172a',
  bannerOverlayOpacity: 45,
  cardStrokeColor: '#b45309',
  cardStrokeWidth: 2,
  statCardUseGradient: false,
  statCardGradientFrom: '#2563eb',
  statCardGradientTo: '#7c3aed',
  customPresets: [],
};

/**
 * Helper to convert HEX or RGB string to RGB values { r, g, b }
 */
export function hexOrRgbToRgb(colorStr: string): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 37, g: 99, b: 235 };

  const str = colorStr.trim();
  
  // Handle rgb(r, g, b) or rgba(r, g, b, a)
  if (str.startsWith('rgb')) {
    const matches = str.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return {
        r: parseInt(matches[0], 10),
        g: parseInt(matches[1], 10),
        b: parseInt(matches[2], 10),
      };
    }
  }

  // Handle #HEX
  let hex = str.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  
  if (hex.length === 6) {
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  return { r: 37, g: 99, b: 235 };
}

/**
 * Convert RGB numbers to HEX string #rrggbb
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
