import React from 'react';
import { X, Target, Compass, Sparkles } from 'lucide-react';

interface VisiMisiDetailModalProps {
  visi?: string;
  misi?: string;
  title?: string;
  subtitle?: string;
  schoolName: string;
  logoUrl?: string;
  onClose: () => void;
}

export const VisiMisiDetailModal: React.FC<VisiMisiDetailModalProps> = ({
  visi = '',
  misi = '',
  title = 'Visi & Misi Instansi',
  subtitle = 'Komitmen pelayanan prima dan arah pandang dedikasi masa depan.',
  schoolName,
  logoUrl = 'https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png',
  onClose,
}) => {
  // Parse mission bullet points from newline-separated string
  const missionPoints = React.useMemo(() => {
    if (!misi) return [];
    return misi
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [misi]);

  const defaultVisi = "Terwujudnya insan yang berakhlak mulia, cerdas, berprestasi, kreatif, mandiri, dan berwawasan lingkungan.";

  // Close on Esc key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            {/* Logo Sekolah */}
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              <img
                src={logoUrl || 'https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png'}
                alt="Logo Sekolah"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain animate-spin-y"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.ibb.co.com/d44hK88L/logo-smpn-1-bengkalis-kecil.png';
                }}
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {schoolName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Visi Misi Columns */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Tagline Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider shadow-3xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Falsafah & Komitmen Dedikasi</span>
            </div>
          </div>

          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 text-center max-w-2xl mx-auto -mt-3">
              {subtitle}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch mt-2">
            
            {/* KOLOM VISI (5/12 width) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shadow-3xs">
                    <Compass className="w-5 h-5 text-blue-600" />
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Visi Utama
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Future Vision
                    </p>
                  </div>
                </div>

                <div className="relative pl-4 border-l-4 border-blue-600 py-1">
                  <p className="text-sm sm:text-base text-slate-700 font-bold italic leading-relaxed">
                    "{visi || defaultVisi}"
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold">{schoolName}</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">Unggul & Berkarakter</span>
              </div>
            </div>

            {/* KOLOM MISI (7/12 width) */}
            <div className="md:col-span-7 bg-white border border-slate-200/95 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-3xs">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Misi Strategis
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Concrete Mission
                    </p>
                  </div>
                </div>

                {missionPoints.length > 0 ? (
                  <div className="space-y-3.5">
                    {missionPoints.map((point, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shadow-3xs mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-xs">Belum ada misi yang ditambahkan.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Fokus Strategis</span>
                <span className="font-bold text-slate-500">Misi Layanan Terpadu</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
