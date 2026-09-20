import React, { useState, useRef, useEffect } from 'react';
import { GTKItem, SchoolConfig } from '../../types';
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Quote,
  User,
  Sparkles,
  Award,
  Phone,
  Mail,
} from 'lucide-react';

interface GTKCarouselSectionProps {
  config: SchoolConfig;
}

export const GTKCarouselSection: React.FC<GTKCarouselSectionProps> = ({ config }) => {
  const allGtkList = config.gtkList || [];
  // Filter only visible teachers
  const visibleGtk = allGtkList.filter((item) => item.isVisible !== false && item.name?.trim());

  const sectionTitle = config.gtkSectionTitle || 'Guru & Tenaga Kependidikan';
  const sectionSubtitle =
    config.gtkSectionSubtitle ||
    'Mengenal para pendidik dan tenaga kependidikan berdedikasi yang membimbing dan menginspirasi generasi penerus bangsa.';

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [visibleGtk]);

  // Gentle auto-scroll effect every 5 seconds if not hovered
  useEffect(() => {
    if (visibleGtk.length <= 3 || isPaused) return;

    const interval = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [visibleGtk.length, isPaused]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 340;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (visibleGtk.length === 0) {
    return null; // Do not display section if no visible teacher data
  }

  return (
    <section
      id="gtk"
      className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden border-t border-slate-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wider uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Tenaga Pendidik</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {sectionTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {sectionSubtitle}
            </p>
          </div>

          {/* Navigation Controls */}
          {visibleGtk.length > 1 && (
            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Sebelumnya"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Selanjutnya"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleGtk.map((teacher, index) => (
            <div
              key={teacher.id || index}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                
                {/* Photo & Role Tag */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    {teacher.photoUrl ? (
                      <img
                        src={teacher.photoUrl}
                        alt={teacher.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm">
                        {teacher.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 mb-1 max-w-full truncate">
                      {teacher.role}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                      {teacher.name}
                    </h3>
                    {teacher.nip && teacher.nip !== '-' && (
                      <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                        NIP. {teacher.nip}
                      </p>
                    )}
                  </div>
                </div>

                {/* Kata-kata Mutiara / Quote */}
                {teacher.quote && (
                  <div className="relative bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 text-xs sm:text-[13px] italic text-slate-700 leading-relaxed group-hover:bg-blue-50/40 group-hover:border-blue-100 transition-colors">
                    <Quote className="w-4 h-4 text-blue-400/80 shrink-0 mb-1" />
                    <p className="line-clamp-4">
                      "{teacher.quote}"
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Footer info (Email / Phone) */}
              {(teacher.email || teacher.phone) && (
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-400">
                  {teacher.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {teacher.phone}
                    </span>
                  )}
                  {teacher.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3" />
                      {teacher.email}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
