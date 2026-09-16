import React, { useState, useEffect, useRef } from 'react';
import { NewsArticle } from '../../types';
import {
  X,
  Calendar,
  User,
  Eye,
  Tag,
  BookmarkCheck,
  Share2,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Code2,
  Globe,
  FileText,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { parseEmbedUrl } from '../../lib/embedHelper';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import { FormattedContentRenderer } from '../common/FormattedContentRenderer';
import { CommentsSection } from './CommentsSection';
import {
  toggleLikeArticle,
  getArticleLikesState,
  getBrowserDeviceId,
  getCurrentCommentUser,
  incrementArticleViews,
  getArticleViewsCount,
} from '../../lib/comments';

interface NewsDetailModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  onCloseParent?: () => void;
  isSecondLayer?: boolean;
  zIndexClass?: string;
}

interface SingleNewsModalViewProps {
  article: NewsArticle;
  onClose: () => void;
  onOpenInternalArticle: (target: NewsArticle) => void;
  isSecondLayer?: boolean;
  zIndexClass?: string;
}

const SingleNewsModalView: React.FC<SingleNewsModalViewProps> = ({
  article,
  onClose,
  onOpenInternalArticle,
  isSecondLayer = false,
  zIndexClass = 'z-50',
}) => {
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isEmbedExpanded, setIsEmbedExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [actionConfirmUrl, setActionConfirmUrl] = useState<string | null>(null);
  const [likesState, setLikesState] = useState(() =>
    getArticleLikesState(article.id, article.likes || 0, getBrowserDeviceId())
  );
  const [viewsCount, setViewsCount] = useState(() =>
    getArticleViewsCount(article.id, article.views || 0)
  );

  const viewIncrementedRef = useRef(false);

  useEffect(() => {
    setLikesState(getArticleLikesState(article.id, article.likes || 0, getBrowserDeviceId()));
    setViewsCount(getArticleViewsCount(article.id, article.views || 0));
    viewIncrementedRef.current = false;
  }, [article.id, article.likes, article.views]);

  useEffect(() => {
    if (viewIncrementedRef.current) return;
    viewIncrementedRef.current = true;

    let isMounted = true;
    incrementArticleViews(article.id, article.views || 0).then((newCount) => {
      if (isMounted) {
        setViewsCount(newCount);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [article.id]);

  const handleTogglePostLike = () => {
    const userIdentifier = getBrowserDeviceId();

    // Instant optimistic update
    setLikesState((prev) => ({
      likes: prev.hasLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
      hasLiked: !prev.hasLiked,
    }));

    toggleLikeArticle(article.id, userIdentifier).catch((err) => {
      console.warn('Failed to sync post like:', err);
    });
  };

  const parsedEmbed = article.embedUrl ? parseEmbedUrl(article.embedUrl) : null;
  const gallery = article.galleryImages || [];

  const handleShare = async () => {
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('post', article.id);
      const shareUrl = url.toString();

      // Formatted text for WhatsApp and Clipboard
      const shareMessage = `*${article.title}*\n\nBaca berita lengkapnya di:\n${shareUrl}`;

      // 1. Copy to clipboard automatically
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareMessage);
          setCopiedNotice(true);
          setTimeout(() => setCopiedNotice(false), 3500);
        } catch {}
      }

      // 2. Open WhatsApp with pre-filled message
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
      window.open(waUrl, '_blank');
    } catch (e) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 3000);
      }
    }
  };

  // Sync active article ID to URL and update Open Graph meta tags (cover image & title)
  React.useEffect(() => {
    if (!article?.id) return;

    // 1. Sync URL parameter ?post=
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('post', article.id);
      window.history.replaceState({}, '', url.toString());
    } catch {}

    // 2. Dynamic OpenGraph / Title / Image meta tags
    const originalTitle = document.title;
    document.title = `${article.title} - SMP Negeri 1 Bengkalis`;

    const setMetaTag = (selector: string, attr: string, value: string) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        const parts = selector.replace(/[\[\]"']/g, '').split('=');
        if (parts.length === 2) {
          tag.setAttribute(parts[0], parts[1]);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute(attr, value);
    };

    if (article.coverImage) {
      setMetaTag('meta[property="og:image"]', 'content', article.coverImage);
      setMetaTag('meta[name="twitter:image"]', 'content', article.coverImage);
      let linkImg = document.querySelector('link[rel="image_src"]') as HTMLLinkElement;
      if (!linkImg) {
        linkImg = document.createElement('link');
        linkImg.rel = 'image_src';
        document.head.appendChild(linkImg);
      }
      linkImg.href = article.coverImage;
    }

    setMetaTag('meta[property="og:title"]', 'content', article.title);
    setMetaTag('meta[name="twitter:title"]', 'content', article.title);

    return () => {
      document.title = originalTitle;
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('post') === article.id) {
          url.searchParams.delete('post');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
      } catch {}
    };
  }, [article]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % lightboxImages.length);
  };

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 ${zIndexClass || 'z-50'} flex items-center justify-center p-1.5 sm:p-4 pt-[max(0.375rem,env(safe-area-inset-top))] pb-[max(0.375rem,env(safe-area-inset-bottom))] pl-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))] ${
        isSecondLayer ? 'bg-slate-950/75 backdrop-blur-xs' : 'bg-slate-950/80 backdrop-blur-xs'
      } overscroll-contain touch-pan-y animate-in fade-in duration-200 h-[100dvh] w-full`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col overscroll-contain transition-all duration-300 ${
          isEmbedExpanded
            ? 'max-w-6xl h-[calc(100dvh-12px)] sm:h-[96vh]'
            : 'max-w-4xl h-full max-h-[calc(100dvh-12px)] sm:max-h-[92vh]'
        }`}
      >
        {/* Toast Share Notification */}
        {copiedNotice && (
          <div className="absolute top-16 right-4 sm:right-6 z-50 bg-slate-900/95 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tautan disalin & membuka WhatsApp...</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">
              <Tag className="w-3 h-3" />
              {article.category}
            </span>
            {isSecondLayer && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                Lapis 2
              </span>
            )}
            {article.isPinned && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                <BookmarkCheck className="w-3 h-3 text-amber-600" />
                Unggulan
              </span>
            )}
            {parsedEmbed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                <Code2 className="w-3 h-3" />
                {parsedEmbed.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {parsedEmbed && (
              <a
                href={parsedEmbed.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Aplikasi / Embed di Tab Baru (Layar Penuh)"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru</span>
              </a>
            )}

            <button
              onClick={handleShare}
              title="Bagikan Artikel"
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-3.5 sm:p-8 overflow-y-auto overscroll-contain touch-pan-y space-y-4 sm:space-y-6 flex-1 pb-6 sm:pb-8">
          {/* Cover Image - diletakkan di atas teks dan terlihat utuh tanpa terpotong pada tampilan HP */}
          {article.coverImage && (
            <div
              onClick={() => {
                setLightboxImages([article.coverImage]);
                setLightboxIndex(0);
              }}
              className="rounded-xl sm:rounded-2xl overflow-hidden w-full bg-slate-100/90 border border-slate-200/90 shadow-2xs flex items-center justify-center p-1 sm:p-1.5 cursor-pointer group"
            >
              <img
                src={article.coverImage}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[48dvh] sm:max-h-[520px] object-contain rounded-lg mx-auto block transition-transform duration-200 group-hover:scale-[1.01]"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {article.title}
          </h1>

          {/* Body Content - Langsung tanpa baris Humas/author agar tampilan lebih leluasa */}
          <div className="text-slate-800 text-base leading-relaxed pt-1">
            <FormattedContentRenderer
              content={article.content}
              onOpenInternalArticle={onOpenInternalArticle}
              isSecondLayer={isSecondLayer}
            />
          </div>

          {/* Custom Action Link Button / Link Tertentu */}
          {article.actionLink && article.actionLink.url && (
            <div className="p-4 sm:p-5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Tautan Khusus / Akses Terkait
                </span>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  {article.actionLink.label || 'Kunjungi Halaman / Tautan Terkait'}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-md">
                  {article.actionLink.url}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActionConfirmUrl(article.actionLink.url)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <span>Buka Tautan</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Full Embed Section (Apps Script, YouTube, Google Forms/Docs, Web) */}
          {parsedEmbed && (
            <div className="rounded-2xl border border-slate-300 bg-slate-900 overflow-hidden shadow-md">
              {/* Embed Toolbar */}
              <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-xs sm:text-sm tracking-wide">
                    {article.embedTitle || parsedEmbed.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Reload iframe */}
                  <button
                    type="button"
                    onClick={() => setIframeKey((k) => k + 1)}
                    title="Muat ulang embed"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  {/* Toggle expand height inside modal */}
                  <button
                    type="button"
                    onClick={() => setIsEmbedExpanded(!isEmbedExpanded)}
                    title={isEmbedExpanded ? 'Kecilkan Tampilan' : 'Perbesar Tampilan'}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {isEmbedExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>

                  {/* Open in New Tab - User requested for full freedom and unconstrained view */}
                  <a
                    href={parsedEmbed.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Tab Baru (Layar Penuh)</span>
                  </a>
                </div>
              </div>

              {/* Iframe Viewport */}
              <div
                className={`w-full bg-white relative transition-all duration-200 ${
                  parsedEmbed.kind === 'youtube'
                    ? 'aspect-video'
                    : isEmbedExpanded
                    ? 'h-[75vh]'
                    : 'h-[480px] sm:h-[550px]'
                }`}
              >
                <iframe
                  key={iframeKey}
                  src={parsedEmbed.embedUrl}
                  title={article.embedTitle || article.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; camera; microphone"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
                />
              </div>

              {/* Embed Footer helper note */}
              <div className="px-4 py-2 bg-slate-950 text-slate-400 text-[11px] flex items-center justify-between">
                <span>
                  Sumber: <strong className="text-slate-300">{parsedEmbed.label}</strong>
                </span>
                <a
                  href={parsedEmbed.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Jika embed terkendala, buka tautan langsung</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Multiple Image Gallery Section */}
          {gallery.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Dokumentasi &amp; Galeri Foto ({gallery.length} Foto)</span>
                </h3>
                <span className="text-xs text-slate-400">Klik foto untuk perbesar</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gallery.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setLightboxImages(gallery);
                      setLightboxIndex(idx);
                    }}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={imgUrl}
                      alt={`Dokumentasi ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Komentar & Tanggapan Khusus Postingan Berita */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <CommentsSection
              targetId={article.id}
              targetTitle={article.title}
              compact={false}
            />
          </div>
        </div>

        {/* Footer: Menampilkan Tanggal, Jumlah Baca, Tombol Suka Postingan (Love), dan Tutup */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 font-medium truncate">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{article.date}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{viewsCount} dibaca</span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Tanda Love Suka Postingan (hanya jumlah angka saja) */}
            <button
              type="button"
              onClick={handleTogglePostLike}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-2xs ${
                likesState.hasLiked
                  ? 'bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-rose-600'
              }`}
              title={likesState.hasLiked ? 'Batalkan suka' : 'Sukai postingan ini'}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  likesState.hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'
                }`}
              />
              <span>{likesState.likes}</span>
            </button>

            {parsedEmbed && (
              <a
                href={parsedEmbed.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Embed</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Lightbox Modal for Gallery Fullscreen View */}
        {lightboxIndex !== null && lightboxImages.length > 0 && (
          <div
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-2 right-2 z-20 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Prev Button */}
              {lightboxImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 z-20 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next Button */}
              {lightboxImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 z-20 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Main Image */}
              <div className="max-h-[80vh] overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black/50">
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt={`Galeri ${lightboxIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[80vh] w-auto object-contain mx-auto"
                />
              </div>

              {/* Counter Indicator */}
              {lightboxImages.length > 1 && (
                <div className="mt-3 text-white text-xs font-semibold bg-white/15 px-3 py-1 rounded-full">
                  Foto {lightboxIndex + 1} dari {lightboxImages.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Layer 2: Action Link Confirmation Popup Modal */}
        {actionConfirmUrl && (
          <div
            className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              e.stopPropagation();
              setActionConfirmUrl(null);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div className="space-y-1 pr-6">
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    Konfirmasi Buka Tautan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Apakah Anda ingin membuka link ini?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActionConfirmUrl(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 overflow-hidden">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-mono text-slate-800 break-all select-all font-semibold">
                  {actionConfirmUrl}
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Tautan ini akan dibuka pada tab baru di browser Anda.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionConfirmUrl(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.open(actionConfirmUrl, '_blank', 'noopener,noreferrer');
                    setActionConfirmUrl(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Buka Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  article,
  onClose,
  zIndexClass = 'z-50',
}) => {
  const [currentArticle, setCurrentArticle] = useState<NewsArticle | null>(article);

  // Sync state if initial article prop changes
  React.useEffect(() => {
    setCurrentArticle(article);
  }, [article]);

  // Prevent background scrolling while modal is open
  useBodyScrollLock(!!currentArticle);

  if (!currentArticle) return null;

  // Called when user opens an internal article from within the content: navigate directly in single popup
  const handleOpenInternal = (target: NewsArticle) => {
    setCurrentArticle(target);
  };

  const handleClose = () => {
    setCurrentArticle(null);
    onClose();
  };

  return (
    <SingleNewsModalView
      article={currentArticle}
      onClose={handleClose}
      onOpenInternalArticle={handleOpenInternal}
      zIndexClass={zIndexClass}
      isSecondLayer={false}
    />
  );
};


