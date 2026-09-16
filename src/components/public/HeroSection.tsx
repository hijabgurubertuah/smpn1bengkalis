import React, { useState, useEffect } from 'react';
import { SchoolConfig } from '../../types';
import { Award, GraduationCap, Users, BookOpen, ChevronRight, PlayCircle } from 'lucide-react';

interface HeroSectionProps {
  config: SchoolConfig;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ config }) => {
  const { header, identity, layoutSections, themeConfig } = config;
  const btnBg = themeConfig?.buttonBgColor || themeConfig?.primaryColor;
  const btnText = themeConfig?.buttonTextColor;

  // Carousel State & Autoplay
  const carouselImages = header.carouselEnabled && header.carouselImages && header.carouselImages.length > 0
    ? header.carouselImages
    : [header.heroImageUrl].filter(Boolean);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!header.carouselEnabled || carouselImages.length <= 1) return;
    const intervalSec = (header.carouselInterval || 5) * 1000;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, intervalSec);
    return () => clearInterval(timer);
  }, [header.carouselEnabled, header.carouselImages, header.heroImageUrl, header.carouselInterval, carouselImages.length]);

  // Icon mapping helper
  const cardStrokeColor = themeConfig?.cardStrokeColor || '#b45309';

  const getStatIcon = (iconName: string, customColor?: string) => {
    const iconColor = customColor || cardStrokeColor;
    switch (iconName?.toLowerCase()) {
      case 'award':
        return <Award className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />;
      case 'graduationcap':
        return <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />;
      case 'users':
        return <Users className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />;
      case 'bookopen':
      default:
        return <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: iconColor }} />;
    }
  };

  const handleScrollTo = (target: string) => {
    if (target?.startsWith('#')) {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasQuickStats = layoutSections.showQuickStats && header.highlights && header.highlights.length > 0;

  // Banner overlay color & opacity configuration from Admin Theme settings
  const bannerColor = themeConfig?.bannerOverlayColor || '#020617';
  const bannerOpacity = typeof themeConfig?.bannerOverlayOpacity === 'number' ? themeConfig.bannerOverlayOpacity : 45;
  const opacityRatio = Math.max(0, Math.min(100, bannerOpacity)) / 100;

  const hexToRgba = (hex: string, alpha: number) => {
    let c = (hex || '#020617').replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  };

  // Text alignment classes
  const textAlign = header.textAlign || 'left';
  const alignClasses =
    textAlign === 'center'
      ? 'text-center items-center mx-auto'
      : textAlign === 'right'
      ? 'text-right items-end ml-auto'
      : 'text-left items-start mr-auto';

  // Vertical position classes
  const verticalPosition = header.verticalPosition || 'center';
  const verticalClasses =
    verticalPosition === 'top'
      ? 'pt-10 sm:pt-16 pb-24 sm:pb-32'
      : verticalPosition === 'bottom'
      ? 'pt-24 sm:pt-36 pb-24 sm:pb-32'
      : 'py-16 sm:py-24 md:py-28';

  return (
    <div id="beranda" className="relative text-white w-full max-w-full overflow-hidden">
      
      {/* Background Hero Image / Carousel with Overlays */}
      <div className="relative overflow-hidden bg-slate-950 min-h-[420px] sm:min-h-[520px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0">
          {carouselImages.length > 0 ? (
            carouselImages.map((imgUrl, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${identity.name || 'Hero Banner'} - Slide ${index + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform scale-105"
                />
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-slate-900" />
          )}

          {/* Pelindung Kontras Teks */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 z-20" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent z-20" />

          {/* Configurable Gradients Overlay dari Pengaturan Tema Admin */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300 z-20"
            style={{
              background: `linear-gradient(to right, ${hexToRgba(bannerColor, Math.min(1, opacityRatio * 1.15))}, ${hexToRgba(bannerColor, Math.min(1, opacityRatio * 0.75))})`,
            }}
          />
        </div>

        {/* Hero Content Area */}
        <div className={`relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full ${verticalClasses} ${hasQuickStats ? 'pb-28 sm:pb-32 md:pb-28' : ''}`}>
          <div className={`max-w-3xl space-y-4 flex flex-col ${alignClasses}`}>
            
            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {header.heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-2xl">
              {header.heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 mb-2 flex flex-wrap items-center gap-3 relative z-30">
              {header.showPrimaryButton !== false && header.heroCtaText && (
                <button
                  type="button"
                  onClick={() => handleScrollTo(header.heroCtaLink)}
                  style={btnBg ? { backgroundColor: btnBg, color: btnText || '#ffffff' } : undefined}
                  className={`inline-flex items-center gap-2 font-bold px-5 py-3 rounded-xl shadow-lg transition-all text-xs sm:text-sm cursor-pointer transform hover:-translate-y-0.5 ${
                    !btnBg ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' : ''
                  }`}
                >
                  <span>{header.heroCtaText}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {header.showSecondaryButton !== false && header.secondaryCtaText && (
                <button
                  type="button"
                  onClick={() => handleScrollTo(header.secondaryCtaLink)}
                  className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 font-semibold px-4 py-3 rounded-xl backdrop-blur-sm transition-all text-xs sm:text-sm cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                  <span>{header.secondaryCtaText}</span>
                </button>
              )}
            </div>

            {/* Carousel Dots / Indicators if multiple slides */}
            {header.carouselEnabled && carouselImages.length > 1 && (
              <div className="flex items-center gap-2 pt-3 z-30">
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Floating 4 Stat Cards */}
      {hasQuickStats && (
        <div className="relative z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -translate-y-1/2 -mb-[74px] sm:-mb-[80px] md:-mb-8 lg:-mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {header.highlights.map((stat) => {
              const useGrad = !!themeConfig?.statCardUseGradient;
              const gradFrom = themeConfig?.statCardGradientFrom || '#2563eb';
              const gradTo = themeConfig?.statCardGradientTo || '#7c3aed';
              const strokeThickness = typeof themeConfig?.cardStrokeWidth === 'number' ? themeConfig.cardStrokeWidth : 2;
              return (
                <div
                  key={stat.id}
                  className="group relative rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.25)] transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    padding: `${strokeThickness}px`,
                    background: `linear-gradient(135deg, ${cardStrokeColor} 0%, ${hexToRgba(cardStrokeColor, 0.5)} 100%)`,
                  }}
                >
                  <div
                    className="h-full w-full bg-slate-900/95 backdrop-blur-xl rounded-[14px] p-3 sm:p-4.5 flex flex-col justify-between"
                    style={{
                      background: useGrad
                        ? `linear-gradient(135deg, ${hexToRgba(gradFrom, 0.92)} 0%, ${hexToRgba(gradTo, 0.96)} 100%)`
                        : undefined
                    }}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                      <div
                        className="p-1.5 sm:p-2 rounded-lg bg-slate-800/95 border group-hover:scale-105 transition-transform shrink-0"
                        style={{
                          borderColor: useGrad ? hexToRgba(gradFrom, 0.4) : hexToRgba(cardStrokeColor, 0.4),
                          backgroundColor: useGrad ? hexToRgba(gradFrom, 0.15) : undefined
                        }}
                      >
                        {getStatIcon(stat.icon, useGrad ? '#ffffff' : undefined)}
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 line-clamp-1">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-lg sm:text-2xl font-black text-white tracking-tight pl-0.5">
                      {stat.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
