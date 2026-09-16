import React, { useState, useMemo } from 'react';
import { PrincipalConfig, NewsArticle } from '../../types';
import { ChevronRight, Award, Pin, Calendar, ArrowUpRight } from 'lucide-react';
import { SpeechDetailModal } from './SpeechDetailModal';
import { NewsDetailModal } from './NewsDetailModal';

interface PrincipalSectionProps {
  principal: PrincipalConfig;
  schoolName: string;
  logoUrl?: string;
  articles?: NewsArticle[];
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

export const PrincipalSection: React.FC<PrincipalSectionProps> = ({
  principal,
  schoolName,
  logoUrl,
  articles = [],
  onSelectArticle,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const handleArticleClick = (art: NewsArticle) => {
    if (onSelectArticle) {
      onSelectArticle(art);
    } else {
      setSelectedArticle(art);
    }
  };

  // Get up to 4 pinned articles (or fallback to latest published if none pinned)
  const pinnedArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    const published = articles.filter(
      (a) => a.status === 'published' && !a.isLocalDraft
    );

    const pinned = published
      .filter((a) => Boolean(a.isPinned))
      .sort((a, b) => parseDateToTime(b.date, b.id) - parseDateToTime(a.date, a.id))
      .slice(0, 4);

    if (pinned.length > 0) return pinned;

    // Fallback if none pinned yet: latest 4 published
    return published
      .sort((a, b) => parseDateToTime(b.date, b.id) - parseDateToTime(a.date, a.id))
      .slice(0, 4);
  }, [articles]);

  const pinnedCount = pinnedArticles.length;
  const hasPinned = pinnedCount > 0;

  return (
    <section id="sambutan" className="pt-3 sm:pt-6 lg:pt-8 pb-6 sm:pb-10 lg:pb-12 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ============================================================ */}
        {/* DESKTOP LAYOUT (lg:grid): Bagi Dua Kiri Sambutan & Kanan Berita */}
        {/* ============================================================ */}
        {hasPinned ? (
          <div className="hidden lg:grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* KOLOM KIRI: Sambutan Kepala Sekolah */}
            <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200/80 rounded-2xl p-6 lg:p-7 shadow-xs flex flex-col justify-between h-full">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Award className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Pimpinan Sekolah
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {principal.title || 'Kepala Sekolah'}
                  </span>
                </div>

                {/* Photo & Quote Flex */}
                <div className="flex gap-5 items-start">
                  {/* Principal Photo */}
                  <div
                    onClick={() => setModalOpen(true)}
                    className="relative group cursor-pointer shrink-0"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setModalOpen(true);
                      }
                    }}
                    title="Klik untuk membaca sambutan lengkap"
                  >
                    <div className="relative w-36 sm:w-40 h-48 sm:h-52 rounded-xl overflow-hidden shadow-md border-3 border-white bg-slate-200 group-hover:shadow-lg transition-all">
                      {principal.imageUrl ? (
                        <img
                          src={principal.imageUrl}
                          alt={principal.name || 'Kepala Sekolah'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-3 text-center">
                          <Award className="w-10 h-10 text-amber-300 mb-1.5 opacity-90" />
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                            {principal.title || 'Kepala Sekolah'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-2.5 text-center">
                        <p className="text-[11px] font-bold text-white leading-tight truncate">
                          {principal.name || principal.title || 'Kepala Sekolah'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content info */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      Sambutan Kepala {schoolName}
                    </h2>
                    <div className="pl-3 border-l-3 border-blue-600 py-0.5">
                      <p className="text-xs sm:text-sm text-slate-600 font-medium italic leading-relaxed line-clamp-4">
                        "{principal.quote}"
                      </p>
                    </div>
                    {principal.nip && (
                      <p className="text-[11px] text-slate-400">
                        NIP: {principal.nip}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                  {principal.name || principal.title || 'Kepala Sekolah'}
                </span>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs hover:shadow transition-all cursor-pointer"
                >
                  <span>Baca Sambutan Lengkap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* KOLOM KANAN: Postingan Berita yang Disematkan */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 lg:p-6 shadow-xs flex flex-col justify-between h-full">
              {/* Header Right Column */}
              <div className="flex items-center justify-between gap-3 mb-3.5 shrink-0 pb-2.5 border-b border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Pin className="w-4 h-4 rotate-45" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    Postingan Disematkan
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    {pinnedCount} Berita
                  </span>
                </div>
                <a
                  href="#berita"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
                >
                  <span>Lihat Semua</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Dynamic Content based on pinnedCount: 1, 2, 3, or 4 */}
              <div className="flex-1 flex flex-col justify-between min-h-0">
                {/* 1 POSTINGAN: Ukuran Besar */}
                {pinnedCount === 1 && (
                  <div
                    onClick={() => handleArticleClick(pinnedArticles[0])}
                    className="group flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative w-full aspect-16/9 bg-slate-100 overflow-hidden">
                      <img
                        src={pinnedArticles[0].coverImage}
                        alt={pinnedArticles[0].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {pinnedArticles[0].category}
                      </span>
                      <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Pin className="w-3 h-3 rotate-45" />
                        Disematkan
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-2 leading-snug">
                          {pinnedArticles[0].title}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {pinnedArticles[0].date}
                        </span>
                        <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                          Baca Selengkapnya
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2 POSTINGAN: Ukuran Sedang */}
                {pinnedCount === 2 && (
                  <div className="flex-1 flex flex-col gap-3 justify-between">
                    {pinnedArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => handleArticleClick(art)}
                        className="group flex-1 flex gap-3.5 bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer items-center min-h-[105px]"
                      >
                        <div className="relative w-32 sm:w-36 h-full min-h-[92px] rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {art.category}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-full">
                          <div>
                            <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold mb-1">
                              <Pin className="w-3 h-3 rotate-45" />
                              <span>Unggulan</span>
                            </div>
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs sm:text-sm line-clamp-2 leading-snug">
                              {art.title}
                            </h4>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span>{art.date}</span>
                            <span className="text-blue-600 font-semibold group-hover:underline flex items-center">
                              Detail <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3 POSTINGAN: Ukuran Kompak */}
                {pinnedCount === 3 && (
                  <div className="flex-1 flex flex-col gap-2.5 justify-between">
                    {pinnedArticles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => handleArticleClick(art)}
                        className="group flex gap-3 bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs hover:shadow-md transition-all cursor-pointer items-center min-h-[72px]"
                      >
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[10px] mb-0.5">
                            <span className="font-bold text-blue-600">{art.category}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">{art.date}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs line-clamp-2 leading-tight">
                            {art.title}
                          </h4>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 4 POSTINGAN: Ukuran Ramping Simetris (4 Kotak Vertikal) */}
                {pinnedCount >= 4 && (
                  <div className="flex-1 flex flex-col gap-2 justify-between">
                    {pinnedArticles.slice(0, 4).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => handleArticleClick(art)}
                        className="group flex gap-2.5 bg-white rounded-xl border border-slate-200 p-2 shadow-2xs hover:shadow-md transition-all cursor-pointer items-center min-h-[62px]"
                      >
                        <div className="relative w-16 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[9px] mb-0.5">
                            <span className="font-bold text-blue-600">{art.category}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400">{art.date}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs line-clamp-2 leading-tight">
                            {art.title}
                          </h4>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop layout jika tidak ada postingan sama sekali */
          <div className="hidden lg:block max-w-4xl mx-auto bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200/80 rounded-2xl p-7 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Award className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Pimpinan Sekolah
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {principal.title || 'Kepala Sekolah'}
              </span>
            </div>
            <div className="flex gap-6 items-start">
              <div
                onClick={() => setModalOpen(true)}
                className="relative w-44 h-56 rounded-xl overflow-hidden shadow-md border-3 border-white bg-slate-200 group cursor-pointer shrink-0"
              >
                {principal.imageUrl ? (
                  <img
                    src={principal.imageUrl}
                    alt={principal.name || 'Kepala Sekolah'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-3 text-center">
                    <Award className="w-12 h-12 text-amber-300 mb-2 opacity-90" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {principal.title || 'Kepala Sekolah'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Sambutan Kepala {schoolName}
                </h2>
                <p className="text-sm text-slate-600 italic border-l-3 border-blue-600 pl-3">
                  "{principal.quote}"
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-2xs mt-3 cursor-pointer"
                >
                  <span>Baca Sambutan Lengkap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MOBILE LAYOUT (lg:hidden): Proporsional Sesuai Jumlah Sematan */}
        {/* ============================================================ */}
        <div className="grid grid-cols-12 gap-2 sm:gap-3 lg:hidden items-stretch">
          
          {/* KIRI HP: Sambutan Pimpinan Kompak */}
          <div
            onClick={() => setModalOpen(true)}
            className={`${
              hasPinned ? 'col-span-5 sm:col-span-5' : 'col-span-12'
            } flex flex-col justify-between bg-gradient-to-b from-blue-50/70 via-slate-50 to-blue-50/40 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 shadow-2xs cursor-pointer group active:scale-[0.99] transition-transform h-full`}
            role="button"
            tabIndex={0}
            title="Ketuk untuk membaca sambutan kepala sekolah"
          >
            <div className="space-y-1.5">
              {/* Photo */}
              <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-xs border-2 border-white bg-slate-200">
                {principal.imageUrl ? (
                  <img
                    src={principal.imageUrl}
                    alt={principal.name || 'Kepala Sekolah'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-2 text-center">
                    <Award className="w-7 h-7 text-amber-300 mb-1 opacity-90" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider line-clamp-1">
                      {principal.title || 'Kepala Sekolah'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent p-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[8px] sm:text-[9px] text-amber-300 font-bold mb-0.5">
                    <Award className="w-2.5 h-2.5 shrink-0" />
                    <span>Kepala Sekolah</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-white leading-tight line-clamp-1">
                    {principal.name || principal.title || 'Kepala Sekolah'}
                  </p>
                </div>
              </div>

              {/* Quote snippet */}
              <div className="px-1 pt-1">
                <p className="text-[10px] sm:text-[11px] text-slate-600 italic line-clamp-2 leading-tight">
                  "{principal.quote}"
                </p>
              </div>
            </div>

            {/* Button / Trigger */}
            <div className="mt-2 pt-1.5 border-t border-slate-200/60">
              <div className="w-full py-1.5 px-2 bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs">
                <span>Sambutan</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* KANAN HP: Postingan yang Disematkan (Adaptif: 1 besar/seimbang, 2 atas-bawah, 3 ke bawah, 4 ke bawah) */}
          {hasPinned && (
            <div className="col-span-7 sm:col-span-7 flex flex-col justify-between h-full">
              
              {/* JIKA 1 SEMATAN: Besarkan & Seimbangkan Tinggi dengan Sambutan Pimpinan */}
              {pinnedCount === 1 && (
                <div
                  onClick={() => handleArticleClick(pinnedArticles[0])}
                  className="flex-1 h-full bg-white hover:bg-blue-50/50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between cursor-pointer active:scale-[0.99] transition-all group"
                >
                  <div className="space-y-2">
                    {/* Cover Image */}
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-2xs">
                      <img
                        src={pinnedArticles[0].coverImage}
                        alt={pinnedArticles[0].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-blue-600/90 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                        {pinnedArticles[0].category}
                      </span>
                      <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                        <Pin className="w-2.5 h-2.5 rotate-45" />
                        Pin
                      </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h4 className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-3 leading-snug">
                        {pinnedArticles[0].title}
                      </h4>
                    </div>
                  </div>

                  {/* Bottom Bar: Tanggal & Baca */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="truncate">{pinnedArticles[0].date}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5 shrink-0">
                      Baca Berita
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )}

              {/* JIKA 2 SEMATAN: Bagi Dua Atas dan Bawah */}
              {pinnedCount === 2 && (
                <div className="flex-1 h-full flex flex-col justify-between gap-1.5 sm:gap-2">
                  {pinnedArticles.slice(0, 2).map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleArticleClick(art)}
                      className="flex-1 bg-white hover:bg-blue-50/50 border border-slate-200/90 rounded-xl p-2 shadow-2xs flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all group"
                    >
                      <div className="flex gap-2 items-start">
                        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-blue-600 truncate mb-0.5">
                            <Pin className="w-2.5 h-2.5 text-amber-500 rotate-45 shrink-0" />
                            <span className="truncate">{art.category}</span>
                          </div>
                          <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-tight">
                            {art.title}
                          </h4>
                        </div>
                      </div>

                      <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] sm:text-[9px] text-slate-400">
                        <span className="truncate">{art.date}</span>
                        <span className="text-blue-600 font-bold flex items-center">
                          Detail <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* JIKA 3 SEMATAN: Bagi Tiga ke Bawah */}
              {pinnedCount === 3 && (
                <div className="flex-1 h-full flex flex-col justify-between gap-1.5 sm:gap-2">
                  {pinnedArticles.slice(0, 3).map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleArticleClick(art)}
                      className="flex-1 min-h-[58px] sm:min-h-[64px] bg-white hover:bg-blue-50/60 active:bg-blue-50/90 border border-slate-200/90 rounded-xl p-1.5 sm:p-2 shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] group"
                    >
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <img
                          src={art.coverImage}
                          alt={art.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-blue-600 truncate mb-0.5">
                          <Pin className="w-2.5 h-2.5 text-amber-500 rotate-45 shrink-0" />
                          <span className="truncate">{art.category}</span>
                        </div>
                        <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-tight">
                          {art.title}
                        </h4>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 truncate mt-0.5">
                          {art.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* JIKA 4 SEMATAN: Bagi Empat ke Bawah (4 Kotak Kecil) */}
              {pinnedCount >= 4 && (
                <div className="flex-1 h-full flex flex-col justify-between gap-1 sm:gap-1.5">
                  {pinnedArticles.slice(0, 4).map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleArticleClick(art)}
                      className="flex-1 min-h-[54px] sm:min-h-[60px] bg-white hover:bg-blue-50/60 active:bg-blue-50/90 border border-slate-200/90 rounded-xl p-1.5 sm:p-2 shadow-2xs flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all active:scale-[0.98] group"
                    >
                      <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <img
                          src={art.coverImage}
                          alt={art.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-blue-600 truncate mb-0.5">
                          <Pin className="w-2 h-2 text-amber-500 rotate-45 shrink-0" />
                          <span className="truncate">{art.category}</span>
                        </div>
                        <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-tight">
                          {art.title}
                        </h4>
                        <span className="text-[8px] sm:text-[9px] text-slate-400 truncate mt-0.5">
                          {art.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Speech Detail Modal */}
      {modalOpen && (
        <SpeechDetailModal
          principal={principal}
          schoolName={schoolName}
          logoUrl={logoUrl}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* News Detail Modal for Pinned Posts (only if not handled by parent) */}
      {!onSelectArticle && selectedArticle && (
        <NewsDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </section>
  );
};
