import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  ImageIcon,
  Eye,
  Edit,
  Edit3,
  Plus,
  Trash2,
  X,
  Smile,
  Link as LinkIcon,
  Unlink,
  Clipboard,
  Check,
  Search,
  FileText,
  ExternalLink,
  Palette,
  Type,
  ChevronDown,
  Highlighter,
  List,
  ListOrdered,
  Subscript,
  Superscript,
  Video,
} from 'lucide-react';
import { FormattedContentRenderer } from './FormattedContentRenderer';
import { ImageUploadButton } from '../admin/ImageUploadButton';
import { convertGoogleDriveUrl } from '../../lib/imageOptimizer';
import { parseEmbedUrl } from '../../lib/embedHelper';

export interface InternalPostItem {
  id: string;
  title: string;
  category?: string;
}

interface RichTextEditorWithImagesProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  minRows?: number;
  articles?: InternalPostItem[];
}

// Popular curated emojis for school/organization posts
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😋', '😜', '🤓', '😎', '🥳', '🥺', '🤔', '👍', '👎', '👏', '🙌', '🤝', '✍️', '🙏',
  '💪', '✨', '⭐', '🌟', '🚀', '🏆', '🥇', '🥈', '🥉', '🏅', '🎯', '💡', '📌', '📍', '🔔',
  '📢', '🎓', '🏫', '📚', '📖', '📝', '📊', '📈', '📅', '🗓️', '⏰', '💼', '🏢', '🇮🇩', '🌐',
  '💻', '📱', '✉️', '🎉', '🔥', '❤️', '💯', '✅', '⚠️', '❗', '❓'
];

// Color palette choices for text color tool
const COLOR_PALETTE = [
  { hex: '#0f172a', label: 'Hitam Utama' },
  { hex: '#2563eb', label: 'Biru' },
  { hex: '#059669', label: 'Hijau' },
  { hex: '#d97706', label: 'Kuning / Emas' },
  { hex: '#dc2626', label: 'Merah' },
  { hex: '#7c3aed', label: 'Ungu' },
  { hex: '#0891b2', label: 'Teal' },
  { hex: '#e11d48', label: 'Rose' },
  { hex: '#475569', label: 'Abu-Abu' },
  { hex: '#ffffff', label: 'Putih', isLight: true },
];

// Font choices for Font Family tool
const FONT_OPTIONS = [
  { name: 'Font Default', family: 'Default', label: 'Default' },
  { name: 'Sans-Serif (Modern)', family: 'Plus Jakarta Sans, sans-serif', label: 'Jakarta Sans' },
  { name: 'Playfair (Serif)', family: 'Playfair Display, serif', label: 'Playfair' },
  { name: 'Georgia (Klasik)', family: 'Georgia, serif', label: 'Georgia' },
  { name: 'Times New Roman', family: 'Times New Roman, serif', label: 'Times' },
  { name: 'Arial', family: 'Arial, sans-serif', label: 'Arial' },
  { name: 'Courier (Kode)', family: 'Courier New, monospace', label: 'Courier' },
  { name: 'Comic Sans', family: 'Comic Sans MS, cursive', label: 'Comic Sans' },
  { name: 'Impact (Tebal)', family: 'Impact, sans-serif', label: 'Impact' },
];

// Highlight / Stabilo palette
const HIGHLIGHT_PALETTE = [
  { hex: '#fef08a', label: 'Kuning Stabilo' },
  { hex: '#bbf7d0', label: 'Hijau Stabilo' },
  { hex: '#fbcfe8', label: 'Merah Muda' },
  { hex: '#bfdbfe', label: 'Biru Muda' },
  { hex: '#fed7aa', label: 'Oranye' },
  { hex: '#e9d5ff', label: 'Ungu Muda' },
  { hex: '#e2e8f0', label: 'Abu-Abu' },
  { hex: 'transparent', label: 'Hapus Highlight', isClear: true },
];

// Bullet style options
const BULLET_VARIATIONS = [
  { label: 'Bulat Penuh', style: 'disc', icon: '•' },
  { label: 'Lingkaran Kosong', style: 'circle', icon: '◦' },
  { label: 'Kotak / Persegi', style: 'square', icon: '▪' },
];

// Numbering style options
const NUMBER_VARIATIONS = [
  { label: 'Angka (1, 2, 3)', style: 'decimal', sample: '1.' },
  { label: 'Huruf Besar (A, B, C)', style: 'upper-alpha', sample: 'A.' },
  { label: 'Huruf Kecil (a, b, c)', style: 'lower-alpha', sample: 'a.' },
  { label: 'Romawi Besar (I, II, III)', style: 'upper-roman', sample: 'I.' },
  { label: 'Romawi Kecil (i, ii, iii)', style: 'lower-roman', sample: 'i.' },
];

// Helper: Convert [img layout="..." urls="..." caption="..."] BBCode shortcodes to real standard interactive HTML blocks
function shortcodesToHtml(input: string): string {
  if (!input) return '';
  let html = input;

  // Regex to match [img layout="full" urls="..."] or [img layout="..." urls="..." caption="..." captions="..."]
  const regex = /\[img\s+layout=["']([^"']+)["']\s+urls=["']([^"']+)["'](?:(?:\s+caption=["']([^"']+)["'])|(?:\s+captions=["']([^"']+)["']))?\]/gi;
  html = html.replace(regex, (match, layout, urlsStr, caption, captionsStr) => {
    const urls = (urlsStr || '').split(' | ').map(u => u.trim());
    const captions = captionsStr ? captionsStr.split(' | ').map(c => c.trim()) : (caption ? [caption] : []);

    if (urls.length === 0 || !urls[0]) return '';

    if (layout === 'full' || urls.length === 1) {
      const u = urls[0];
      const cap = captions[0] || '';
      return `
        <div class="my-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1 select-none" contenteditable="false" data-layout="full" data-urls="${u}" data-caption="${cap}">
          <img src="${u}" class="max-w-full h-auto max-h-[450px] object-contain rounded-lg shadow-xs" referrerpolicy="no-referrer" />
          ${cap ? `<p class="text-xs text-slate-500 mt-2 px-3 py-1 bg-white border border-slate-100 rounded-full font-medium shadow-2xs">${cap}</p>` : ''}
        </div><p><br></p>
      `;
    } else if (layout === 'grid-2' || urls.length === 2) {
      const u1 = urls[0];
      const u2 = urls[1] || '';
      const cap1 = captions[0] || '';
      const cap2 = captions[1] || '';
      return `
        <div class="grid grid-cols-2 gap-2 my-4 bg-slate-50 border border-slate-200 rounded-xl p-1.5 select-none" contenteditable="false" data-layout="grid-2" data-urls="${u1} | ${u2}">
          <div class="flex flex-col items-center justify-center">
            <img src="${u1}" class="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap1 ? `<p class="text-[10px] text-slate-500 mt-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-md font-medium shadow-2xs">${cap1}</p>` : ''}
          </div>
          <div class="flex flex-col items-center justify-center">
            <img src="${u2}" class="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap2 ? `<p class="text-[10px] text-slate-500 mt-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-md font-medium shadow-2xs">${cap2}</p>` : ''}
          </div>
        </div><p><br></p>
      `;
    } else {
      // grid-3 or more
      const u1 = urls[0];
      const u2 = urls[1] || '';
      const u3 = urls[2] || '';
      const cap1 = captions[0] || '';
      const cap2 = captions[1] || '';
      const cap3 = captions[2] || '';
      return `
        <div class="grid grid-cols-3 gap-2 my-4 bg-slate-50 border border-slate-200 rounded-xl p-1.5 select-none" contenteditable="false" data-layout="grid-3" data-urls="${u1} | ${u2} | ${u3}">
          <div class="flex flex-col items-center justify-center">
            <img src="${u1}" class="w-full h-auto max-h-[220px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap1 ? `<p class="text-[9px] text-slate-500 mt-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded font-medium shadow-2xs">${cap1}</p>` : ''}
          </div>
          <div class="flex flex-col items-center justify-center">
            <img src="${u2}" class="w-full h-auto max-h-[220px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap2 ? `<p class="text-[9px] text-slate-500 mt-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded font-medium shadow-2xs">${cap2}</p>` : ''}
          </div>
          <div class="flex flex-col items-center justify-center">
            <img src="${u3}" class="w-full h-auto max-h-[220px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap3 ? `<p class="text-[9px] text-slate-500 mt-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded font-medium shadow-2xs">${cap3}</p>` : ''}
          </div>
        </div><p><br></p>
      `;
    }
  });

  return html;
}

// Helper: Convert legacy BBCode / plain text into clean HTML for live WYSIWYG editing
function bbcodeToHtml(input: string): string {
  if (!input) return '';

  let html = input;

  // First convert [img ...] shortcodes to modern standard interactive HTML blocks
  html = shortcodesToHtml(html);

  // Strip duplicate/nested BBCode tags first
  html = html.replace(/\[align=(justify|center|right|left)\]\s*\[align=\1\]/gi, '[align=$1]');
  html = html.replace(/\[\/(align=(justify|center|right|left))\]\s*\[\/\1\]/gi, '[/$1]');

  // Convert BBCode to HTML tags
  html = html.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<b>$1</b>');
  html = html.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<i>$1</i>');
  html = html.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');

  html = html.replace(/\[align=justify\]([\s\S]*?)\[\/align\]/gi, '<p style="text-align: justify;">$1</p>');
  html = html.replace(/\[align=center\]([\s\S]*?)\[\/align\]/gi, '<p style="text-align: center;">$1</p>');
  html = html.replace(/\[align=right\]([\s\S]*?)\[\/align\]/gi, '<p style="text-align: right;">$1</p>');
  html = html.replace(/\[align=left\]([\s\S]*?)\[\/align\]/gi, '<p style="text-align: left;">$1</p>');

  html = html.replace(/\[justify\]([\s\S]*?)\[\/justify\]/gi, '<p style="text-align: justify;">$1</p>');
  html = html.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<p style="text-align: center;">$1</p>');
  html = html.replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<p style="text-align: right;">$1</p>');
  html = html.replace(/\[left\]([\s\S]*?)\[\/left\]/gi, '<p style="text-align: left;">$1</p>');

  html = html.replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, '<h2>$1</h2>');
  html = html.replace(/\[h3\]([\s\S]*?)\[\/h3\]/gi, '<h3>$1</h3>');
  html = html.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote>$1</blockquote>');

  // Convert Markdown link [text](url) to <a>
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+|#[^\)]+)\)/gi, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // If plain text with newlines and no paragraph/heading wrappers, wrap in paragraphs
  if (!html.includes('<p') && !html.includes('<div') && !html.includes('<h2') && !html.includes('<h3')) {
    const lines = html.split(/\n\n+/);
    html = lines
      .map((l) => (l.trim() ? `<p>${l.replace(/\n/g, '<br>')}</p>` : ''))
      .join('');
  }

  // Strip trailing empty paragraph noise
  html = html.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s*)*<\/p>/gi, '');

  return html;
}

interface ImageSlot {
  url: string;
  caption: string;
}

export const RichTextEditorWithImages: React.FC<RichTextEditorWithImagesProps> = ({
  value,
  onChange,
  label = 'Isi Teks Postingan',
  placeholder = 'Tuliskan teks postingan atau kata sambutan di sini...',
  minRows = 8,
  articles = [],
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'code'>('wysiwyg');

  // Active Formatting State (Bold, Italic, Alignments, Headings, Link)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    h2: false,
    h3: false,
    blockquote: false,
    link: false,
    subscript: false,
    superscript: false,
  });

  // Color picker popover & selected color state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState('#0f172a');

  // Highlight / Stabilo picker state
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState('#fef08a');

  // Font size numeric state & preset menu popover
  const [fontSizePx, setFontSizePx] = useState<number>(14);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);

  // Font family menu popover & selected font state
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [selectedFontLabel, setSelectedFontLabel] = useState('Default');

  // Bullet & Numbering list popover states
  const [showBulletMenu, setShowBulletMenu] = useState(false);
  const [showNumberMenu, setShowNumberMenu] = useState(false);

  // Emoticon popover state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Link Tooltip / Dialog states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showInternalPosts, setShowInternalPosts] = useState(false);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedInputUrl, setEmbedInputUrl] = useState('');
  const [embedInputTitle, setEmbedInputTitle] = useState('');
  const [selectedEmbedNode, setSelectedEmbedNode] = useState<HTMLElement | null>(null);
  const [selectedEmbedType, setSelectedEmbedType] = useState<'image' | 'video' | null>(null);
  const [editingNode, setEditingNode] = useState<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Helper & Effect: Auto-close active popovers when tapping/clicking outside popover area
  const closeAllPopovers = () => {
    setShowFontMenu(false);
    setShowFontSizeMenu(false);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowBulletMenu(false);
    setShowNumberMenu(false);
    setShowEmojiPicker(false);
    setShowLinkModal(false);
  };

  useEffect(() => {
    const isAnyPopoverOpen =
      showFontMenu ||
      showFontSizeMenu ||
      showColorPicker ||
      showHighlightPicker ||
      showBulletMenu ||
      showNumberMenu ||
      showEmojiPicker ||
      showLinkModal;

    if (!isAnyPopoverOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-popover-area="true"]')) {
        closeAllPopovers();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [
    showFontMenu,
    showFontSizeMenu,
    showColorPicker,
    showHighlightPicker,
    showBulletMenu,
    showNumberMenu,
    showEmojiPicker,
    showLinkModal,
  ]);

  // Stored articles list for internal link selector
  const [internalList, setInternalList] = useState<InternalPostItem[]>(articles);

  useEffect(() => {
    if (articles && articles.length > 0) {
      setInternalList(articles);
    } else {
      try {
        const raw = localStorage.getItem('dapodik_cloud_articles') || localStorage.getItem('offline_draft_articles');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setInternalList(
              parsed.map((a: any) => ({
                id: a.id || String(Math.random()),
                title: a.title || 'Postingan',
                category: a.category,
              }))
            );
          }
        }
      } catch {
        // fallback
      }
    }
  }, [articles]);

  // Insert Image Modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [layoutCount, setLayoutCount] = useState<1 | 2 | 3>(1);
  const [slots, setSlots] = useState<ImageSlot[]>([
    { url: '', caption: '' },
    { url: '', caption: '' },
    { url: '', caption: '' },
  ]);

  // Initial load / Sync external value to contentEditable div
  useEffect(() => {
    if (activeTab === 'editor' && editorRef.current && editorMode === 'wysiwyg') {
      const formattedHtml = bbcodeToHtml(value);
      if (editorRef.current.innerHTML !== formattedHtml && !editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = formattedHtml || `<p><br></p>`;
      }
    }
  }, [value, editorMode, activeTab]);

  // Handle live content changes from contentEditable
  const handleEditorInput = () => {
    if (editorRef.current) {
      let currentHtml = editorRef.current.innerHTML;
      // Strip trailing empty <p><br></p> noise when saving
      currentHtml = currentHtml.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s*)*<\/p>/gi, '');
      onChange(currentHtml);
    }
  };

  // Switch tab with instant content sync
  const handleSwitchTab = (newTab: 'editor' | 'preview') => {
    if (activeTab === 'editor' && editorMode === 'wysiwyg' && editorRef.current) {
      let currentHtml = editorRef.current.innerHTML;
      currentHtml = currentHtml.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s*)*<\/p>/gi, '');
      onChange(currentHtml);
    }
    setActiveTab(newTab);
  };

  // Update active format state based on current cursor / selection
  const updateActiveFormats = () => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || !sel.anchorNode || !editorRef.current.contains(sel.anchorNode)) {
      return;
    }

    try {
      const bold = document.queryCommandState('bold');
      const italic = document.queryCommandState('italic');
      const underline = document.queryCommandState('underline');
      const justifyLeft = document.queryCommandState('justifyLeft');
      const justifyCenter = document.queryCommandState('justifyCenter');
      const justifyRight = document.queryCommandState('justifyRight');
      const justifyFull = document.queryCommandState('justifyFull');

      const blockTag = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      let isH2 = blockTag === 'h2';
      let isH3 = blockTag === 'h3';
      let isBlockquote = blockTag === 'blockquote';

      let subscript = activeFormats.subscript;
      let superscript = activeFormats.superscript;

      if (!sel.isCollapsed) {
        subscript = document.queryCommandState('subscript');
        superscript = document.queryCommandState('superscript');
      }

      let isInsideLink = false;
      let currNode: Node | null = sel.anchorNode;
      while (currNode && currNode !== editorRef.current) {
        if (currNode instanceof HTMLElement) {
          const tag = currNode.tagName.toLowerCase();
          if (tag === 'h2') isH2 = true;
          if (tag === 'h3') isH3 = true;
          if (tag === 'blockquote') isBlockquote = true;
          if (tag === 'a') isInsideLink = true;
          if (!sel.isCollapsed) {
            if (tag === 'sub') subscript = true;
            if (tag === 'sup') superscript = true;
          }
        }
        currNode = currNode.parentNode;
      }

      // Detect live font size at cursor position
      let targetElement: HTMLElement | null = null;
      if (sel.anchorNode.nodeType === Node.TEXT_NODE) {
        targetElement = sel.anchorNode.parentElement;
      } else if (sel.anchorNode instanceof HTMLElement) {
        targetElement = sel.anchorNode;
      }

      if (targetElement && editorRef.current.contains(targetElement)) {
        // Climb up out of sub or sup tags to get the base element font size
        let fontElem: HTMLElement | null = targetElement;
        while (
          fontElem &&
          fontElem !== editorRef.current &&
          (fontElem.tagName.toLowerCase() === 'sub' || fontElem.tagName.toLowerCase() === 'sup')
        ) {
          fontElem = fontElem.parentElement;
        }

        if (fontElem) {
          const computedSize = window.getComputedStyle(fontElem).fontSize;
          if (computedSize) {
            const parsedPx = Math.round(parseFloat(computedSize));
            if (!isNaN(parsedPx) && parsedPx >= 6 && parsedPx <= 120) {
              setFontSizePx(parsedPx);
            }
          }
        }
      }

      setActiveFormats({
        bold,
        italic,
        underline,
        justifyLeft,
        justifyCenter,
        justifyRight,
        justifyFull,
        h2: isH2,
        h3: isH3,
        blockquote: isBlockquote,
        link: isInsideLink,
        subscript,
        superscript,
      });
    } catch {
      // Ignore queryCommandState errors
    }
  };

  // Helper: Save current selection range inside editorRef
  const saveSelection = () => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.anchorNode && editorRef.current.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Helper: Restore saved selection range
  const restoreSelection = () => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;
    editorRef.current.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  // Listen to selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      saveSelection();
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editorMode]);

  // Intercept beforeinput to prevent typing inside sub/sup when X2/X² is OFF
  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent.inputType === 'insertText' && nativeEvent.data) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
        let subElem: HTMLElement | null = null;
        let supElem: HTMLElement | null = null;
        let currNode: Node | null = sel.anchorNode;

        while (currNode && currNode !== editorRef.current) {
          if (currNode instanceof HTMLElement) {
            const tag = currNode.tagName.toLowerCase();
            if (tag === 'sub') subElem = currNode;
            if (tag === 'sup') supElem = currNode;
          }
          currNode = currNode.parentNode;
        }

        // Caret is inside <sub>, but Subscript is OFF -> Force typing OUTSIDE <sub>
        if (subElem && !activeFormats.subscript) {
          e.preventDefault();
          const textToInsert = nativeEvent.data;

          let nextNode = subElem.nextSibling;
          if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
            nextNode = document.createTextNode('');
            if (subElem.parentNode) {
              subElem.parentNode.insertBefore(nextNode, subElem.nextSibling);
            }
          }

          const textNode = nextNode as Text;
          if (textNode.textContent === '\u200B') {
            textNode.textContent = '';
          }
          const insertOffset = textNode.textContent?.length || 0;
          textNode.insertData(insertOffset, textToInsert);

          const newRange = document.createRange();
          newRange.setStart(textNode, insertOffset + textToInsert.length);
          newRange.setEnd(textNode, insertOffset + textToInsert.length);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();

          handleEditorInput();
          updateActiveFormats();
          return;
        }

        // Caret is inside <sup>, but Superscript is OFF -> Force typing OUTSIDE <sup>
        if (supElem && !activeFormats.superscript) {
          e.preventDefault();
          const textToInsert = nativeEvent.data;

          let nextNode = supElem.nextSibling;
          if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
            nextNode = document.createTextNode('');
            if (supElem.parentNode) {
              supElem.parentNode.insertBefore(nextNode, supElem.nextSibling);
            }
          }

          const textNode = nextNode as Text;
          if (textNode.textContent === '\u200B') {
            textNode.textContent = '';
          }
          const insertOffset = textNode.textContent?.length || 0;
          textNode.insertData(insertOffset, textToInsert);

          const newRange = document.createRange();
          newRange.setStart(textNode, insertOffset + textToInsert.length);
          newRange.setEnd(textNode, insertOffset + textToInsert.length);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRangeRef.current = newRange.cloneRange();

          handleEditorInput();
          updateActiveFormats();
          return;
        }
      }
    }
  };

  // Execute formatting command directly on live document
  const execCommand = (command: string, valueArg: string | undefined = undefined) => {
    if (editorMode === 'code') return;
    restoreSelection();

    try {
      if (command === 'subscript') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
          let subElem: HTMLElement | null = null;
          let supElem: HTMLElement | null = null;
          let currNode: Node | null = sel.anchorNode;

          while (currNode && currNode !== editorRef.current) {
            if (currNode instanceof HTMLElement) {
              const tag = currNode.tagName.toLowerCase();
              if (tag === 'sub') subElem = currNode;
              if (tag === 'sup') supElem = currNode;
            }
            currNode = currNode.parentNode;
          }

          if (subElem) {
            // TURN OFF: User clicked X₂ to turn subscript OFF!
            // Step caret OUTSIDE <sub> element into a normal text node
            let nextNode = subElem.nextSibling;
            if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
              nextNode = document.createTextNode('\u200B');
              if (subElem.parentNode) {
                subElem.parentNode.insertBefore(nextNode, subElem.nextSibling);
              }
            }

            const newRange = document.createRange();
            newRange.setStart(nextNode, nextNode.textContent?.length || 0);
            newRange.setEnd(nextNode, nextNode.textContent?.length || 0);
            sel.removeAllRanges();
            sel.addRange(newRange);

            // Clean up empty <sub> if nothing was typed in it
            const text = subElem.textContent?.replace(/\u200B/g, '');
            if (!text) {
              subElem.remove();
            }

            setActiveFormats((prev) => ({ ...prev, subscript: false }));
          } else {
            // TURN ON: User clicked X₂ to turn subscript ON!
            if (supElem) {
              // Exit <sup> first if inside superscript
              const exitSupRange = document.createRange();
              exitSupRange.setStartAfter(supElem);
              exitSupRange.setEndAfter(supElem);
              sel.removeAllRanges();
              sel.addRange(exitSupRange);
            }

            const sub = document.createElement('sub');
            const zwNode = document.createTextNode('\u200B');
            sub.appendChild(zwNode);

            const range = sel.getRangeAt(0);
            range.insertNode(sub);

            const newRange = document.createRange();
            newRange.setStart(zwNode, 1);
            newRange.setEnd(zwNode, 1);
            sel.removeAllRanges();
            sel.addRange(newRange);

            setActiveFormats((prev) => ({ ...prev, subscript: true, superscript: false }));
          }
        } else {
          if (document.queryCommandState('superscript')) {
            document.execCommand('superscript', false);
          }
          document.execCommand('subscript', false);
        }
      } else if (command === 'superscript') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
          let subElem: HTMLElement | null = null;
          let supElem: HTMLElement | null = null;
          let currNode: Node | null = sel.anchorNode;

          while (currNode && currNode !== editorRef.current) {
            if (currNode instanceof HTMLElement) {
              const tag = currNode.tagName.toLowerCase();
              if (tag === 'sub') subElem = currNode;
              if (tag === 'sup') supElem = currNode;
            }
            currNode = currNode.parentNode;
          }

          if (supElem) {
            // TURN OFF: User clicked X² to turn superscript OFF!
            let nextNode = supElem.nextSibling;
            if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
              nextNode = document.createTextNode('\u200B');
              if (supElem.parentNode) {
                supElem.parentNode.insertBefore(nextNode, supElem.nextSibling);
              }
            }

            const newRange = document.createRange();
            newRange.setStart(nextNode, nextNode.textContent?.length || 0);
            newRange.setEnd(nextNode, nextNode.textContent?.length || 0);
            sel.removeAllRanges();
            sel.addRange(newRange);

            const text = supElem.textContent?.replace(/\u200B/g, '');
            if (!text) {
              supElem.remove();
            }

            setActiveFormats((prev) => ({ ...prev, superscript: false }));
          } else {
            // TURN ON: User clicked X² to turn superscript ON!
            if (subElem) {
              const exitSubRange = document.createRange();
              exitSubRange.setStartAfter(subElem);
              exitSubRange.setEndAfter(subElem);
              sel.removeAllRanges();
              sel.addRange(exitSubRange);
            }

            const sup = document.createElement('sup');
            const zwNode = document.createTextNode('\u200B');
            sup.appendChild(zwNode);

            const range = sel.getRangeAt(0);
            range.insertNode(sup);

            const newRange = document.createRange();
            newRange.setStart(zwNode, 1);
            newRange.setEnd(zwNode, 1);
            sel.removeAllRanges();
            sel.addRange(newRange);

            setActiveFormats((prev) => ({ ...prev, superscript: true, subscript: false }));
          }
        } else {
          if (document.queryCommandState('subscript')) {
            document.execCommand('subscript', false);
          }
          document.execCommand('superscript', false);
        }
      } else {
        document.execCommand(command, false, valueArg);
      }
    } catch {
      // Fallback
    }

    saveSelection();
    handleEditorInput();
    setTimeout(updateActiveFormats, 10);
  };

  // Force caret back to Normal Text format without altering existing sub/sup elements
  const handleForceNormalText = () => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;
    editorRef.current.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let subOrSupElem: HTMLElement | null = null;
      let currNode: Node | null = sel.anchorNode;

      while (currNode && currNode !== editorRef.current) {
        if (currNode instanceof HTMLElement) {
          const tag = currNode.tagName.toLowerCase();
          if (tag === 'sub' || tag === 'sup') {
            subOrSupElem = currNode;
          }
        }
        currNode = currNode.parentNode;
      }

      if (subOrSupElem && subOrSupElem.parentNode) {
        let nextNode = subOrSupElem.nextSibling;
        if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
          nextNode = document.createTextNode('\u200B');
          subOrSupElem.parentNode.insertBefore(nextNode, subOrSupElem.nextSibling);
        }

        const newRange = document.createRange();
        const targetOffset = nextNode.textContent?.length || 0;
        newRange.setStart(nextNode, targetOffset);
        newRange.setEnd(nextNode, targetOffset);

        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    }

    setActiveFormats((prev) => ({
      ...prev,
      subscript: false,
      superscript: false,
    }));

    handleEditorInput();
    setTimeout(updateActiveFormats, 10);
  };

  // Apply exact font size (px)
  const handleApplyExactFontSize = (sizePx: number) => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;
    restoreSelection();

    const validPx = Math.min(100, Math.max(8, sizePx));
    setFontSizePx(validPx);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);

      if (!sel.isCollapsed) {
        // Apply to blocked text
        const span = document.createElement('span');
        span.style.fontSize = `${validPx}px`;

        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);

          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.addRange(newRange);
        } catch {
          document.execCommand('fontSize', false, '3');
        }
      } else {
        // Collapsed caret cursor: insert span with zero-width space so new typed characters inherit this size
        const span = document.createElement('span');
        span.style.fontSize = `${validPx}px`;
        const zeroWidthNode = document.createTextNode('\u200B');
        span.appendChild(zeroWidthNode);

        try {
          range.insertNode(span);
          const newRange = document.createRange();
          newRange.setStart(zeroWidthNode, 1);
          newRange.setEnd(zeroWidthNode, 1);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } catch {
          // fallback
        }
      }
    }

    saveSelection();
    handleEditorInput();
    setTimeout(updateActiveFormats, 10);
  };

  // Step Font Size (A+ / A-) for blocked text
  const handleStepFontSize = (delta: number) => {
    const nextPx = Math.min(72, Math.max(10, fontSizePx + delta * 2));
    handleApplyExactFontSize(nextPx);
  };

  // Change Font Family for blocked text
  const handleApplyFontName = (fontFamily: string, fontLabel?: string) => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;
    restoreSelection();

    if (fontLabel) {
      setSelectedFontLabel(fontLabel);
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);

      if (fontFamily === 'Default') {
        document.execCommand('removeFormat', false);
      } else {
        // Create a span element with explicit inline style font-family for maximum CSS specificity
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;

        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);

          // Reselect newly formatted span so selection stays visible
          sel.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          sel.addRange(newRange);
        } catch {
          // Fallback to execCommand fontName
          document.execCommand('fontName', false, fontFamily);
        }
      }
    } else {
      // Fallback for collapsed selection / next typed character
      document.execCommand('fontName', false, fontFamily);
    }

    saveSelection();
    handleEditorInput();
    setTimeout(updateActiveFormats, 10);
  };

  // Change Text Color for blocked text
  const handleApplyTextColor = (colorHex: string) => {
    setActiveColor(colorHex);
    if (editorMode === 'wysiwyg' && editorRef.current) {
      restoreSelection();
      document.execCommand('foreColor', false, colorHex);
      saveSelection();
      handleEditorInput();
      setTimeout(updateActiveFormats, 10);
    }
  };

  // Change Highlight / Background Color for blocked text
  const handleApplyHighlightColor = (colorHex: string) => {
    setActiveHighlightColor(colorHex);
    if (editorMode === 'wysiwyg' && editorRef.current) {
      restoreSelection();

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);

        if (colorHex === 'transparent' || !colorHex) {
          document.execCommand('removeFormat', false);
        } else {
          const span = document.createElement('span');
          span.style.backgroundColor = colorHex;

          try {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);

            sel.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.addRange(newRange);
          } catch {
            document.execCommand('hiliteColor', false, colorHex);
          }
        }
      } else {
        document.execCommand('hiliteColor', false, colorHex);
      }

      saveSelection();
      handleEditorInput();
      setTimeout(updateActiveFormats, 10);
    }
  };

  // Change List Style (Bulleted & Numbered)
  const handleApplyList = (type: 'ul' | 'ol', listStyleType: string) => {
    if (editorMode !== 'wysiwyg' || !editorRef.current) return;
    restoreSelection();

    if (type === 'ul') {
      document.execCommand('insertUnorderedList', false);
    } else {
      document.execCommand('insertOrderedList', false);
    }

    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      let node: Node | null = sel.anchorNode;
      while (node && node !== editorRef.current) {
        const tag = node.nodeName.toLowerCase();
        if (tag === 'ul' || tag === 'ol') {
          (node as HTMLElement).style.listStyleType = listStyleType;
          break;
        }
        node = node.parentNode;
      }
    }

    saveSelection();
    handleEditorInput();
    setTimeout(updateActiveFormats, 10);
  };

  // Block format toggler (h2, h3, blockquote)
  const handleBlockFormat = (tag: 'h2' | 'h3' | 'blockquote') => {
    if (editorMode === 'code') return;
    restoreSelection();

    if (activeFormats[tag]) {
      // Toggle off back to normal paragraph
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }

    saveSelection();
    handleEditorInput();
    setTimeout(updateActiveFormats, 10);
  };

  // Open Link Dialog
  const handleOpenLinkModal = () => {
    setShowEmojiPicker(false);
    setShowInternalPosts(false);

    if (editorMode !== 'wysiwyg' || !editorRef.current) {
      setShowLinkModal(true);
      return;
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      savedRangeRef.current = range.cloneRange();
      const selectedString = range.toString();
      setLinkText(selectedString);

      // Check if cursor/selection is already inside an <a> tag
      let parentA: HTMLAnchorElement | null = null;
      let node: Node | null = range.commonAncestorContainer;
      while (node && node !== editorRef.current) {
        if (node instanceof HTMLAnchorElement) {
          parentA = node;
          break;
        }
        node = node.parentNode;
      }

      if (parentA) {
        setLinkUrl(parentA.getAttribute('href') || '');
        if (!selectedString) {
          setLinkText(parentA.innerText || '');
        }
      } else {
        setLinkUrl('');
      }
    } else {
      setLinkText('');
      setLinkUrl('');
    }

    setShowLinkModal(true);
  };

  // Paste from clipboard into URL input
  const handlePasteLinkUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLinkUrl(text.trim());
      }
    } catch (err) {
      console.warn('Gagal membaca clipboard:', err);
    }
  };

  // Select internal post as link destination
  const handleSelectInternalPost = (article: InternalPostItem) => {
    setLinkUrl(`#berita-${article.id}`);
    if (!linkText.trim()) {
      setLinkText(article.title);
    }
    setShowInternalPosts(false);
  };

  // Apply link to selected text
  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const finalUrl = linkUrl.trim();

    if (editorMode === 'wysiwyg' && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && savedRangeRef.current) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }

      const selectedStr = sel?.toString() || '';
      const label = linkText.trim() || selectedStr.trim() || finalUrl;
      const isExternal = finalUrl.startsWith('http://') || finalUrl.startsWith('https://');
      const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';

      const linkHtml = `<a href="${finalUrl}" ${targetAttr} style="color:#2563eb;text-decoration:underline;font-weight:500;" class="text-blue-600 underline font-medium hover:text-blue-800">${label}</a>&nbsp;`;

      try {
        document.execCommand('insertHTML', false, linkHtml);
      } catch {
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const temp = document.createElement('div');
          temp.innerHTML = linkHtml;
          while (temp.firstChild) {
            range.insertNode(temp.firstChild);
          }
        }
      }

      handleEditorInput();
      setTimeout(updateActiveFormats, 10);
    } else {
      const label = linkText.trim() || 'Link';
      const md = `[${label}](${finalUrl})`;
      onChange(value ? `${value} ${md}` : md);
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    savedRangeRef.current = null;
  };

  // Unlink / Remove Link
  const handleUnlink = () => {
    if (editorMode === 'wysiwyg' && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && savedRangeRef.current) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
      document.execCommand('unlink', false);
      handleEditorInput();
      setTimeout(updateActiveFormats, 10);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    savedRangeRef.current = null;
  };

  // Insert Emoji at cursor
  const handleInsertEmoji = (emoji: string) => {
    if (editorMode === 'wysiwyg' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, emoji);
      handleEditorInput();
    } else if (textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const current = ta.value;
      const next = current.slice(0, start) + emoji + current.slice(end);
      onChange(next);
    }
    setShowEmojiPicker(false);
  };

  // Update specific image slot URL or caption
  const handleUpdateSlot = (index: number, url: string, caption: string) => {
    setSlots((prev) => {
      const next = [...prev];
      while (next.length <= index) {
        next.push({ url: '', caption: '' });
      }
      next[index] = { url, caption };
      return next;
    });
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSlots([
      { url: '', caption: '' },
      { url: '', caption: '' },
      { url: '', caption: '' },
    ]);
    setLayoutCount(1);
    setEditingNode(null);
  };

  // Insert complete shortcode into editor at cursor
  const handleConfirmInsertImage = () => {
    const activeSlots = slots.slice(0, layoutCount);
    const filledSlots = activeSlots.filter((s) => s.url && s.url.trim().length > 5);

    if (filledSlots.length === 0) return;

    const cleanUrls = activeSlots
      .map((s) => (s.url ? convertGoogleDriveUrl(s.url.trim()) : ''))
      .filter((u) => u.length > 5);

    if (cleanUrls.length === 0) return;

    const captions = activeSlots.map((s) => s.caption.trim());
    const hasAnyCaption = captions.some((c) => c.length > 0);

    let htmlBlock = '';
    if (layoutCount === 1) {
      const u = cleanUrls[0];
      const cap = captions[0] || '';
      htmlBlock = `
        <div class="my-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1 select-none" contenteditable="false" data-layout="full" data-urls="${u}" data-caption="${cap}">
          <img src="${u}" class="max-w-full h-auto max-h-[450px] object-contain rounded-lg shadow-xs" referrerpolicy="no-referrer" />
          ${cap ? `<p class="text-xs text-slate-500 mt-2 px-3 py-1 bg-white border border-slate-100 rounded-full font-medium shadow-2xs">${cap}</p>` : ''}
        </div><p><br></p>
      `;
    } else if (layoutCount === 2) {
      const u1 = cleanUrls[0];
      const u2 = cleanUrls[1] || '';
      const cap1 = captions[0] || '';
      const cap2 = captions[1] || '';
      htmlBlock = `
        <div class="grid grid-cols-2 gap-2 my-4 bg-slate-50 border border-slate-200 rounded-xl p-1.5 select-none" contenteditable="false" data-layout="grid-2" data-urls="${u1} | ${u2}">
          <div class="flex flex-col items-center justify-center">
            <img src="${u1}" class="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap1 ? `<p class="text-[10px] text-slate-500 mt-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-md font-medium shadow-2xs">${cap1}</p>` : ''}
          </div>
          <div class="flex flex-col items-center justify-center">
            <img src="${u2}" class="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap2 ? `<p class="text-[10px] text-slate-500 mt-1.5 px-2 py-0.5 bg-white border border-slate-100 rounded-md font-medium shadow-2xs">${cap2}</p>` : ''}
          </div>
        </div><p><br></p>
      `;
    } else {
      const u1 = cleanUrls[0];
      const u2 = cleanUrls[1] || '';
      const u3 = cleanUrls[2] || '';
      const cap1 = captions[0] || '';
      const cap2 = captions[1] || '';
      const cap3 = captions[2] || '';
      htmlBlock = `
        <div class="grid grid-cols-3 gap-2 my-4 bg-slate-50 border border-slate-200 rounded-xl p-1.5 select-none" contenteditable="false" data-layout="grid-3" data-urls="${u1} | ${u2} | ${u3}">
          <div class="flex flex-col items-center justify-center">
            <img src="${u1}" class="w-full h-auto max-h-[220px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap1 ? `<p class="text-[9px] text-slate-500 mt-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded font-medium shadow-2xs">${cap1}</p>` : ''}
          </div>
          <div class="flex flex-col items-center justify-center">
            <img src="${u2}" class="w-full h-auto max-h-[220px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap2 ? `<p class="text-[9px] text-slate-500 mt-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded font-medium shadow-2xs">${cap2}</p>` : ''}
          </div>
          <div class="flex flex-col items-center justify-center">
            <img src="${u3}" class="w-full h-auto max-h-[220px] object-cover rounded-lg shadow-2xs" referrerpolicy="no-referrer" />
            ${cap3 ? `<p class="text-[9px] text-slate-500 mt-1 px-1.5 py-0.5 bg-white border border-slate-100 rounded font-medium shadow-2xs">${cap3}</p>` : ''}
          </div>
        </div><p><br></p>
      `;
    }

    if (editingNode) {
      editingNode.outerHTML = htmlBlock;
      setEditingNode(null);
      setSelectedEmbedNode(null);
      setSelectedEmbedType(null);
      handleEditorInput();
    } else if (editorMode === 'wysiwyg' && editorRef.current) {
      editorRef.current.focus();

      try {
        document.execCommand('insertHTML', false, htmlBlock);
      } catch {
        editorRef.current.innerHTML += htmlBlock;
      }
      handleEditorInput();
    } else {
      onChange(value ? `${value}\n\n${htmlBlock}\n` : `${htmlBlock}\n`);
    }

    handleCloseImageModal();
  };

  // Insert complete embed video/iframe HTML into editor at cursor
  const handleConfirmInsertEmbed = () => {
    if (!embedInputUrl.trim()) return;

    const parsed = parseEmbedUrl(embedInputUrl.trim());
    if (!parsed || !parsed.embedUrl) {
      alert('Tautan video tidak dikenali. Silakan masukkan tautan YouTube yang valid atau kode iframe yang benar.');
      return;
    }

    const titleText = embedInputTitle.trim();
    const htmlBlock = `
      <div class="my-5 flex flex-col items-center bg-slate-100 border border-slate-200 rounded-xl overflow-hidden p-2 shadow-2xs max-w-2xl mx-auto w-full select-none" contenteditable="false" data-embed-url="${parsed.embedUrl}">
        <div class="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xs bg-black">
          <iframe src="${parsed.embedUrl}" class="absolute top-0 left-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        ${titleText ? `<p class="text-xs font-bold text-slate-700 mt-2 text-center px-4">${titleText}</p>` : ''}
      </div><p><br></p>
    `;

    if (editingNode) {
      editingNode.outerHTML = htmlBlock;
      setEditingNode(null);
      setSelectedEmbedNode(null);
      setSelectedEmbedType(null);
      handleEditorInput();
    } else if (editorMode === 'wysiwyg' && editorRef.current) {
      editorRef.current.focus();

      try {
        document.execCommand('insertHTML', false, htmlBlock);
      } catch {
        editorRef.current.innerHTML += htmlBlock;
      }
      handleEditorInput();
    } else {
      onChange(value ? `${value}\n\n${htmlBlock}\n` : `${htmlBlock}\n`);
    }

    setShowEmbedModal(false);
    setEmbedInputUrl('');
    setEmbedInputTitle('');
  };

  const filteredInternalPosts = internalList.filter((a) =>
    a.title.toLowerCase().includes(postSearchQuery.toLowerCase())
  );

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Check video block first, then image layout block to ensure strict separation of embed video link from image blocks
    const videoBlock = target.closest('[data-embed-url]') as HTMLElement | null;
    const imageBlock = target.closest('[data-layout]') as HTMLElement | null;

    if (videoBlock) {
      e.preventDefault();
      setSelectedEmbedNode(videoBlock);
      setSelectedEmbedType('video');
    } else if (imageBlock) {
      e.preventDefault();
      setSelectedEmbedNode(imageBlock);
      setSelectedEmbedType('image');
    } else {
      setSelectedEmbedNode(null);
      setSelectedEmbedType(null);
    }
  };

  const handleDeleteSelectedEmbed = () => {
    if (!selectedEmbedNode) return;

    if (confirm('Apakah Anda yakin ingin menghapus media ini dari artikel?')) {
      selectedEmbedNode.remove();
      setSelectedEmbedNode(null);
      setSelectedEmbedType(null);
      handleEditorInput();
    }
  };

  const handleEditSelectedEmbed = () => {
    if (!selectedEmbedNode) return;

    if (selectedEmbedType === 'video') {
      const url = selectedEmbedNode.getAttribute('data-embed-url') || '';
      const p = selectedEmbedNode.querySelector('p');
      const title = p ? p.innerText : '';

      setEmbedInputUrl(url);
      setEmbedInputTitle(title);
      setEditingNode(selectedEmbedNode);
      setShowEmbedModal(true);
    } else {
      // Image layout block
      const layout = selectedEmbedNode.getAttribute('data-layout') || 'full';
      const newSlots = [
        { url: '', caption: '' },
        { url: '', caption: '' },
        { url: '', caption: '' },
      ];

      if (layout === 'full') {
        const img = selectedEmbedNode.querySelector('img');
        const p = selectedEmbedNode.querySelector('p');
        newSlots[0] = {
          url: img ? img.getAttribute('src') || '' : '',
          caption: p ? p.innerText : '',
        };
        setLayoutCount(1);
      } else {
        const imgs = Array.from(selectedEmbedNode.querySelectorAll('img'));
        imgs.forEach((img, idx) => {
          if (idx >= 3) return;
          const parentCol = img.parentElement;
          const p = parentCol ? parentCol.querySelector('p') : null;
          newSlots[idx] = {
            url: img.getAttribute('src') || '',
            caption: p ? p.innerText : '',
          };
        });
        setLayoutCount(layout === 'grid-2' ? 2 : 3);
      }

      setSlots(newSlots);
      setEditingNode(selectedEmbedNode);
      setShowImageModal(true);
    }
  };

  return (
    <div className="space-y-2">
      {/* Top Header Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        {label && (
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
      </div>

      {/* Unified Editor & Preview Panel */}
      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-all relative">
          
          {/* Formatting Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1 relative">
            
            {/* 1. Bold Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('bold')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.bold
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Tebal (Bold)"
              aria-label="Tebal"
            >
              <Bold className="w-4 h-4 stroke-[3]" />
            </button>

            {/* 2. Italic Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('italic')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.italic
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Miring (Italic)"
              aria-label="Miring"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* 3. Underline Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('underline')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.underline
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Garis Bawah (Underline)"
              aria-label="Garis Bawah"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* 4. Font Family Selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                data-popover-area="true"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => {
                  saveSelection();
                  setShowFontMenu(!showFontMenu);
                  setShowColorPicker(false);
                  setShowEmojiPicker(false);
                  setShowLinkModal(false);
                  setShowFontSizeMenu(false);
                  setShowHighlightPicker(false);
                  setShowBulletMenu(false);
                  setShowNumberMenu(false);
                }}
                className={`px-2.5 py-1 bg-white border rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold text-slate-700 max-w-[130px] ${
                  showFontMenu
                    ? 'border-blue-500 ring-2 ring-blue-500/20 text-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                title="Pilih Jenis Font"
                aria-label="Pilih Jenis Font"
              >
                <Type className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{selectedFontLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
              </button>

              {showFontMenu && (
                <div data-popover-area="true" className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 w-52 max-h-64 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Pilih Jenis Font
                  </div>
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.family}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                      }}
                      onClick={() => {
                        handleApplyFontName(f.family, f.label);
                        setShowFontMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        selectedFontLabel === f.label
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span style={{ fontFamily: f.family !== 'Default' ? f.family : undefined }}>
                        {f.name}
                      </span>
                      {selectedFontLabel === f.label && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Font Size Decrement (A-) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => handleStepFontSize(-1)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer font-black text-xs flex items-center shrink-0"
              title="Perkecil Ukuran Font (A-)"
              aria-label="Perkecil Ukuran Font"
            >
              <span className="text-xs font-bold leading-none">A</span>
              <span className="text-[10px] font-black leading-none text-blue-600 ml-0.5">-</span>
            </button>

            {/* 6. Numeric Font Size Input & Preset Menu */}
            <div data-popover-area="true" className="flex items-center relative shrink-0">
              <input
                type="number"
                min={8}
                max={96}
                value={fontSizePx || ''}
                onFocus={() => saveSelection()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    handleApplyExactFontSize(val);
                  } else {
                    setFontSizePx(0);
                  }
                }}
                className="w-10 text-center py-1 px-1 text-xs font-extrabold text-blue-700 bg-white border border-slate-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                title="Ketik Ukuran Font Teks"
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => {
                  saveSelection();
                  setShowFontSizeMenu(!showFontSizeMenu);
                  setShowFontMenu(false);
                  setShowColorPicker(false);
                  setShowHighlightPicker(false);
                  setShowBulletMenu(false);
                  setShowNumberMenu(false);
                  setShowEmojiPicker(false);
                  setShowLinkModal(false);
                }}
                className="px-1.5 py-1 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 rounded-r-lg transition-colors flex items-center justify-center cursor-pointer h-full"
                title="Pilih Preset Ukuran Font"
                aria-label="Preset Ukuran Font"
              >
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </button>

              {showFontSizeMenu && (
                <div data-popover-area="true" className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 w-28 max-h-52 overflow-y-auto space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Ukuran Preset
                  </div>
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleApplyExactFontSize(sz);
                        setShowFontSizeMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer font-bold ${
                        fontSizePx === sz
                          ? 'bg-blue-600 text-white font-extrabold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{sz}</span>
                      <span className={`text-[9px] ${fontSizePx === sz ? 'text-blue-100' : 'text-slate-400'}`}>pt</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Font Size Increment (A+) */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => handleStepFontSize(+1)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer font-black text-xs flex items-center shrink-0"
              title="Perbesar Ukuran Font (A+)"
              aria-label="Perbesar Ukuran Font"
            >
              <span className="text-sm font-black leading-none">A</span>
              <span className="text-[10px] font-black leading-none text-blue-600 ml-0.5">+</span>
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* 8. Text Color Picker */}
            <div data-popover-area="true" className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => {
                  saveSelection();
                  setShowColorPicker(!showColorPicker);
                  setShowHighlightPicker(false);
                  setShowFontMenu(false);
                  setShowBulletMenu(false);
                  setShowNumberMenu(false);
                  setShowEmojiPicker(false);
                  setShowLinkModal(false);
                  setShowFontSizeMenu(false);
                }}
                className={`p-1.5 bg-white border rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  showColorPicker
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title="Ubah Warna Teks"
                aria-label="Warna Teks"
              >
                <Palette className="w-4 h-4 text-slate-700" />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                  style={{ backgroundColor: activeColor }}
                />
              </button>

              {showColorPicker && (
                <div className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-56 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Warna Teks</span>
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleApplyTextColor(c.hex)}
                        className="w-7 h-7 rounded-lg border border-slate-200/80 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs"
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {activeColor === c.hex && (
                          <Check className={`w-3.5 h-3.5 ${c.isLight ? 'text-slate-900' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Warna Bebas:</span>
                    <input
                      type="color"
                      value={activeColor}
                      onFocus={saveSelection}
                      onChange={(e) => handleApplyTextColor(e.target.value)}
                      className="w-8 h-7 rounded cursor-pointer border border-slate-200 bg-white p-0.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 9. Stabilo / Highlight Picker */}
            <div data-popover-area="true" className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => {
                  saveSelection();
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowColorPicker(false);
                  setShowFontMenu(false);
                  setShowBulletMenu(false);
                  setShowNumberMenu(false);
                  setShowEmojiPicker(false);
                  setShowLinkModal(false);
                  setShowFontSizeMenu(false);
                }}
                className={`p-1.5 bg-white border rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  showHighlightPicker
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title="Stabilo / Highlight Teks"
                aria-label="Stabilo Teks"
              >
                <Highlighter className="w-4 h-4 text-slate-700" />
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                  style={{ backgroundColor: activeHighlightColor === 'transparent' ? '#fef08a' : activeHighlightColor }}
                />
              </button>

              {showHighlightPicker && (
                <div className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-56 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                      <span>Warna Stabilo</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowHighlightPicker(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {HIGHLIGHT_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          handleApplyHighlightColor(c.hex);
                          setShowHighlightPicker(false);
                        }}
                        className={`h-7 rounded-lg border border-slate-200 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer text-[10px] font-bold ${
                          c.isClear ? 'col-span-4 bg-slate-100 text-slate-600 hover:bg-slate-200' : ''
                        }`}
                        style={{ backgroundColor: !c.isClear ? c.hex : undefined }}
                        title={c.label}
                      >
                        {c.isClear ? (
                          '🚫 Hapus Stabilo'
                        ) : (
                          activeHighlightColor === c.hex && <Check className="w-3.5 h-3.5 text-slate-900" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Warna Bebas:</span>
                    <input
                      type="color"
                      value={activeHighlightColor === 'transparent' ? '#fef08a' : activeHighlightColor}
                      onFocus={saveSelection}
                      onChange={(e) => handleApplyHighlightColor(e.target.value)}
                      className="w-8 h-7 rounded cursor-pointer border border-slate-200 bg-white p-0.5"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* 10. Align Left */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('justifyLeft')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.justifyLeft
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Rata Kiri"
              aria-label="Rata Kiri"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            {/* 11. Align Center */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('justifyCenter')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.justifyCenter
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Rata Tengah"
              aria-label="Rata Tengah"
            >
              <AlignCenter className="w-4 h-4" />
            </button>

            {/* 12. Align Right */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('justifyRight')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.justifyRight
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Rata Kanan"
              aria-label="Rata Kanan"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            {/* 13. Justify */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => execCommand('justifyFull')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                activeFormats.justifyFull
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Rata Kanan-Kiri (Justify)"
              aria-label="Rata Kanan-Kiri"
            >
              <AlignJustify className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* 14. Bullet List */}
            <div data-popover-area="true" className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => {
                  saveSelection();
                  setShowBulletMenu(!showBulletMenu);
                  setShowNumberMenu(false);
                  setShowHighlightPicker(false);
                  setShowColorPicker(false);
                  setShowFontMenu(false);
                  setShowFontSizeMenu(false);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer text-slate-700 flex items-center gap-0.5 ${
                  showBulletMenu
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title="Daftar Simbol / Bullet List"
                aria-label="Bullet List"
              >
                <List className="w-4 h-4" />
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
              </button>

              {showBulletMenu && (
                <div className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 w-48 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Gaya Bullet
                  </div>
                  {BULLET_VARIATIONS.map((b) => (
                    <button
                      key={b.style}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleApplyList('ul', b.style);
                        setShowBulletMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer font-medium text-slate-700"
                    >
                      <span className="text-base leading-none w-4 text-center font-extrabold text-blue-600">{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 15. Numbering List */}
            <div data-popover-area="true" className="relative shrink-0">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => {
                  saveSelection();
                  setShowNumberMenu(!showNumberMenu);
                  setShowBulletMenu(false);
                  setShowHighlightPicker(false);
                  setShowColorPicker(false);
                  setShowFontMenu(false);
                  setShowFontSizeMenu(false);
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer text-slate-700 flex items-center gap-0.5 ${
                  showNumberMenu
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                title="Daftar Penomoran / Numbering List"
                aria-label="Numbering List"
              >
                <ListOrdered className="w-4 h-4" />
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
              </button>

              {showNumberMenu && (
                <div className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 w-52 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Gaya Penomoran
                  </div>
                  {NUMBER_VARIATIONS.map((n) => (
                    <button
                      key={n.style}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        handleApplyList('ol', n.style);
                        setShowNumberMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer font-medium text-slate-700"
                    >
                      <span className="text-xs font-extrabold text-blue-600 w-5">{n.sample}</span>
                      <span>{n.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* 16. Quote Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => handleBlockFormat('blockquote')}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                activeFormats.blockquote
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Kotak Kutipan (Quote)"
              aria-label="Kotak Kutipan"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-300 mx-0.5 shrink-0" />

            {/* 17. Link Button */}
            <button
              type="button"
              data-popover-area="true"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={handleOpenLinkModal}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                activeFormats.link || showLinkModal
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Sisipkan / Edit Teks Link"
              aria-label="Teks Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            {/* 18. Emoticon Button */}
            <button
              type="button"
              data-popover-area="true"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => {
                saveSelection();
                setShowEmojiPicker(!showEmojiPicker);
                setShowLinkModal(false);
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                showEmojiPicker
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Sisipkan Emoticon"
              aria-label="Emoticon"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* 19. Image Inserter */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => {
                saveSelection();
                setShowImageModal(true);
                setShowEmojiPicker(false);
                setShowLinkModal(false);
              }}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Sisipkan Gambar (Layout 1, 2, 3)"
              aria-label="Sisipkan Gambar"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* 20. Video Embed */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => {
                saveSelection();
                setShowEmbedModal(true);
                setShowEmojiPicker(false);
                setShowLinkModal(false);
              }}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
              title="Sisipkan Video (YouTube / Embed Link)"
              aria-label="Sisipkan Video"
            >
              <Video className="w-4 h-4" />
            </button>

          </div>

          {/* Floating Minimalist Text Link Popover */}
          {showLinkModal && (
            <div data-popover-area="true" className="absolute top-12 left-2 right-2 sm:left-auto sm:right-4 z-40 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 sm:w-96">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://... atau #berita-id"
                    className="w-full pl-7 pr-8 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-mono"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyLink();
                      }
                      if (e.key === 'Escape') {
                        setShowLinkModal(false);
                      }
                    }}
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <button
                    type="button"
                    onClick={handlePasteLinkUrl}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded absolute right-1 top-1 transition-colors cursor-pointer"
                    title="Tempel dari Clipboard"
                    aria-label="Tempel"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Internal Website Posts Dropdown Toggle */}
                {internalList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowInternalPosts(!showInternalPosts)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                      showInternalPosts
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700 border-slate-300'
                    }`}
                    title="Arahkan ke Postingan Website Ini"
                    aria-label="Pilih Postingan"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyLink}
                  disabled={!linkUrl.trim()}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                  title="Terapkan Link"
                  aria-label="Terapkan"
                >
                  <Check className="w-4 h-4" />
                </button>

                {/* Unlink button if active */}
                {activeFormats.link && (
                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                    title="Hapus Link"
                    aria-label="Hapus Link"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Tutup"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Internal Website Posts Search Dropdown */}
              {showInternalPosts && (
                <div className="border border-purple-200 rounded-lg p-2 bg-purple-50/40 space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="relative">
                    <input
                      type="text"
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                      placeholder="Cari postingan..."
                      className="w-full pl-7 pr-2 py-1 text-[11px] bg-white rounded-md border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                    <Search className="w-3 h-3 text-purple-400 absolute left-2 top-1.5" />
                  </div>

                  <div className="space-y-1 pt-1">
                    {filteredInternalPosts.length > 0 ? (
                      filteredInternalPosts.map((art) => (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() => handleSelectInternalPost(art)}
                          className="w-full text-left p-1.5 rounded-md hover:bg-purple-100/70 transition-colors text-xs text-slate-800 flex items-start gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1 font-medium">{art.title}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 text-center py-2">
                        Tidak ada postingan yang sesuai
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Floating Emoticon Picker Popover */}
          {showEmojiPicker && (
            <div data-popover-area="true" className="absolute top-12 left-2 sm:left-48 z-40 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-w-[280px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1 px-1">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-blue-600" />
                  <span>Emoticon</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto p-1">
                {EMOJI_LIST.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertEmoji(emoji)}
                    className="p-1.5 text-base hover:bg-slate-100 active:bg-blue-100 rounded-lg transition-transform hover:scale-125 cursor-pointer flex items-center justify-center select-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editor Body */}
          {editorMode === 'wysiwyg' ? (
            <div
              ref={editorRef}
              contentEditable
              onBeforeInput={handleBeforeInput}
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              onKeyUp={() => {
                saveSelection();
                updateActiveFormats();
              }}
              onMouseUp={() => {
                saveSelection();
                updateActiveFormats();
              }}
              onClick={(e) => {
                saveSelection();
                updateActiveFormats();
                handleEditorClick(e);
              }}
              className="w-full p-4 min-h-[220px] text-sm font-sans text-slate-800 leading-relaxed focus:outline-none bg-white font-normal [&_p]:my-2 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-3 [&_h3]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-600 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:bg-blue-50/60 [&_blockquote]:rounded-r-xl [&_blockquote]:text-slate-700 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_a]:font-medium [&_u]:decoration-current [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-0.5 [&_iframe]:pointer-events-none"
              style={{ minHeight: `${minRows * 24}px` }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              rows={minRows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 text-sm font-mono text-slate-100 leading-relaxed border-0 focus:outline-none focus:ring-0 bg-slate-900 resize-y"
            />
          )}

          {/* Floating Action Overlay for Selected Image or Video Embed */}
          {selectedEmbedNode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3.5 shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <span className="text-xs font-bold text-slate-300 select-none flex items-center gap-1.5">
                {selectedEmbedType === 'video' ? '📺 Video Terpilih' : '🖼️ Gambar Terpilih'}
              </span>
              <div className="h-4 w-[1px] bg-slate-700" />
              <button
                type="button"
                onClick={handleEditSelectedEmbed}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                title="Ubah detail / layout media ini"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Ubah / Edit</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedEmbed}
                className="text-xs font-bold text-red-400 hover:text-red-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                title="Hapus media ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEmbedNode(null);
                  setSelectedEmbedType(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
                title="Batal Pilih"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      {/* Modal Sisipkan Gambar & Susunan Layout (Minimalist without tips) */}
      {showImageModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Sisipkan Gambar ke Teks Postingan
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseImageModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Layout Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Layout
              </label>
              
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLayoutCount(1)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    layoutCount === 1
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-6 border-2 border-dashed border-current rounded flex items-center justify-center">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span className="text-xs">1 Kolom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutCount(2)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    layoutCount === 2
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-6 border-2 border-dashed border-current rounded flex items-center justify-center gap-1 px-1">
                    <div className="flex-1 h-3.5 bg-current opacity-30 rounded-xs" />
                    <div className="flex-1 h-3.5 bg-current opacity-30 rounded-xs" />
                  </div>
                  <span className="text-xs">2 Kolom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutCount(3)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    layoutCount === 3
                      ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-600/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-6 border-2 border-dashed border-current rounded flex items-center justify-center gap-0.5 px-0.5">
                    <div className="flex-1 h-3.5 bg-current opacity-30 rounded-xs" />
                    <div className="flex-1 h-3.5 bg-current opacity-30 rounded-xs" />
                    <div className="flex-1 h-3.5 bg-current opacity-30 rounded-xs" />
                  </div>
                  <span className="text-xs">3 Kolom</span>
                </button>
              </div>
            </div>

            {/* 2. Image Upload Slots (1, 2, or 3 corresponding columns) */}
            <div className="space-y-4 pt-1">
              <div
                className={`grid gap-3.5 ${
                  layoutCount === 1
                    ? 'grid-cols-1'
                    : layoutCount === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {Array.from({ length: layoutCount }).map((_, idx) => {
                  const slot = slots[idx] || { url: '', caption: '' };
                  const hasImage = !!(slot.url && slot.url.trim().length > 5);

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {hasImage ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white aspect-4/3 flex items-center justify-center">
                            <img
                              src={convertGoogleDriveUrl(slot.url)}
                              alt={`Slot ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateSlot(idx, '', slot.caption)}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Ganti Foto</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ImageUploadButton
                            label={`Pilih / Unggah Foto ${idx + 1}`}
                            value=""
                            onChange={(newUrl) => {
                              if (newUrl) {
                                handleUpdateSlot(idx, newUrl, slot.caption);
                              }
                            }}
                            preset="post"
                            aspectRatio="wide"
                            placeholder="Tempel tautan foto..."
                          />
                        )}
                      </div>

                      {/* Individual Optional Caption */}
                      <div className="space-y-1 pt-2 border-t border-slate-200/80">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Keterangan Foto {idx + 1} (Opsional)
                        </label>
                        <input
                          type="text"
                          value={slot.caption}
                          onChange={(e) => handleUpdateSlot(idx, slot.url, e.target.value)}
                          placeholder={`Contoh: Dokumentasi foto ${idx + 1}...`}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={handleCloseImageModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmInsertImage}
                disabled={!slots.slice(0, layoutCount).some((s) => s.url && s.url.trim().length > 5)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Sisipkan Foto ke Dalam Teks</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Sisipkan Video / Embed Link */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Sisipkan Video & Media Embed
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowEmbedModal(false);
                  setEmbedInputUrl('');
                  setEmbedInputTitle('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tautan Video / Kode Iframe
                </label>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  Tempel tautan video YouTube (contoh: <code>https://www.youtube.com/watch?v=...</code> atau <code>https://youtu.be/...</code>) atau kode HTML iframe dari penyedia media.
                </p>
                <textarea
                  value={embedInputUrl}
                  onChange={(e) => setEmbedInputUrl(e.target.value)}
                  placeholder="Tempel tautan YouTube atau kode iframe di sini..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Keterangan / Judul Video (Opsional)
                </label>
                <input
                  type="text"
                  value={embedInputTitle}
                  onChange={(e) => setEmbedInputTitle(e.target.value)}
                  placeholder="Contoh: Video profil sekolah terbaru..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEmbedModal(false);
                  setEmbedInputUrl('');
                  setEmbedInputTitle('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmInsertEmbed}
                disabled={!embedInputUrl.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Sisipkan Video</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
