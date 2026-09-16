import React, { useState, useEffect } from 'react';
import { FacilityItem, ExtracurricularItem } from '../../types';
import {
  Building2,
  Trophy,
  Clock,
  UserCheck,
  Sparkles,
  Cpu,
  Flag,
  Music,
  HeartHandshake,
  MessageSquare,
  Award,
  BookOpen,
  Users,
  Target,
  X,
} from 'lucide-react';

interface FacilitiesAndEkskulProps {
  facilities: FacilityItem[];
  extracurriculars: ExtracurricularItem[];
  facilitiesTabTitle?: string;
  ekskulTabTitle?: string;
  facilitiesSectionTitle?: string;
  facilitiesSectionSubtitle?: string;
}

export const FacilitiesAndEkskul: React.FC<FacilitiesAndEkskulProps> = ({
  facilities,
  extracurriculars,
  facilitiesTabTitle = 'Fasilitas Sekolah',
  ekskulTabTitle = 'Ekstrakurikuler',
  facilitiesSectionTitle = 'Fasilitas Modern & Ekstrakurikuler',
  facilitiesSectionSubtitle = 'Dukungan penuh sarana fisik berstandar tinggi serta wadah pengembangan talenta generasi muda.',
}) => {
  const [activeTab, setActiveTab] = useState<'facilities' | 'ekskul'>('facilities');

  const [selectedFacility, setSelectedFacility] = useState<FacilityItem | null>(null);
  const [selectedEkskul, setSelectedEkskul] = useState<ExtracurricularItem | null>(null);

  useEffect(() => {
    const handleSelectTab = (e: Event) => {
      const customEvent = e as CustomEvent<'facilities' | 'ekskul'>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('select-facility-tab', handleSelectTab);
    return () => window.removeEventListener('select-facility-tab', handleSelectTab);
  }, []);

  const getEkskulIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'cpu':
        return <Cpu className="w-5 h-5 sm:w-6 h-6 text-blue-600" />;
      case 'flag':
        return <Flag className="w-5 h-5 sm:w-6 h-6 text-red-600" />;
      case 'music':
        return <Music className="w-5 h-5 sm:w-6 h-6 text-purple-600" />;
      case 'hearthandshake':
        return <HeartHandshake className="w-5 h-5 sm:w-6 h-6 text-emerald-600" />;
      case 'messagesquare':
        return <MessageSquare className="w-5 h-5 sm:w-6 h-6 text-indigo-600" />;
      case 'bookopen':
        return <BookOpen className="w-5 h-5 sm:w-6 h-6 text-teal-600" />;
      case 'users':
        return <Users className="w-5 h-5 sm:w-6 h-6 text-cyan-600" />;
      case 'target':
        return <Target className="w-5 h-5 sm:w-6 h-6 text-rose-600" />;
      case 'award':
        return <Award className="w-5 h-5 sm:w-6 h-6 text-yellow-600" />;
      case 'trophy':
      default:
        return <Trophy className="w-5 h-5 sm:w-6 h-6 text-amber-600" />;
    }
  };

  return (
    <section id="fasilitas" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/60 relative">
      <span id="ekskul" className="absolute -top-16 left-0 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Switcher Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {facilitiesSectionTitle}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-1">
              {facilitiesSectionSubtitle}
            </p>
          </div>

          {/* Interactive Tab Switcher - Stretched full width and balanced on Mobile HP, centered on larger screens */}
          <div className="w-full lg:w-auto inline-flex p-1 bg-slate-200/80 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('facilities')}
              className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'facilities'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 h-4" />
              <span>{facilitiesTabTitle}</span>
            </button>
            <button
              onClick={() => setActiveTab('ekskul')}
              className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ekskul'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 h-4" />
              <span>{ekskulTabTitle}</span>
            </button>
          </div>
        </div>

        {/* Facilities Tab Content - 2 columns on Mobile grid-cols-2 */}
        {activeTab === 'facilities' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in duration-300">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col cursor-pointer transform hover:-translate-y-1 duration-300"
              >
                <div className="relative aspect-16/10 sm:aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={fac.imageUrl}
                    alt={fac.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3 sm:p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {fac.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extracurriculars Tab Content - 2 columns on Mobile grid-cols-2 */}
        {activeTab === 'ekskul' && (
          <div id="ekskul" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-in fade-in duration-300">
            {extracurriculars.map((ekskul) => (
              <div
                key={ekskul.id}
                onClick={() => setSelectedEkskul(ekskul)}
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col cursor-pointer transform hover:-translate-y-1 duration-300"
              >
                <div className="relative aspect-16/10 sm:aspect-4/3 overflow-hidden bg-slate-100 flex items-center justify-center">
                  {ekskul.imageUrl ? (
                    <img
                      src={ekskul.imageUrl}
                      alt={ekskul.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <div className="p-3 rounded-2xl bg-white shadow-xs border border-indigo-50">
                        {getEkskulIcon(ekskul.icon)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm md:text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {ekskul.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= DETAIL MODAL: FASILITAS ================= */}
      {selectedFacility && (
        <div
          onClick={() => setSelectedFacility(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Image Header Area */}
            <div className="relative aspect-16/10 bg-slate-100 w-full shrink-0">
              <img
                src={selectedFacility.imageUrl}
                alt={selectedFacility.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedFacility(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-xs text-white rounded-full transition-all cursor-pointer"
                aria-label="Tutup detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {selectedFacility.title}
              </h3>
              <div className="h-px bg-slate-100 w-full" />
              <div className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {selectedFacility.description}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFacility(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DETAIL MODAL: EKSTRAKURIKULER ================= */}
      {selectedEkskul && (
        <div
          onClick={() => setSelectedEkskul(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          >
            {/* Image/Icon Header Area */}
            <div className="relative aspect-16/10 bg-slate-100 w-full shrink-0 flex items-center justify-center">
              {selectedEkskul.imageUrl ? (
                <img
                  src={selectedEkskul.imageUrl}
                  alt={selectedEkskul.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="p-4 rounded-3xl bg-white shadow-md border border-indigo-50">
                    {getEkskulIcon(selectedEkskul.icon)}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedEkskul(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-xs text-white rounded-full transition-all cursor-pointer"
                aria-label="Tutup detail"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {selectedEkskul.name}
              </h3>
              
              <div className="h-px bg-slate-100 w-full" />
              <div className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {selectedEkskul.description}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEkskul(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
