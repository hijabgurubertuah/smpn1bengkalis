import React, { useState } from 'react';
import { NewsArticle } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  BookmarkCheck,
  Search,
  FileText,
  Calendar,
  User,
  Image as ImageIcon,
  Eye,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  Code2,
  Link as LinkIcon,
  Globe,
  Sparkles,
  Maximize2,
  HardDrive,
  CloudUpload,
  Pin,
  Clipboard,
  ArrowLeft,
} from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { RichTextEditorWithImages } from '../common/RichTextEditorWithImages';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';
import { parseEmbedUrl } from '../../lib/embedHelper';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';

const getTodayDateIndo = (): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
};

const DEFAULT_CATEGORIES = [
  'Prestasi',
  'Pengumuman',
  'Kegiatan',
  'Akademik',
  'Ekstrakurikuler',
  'Alumni',
];

interface AdminPostsTabProps {
  articles: NewsArticle[];
  categories?: string[];
  onSaveArticle: (article: NewsArticle) => Promise<void>;
  onSaveArticleLocally?: (article: NewsArticle) => Promise<void>;
  onDeleteArticle: (articleId: string) => Promise<void>;
  onUpdateCategories?: (categories: string[]) => void;
}

export const AdminPostsTab: React.FC<AdminPostsTabProps> = ({
  articles,
  categories,
  onSaveArticle,
  onSaveArticleLocally,
  onDeleteArticle,
  onUpdateCategories,
}) => {
  const activeCategories =
    categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'drafts' | 'cloud'>('all');
  const [mainPostTab, setMainPostTab] = useState<'list' | 'write'>('write');
  const [isEditing, setIsEditing] = useState(true);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [postEditorTab, setPostEditorTab] = useState<'content' | 'embed'>('content');

  // Category Management Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(() => activeCategories[0] || 'Prestasi');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('Humas Instansi');
  const [date, setDate] = useState(() => getTodayDateIndo());
  const [isPinned, setIsPinned] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [saving, setSaving] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Embed states
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [actionLinkLabel, setActionLinkLabel] = useState('');
  const [actionLinkUrl, setActionLinkUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedTitle, setEmbedTitle] = useState('');
  const [embedSourceType, setEmbedSourceType] = useState<'url' | 'iframe'>('url');
  const [rawIframeInput, setRawIframeInput] = useState('');
  const [showEmbedPreview, setShowEmbedPreview] = useState(true);

  // Delete modal states
  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lock body scroll when modal is open
  useBodyScrollLock(!!articleToDelete || isCategoryModalOpen);

  const [feedbackToast, setFeedbackToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // --- CATEGORY MANAGEMENT HANDLERS ---
  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (activeCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setFeedbackToast({
        type: 'error',
        message: `Kategori "${trimmed}" sudah ada.`,
      });
      setTimeout(() => setFeedbackToast(null), 2500);
      return;
    }
    const updated = [...activeCategories, trimmed];
    if (onUpdateCategories) {
      onUpdateCategories(updated);
    }
    setNewCategoryInput('');
    setCategory(trimmed);
    setFeedbackToast({
      type: 'success',
      message: `Kategori "${trimmed}" berhasil ditambahkan.`,
    });
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleStartEditCategory = (index: number) => {
    setEditingCatIndex(index);
    setEditingCatValue(activeCategories[index]);
  };

  const handleSaveEditCategory = (index: number) => {
    const trimmed = editingCatValue.trim();
    if (!trimmed) return;
    const oldName = activeCategories[index];
    const updated = [...activeCategories];
    updated[index] = trimmed;

    if (onUpdateCategories) {
      onUpdateCategories(updated);
    }

    // Automatically update existing articles matching old category name
    articles.forEach((art) => {
      if (art.category === oldName) {
        onSaveArticle({ ...art, category: trimmed });
      }
    });

    if (category === oldName) {
      setCategory(trimmed);
    }

    setEditingCatIndex(null);
    setEditingCatValue('');
    setFeedbackToast({
      type: 'success',
      message: `Kategori "${oldName}" berhasil diubah menjadi "${trimmed}".`,
    });
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleDeleteCategory = (index: number) => {
    if (activeCategories.length <= 1) {
      setFeedbackToast({
        type: 'error',
        message: 'Minimal harus ada 1 kategori berita.',
      });
      setTimeout(() => setFeedbackToast(null), 2500);
      return;
    }
    const catToRemove = activeCategories[index];
    const updated = activeCategories.filter((_, i) => i !== index);
    if (onUpdateCategories) {
      onUpdateCategories(updated);
    }
    if (category === catToRemove) {
      setCategory(updated[0] || 'Umum');
    }
    setFeedbackToast({
      type: 'success',
      message: `Kategori "${catToRemove}" dihapus.`,
    });
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleIframeInputChange = (rawHtml: string) => {
    setRawIframeInput(rawHtml);
    const iframeMatch = rawHtml.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch && iframeMatch[1]) {
      setEmbedUrl(iframeMatch[1]);
    } else if (rawHtml.trim().startsWith('http://') || rawHtml.trim().startsWith('https://')) {
      setEmbedUrl(rawHtml.trim());
    } else {
      setEmbedUrl(rawHtml.trim());
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory(activeCategories[0] || 'Prestasi');
    setSummary('');
    setContent('');
    setCoverImage('');
    setAuthor('Humas Instansi');
    setDate(getTodayDateIndo());
    setIsPinned(false);
    setStatus('published');
    setGalleryImages([]);
    setActionLinkLabel('');
    setActionLinkUrl('');
    setEmbedUrl('');
    setEmbedTitle('');
    setEmbedSourceType('url');
    setRawIframeInput('');
    setShowEmbedPreview(true);
    setEditingArticleId(null);
    setIsEditing(false);
    setPostEditorTab('content');
    setFormError(null);
    setMainPostTab('list');
  };

  const handleStartCreate = () => {
    resetForm();
    setIsEditing(true);
    setMainPostTab('write');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  };

  const handleStartEdit = (art: NewsArticle) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setCategory(art.category);
    setSummary(art.summary);
    setContent(art.content);
    setCoverImage(art.coverImage);
    setAuthor(art.author);
    setDate(art.date || getTodayDateIndo());
    setIsPinned(art.isPinned);
    setStatus(art.status || 'published');
    setGalleryImages(art.galleryImages || []);
    setActionLinkLabel(art.actionLink?.label || '');
    setActionLinkUrl(art.actionLink?.url || '');
    setEmbedUrl(art.embedUrl || '');
    setEmbedTitle(art.embedTitle || '');
    if (art.embedUrl && art.embedUrl.includes('<iframe')) {
      setEmbedSourceType('iframe');
      setRawIframeInput(art.embedUrl);
    } else {
      setEmbedSourceType('url');
      setRawIframeInput('');
    }
    setShowEmbedPreview(Boolean(art.embedUrl));
    setPostEditorTab(art.embedUrl ? 'embed' : 'content');
    setFormError(null);
    setIsEditing(true);
    setMainPostTab('write');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 80);
  };

  // Helper to sanitize article content before saving to local or cloud storage
  const sanitizeArticleContent = (raw: string): string => {
    if (!raw) return '';
    let cleaned = raw;
    if (cleaned.includes('&lt;') && cleaned.includes('&gt;')) {
      cleaned = cleaned
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
    }
    // Extract [img] from <p>[img...]</p>
    cleaned = cleaned.replace(/<p[^>]*>\s*(\[img\b[^\]]*\])\s*<\/p>/gi, '\n$1\n');
    // Strip empty paragraphs with br or nbsp
    cleaned = cleaned.replace(/<p[^>]*>\s*(<br\s*\/?>|&nbsp;|\s*)*<\/p>/gi, '');
    return cleaned.trim();
  };

  // Save to Local Draft only (0 Firebase write operations)
  const handleSaveLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Judul berita tidak boleh kosong.');
      return;
    }
    const cleanContentText = sanitizeArticleContent(content);
    if (!cleanContentText && !embedUrl.trim()) {
      setFormError('Konten lengkap berita atau URL embed tidak boleh kosong.');
      return;
    }

    setFormError(null);
    setSavingLocal(true);
    const generatedSummary =
      summary.trim().replace(/<[^>]*>/g, '') ||
      cleanContentText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

    const localArticle: NewsArticle = {
      id: editingArticleId || `news-${Date.now()}`,
      title: title.trim(),
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      category,
      summary: generatedSummary,
      content: cleanContentText || '<p>Silakan akses aplikasi interaktif di bawah ini.</p>',
      coverImage:
        coverImage.trim() ||
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
      author: author.trim() || 'Humas Instansi',
      date: date.trim() || getTodayDateIndo(),
      isPinned,
      views: editingArticleId ? articles.find((a) => a.id === editingArticleId)?.views || 10 : 1,
      status: 'draft',
      galleryImages: galleryImages.filter(Boolean),
      actionLink: actionLinkUrl.trim()
        ? {
            label: actionLinkLabel.trim() || 'Kunjungi Tautan Terkait',
            url: actionLinkUrl.trim(),
          }
        : undefined,
      embedUrl: embedUrl.trim() || undefined,
      embedTitle: embedTitle.trim() || undefined,
      isLocalDraft: true,
    };

    try {
      if (onSaveArticleLocally) {
        await onSaveArticleLocally(localArticle);
      } else {
        await onSaveArticle(localArticle);
      }
      resetForm();
      setFeedbackToast({
        type: 'success',
        message: 'Draft berhasil disimpan.',
      });
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal menyimpan draft: ' + String(err),
      });
    } finally {
      setSavingLocal(false);
    }
  };

  // Save and Upload directly to Cloud Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Judul berita tidak boleh kosong.');
      return;
    }
    const cleanContentText = sanitizeArticleContent(content);
    if (!cleanContentText && !embedUrl.trim()) {
      setFormError('Konten lengkap berita atau URL embed tidak boleh kosong.');
      return;
    }

    setFormError(null);
    setSaving(true);
    const generatedSummary =
      summary.trim().replace(/<[^>]*>/g, '') ||
      cleanContentText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

    const newArticle: NewsArticle = {
      id: editingArticleId || `news-${Date.now()}`,
      title: title.trim(),
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      category,
      summary: generatedSummary,
      content: cleanContentText || '<p>Silakan akses aplikasi interaktif di bawah ini.</p>',
      coverImage:
        coverImage.trim() ||
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
      author: author.trim() || 'Humas Instansi',
      date: date.trim() || getTodayDateIndo(),
      isPinned,
      views: editingArticleId ? articles.find((a) => a.id === editingArticleId)?.views || 10 : 1,
      status: 'published',
      galleryImages: galleryImages.filter(Boolean),
      actionLink: actionLinkUrl.trim()
        ? {
            label: actionLinkLabel.trim() || 'Kunjungi Tautan Terkait',
            url: actionLinkUrl.trim(),
          }
        : undefined,
      embedUrl: embedUrl.trim() || undefined,
      embedTitle: embedTitle.trim() || undefined,
      isLocalDraft: false,
    };

    await onSaveArticle(newArticle);
    setSaving(false);
    resetForm();
    setFeedbackToast({
      type: 'success',
      message: 'Postingan berhasil dipublikasikan.',
    });
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Quick 1-click upload from table for any local draft
  const handleQuickUploadToCloud = async (art: NewsArticle) => {
    setSaving(true);
    try {
      await onSaveArticle({
        ...art,
        isLocalDraft: false,
      });
      setFeedbackToast({
        type: 'success',
        message: 'Draf diunggah',
      });
      setTimeout(() => setFeedbackToast(null), 1000);
    } catch (err) {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal unggah',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!articleToDelete) return;
    setDeleting(true);
    try {
      await onDeleteArticle(articleToDelete.id);
      if (editingArticleId === articleToDelete.id) {
        resetForm();
      }
      setFeedbackToast({
        type: 'success',
        message: 'Berita dihapus',
      });
      setTimeout(() => setFeedbackToast(null), 1000);
    } catch (err) {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal hapus',
      });
    } finally {
      setDeleting(false);
      setArticleToDelete(null);
    }
  };

  const handleTogglePin = async (art: NewsArticle) => {
    // If currently NOT pinned, check how many are already pinned (max 4)
    if (!art.isPinned) {
      const currentlyPinned = articles.filter((a) => Boolean(a.isPinned));
      if (currentlyPinned.length >= 4) {
        setFeedbackToast({
          type: 'error',
          message: 'Maksimal 4 postingan yang dapat disematkan (pin). Lepas pin dari postingan lain terlebih dahulu.',
        });
        setTimeout(() => setFeedbackToast(null), 4000);
        return;
      }
    }

    try {
      await onSaveArticle({
        ...art,
        isPinned: !art.isPinned,
      });
      setFeedbackToast({
        type: 'success',
        message: !art.isPinned ? 'Berita berhasil disematkan (Pin)' : 'Pin berita dilepas',
      });
      setTimeout(() => setFeedbackToast(null), 2000);
    } catch {
      setFeedbackToast({
        type: 'error',
        message: 'Gagal mengubah status pin berita.',
      });
      setTimeout(() => setFeedbackToast(null), 3000);
    }
  };

  const localDrafts = articles.filter((a) => Boolean(a.isLocalDraft));
  const cloudArticles = articles.filter((a) => !a.isLocalDraft);

  const filtered = articles
    .filter((a) => {
      if (filterTab === 'drafts') return Boolean(a.isLocalDraft);
      if (filterTab === 'cloud') return !a.isLocalDraft;
      return true;
    })
    .filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase()) ||
        a.author.toLowerCase().includes(search.toLowerCase())
    );

  const currentEditingArt = editingArticleId ? articles.find((a) => a.id === editingArticleId) : null;
  const isCurrentDraftLocal = currentEditingArt ? Boolean(currentEditingArt.isLocalDraft) : false;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Feedback Toast Notification */}
      {feedbackToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="p-1 hover:bg-black/5 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Primary Sub-Tabs: Tulis Berita Baru vs Daftar Berita */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => {
              if (!isEditing) {
                handleStartCreate();
              } else {
                setMainPostTab('write');
              }
            }}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mainPostTab === 'write'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {editingArticleId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingArticleId ? 'Edit Berita' : 'Tulis Berita Baru'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMainPostTab('list')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              mainPostTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Daftar Berita</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                mainPostTab === 'list' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {articles.length}
            </span>
          </button>
        </div>

        {mainPostTab === 'list' && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Berita Baru</span>
          </button>
        )}
      </div>

      {/* Editor Tab / Form */}
      {mainPostTab === 'write' && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200 max-w-md">
            <button
              type="button"
              onClick={() => setPostEditorTab('content')}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                postEditorTab === 'content'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className={`w-4 h-4 ${postEditorTab === 'content' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Konten Berita</span>
            </button>

            <button
              type="button"
              onClick={() => setPostEditorTab('embed')}
              className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                postEditorTab === 'embed'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Code2 className={`w-4 h-4 ${postEditorTab === 'embed' ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>Embed</span>
              {embedUrl.trim() && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Aktif
                </span>
              )}
            </button>
          </div>

          {formError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* TAB 1: STANDARD POST */}
            {postEditorTab === 'content' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Judul Berita *
                  </label>
                  <AutoResizeTextarea
                    minRows={1}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan judul berita yang jelas dan menarik..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Kategori Berita
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Kelola Kategori</span>
                      </button>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    >
                      {activeCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Tanggal Publikasi
                    </label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder={getTodayDateIndo()}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Cover Image Upload / Google Drive Converter */}
                <div className="space-y-2">
                  <ImageUploadButton
                    label="Cover Image"
                    value={coverImage}
                    onChange={(url) => setCoverImage(url)}
                    preset="post"
                    aspectRatio="wide"
                    placeholder="https://... atau tempel link Google Drive"
                    allowDriveConverter={true}
                  />
                </div>

                {/* Full Content with Formatting & Drive Image Inserter */}
                <RichTextEditorWithImages
                  value={content}
                  onChange={setContent}
                  label="Isi Postingan"
                  placeholder="Tuliskan berita lengkap di sini..."
                  minRows={10}
                  articles={articles}
                />
              </div>
            )}

            {/* TAB 2: INTERACTIVE EMBED & GOOGLE APPS SCRIPT */}
            {postEditorTab === 'embed' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Judul Postingan / Halaman Embed *
                  </label>
                  <AutoResizeTextarea
                    minRows={1}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Aplikasi Kelulusan Siswa / Formulir PPDB / Sistem Informasi..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none font-semibold bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Kategori Berita
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Kelola Kategori</span>
                      </button>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white font-medium"
                    >
                      {activeCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Tanggal
                    </label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder={getTodayDateIndo()}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                  {/* Top Sub-tabs (Url vs Kode Iframe) & Delete Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Embed Sub-Tabs: URL vs Kode Iframe */}
                    <div className="flex bg-white p-1 rounded-xl border border-purple-200 gap-1 w-full sm:w-64 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setEmbedSourceType('url')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          embedSourceType === 'url'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Url</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmbedSourceType('iframe')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          embedSourceType === 'iframe'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Kode Iframe</span>
                      </button>
                    </div>

                    {embedUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmbedUrl('');
                          setEmbedTitle('');
                          setRawIframeInput('');
                        }}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Embed</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Label / Nama Embed:
                      </label>
                      <input
                        type="text"
                        value={embedTitle}
                        onChange={(e) => setEmbedTitle(e.target.value)}
                        placeholder="Contoh: Aplikasi Kelulusan"
                        className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      {embedSourceType === 'url' ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Url
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={embedUrl}
                              onChange={(e) => setEmbedUrl(e.target.value)}
                              placeholder="https://script.google.com/macros/s/.../exec atau https://youtube.com/..."
                              className="flex-1 px-3 py-2 text-xs bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const text = await navigator.clipboard.readText();
                                  if (text) setEmbedUrl(text.trim());
                                } catch (err) {
                                  console.error('Gagal membaca clipboard:', err);
                                }
                              }}
                              className="p-2 bg-white hover:bg-purple-50 active:bg-purple-100 border border-slate-300 text-slate-700 hover:text-purple-700 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center justify-center"
                              title="Tempel dari Clipboard"
                              aria-label="Tempel dari Clipboard"
                            >
                              <Clipboard className="w-4 h-4 text-purple-600" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Kode Iframe
                          </label>
                          <div className="flex items-start gap-2">
                            <textarea
                              rows={2}
                              value={rawIframeInput || (embedUrl.includes('<iframe') ? embedUrl : '')}
                              onChange={(e) => handleIframeInputChange(e.target.value)}
                              placeholder='<iframe src="https://..." width="100%" height="600"></iframe>'
                              className="flex-1 px-3 py-2 text-xs bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const text = await navigator.clipboard.readText();
                                  if (text) handleIframeInputChange(text.trim());
                                } catch (err) {
                                  console.error('Gagal membaca clipboard:', err);
                                }
                              }}
                              className="p-2 bg-white hover:bg-purple-50 active:bg-purple-100 border border-slate-300 text-slate-700 hover:text-purple-700 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center justify-center mt-0.5"
                              title="Tempel dari Clipboard"
                              aria-label="Tempel dari Clipboard"
                            >
                              <Clipboard className="w-4 h-4 text-purple-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Format supported */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold">Format didukung:</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
                      Google Apps Script (/exec)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-medium">
                      YouTube Video / Shorts
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                      Google Forms / Docs / Sheets
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-medium">
                      Kode &lt;iframe&gt; HTML
                    </span>
                  </div>

                  {/* Live Embed Preview */}
                  {embedUrl && (
                    <div className="mt-3 border border-purple-200 rounded-xl bg-white overflow-hidden shadow-xs">
                      {(() => {
                        const parsed = parseEmbedUrl(embedUrl);
                        if (!parsed) return <div className="p-3 text-xs text-red-600">Format URL tidak valid.</div>;

                        return (
                          <div>
                            <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {embedTitle || parsed.label}
                              </span>
                              <a
                                href={parsed.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                              >
                                <span>Uji Buka di Tab Baru</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="h-80 w-full bg-slate-100">
                              <iframe
                                src={parsed.embedUrl}
                                title="Pratinjau Embed Admin"
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Optional Cover & Intro for Embed Post */}
                <div className="space-y-3 pt-2">
                  <ImageUploadButton
                    label="Cover Image (Opsional)"
                    value={coverImage}
                    onChange={(url) => setCoverImage(url)}
                    preset="post"
                    aspectRatio="wide"
                    placeholder="https://... atau tempel link Google Drive"
                    allowDriveConverter={true}
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Teks Pengantar
                    </label>
                    <RichTextEditorWithImages
                      value={content}
                      onChange={setContent}
                      placeholder="Tuliskan teks pengantar atau informasi panduan penggunaan..."
                      minRows={4}
                      articles={articles}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Simpan Draft & Publikasi (Sejajar) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {editingArticleId ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentArt = articles.find((a) => a.id === editingArticleId);
                    if (currentArt) setArticleToDelete(currentArt);
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Berita Ini</span>
                </button>
              ) : (
                <div />
              )}

              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveLocal}
                  disabled={saving || savingLocal}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs w-full"
                  title="Simpan sebagai draft di perangkat ini"
                >
                  <HardDrive className={`w-4 h-4 text-amber-700 ${savingLocal ? 'animate-pulse' : ''}`} />
                  <span>{savingLocal ? 'Menyimpan...' : 'Simpan Draft'}</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || savingLocal}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                  title="Publikasikan postingan"
                >
                  <CloudUpload className={`w-4 h-4 ${saving ? 'animate-bounce' : ''}`} />
                  <span>{saving ? 'Mempublikasikan...' : 'Publikasi'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 1: DAFTAR BERITA */}
      {mainPostTab === 'list' && (
        <div className="space-y-4">
          {/* Articles Table & Search */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Daftar Berita ({articles.length})
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterTab === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({articles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('drafts')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterTab === 'drafts'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Draf Lokal</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        filterTab === 'drafts'
                          ? 'bg-amber-950/20 text-amber-950'
                          : localDrafts.length > 0
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {localDrafts.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('cloud')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterTab === 'cloud'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Cloud ({cloudArticles.length})</span>
                  </button>
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berita..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3">Berita</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Status Simpan</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada berita ditemukan. Klik &quot;Tulis Berita Baru&quot; untuk membuat berita baru.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <img
                                src={art.coverImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 line-clamp-1 text-sm">{art.title}</p>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                {art.summary || art.content?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)}
                              </p>
                              
                              {/* Tags for multi-image, embed, link */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {art.galleryImages && art.galleryImages.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                    <ImageIcon className="w-2.5 h-2.5 text-blue-600" />
                                    {art.galleryImages.length} Foto
                                  </span>
                                )}
                                {art.embedUrl && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                    <Code2 className="w-2.5 h-2.5 text-purple-600" />
                                    Embed
                                  </span>
                                )}
                                {art.actionLink?.url && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                    <LinkIcon className="w-2.5 h-2.5 text-blue-600" />
                                    Link
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700">
                            {art.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-500 text-xs whitespace-nowrap">
                          {art.date}
                        </td>

                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ${
                                  art.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              <span className="text-xs font-medium text-slate-700 capitalize">
                                {art.status}
                              </span>
                            </div>
                            {art.isLocalDraft ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <HardDrive className="w-2.5 h-2.5 text-amber-600" />
                                Draf Lokal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Cloud
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 sm:gap-1.5">
                            {art.isLocalDraft && (
                              <button
                                type="button"
                                onClick={() => handleQuickUploadToCloud(art)}
                                disabled={saving}
                                title="Unggah draf lokal ini ke Firebase Cloud sekarang"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-2.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer mr-1 disabled:opacity-50"
                              >
                                <CloudUpload className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">Unggah Cloud</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleTogglePin(art)}
                              title={art.isPinned ? 'Lepas Pin' : 'Pasang Pin Unggulan'}
                              className={`p-3 sm:p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
                                art.isPinned
                                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                  : 'text-slate-400 hover:text-slate-700'
                              }`}
                            >
                              <BookmarkCheck className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEdit(art)}
                              title="Edit Berita"
                              className="p-3 sm:p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                            >
                              <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setArticleToDelete(art)}
                              title="Hapus Berita"
                              className="p-3 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
                            >
                              <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* In-UI Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain touch-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overscroll-contain space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Postingan Berita?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus postingan berita ini? Data akan dihapus secara permanen dari browser lokal dan cloud Firebase.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <p className="font-bold text-slate-900 text-xs line-clamp-2">{articleToDelete.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-blue-600">{articleToDelete.category}</span>
                <span>•</span>
                <span>{articleToDelete.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain touch-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kelola Kategori Berita</h3>
                  <p className="text-xs text-slate-500">Tambah, ubah nama, atau hapus kategori</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatIndex(null);
                  setNewCategoryInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              />
              <button
                type="submit"
                disabled={!newCategoryInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </form>

            {/* Daftar Kategori */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Daftar Kategori ({activeCategories.length})
              </label>
              <div className="space-y-1.5">
                {activeCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                  >
                    {editingCatIndex === idx ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingCatValue}
                          onChange={(e) => setEditingCatValue(e.target.value)}
                          className="flex-1 px-3 py-1 rounded-lg border border-blue-500 text-xs font-bold focus:outline-none bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(idx)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatIndex(null)}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-800">{cat}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(idx)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit nama kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(idx)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Hapus kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCatIndex(null);
                  setNewCategoryInput('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
