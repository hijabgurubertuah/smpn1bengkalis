import React, { useState, useMemo, useEffect } from 'react';
import { NewsArticle } from '../../types';
import {
  BookmarkCheck,
  Newspaper,
  Search,
  Image as ImageIcon,
  Code2,
} from 'lucide-react';
import { NewsDetailModal } from './NewsDetailModal';

interface NewsSectionProps {
  articles: NewsArticle[];
  isInitialSyncing?: boolean;
  onSelectArticle?: (article: NewsArticle) => void;
}

// Helper to parse date string or timestamp for accurate sorting
const parseDateToTime = (dateStr?: string, id?: string): number => {
  if (!dateStr) return 0;
  const isoTime = Date.parse(dateStr);
  if (!isNaN(isoTime)) return isoTime;

  const indoMonths: Record<string, number> = {
    januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
    juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
  };
  const parts = dateStr.trim().toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const month = indoMonths[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day).getTime();
    }
  }

  if (id) {
    const numMatch = id.match(/\d{10,}/);
    if (numMatch) return parseInt(numMatch[0], 10);
  }

  return 0;
};

export const NewsSection: React.FC<NewsSectionProps> = ({
  articles,
  isInitialSyncing = false,
  onSelectArticle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const handleArticleClick = (art: NewsArticle) => {
    if (onSelectArticle) {
      onSelectArticle(art);
    } else {
      setSelectedArticle(art);
    }
  };

  useEffect(() => {
    const handleSelectCategory = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedCategory(customEvent.detail);
      }
    };

    window.addEventListener('select-news-category', handleSelectCategory);
    return () => window.removeEventListener('select-news-category', handleSelectCategory);
  }, []);

  // Auto-open article from URL parameter or popstate (e.g. ?post=post_123 or ?post=slug)
  useEffect(() => {
    // If handled at parent level (e.g., App.tsx with onSelectArticle), let parent handle URL
    if (onSelectArticle) return;
    if (!articles || articles.length === 0) return;

    const checkUrlForPost = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const postId = params.get('post') || params.get('berita') || params.get('id');
        if (postId) {
          const found = articles.find(
            (a) =>
              a.id === postId ||
              (a.slug && a.slug.toLowerCase() === postId.toLowerCase()) ||
              String(a.id).toLowerCase() === postId.toLowerCase()
          );
          if (found) {
            setSelectedArticle(found);
          }
        }
      } catch {}
    };

    checkUrlForPost();
    window.addEventListener('popstate', checkUrlForPost);
    return () => window.removeEventListener('popstate', checkUrlForPost);
  }, [articles, onSelectArticle]);

  // Layout Columns state (1, 2, 3, or 4 columns, default 2)
  const [layoutColumns, setLayoutColumns] = useState<1 | 2 | 3 | 4>(() => {
    try {
      const saved = localStorage.getItem('public_news_layout_cols');
      if (saved === '1' || saved === '2' || saved === '3' || saved === '4') {
        return Number(saved) as 1 | 2 | 3 | 4;
      }
    } catch {
      // ignore
    }
    return 2;
  });

  const handleCycleLayout = () => {
    setLayoutColumns((prev) => {
      const next: 1 | 2 | 3 | 4 = prev === 1 ? 2 : prev === 2 ? 3 : prev === 3 ? 4 : 1;
      try {
        localStorage.setItem('public_news_layout_cols', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['Semua', ...Array.from(set)];
  }, [articles]);

  // Filter and Sort articles: Pinned (max 4) first, then newest published first
  const filteredArticles = useMemo(() => {
    const published = articles
      .filter((a) => a.status === 'published' && !a.isLocalDraft)
      .filter((a) => {
        if (selectedCategory === 'Semua') return true;
        return a.category.toLowerCase() === selectedCategory.toLowerCase();
      })
      .filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
        );
      });

    // Pinned articles (maximum 4, sorted newest first)
    const pinned = published
      .filter((a) => Boolean(a.isPinned))
      .sort((a, b) => parseDateToTime(b.date, b.id) - parseDateToTime(a.date, a.id))
      .slice(0, 4);

    const pinnedIds = new Set(pinned.map((a) => a.id));

    // Non-pinned articles (all remaining, sorted newest first)
    const nonPinned = published
      .filter((a) => !pinnedIds.has(a.id))
      .sort((a, b) => parseDateToTime(b.date, b.id) - parseDateToTime(a.date, a.id));

    return [...pinned, ...nonPinned];
  }, [articles, selectedCategory, searchQuery]);

  return (
    <section id="berita" className="pt-3 pb-12 sm:pt-8 sm:pb-20 bg-slate-50 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Controls: Search Bar & Dynamic Layout Button */}
        <div className="flex items-center justify-between gap-2.5 mb-4 sm:mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berita..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs"
            />
          </div>

          {/* Layout Cycler Button (Tetap seperti semula) */}
          <button
            type="button"
            onClick={handleCycleLayout}
            className="h-10 px-3 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-blue-600 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 select-none"
            title={`Layout Tampilan: ${layoutColumns} Kolom`}
            aria-label={`Ubah susunan layout ke ${layoutColumns === 1 ? '2' : layoutColumns === 2 ? '3' : layoutColumns === 3 ? '4' : '1'} kolom`}
          >
            {layoutColumns === 1 && (
              <div className="w-4 h-4 rounded-xs border-2 border-slate-400 bg-slate-200" />
            )}
            {layoutColumns === 2 && (
              <div className="flex items-center gap-0.5">
                <div className="w-2 h-4 rounded-xs border-1.5 border-slate-400 bg-slate-200" />
                <div className="w-2 h-4 rounded-xs border-1.5 border-slate-400 bg-slate-200" />
              </div>
            )}
            {layoutColumns === 3 && (
              <div className="flex items-center gap-0.5">
                <div className="w-1.5 h-4 rounded-xs border border-slate-400 bg-slate-200" />
                <div className="w-1.5 h-4 rounded-xs border border-slate-400 bg-slate-200" />
                <div className="w-1.5 h-4 rounded-xs border border-slate-400 bg-slate-200" />
              </div>
            )}
            {layoutColumns === 4 && (
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-4 rounded-xs border border-slate-400 bg-slate-200" />
                <div className="w-1 h-4 rounded-xs border border-slate-400 bg-slate-200" />
                <div className="w-1 h-4 rounded-xs border border-slate-400 bg-slate-200" />
                <div className="w-1 h-4 rounded-xs border border-slate-400 bg-slate-200" />
              </div>
            )}
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">
              {layoutColumns} Kolom
            </span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8 justify-start sm:justify-start">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {filteredArticles.length === 0 ? (
          isInitialSyncing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 p-0 flex flex-col animate-pulse shadow-2xs">
                  <div className="aspect-16/10 bg-slate-200 w-full" />
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-2/3" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="h-3 bg-slate-200 rounded w-24" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">
                {searchQuery || selectedCategory !== 'Semua'
                  ? 'Tidak ada berita yang sesuai filter.'
                  : 'Belum ada postingan berita.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || selectedCategory !== 'Semua'
                  ? 'Coba gunakan kata kunci lain atau pilih kategori yang berbeda.'
                  : 'Postingan berita resmi dari pihak sekolah akan ditampilkan di sini.'}
              </p>
            </div>
          )
        ) : (
          <div
            className={
              layoutColumns === 1
                ? 'grid grid-cols-1 gap-4 sm:gap-6 max-w-4xl mx-auto'
                : layoutColumns === 2
                ? 'grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6'
                : layoutColumns === 3
                ? 'grid grid-cols-3 gap-2 sm:gap-3.5 md:gap-5 lg:gap-6'
                : 'grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 lg:gap-5'
            }
          >
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className={`group bg-white ${
                  layoutColumns === 4 ? 'rounded-lg sm:rounded-2xl' : 'rounded-xl sm:rounded-2xl'
                } overflow-hidden border border-slate-200 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1`}
              >
                {/* Thumbnail Image */}
                <div
                  className={`relative overflow-hidden bg-slate-100 shrink-0 w-full ${
                    layoutColumns === 4 || layoutColumns === 3
                      ? 'aspect-4/3 sm:aspect-16/10'
                      : 'aspect-16/10'
                  }`}
                >
                  <img
                    src={
                      article.coverImage ||
                      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80'
                    }
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Category & Pinned Badges (Hidden in 2-column or mobile 4-column) */}
                  <div className={`absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-wrap gap-1 sm:gap-2 ${layoutColumns === 2 || layoutColumns === 4 ? 'hidden sm:flex' : 'flex'}`}>
                    <span
                      className={`bg-blue-700/90 backdrop-blur-md text-white font-bold rounded uppercase tracking-wider ${
                        layoutColumns === 3 || layoutColumns === 4
                          ? 'text-[8px] sm:text-[11px] px-1 py-0.5 sm:px-2.5 sm:py-1'
                          : 'text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1'
                      }`}
                    >
                      {article.category}
                    </span>
                    {article.isPinned && (
                      <span
                        className={`bg-amber-500/95 backdrop-blur-md text-slate-950 font-bold rounded flex items-center gap-0.5 sm:gap-1 shadow-2xs ${
                          layoutColumns === 3 || layoutColumns === 4
                            ? 'text-[8px] sm:text-[11px] px-1 py-0.5 sm:px-2 sm:py-1'
                            : 'text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1'
                        }`}
                      >
                        <BookmarkCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-950" />
                        <span className={layoutColumns === 3 || layoutColumns === 4 ? 'hidden sm:inline' : 'inline'}>Unggulan</span>
                      </span>
                    )}
                  </div>

                  {/* Badges for gallery and embed */}
                  <div className={`absolute bottom-1.5 right-1.5 sm:bottom-3 sm:right-3 flex items-center gap-1 sm:gap-1.5 ${layoutColumns === 2 || layoutColumns === 4 ? 'hidden sm:flex' : 'flex'}`}>
                    {article.galleryImages && article.galleryImages.length > 0 && (
                      <span
                        className={`bg-slate-900/80 backdrop-blur-md text-white font-bold rounded-full flex items-center gap-0.5 sm:gap-1 ${
                          layoutColumns === 3 || layoutColumns === 4
                            ? 'text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5'
                            : 'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5'
                        }`}
                      >
                        <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className={layoutColumns === 3 || layoutColumns === 4 ? 'hidden sm:inline' : 'inline'}>
                          {article.galleryImages.length}
                        </span>
                      </span>
                    )}
                    {article.embedUrl && (
                      <span
                        className={`bg-purple-900/80 backdrop-blur-md text-purple-200 font-bold rounded-full flex items-center gap-0.5 sm:gap-1 ${
                          layoutColumns === 3 || layoutColumns === 4
                            ? 'text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5'
                            : 'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5'
                        }`}
                      >
                        <Code2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className={layoutColumns === 3 || layoutColumns === 4 ? 'hidden sm:inline' : 'inline'}>Interaktif</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content - Cover & Title only across all column layouts */}
                <div
                  className={`flex flex-col flex-1 justify-center ${
                    layoutColumns === 4
                      ? 'p-2 sm:p-3'
                      : layoutColumns === 3
                      ? 'p-2.5 sm:p-4'
                      : layoutColumns === 2
                      ? 'p-2.5 sm:p-4'
                      : 'p-3.5 sm:p-5'
                  }`}
                >
                  <h3
                    className={`font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 ${
                      layoutColumns === 4
                        ? 'text-xs sm:text-sm leading-tight'
                        : layoutColumns === 3
                        ? 'text-xs sm:text-base'
                        : layoutColumns === 2
                        ? 'text-xs sm:text-base'
                        : 'text-sm sm:text-lg'
                    }`}
                  >
                    {article.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Detail Modal (fallback if not handled by parent) */}
      {!onSelectArticle && selectedArticle && (
        <NewsDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </section>
  );
};
