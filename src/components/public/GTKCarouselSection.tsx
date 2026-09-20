import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GTKItem, SchoolConfig } from '../../types';
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Award,
  Phone,
  Mail,
  X,
  Maximize2,
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

  // Touch / Drag swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Lightbox / Photo preview modal
  const [previewTeacher, setPreviewTeacher] = useState<GTKItem | null>(null);

  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [visibleGtk, checkScroll]);

  // Continuous auto-advance loop (smooth auto scrolling every 3.8s)
  useEffect(() => {
    if (visibleGtk.length <= 1 || isPaused || isDragging || previewTeacher) return;

    const interval = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // If reached end, seamlessly loop back to start
      if (scrollLeft + clientWidth >= scrollWidth - 30) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Step forward by 1 card width
        const cardWidth = window.innerWidth < 640 ? 270 : 310;
        scrollContainerRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [visibleGtk.length, isPaused, isDragging, previewTeacher]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const cardWidth = window.innerWidth < 640 ? 270 : 310;

    if (direction === 'right') {
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    } else {
      if (scrollLeft <= 10) {
        scrollContainerRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
      } else {
        scrollContainerRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    }
  };

  // Mouse Drag to Swipe handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setIsPaused(false);
  };

  if (visibleGtk.length === 0) {
    return null;
  }

  return (
    <section
      id="gtk"
      className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden border-t border-slate-100 select-none"
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
                aria-label="Sebelumnya"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                title="Geser ke kiri"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                aria-label="Selanjutnya"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                title="Geser ke kanan"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Carousel Track with swipe support */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className={`flex gap-4 sm:gap-5 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y' }}
        >
          {visibleGtk.map((teacher, index) => (
            <div
              key={teacher.id || index}
              className="w-[250px] sm:w-[280px] shrink-0 snap-start bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* TOP: Kartu Thumbnail Foto GTK - Bisa di-klik untuk Preview/Lightbox */}
              <div
                onClick={() => setPreviewTeacher(teacher)}
                className="relative aspect-square w-full bg-gradient-to-br from-slate-100 via-slate-200 to-blue-50 overflow-hidden shrink-0 border-b border-slate-100 cursor-pointer"
                title="Klik untuk melihat foto lebih jelas"
              >
                {teacher.photoUrl ? (
                  <img
                    src={teacher.photoUrl}
                    alt={teacher.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white p-4 text-center">
                    <User className="w-16 h-16 opacity-40 mb-2" />
                    <span className="text-2xl font-black">{teacher.name.charAt(0)}</span>
                  </div>
                )}

                {/* Hover zoom icon indicator */}
                <div className="absolute inset-0 bg-slate-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="p-2 rounded-full bg-white/90 text-slate-900 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>

                {/* Role Badge Floating on Top of Photo */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-start">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md text-white border border-white/20 shadow-sm max-w-full truncate">
                    {teacher.role}
                  </span>
                </div>
              </div>

              {/* BOTTOM: Detail Informasi Guru (Nama, NIP, Mutiara, Kontak) */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white">
                <div className="space-y-1.5">
                  {/* Nama Lengkap & Gelar */}
                  <h3
                    onClick={() => setPreviewTeacher(teacher)}
                    className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
                    title={teacher.name}
                  >
                    {teacher.name}
                  </h3>

                  {/* NIP / NUPTK */}
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
                    <Award className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      {teacher.nip && teacher.nip !== '-' ? `NIP. ${teacher.nip}` : 'Tenaga Pendidik'}
                    </span>
                  </div>

                  {/* Kata-kata Mutiara / Motto (Tanpa tanda kutip biru besar) */}
                  {teacher.quote && (
                    <div className="pt-2">
                      <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 text-xs italic text-slate-600 leading-relaxed group-hover:bg-blue-50/40 group-hover:border-blue-100 transition-colors">
                        <span className="line-clamp-3 leading-relaxed">"{teacher.quote}"</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Kontak WhatsApp / Email */}
                {(teacher.phone || teacher.email) && (
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    {teacher.phone && (
                      <a
                        href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{teacher.phone}</span>
                      </a>
                    )}
                    {teacher.email && (
                      <a
                        href={`mailto:${teacher.email}`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium truncate max-w-full transition-colors"
                      >
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span className="truncate">{teacher.email}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox / Foto Preview Popup Modal */}
      {previewTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setPreviewTeacher(null)}
              className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Big Photo Preview */}
            <div className="relative aspect-square w-full bg-slate-900 flex items-center justify-center overflow-hidden">
              {previewTeacher.photoUrl ? (
                <img
                  src={previewTeacher.photoUrl}
                  alt={previewTeacher.name}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 text-center">
                  <User className="w-20 h-20 opacity-30 mb-2" />
                  <span className="text-4xl font-black">{previewTeacher.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Biodata Info in Lightbox */}
            <div className="p-5 sm:p-6 space-y-3 overflow-y-auto bg-white">
              <div>
                <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 mb-1.5">
                  {previewTeacher.role}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {previewTeacher.name}
                </h3>
                {previewTeacher.nip && previewTeacher.nip !== '-' && (
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    NIP / NUPTK: {previewTeacher.nip}
                  </p>
                )}
              </div>

              {previewTeacher.quote && (
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 text-xs italic text-slate-700 leading-relaxed">
                  "{previewTeacher.quote}"
                </div>
              )}

              {(previewTeacher.phone || previewTeacher.email) && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {previewTeacher.phone && (
                    <a
                      href={`https://wa.me/${previewTeacher.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{previewTeacher.phone}</span>
                    </a>
                  )}
                  {previewTeacher.email && (
                    <a
                      href={`mailto:${previewTeacher.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition truncate max-w-full"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{previewTeacher.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
