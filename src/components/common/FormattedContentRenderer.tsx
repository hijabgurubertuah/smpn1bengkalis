import React, { useState } from 'react';
import { ExternalLink, X, ChevronLeft, ChevronRight, Eye, Globe, Newspaper, Calendar } from 'lucide-react';
import { convertGoogleDriveUrl } from '../../lib/imageOptimizer';
import { NewsArticle } from '../../types';
import { loadNewsArticles } from '../../lib/firebase';
import { DEFAULT_NEWS_ARTICLES } from '../../lib/defaultData';
import { NewsDetailModal } from '../public/NewsDetailModal';

interface FormattedContentRendererProps {
  content: string;
  className?: string;
  onOpenInternalArticle?: (article: NewsArticle) => void;
  onCloseParent?: () => void;
  isSecondLayer?: boolean;
}

interface ParsedImageShortcode {
  layout: 'full' | 'left' | 'right' | 'grid-2' | 'grid-3' | 'grid-4' | 'flex';
  urls: string[];
  caption?: string;
  captions?: string[];
}

/**
 * Parses image shortcode like:
 * [img layout="grid-2" urls="url1 | url2" captions="cap1 | cap2"]
 * or [img layout="full" urls="url1" caption="caption"]
 */
function parseImageShortcode(tagStr: string): ParsedImageShortcode | null {
  const layoutMatch = tagStr.match(/layout=["']([^"']+)["']/i);
  const urlsMatch = tagStr.match(/urls=["']([^"']+)["']/i);
  const srcMatch = tagStr.match(/src=["']([^"']+)["']/i);
  const captionMatch = tagStr.match(/caption=["']([^"']+)["']/i);
  const captionsMatch = tagStr.match(/captions=["']([^"']+)["']/i);

  let layout: ParsedImageShortcode['layout'] = 'full';
  if (layoutMatch) {
    const l = layoutMatch[1].toLowerCase();
    if (['full', 'left', 'right', 'grid-2', 'grid-3', 'grid-4', 'flex'].includes(l)) {
      layout = l as ParsedImageShortcode['layout'];
    }
  }

  let rawUrls: string[] = [];
  if (urlsMatch) {
    const rawVal = urlsMatch[1];
    if (rawVal.includes(' | ')) {
      rawUrls = rawVal.split(' | ');
    } else if (rawVal.includes('|')) {
      rawUrls = rawVal.split('|');
    } else if (rawVal.includes(';http')) {
      rawUrls = rawVal.split(';');
    } else {
      rawUrls = rawVal.split(/,(?![^;]+;base64)/);
    }
  } else if (srcMatch) {
    rawUrls = [srcMatch[1]];
  }

  const urls = rawUrls
    .map((u) => convertGoogleDriveUrl(u.trim()))
    .filter((u) => u.length > 5 && (u.startsWith('http') || u.startsWith('data:image')));

  if (urls.length === 0) return null;

  let captions: string[] | undefined = undefined;
  if (captionsMatch) {
    captions = captionsMatch[1].split(' | ').map((c) => c.trim());
  }

  return {
    layout,
    urls,
    caption: captionMatch ? captionMatch[1] : (captions && captions.length === 1 ? captions[0] : undefined),
    captions,
  };
}

/**
 * Resolves whether a link target corresponds to an internal news article/post
 */
async function resolveInternalArticle(
  href: string,
  linkText?: string
): Promise<NewsArticle | null> {
  let articles: NewsArticle[] = [];
  try {
    articles = await loadNewsArticles();
  } catch {
    articles = DEFAULT_NEWS_ARTICLES;
  }
  if (!articles || articles.length === 0) articles = DEFAULT_NEWS_ARTICLES;

  const published = articles.filter((a) => a.status === 'published' && !a.isLocalDraft);
  if (published.length === 0) return null;

  const cleanHref = href.trim().toLowerCase();
  const cleanText = (linkText || '').trim().toLowerCase();

  // 1. Direct match by exact article ID
  for (const art of published) {
    if (art.id && cleanHref.includes(art.id.toLowerCase())) {
      return art;
    }
  }

  // 2. Direct match by exact article slug
  for (const art of published) {
    if (art.slug && cleanHref.includes(art.slug.toLowerCase())) {
      return art;
    }
  }

  // 3. Match by link text or title match
  for (const art of published) {
    if (art.title) {
      const titleLower = art.title.toLowerCase();
      if (cleanText.length >= 4 && (titleLower.includes(cleanText) || cleanText.includes(titleLower))) {
        return art;
      }
      const titleSlug = titleLower.replace(/[^a-z0-9]+/g, '-');
      if (titleSlug.length >= 4 && cleanHref.includes(titleSlug)) {
        return art;
      }
    }
  }

  // 4. Query param / hash extract e.g. ?post=..., ?id=..., #post-...
  const idMatch = cleanHref.match(/(?:post|article|berita|id)[=\/-]([a-z0-9_-]+)/i);
  if (idMatch) {
    const extractedId = idMatch[1].toLowerCase();
    for (const art of published) {
      if (art.id.toLowerCase().includes(extractedId) || extractedId.includes(art.id.toLowerCase())) {
        return art;
      }
    }
  }

  // 5. Internal relative links or internal domain match
  const isInternal =
    cleanHref.startsWith('#') ||
    cleanHref.startsWith('/') ||
    cleanHref.startsWith('./') ||
    (typeof window !== 'undefined' && cleanHref.includes(window.location.hostname));

  if (isInternal) {
    const urlWords = cleanHref.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length >= 4);
    for (const art of published) {
      const titleLower = art.title.toLowerCase();
      const matched = urlWords.filter((w) => titleLower.includes(w));
      if (matched.length >= 1) return art;
    }
  }

  return null;
}

export const FormattedContentRenderer: React.FC<FormattedContentRendererProps> = ({
  content,
  className = '',
  onOpenInternalArticle,
  onCloseParent,
  isSecondLayer = false,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<{ urls: string[]; index: number } | null>(null);
  const [pendingLink, setPendingLink] = useState<{
    href: string;
    linkText: string;
    matchedArticle: NewsArticle | null;
  } | null>(null);
  const [nestedArticle, setNestedArticle] = useState<NewsArticle | null>(null);

  if (!content) return null;

  // Intercept any <a> tag clicks inside rendered content to show 2nd layer confirmation popup
  const handleContainerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Support clicking on images inside raw HTML/editor content
    if (target.tagName === 'IMG') {
      const src = target.getAttribute('src');
      if (src) {
        e.preventDefault();
        e.stopPropagation();
        setLightboxIndex({ urls: [src], index: 0 });
        return;
      }
    }

    const anchor = target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      const linkText = anchor.innerText || anchor.textContent || '';
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        e.preventDefault();
        e.stopPropagation();

        const matched = await resolveInternalArticle(href, linkText);
        setPendingLink({
          href,
          linkText,
          matchedArticle: matched,
        });
      }
    }
  };

  // Global pre-sanitization before splitting or rendering
  let normalizedContent = content;

  // 1. Unescape escaped HTML entities if present (e.g. &lt;p style=...&gt;)
  if (normalizedContent.includes('&lt;') && normalizedContent.includes('&gt;')) {
    normalizedContent = normalizedContent
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  // 2. Extract [img ...] shortcodes from inside <p>...</p> wrappers to prevent broken unclosed tags
  normalizedContent = normalizedContent.replace(/<p[^>]*>\s*(\[img\b[^\]]*\])\s*<\/p>/gi, '\n$1\n');

  // 3. Strip all empty <p style="..."><br></p> and <p><br></p> tags
  normalizedContent = normalizedContent.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s*)*<\/p>/gi, '');

  // 4. Remove lingering orphan empty tags
  normalizedContent = normalizedContent.replace(/<p[^>]*>\s*$/gi, '').replace(/^\s*<\/p>/gi, '');

  // Split content into lines/blocks while detecting image shortcodes and alignment tags
  const renderRichText = (text: string) => {
    if (!text || !text.trim()) return null;

    // Regex for image shortcodes: [img ...]
    const parts = text.split(/(\[img\b[^\]]*\])/gi);

    return parts.map((part, partIdx) => {
      // Check if this part is an image shortcode
      if (part.match(/^\[img\b/i) && part.endsWith(']')) {
        const parsed = parseImageShortcode(part);
        if (parsed) {
          return renderImageBlock(parsed, partIdx);
        }
      }

      // Render regular text block with formatting
      return renderTextBlock(part, partIdx);
    });
  };

  const renderImageBlock = (parsed: ParsedImageShortcode, key: number) => {
    const { layout, urls, caption } = parsed;

    const openLightbox = (urlIdx: number) => {
      setLightboxIndex({ urls, index: urlIdx });
    };

    if (layout === 'left') {
      return (
        <div key={key} className="float-none sm:float-left sm:mr-6 my-3 sm:mb-4 max-w-full sm:max-w-sm w-full sm:w-auto rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
          <div className="relative group cursor-pointer" onClick={() => openLightbox(0)}>
            <img
              src={urls[0]}
              alt={caption || 'Gambar Postingan'}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-80 object-cover group-hover:scale-102 transition-transform duration-200"
            />
          </div>
          {caption && (
            <p className="text-[11px] text-slate-500 font-medium p-2 text-center bg-slate-100/80 border-t border-slate-200">
              {caption}
            </p>
          )}
        </div>
      );
    }

    if (layout === 'right') {
      return (
        <div key={key} className="float-none sm:float-right sm:ml-6 my-3 sm:mb-4 max-w-full sm:max-w-sm w-full sm:w-auto rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
          <div className="relative group cursor-pointer" onClick={() => openLightbox(0)}>
            <img
              src={urls[0]}
              alt={caption || 'Gambar Postingan'}
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-80 object-cover group-hover:scale-102 transition-transform duration-200"
            />
          </div>
          {caption && (
            <p className="text-[11px] text-slate-500 font-medium p-2 text-center bg-slate-100/80 border-t border-slate-200">
              {caption}
            </p>
          )}
        </div>
      );
    }

    if (layout === 'grid-2') {
      const { captions } = parsed;
      return (
        <div key={key} className="clear-both my-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {urls.map((u, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <div
                  onClick={() => openLightbox(i)}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition-all"
                >
                  <img
                    src={u}
                    alt={captions?.[i] || caption || `Foto ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                {captions && captions[i] && (
                  <p className="text-[11px] text-slate-600 font-medium text-center bg-slate-50 py-1 px-2 rounded-lg border border-slate-200/60">
                    {captions[i]}
                  </p>
                )}
              </div>
            ))}
          </div>
          {caption && !captions?.length && (
            <p className="text-[11px] text-slate-500 font-medium text-center italic">
              {caption}
            </p>
          )}
        </div>
      );
    }

    if (layout === 'grid-3') {
      const { captions } = parsed;
      return (
        <div key={key} className="clear-both my-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {urls.map((u, i) => (
              <div key={i} className="flex flex-col space-y-1">
                <div
                  onClick={() => openLightbox(i)}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition-all"
                >
                  <img
                    src={u}
                    alt={captions?.[i] || caption || `Foto ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                {captions && captions[i] && (
                  <p className="text-[11px] text-slate-600 font-medium text-center bg-slate-50 py-1 px-2 rounded-lg border border-slate-200/60">
                    {captions[i]}
                  </p>
                )}
              </div>
            ))}
          </div>
          {caption && !captions?.length && (
            <p className="text-[11px] text-slate-500 font-medium text-center italic">
              {caption}
            </p>
          )}
        </div>
      );
    }

    if (layout === 'grid-4') {
      return (
        <div key={key} className="clear-both my-4 space-y-1.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {urls.map((u, i) => (
              <div
                key={i}
                onClick={() => openLightbox(i)}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition-all"
              >
                <img
                  src={u}
                  alt={`Foto ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
          {caption && (
            <p className="text-[11px] text-slate-500 font-medium text-center italic">
              {caption}
            </p>
          )}
        </div>
      );
    }

    // Default: 'full' width
    return (
      <div key={key} className="clear-both my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs space-y-1">
        <div className="relative group cursor-pointer" onClick={() => openLightbox(0)}>
          <img
            src={urls[0]}
            alt={caption || 'Gambar Postingan'}
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[500px] object-cover group-hover:scale-[1.01] transition-transform duration-200"
          />
        </div>
        {caption && (
          <p className="text-xs text-slate-500 font-medium p-2 text-center bg-slate-100/80 border-t border-slate-200">
            {caption}
          </p>
        )}
      </div>
    );
  };

  const renderTextBlock = (text: string, key: number) => {
    if (!text || !text.trim()) return null;

    let cleanText = text;

    // Unescape escaped HTML entities if present (e.g., from browser sync or storage)
    if (cleanText.includes('&lt;') && cleanText.includes('&gt;')) {
      cleanText = cleanText
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
    }

    // Strip trailing/empty <p style="..."><br></p> noise tags
    cleanText = cleanText.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s*)*<\/p>/gi, '');

    if (!cleanText.trim()) return null;

    // Check if text is raw HTML or contains HTML tags/attributes
    if (
      cleanText.includes('<p') ||
      cleanText.includes('<div') ||
      cleanText.includes('<h2') ||
      cleanText.includes('<h3') ||
      cleanText.includes('<img') ||
      cleanText.includes('<iframe') ||
      cleanText.includes('<blockquote') ||
      cleanText.includes('<span') ||
      cleanText.includes('<font') ||
      cleanText.includes('<strong') ||
      cleanText.includes('<em') ||
      cleanText.includes('<sub') ||
      cleanText.includes('<sup') ||
      cleanText.includes('style=')
    ) {
      let processedHtml = cleanText;

      // 1. Convert Google Drive file links inside <a> tags to direct <img> tags
      processedHtml = processedHtml.replace(
        /<a[^>]*href=["'](https?:\/\/(?:drive\.google\.com\/file\/d\/|lh3\.googleusercontent\.com\/d\/)[^"']+)["'][^>]*>[\s\S]*?<\/a>/gi,
        (_, driveUrl) => {
          const directImgUrl = convertGoogleDriveUrl(driveUrl);
          return `<span class="block my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"><img src="${directImgUrl}" alt="Gambar Postingan" referrerpolicy="no-referrer" class="w-full h-auto max-h-[500px] object-cover" /></span>`;
        }
      );

      // 2. Convert standalone Google Drive URLs inside plain HTML text to direct <img> tags
      processedHtml = processedHtml.replace(
        /(^|>|\s)(https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+[^\s<"']*)/gi,
        (_, prefix, driveUrl) => {
          const directImgUrl = convertGoogleDriveUrl(driveUrl);
          return `${prefix}<span class="block my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50"><img src="${directImgUrl}" alt="Gambar Postingan" referrerpolicy="no-referrer" class="w-full h-auto max-h-[500px] object-cover" /></span>`;
        }
      );

      return (
        <div
          key={key}
          className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-3 [&_p]:my-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:bg-blue-50/60 [&_blockquote]:rounded-r-xl [&_blockquote]:text-slate-700 [&_u]:decoration-current [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-0.5 [&_img]:cursor-pointer"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      );
    }

    // Split text by lines / paragraphs
    const paragraphs = cleanText.split(/\n+/);

    return (
      <div key={key} className="space-y-3">
        {paragraphs.map((p, pIdx) => {
          if (!p.trim()) return null;

          let alignClass = 'text-left';
          let cleanP = p;

          // Check alignment intent
          if (/align=justify|\[justify\]/i.test(cleanP) || /text-align:\s*justify/i.test(cleanP)) {
            alignClass = 'text-justify';
          } else if (/align=center|\[center\]/i.test(cleanP) || /text-align:\s*center/i.test(cleanP)) {
            alignClass = 'text-center';
          } else if (/align=right|\[right\]/i.test(cleanP) || /text-align:\s*right/i.test(cleanP)) {
            alignClass = 'text-right';
          }

          // Strip all nested/duplicate align BBCode tags
          cleanP = cleanP.replace(/\[\/?(align=(justify|center|right|left)|justify|center|right|left)\]/gi, '');

          if (!cleanP.trim()) return null;

          // Check Headings: [h2]...[/h2], [h3]...[/h3], ## ..., ### ...
          if (cleanP.match(/^\[h2\]([\s\S]*?)\[\/h2\]$/i) || cleanP.startsWith('## ')) {
            const hText = cleanP.replace(/^\[h2\]|\[\/h2\]$|^##\s+/gi, '');
            return (
              <h2 key={pIdx} className={`text-lg sm:text-xl font-extrabold text-slate-900 mt-4 mb-2 tracking-tight ${alignClass}`}>
                {parseInlineFormatting(hText)}
              </h2>
            );
          }

          if (cleanP.match(/^\[h3\]([\s\S]*?)\[\/h3\]$/i) || cleanP.startsWith('### ')) {
            const hText = cleanP.replace(/^\[h3\]|\[\/h3\]$|^###\s+/gi, '');
            return (
              <h3 key={pIdx} className={`text-base font-bold text-slate-900 mt-3 mb-1 ${alignClass}`}>
                {parseInlineFormatting(hText)}
              </h3>
            );
          }

          // Check Blockquote: [quote]...[/quote]
          if (cleanP.match(/^\[quote\]([\s\S]*?)\[\/quote\]$/i)) {
            const qText = cleanP.replace(/^\[quote\]|\[\/quote\]$/gi, '');
            return (
              <blockquote key={pIdx} className="border-l-4 border-blue-600 pl-4 py-2 my-3 italic bg-blue-50/60 rounded-r-xl text-slate-700 font-medium">
                {parseInlineFormatting(qText)}
              </blockquote>
            );
          }

          return (
            <p key={pIdx} className={`leading-relaxed text-slate-800 text-sm sm:text-base ${alignClass}`}>
              {parseInlineFormatting(cleanP)}
            </p>
          );
        })}
      </div>
    );
  };

  /**
   * Parse inline tags:
   * [b]bold[/b] or **bold**
   * [i]italic[/i] or *italic*
   * [u]underline[/u] or <u>underline</u>
   * Links [label](url) or standalone URLs
   */
  const parseInlineFormatting = (text: string): React.ReactNode => {
    // We break down inline formatting step by step
    // First, process bold, italic, underline tags
    let processed = text;

    // Convert custom tags [b], [i], [u] to JSX nodes array
    const tokens = parseTextToTokens(processed);

    return tokens.map((token, i) => {
      if (typeof token === 'string') {
        // Parse URLs in plain string
        return <React.Fragment key={i}>{parseLinks(token)}</React.Fragment>;
      }
      return token;
    });
  };

  const parseLinks = (str: string): React.ReactNode => {
    const parts = str.split(/(https?:\/\/[^\s]+|\[[^\]]+\]\([^\)]+\))/g);
    return parts.map((part, i) => {
      const mdMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (mdMatch) {
        const linkUrl = mdMatch[2];
        const isImg = linkUrl.match(/\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i) || linkUrl.includes('drive.google.com/file/d/') || linkUrl.includes('lh3.googleusercontent.com/d/');
        if (isImg) {
          const directImgUrl = convertGoogleDriveUrl(linkUrl);
          return (
            <span key={i} className="block my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={directImgUrl} alt={mdMatch[1] || 'Gambar'} referrerPolicy="no-referrer" className="w-full h-auto max-h-[500px] object-cover" />
            </span>
          );
        }
        return (
          <a
            key={i}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center gap-0.5"
          >
            <span>{mdMatch[1]}</span>
            <ExternalLink className="w-3 h-3 inline-block" />
          </a>
        );
      }

      if (part.startsWith('http://') || part.startsWith('https://')) {
        // Check if standalone URL is a Google Drive file link or direct image link
        const isDriveFile = part.includes('drive.google.com/file/d/');
        const isImageExt = part.match(/\.(png|jpg|jpeg|webp|gif|svg)($|\?)/i) || part.includes('lh3.googleusercontent.com/d/');

        if (isDriveFile || isImageExt) {
          const directImgUrl = convertGoogleDriveUrl(part);
          return (
            <span key={i} className="block my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={directImgUrl} alt="Gambar Postingan" referrerPolicy="no-referrer" className="w-full h-auto max-h-[500px] object-cover" />
            </span>
          );
        }

        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-medium break-all inline-flex items-center gap-0.5"
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline-block" />
          </a>
        );
      }

      return part;
    });
  };

  const parseTextToTokens = (input: string): (string | React.ReactNode)[] => {
    // Regex for [b]...[/b], [i]...[/i], [u]...[/u], **...**, *...*, <u>...</u>
    const regex = /(\[b\][\s\S]*?\[\/b\]|\*\*[\s\S]*?\*\*|\[i\][\s\S]*?\[\/i\]|\*[\s\S]*?\*|\[u\][\s\S]*?\[\/u\]|<u>[\s\S]*?<\/u>)/gi;

    const parts = input.split(regex);
    return parts.map((part, idx) => {
      if (part.startsWith('[b]') && part.endsWith('[/b]')) {
        const inner = part.slice(3, -4);
        return <strong key={idx} className="font-extrabold text-slate-900">{inner}</strong>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return <strong key={idx} className="font-extrabold text-slate-900">{inner}</strong>;
      }
      if (part.startsWith('[i]') && part.endsWith('[/i]')) {
        const inner = part.slice(3, -4);
        return <em key={idx} className="italic">{inner}</em>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        const inner = part.slice(1, -1);
        return <em key={idx} className="italic">{inner}</em>;
      }
      if (part.startsWith('[u]') && part.endsWith('[/u]')) {
        const inner = part.slice(3, -4);
        return <u key={idx} className="underline decoration-current decoration-2">{inner}</u>;
      }
      if (part.startsWith('<u>') && part.endsWith('</u>')) {
        const inner = part.slice(3, -4);
        return <u key={idx} className="underline decoration-current decoration-2">{inner}</u>;
      }

      return part;
    });
  };

  return (
    <div className={`prose max-w-none clear-both ${className}`} onClick={handleContainerClick}>
      {renderRichText(normalizedContent)}

      {/* Lightbox Modal for Fullscreen Viewing */}
      {lightboxIndex && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-2 right-2 z-20 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {lightboxIndex.urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex({
                    ...lightboxIndex,
                    index: (lightboxIndex.index - 1 + lightboxIndex.urls.length) % lightboxIndex.urls.length,
                  })
                }
                className="absolute left-2 z-20 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {lightboxIndex.urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex({
                    ...lightboxIndex,
                    index: (lightboxIndex.index + 1) % lightboxIndex.urls.length,
                  })
                }
                className="absolute right-2 z-20 p-2.5 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="max-h-[80vh] overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black/50">
              <img
                src={lightboxIndex.urls[lightboxIndex.index]}
                alt={`Gambar ${lightboxIndex.index + 1}`}
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto object-contain mx-auto"
              />
            </div>

            {lightboxIndex.urls.length > 1 && (
              <div className="mt-3 text-white text-xs font-semibold bg-white/15 px-3 py-1 rounded-full">
                Foto {lightboxIndex.index + 1} dari {lightboxIndex.urls.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layer 2: Confirmation Dialog Popup */}
      {pendingLink && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setPendingLink(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            {pendingLink.matchedArticle ? (
              /* Internal Article Confirmation Card */
              <>
                <div className="flex items-center justify-between pr-8 relative">
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    Ingin Membuka Postingan Ini?
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPendingLink(null)}
                    className="absolute -top-1 right-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {pendingLink.matchedArticle.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {pendingLink.matchedArticle.date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                    {pendingLink.matchedArticle.title}
                  </h4>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingLink(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const targetArt = pendingLink.matchedArticle;
                      setPendingLink(null);
                      if (targetArt) {
                        if (onOpenInternalArticle) {
                          onOpenInternalArticle(targetArt);
                        } else {
                          if (isSecondLayer && onCloseParent) {
                            onCloseParent();
                          }
                          setNestedArticle(targetArt);
                        }
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Buka
                  </button>
                </div>
              </>
            ) : (
              /* External Link Confirmation Card */
              <>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 pr-6">
                    <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                      Konfirmasi Buka Tautan Eksternal
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Apakah Anda ingin membuka link eksternal ini?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingLink(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 overflow-hidden">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-mono text-slate-800 break-all select-all font-semibold">
                    {pendingLink.href}
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Tautan ini akan dibuka pada tab baru di browser Anda. Popup saat ini akan tetap terbuka.
                </p>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPendingLink(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open(pendingLink.href, '_blank', 'noopener,noreferrer');
                      setPendingLink(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Buka Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fallback Layer 2 when onOpenInternalArticle is not provided */}
      {!onOpenInternalArticle && nestedArticle && (
        <NewsDetailModal
          article={nestedArticle}
          onClose={() => setNestedArticle(null)}
          onCloseParent={onCloseParent}
          isSecondLayer={true}
          zIndexClass="z-[75]"
        />
      )}
    </div>
  );
};
