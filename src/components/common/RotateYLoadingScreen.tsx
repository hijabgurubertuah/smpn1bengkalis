import React, { useEffect, useState } from 'react';
import { School } from 'lucide-react';

interface RotateYLoadingScreenProps {
  isVisible: boolean;
  schoolLogo?: string;
  schoolName?: string;
}

export const RotateYLoadingScreen: React.FC<RotateYLoadingScreenProps> = ({
  isVisible,
  schoolLogo,
  schoolName = 'SMPN 1 Bengkalis',
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Hard watchdog timeout: Never stay stuck for more than 2 seconds under any circumstance
      const safetyTimer = setTimeout(() => {
        setShouldRender(false);
      }, 2000);
      return () => clearTimeout(safetyTimer);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      id="fullscreen-rotate-y-loader"
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300 select-none ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Memuat..."
    >
      {/* 3D Rotate Y Animated Logo Only */}
      <div
        className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center animate-rotate-y pointer-events-none"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {schoolLogo && !imgError ? (
          <img
            src={schoolLogo}
            alt={schoolName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-2xl"
            onError={() => setImgError(true)}
          />
        ) : (
          <School className="w-20 h-20 sm:w-24 sm:h-24 text-blue-500 drop-shadow-xl" />
        )}
      </div>
    </div>
  );
};
