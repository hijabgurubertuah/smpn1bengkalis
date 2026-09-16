import React, { useState } from 'react';
import { SchoolConfig, NewsArticle } from '../../types';
import { AlertTriangle, Megaphone, Bell, Sparkles, X, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { NewsDetailModal } from './NewsDetailModal';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import { FormattedContentRenderer } from '../common/FormattedContentRenderer';

interface ImportantNoticeBannerProps {
  config: SchoolConfig;
  articles?: NewsArticle[];
  onSelectArticle?: (article: NewsArticle) => void;
}

export const ImportantNoticeBanner: React.FC<ImportantNoticeBannerProps> = ({
  config,
  articles = [],
  onSelectArticle,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Lock body scroll when custom modal is open
  useBodyScrollLock(showCustomModal);

  const announcement = config.importantAnnouncement;

  if (!announcement || announcement.enabled === false) {
    return null;
  }

  const badgeText = announcement.badge || 'INFO PENTING';
  const textMessage = announcement.text?.trim() || '';

  if (!textMessage) {
    return null;
  }

  const handleOpenDetail = () => {
    const mode = announcement.popupMode || (announcement.targetArticleId ? 'article' : (announcement.detailContent || announcement.detailTitle ? 'custom' : 'article'));

    if (mode === 'none') {
      return;
    }

    if (mode === 'article' && announcement.targetArticleId && articles.length > 0) {
      const found = articles.find((a) => a.id === announcement.targetArticleId);
      if (found) {
        if (onSelectArticle) {
          onSelectArticle(found);
        } else {
          setSelectedArticle(found);
        }
        return;
      }
    }

    if (mode === 'custom' || announcement.detailContent || announcement.detailTitle) {
      setShowCustomModal(true);
    }
  };

  // Animation speed duration
  const getSpeedDuration = () => {
    switch (announcement.speed) {
      case 'slow':
        return '50s';
      case 'fast':
        return '18s';
      case 'normal':
      default:
        return '30s';
    }
  };

  // Color Theme classes
  const getThemeClasses = () => {
    const theme = announcement.theme || 'warning';

    // Custom background override if set
    if (announcement.customBgColor) {
      return {
        containerBg: '',
        customStyle: { backgroundColor: announcement.customBgColor },
        badgeBg: 'bg-white/20 text-white border-white/30 backdrop-blur-xs hover:bg-white/30',
        badgeTextColor: 'text-white',
        tickerTextColor: 'text-white font-semibold',
        icon: <Megaphone className="w-3.5 h-3.5 text-white shrink-0" />,
      };
    }

    switch (theme) {
      case 'danger':
        return {
          containerBg: 'bg-gradient-to-r from-rose-800 via-rose-600 to-rose-800 text-white border-y border-rose-900/40 shadow-sm',
          badgeBg: 'bg-white text-rose-900 font-black border-rose-200 shadow-xs hover:bg-rose-50',
          badgeTextColor: 'text-rose-900',
          tickerTextColor: 'text-rose-50 font-semibold',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-800 shrink-0" />,
        };
      case 'emerald':
        return {
          containerBg: 'bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-800 text-white border-y border-emerald-900/40 shadow-sm',
          badgeBg: 'bg-amber-300 text-slate-950 font-black border-amber-200 shadow-xs hover:bg-amber-200',
          badgeTextColor: 'text-slate-950',
          tickerTextColor: 'text-emerald-50 font-semibold',
          icon: <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />,
        };
      case 'info':
        return {
          containerBg: 'bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 text-white border-y border-blue-900/40 shadow-sm',
          badgeBg: 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-xs hover:bg-amber-300',
          badgeTextColor: 'text-slate-950',
          tickerTextColor: 'text-blue-50 font-semibold',
          icon: <Bell className="w-3.5 h-3.5 text-slate-950 shrink-0" />,
        };
      case 'slate':
        return {
          containerBg: 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-amber-300 border-y border-slate-800 shadow-sm',
          badgeBg: 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-xs hover:bg-amber-300',
          badgeTextColor: 'text-slate-950',
          tickerTextColor: 'text-slate-100 font-semibold',
          icon: <Megaphone className="w-3.5 h-3.5 text-slate-950 shrink-0" />,
        };
      case 'purple':
        return {
          containerBg: 'bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 text-white border-y border-purple-950/40 shadow-sm',
          badgeBg: 'bg-amber-300 text-slate-950 font-black border-amber-200 shadow-xs hover:bg-amber-200',
          badgeTextColor: 'text-slate-950',
          tickerTextColor: 'text-purple-50 font-semibold',
          icon: <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />,
        };
      case 'orange':
        return {
          containerBg: 'bg-gradient-to-r from-orange-700 via-orange-500 to-orange-700 text-white border-y border-orange-800/40 shadow-sm',
          badgeBg: 'bg-slate-950 text-white font-black border-slate-800 shadow-xs hover:bg-slate-900',
          badgeTextColor: 'text-white',
          tickerTextColor: 'text-orange-50 font-semibold',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        };
      case 'warning':
      default:
        return {
          containerBg: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 border-y border-amber-600/30 shadow-sm',
          badgeBg: 'bg-slate-950 text-white font-black border-slate-800 shadow-xs hover:bg-slate-900',
          badgeTextColor: 'text-white',
          tickerTextColor: 'text-slate-950 font-bold',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        };
    }
  };

  const themeStyle = getThemeClasses();

  // Split text by bullets (•), pipes (|), or newlines into items if any
  const textItems = textMessage
    .split(/[•|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isSticky = announcement.isSticky === true;

  return (
    <>
      <div
        id="info-penting-running-text"
        className={`overflow-hidden py-2.5 sm:py-3 px-3 sm:px-6 transition-all duration-300 ${
          isSticky ? 'sticky top-[56px] sm:top-[64px] z-30 shadow-md' : 'relative z-20'
        } ${themeStyle.containerBg}`}
        style={themeStyle.customStyle}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 sm:gap-3">
          
          {/* Clickable Badge Label */}
          <button
            type="button"
            onClick={handleOpenDetail}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs uppercase tracking-wider shrink-0 shadow-xs border cursor-pointer active:scale-95 transition-all group ${themeStyle.badgeBg}`}
            title="Klik untuk membuka detail pengumuman"
          >
            {themeStyle.icon}
            <span className="font-black">{badgeText}</span>
          </button>

          {/* Marquee Running Text Track (Clickable to open popup) */}
          <div
            onClick={handleOpenDetail}
            className="overflow-hidden whitespace-nowrap flex-1 min-w-0 relative cursor-pointer group/track"
            title="Klik untuk melihat pengumuman selengkapnya"
          >
            <div
              className="inline-flex items-center gap-8 animate-marquee group-hover/track:pause"
              style={{ animationDuration: getSpeedDuration() }}
            >
              {/* Repeat items twice for seamless infinite marquee loop */}
              {[...textItems, ...textItems].map((item, idx) => (
                <div key={idx} className="inline-flex items-center gap-2 shrink-0">
                  <span className={`text-xs sm:text-sm tracking-wide ${themeStyle.tickerTextColor} group-hover/track:underline`}>
                    {item}
                  </span>
                  <span className="opacity-60 mx-2 text-xs font-black">•</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Linked News Article Modal (fallback if not handled globally) */}
      {!onSelectArticle && selectedArticle && (
        <NewsDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* Custom Info Penting Detail Popup Modal */}
      {showCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCustomModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Thin Compact Frame */}
            <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                    {badgeText}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    {announcement.detailTitle || badgeText}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup Detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Spacious Content Area */}
            <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 text-slate-800 text-sm leading-relaxed">
              
              {/* Optional Cover Image */}
              {announcement.detailImageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200/80 shadow-xs max-h-80 bg-slate-50">
                  <img
                    src={announcement.detailImageUrl}
                    alt={announcement.detailTitle || badgeText}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Main Content Text */}
              {announcement.detailContent ? (
                <FormattedContentRenderer content={announcement.detailContent} />
              ) : (
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/70 text-slate-800 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap">
                  {textMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
