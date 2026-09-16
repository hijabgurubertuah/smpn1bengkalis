import { useEffect, useState } from 'react';
import { SchoolIdentity } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let activeBlobManifestUrl: string | null = null;

export function syncPWAManifest(identity: SchoolIdentity) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const schoolName = identity.name || 'Portal Resmi';
  const shortName = identity.shortName || identity.name || 'Portal';
  const DEFAULT_LOGO_URL = 'https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png';
  const rawLogo = identity.logoUrl || '';
  const cleanLogo = (rawLogo && !rawLogo.includes('photo-1594608661623')) ? rawLogo : '';
  const rawFavicon = identity.faviconUrl || identity.logoUrl || '';
  const cleanFavicon = (rawFavicon && !rawFavicon.includes('photo-1546410531') && !rawFavicon.includes('photo-1594608661623')) ? rawFavicon : '';

  const logoUrl = cleanLogo || DEFAULT_LOGO_URL;
  const faviconUrl = cleanFavicon || cleanLogo || DEFAULT_LOGO_URL;

  // 1. Update Document Title
  document.title = `${schoolName} - Portal Resmi`;

  // 2. Update meta tags
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', shortName);
  }

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute(
      'content',
      identity.tagline || `Website resmi dan portal informasi ${schoolName}`
    );
  }

  // 3. Update Favicon & Apple Touch Icon
  try {
    // Remove all existing icon links to force browser refresh
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach((el) => {
      if (el.getAttribute('rel') !== 'apple-touch-icon') {
        el.remove();
      }
    });

    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.href = faviconUrl;
    document.head.appendChild(newFavicon);

    const newShortcut = document.createElement('link');
    newShortcut.rel = 'shortcut icon';
    newShortcut.href = faviconUrl;
    document.head.appendChild(newShortcut);

    let appleTouchLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleTouchLink) {
      appleTouchLink = document.createElement('link');
      appleTouchLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchLink);
    }
    appleTouchLink.href = logoUrl;
  } catch (err) {
    console.debug('Favicon update error:', err);
  }

  // 4. Create Dynamic Web Manifest (Blob URL) so PWA install prompt displays the user's school name & logo!
  try {
    const dynamicManifest = {
      id: '/',
      name: `${schoolName} - Portal Resmi`,
      short_name: shortName,
      description: identity.tagline || `Aplikasi Portal Resmi ${schoolName}`,
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    };

    if (activeBlobManifestUrl) {
      URL.revokeObjectURL(activeBlobManifestUrl);
    }

    const blob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
      type: 'application/manifest+json',
    });
    activeBlobManifestUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = activeBlobManifestUrl;
  } catch (err) {
    console.warn('Could not update dynamic manifest:', err);
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
