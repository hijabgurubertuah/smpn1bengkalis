import React, { useState } from 'react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        title="Instal Aplikasi Portal Sekolah ke Perangkat"
        aria-label="Instal Aplikasi"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Instal Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 px-2 sm:px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          title="Instal di iPhone / iPad"
          aria-label="Instal App"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="hidden sm:inline">Instal App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Pasang di iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Untuk memasang portal sekolah ke layar utama perangkat iOS:
                <br />
                1. Ketuk tombol <strong>Share</strong> (ikon kotak berpanah atas) di Safari toolbar.
                <br />
                2. Gulir ke bawah dan pilih <strong>Add to Home Screen</strong> (+ Layar Utama).
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
