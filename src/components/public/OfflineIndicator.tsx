import React from 'react';
import { useOnlineStatus } from '../../lib/usePWAInstall';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-amber-500/50 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-bounce-short">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      </span>
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Mode Offline — Seluruh data &amp; aset situs dimuat dari Service Worker lokal.</span>
    </div>
  );
};
