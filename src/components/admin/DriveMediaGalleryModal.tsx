import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CloudUpload,
  RefreshCw,
  Search,
  Check,
  X,
  Copy,
  Trash2,
  Eye,
  ArrowUpDown,
  FileImage,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  DriveMediaItem,
  getStoredDriveMedia,
  syncDriveMediaFiles,
  subscribeDriveMedia,
  removeStoredDriveMedia,
  recordUploadedDriveMedia,
} from '../../lib/driveMediaStorage';
import {
  uploadFileViaAppsScript,
  getStoredAppsScriptConfig,
  SAMPLE_APPS_SCRIPT_CODE,
} from '../../lib/googleAppsScript';
import { formatFileSize } from '../../lib/imageOptimizer';

const MOBILE_ITEMS_PER_PAGE = 40;
const DESKTOP_ITEMS_PER_PAGE = 100;

interface DriveMediaGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item: DriveMediaItem, allSelected?: DriveMediaItem[]) => void;
  onSelectMultiple?: (urls: string[], items: DriveMediaItem[]) => void;
  currentValue?: string;
  title?: string;
}

export const DriveMediaGalleryModal: React.FC<DriveMediaGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  currentValue = '',
}) => {
  const [items, setItems] = useState<DriveMediaItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size' | 'name'>('newest');

  // Deteksi Tampilan Desktop (layar lebar >= 1024px)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tampilan kolom Mobile: 2 | 3 | 4
  const [mobileCols, setMobileCols] = useState<2 | 3 | 4>(() => {
    try {
      const saved =
        localStorage.getItem('drive_media_grid_cols_mobile') ||
        localStorage.getItem('drive_media_grid_cols');
      if (saved === '2' || saved === '3' || saved === '4') {
        return parseInt(saved, 10) as 2 | 3 | 4;
      }
    } catch {}
    return 3;
  });

  // Tampilan kolom Desktop: 4 | 6 | 8 | 10 (Default: 10 kolom ke samping seperti permintaan user)
  const [desktopCols, setDesktopCols] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('drive_media_grid_cols_desktop');
      if (saved && [4, 6, 8, 10].includes(parseInt(saved, 10))) {
        return parseInt(saved, 10);
      }
    } catch {}
    return 10;
  });

  const effectiveGridCols = isDesktop ? desktopCols : mobileCols;

  // Ordered multiple selection: first long-pressed is #1, next clicked is #2, #3, etc.
  const [selectedItems, setSelectedItems] = useState<DriveMediaItem[]>([]);
  const [previewItem, setPreviewItem] = useState<DriveMediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  const handleCopyAppsScript = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(SAMPLE_APPS_SCRIPT_CODE);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = SAMPLE_APPS_SCRIPT_CODE;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // Pagination & Swipe: Desktop 100 gambar, Mobile 40 gambar
  const itemsPerPage = isDesktop ? DESKTOP_ITEMS_PER_PAGE : MOBILE_ITEMS_PER_PAGE;
  const [currentPage, setCurrentPage] = useState(1);

  // Direct Upload within modal
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Long press refs
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Swipe touch & mouse drag refs
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const mouseDragStartXRef = useRef<number | null>(null);
  const mouseDragStartYRef = useRef<number | null>(null);
  const isMouseDraggingRef = useRef(false);

  const handleToggleGridCols = () => {
    if (isDesktop) {
      const desktopOptions = [4, 6, 8, 10];
      const currIdx = desktopOptions.indexOf(desktopCols);
      const nextCols = desktopOptions[(currIdx + 1) % desktopOptions.length];
      setDesktopCols(nextCols);
      try {
        localStorage.setItem('drive_media_grid_cols_desktop', nextCols.toString());
      } catch {}
    } else {
      const nextCols: 2 | 3 | 4 = mobileCols === 2 ? 3 : mobileCols === 3 ? 4 : 2;
      setMobileCols(nextCols);
      try {
        localStorage.setItem('drive_media_grid_cols_mobile', nextCols.toString());
        localStorage.setItem('drive_media_grid_cols', nextCols.toString());
      } catch {}
    }
  };

  // Load items on open
  useEffect(() => {
    if (!isOpen) return;

    const initial = getStoredDriveMedia();
    setItems(initial);

    // If currentValue matches an item, select it by default
    if (currentValue) {
      const match = initial.find(
        (i) => i.fileUrl === currentValue || (currentValue.includes(i.fileId) && i.fileId)
      );
      if (match) {
        setSelectedItems([match]);
      }
    } else {
      setSelectedItems([]);
    }

    const unsubscribe = subscribeDriveMedia((newItems) => {
      setItems(newItems);
    });

    handleSync(false);

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentValue]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (previewItem) {
          setPreviewItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewItem, onClose]);

  const handleSync = async (showLoading = true) => {
    if (showLoading) setIsSyncing(true);
    try {
      const synced = await syncDriveMediaFiles();
      setItems(synced);
    } catch (err) {
      console.warn('Sync media error:', err);
    } finally {
      if (showLoading) setIsSyncing(false);
    }
  };

  const handleCopy = async (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleDelete = (item: DriveMediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    removeStoredDriveMedia(item.fileId || item.fileUrl);
    setDeleteConfirmId(null);
    setSelectedItems((prev) =>
      prev.filter((i) => i.fileId !== item.fileId && i.fileUrl !== item.fileUrl)
    );
  };

  // Direct upload inside modal
  const handleUploadFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Pilih file gambar valid.');
      return;
    }

    const currentConfig = getStoredAppsScriptConfig();
    if (!currentConfig || !currentConfig.webAppUrl) {
      setUploadError('Konfigurasi Google Apps Script belum lengkap.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress('Mengunggah...');

    try {
      const result = await uploadFileViaAppsScript(file, {
        webAppUrl: currentConfig.webAppUrl,
        folderId: currentConfig.folderId,
        spreadsheetId: currentConfig.spreadsheetId,
        onProgress: (p) => setUploadProgress(p),
      });

      const newItem = recordUploadedDriveMedia({
        fileId: result.fileId,
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        viewUrl: result.viewUrl,
        size: result.size,
        mimeType: result.mimeType,
        folderName: result.folderName,
        source: 'upload',
      });

      setSelectedItems((prev) => [...prev, newItem]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Gagal: ${msg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
    }
  };

  // Filter & Sort
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.fileName.toLowerCase().includes(q) ||
          (i.folderName && i.folderName.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime();
      }
      if (sortBy === 'size') {
        return (b.size || 0) - (a.size || 0);
      }
      if (sortBy === 'name') {
        return a.fileName.localeCompare(b.fileName);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, sortBy]);

  // Pagination (Desktop: 100 gambar per tampilan; Mobile: 40 gambar per tampilan)
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(start, start + itemsPerPage);
  }, [filteredAndSortedItems, currentPage, itemsPerPage]);

  // Navigasi Keyboard Panah Kiri & Kanan untuk desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalPages]);

  // Swipe detection via Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartXRef.current = e.touches[0].clientX;
    swipeStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartXRef.current === null || swipeStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - swipeStartYRef.current;

    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        // Swipe ke kiri -> Halaman berikutnya (100 gambar di desktop / 40 di HP)
        if (currentPage < totalPages) {
          setCurrentPage((p) => p + 1);
        }
      } else {
        // Swipe ke kanan -> Halaman sebelumnya
        if (currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }
    }

    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
  };

  // Swipe detection via Mouse Drag (Desktop)
  const handleMouseDownSwipe = (e: React.MouseEvent) => {
    if (e.button === 0) {
      mouseDragStartXRef.current = e.clientX;
      mouseDragStartYRef.current = e.clientY;
      isMouseDraggingRef.current = true;
    }
  };

  const handleMouseUpSwipe = (e: React.MouseEvent) => {
    if (!isMouseDraggingRef.current || mouseDragStartXRef.current === null) return;
    const deltaX = e.clientX - mouseDragStartXRef.current;
    const deltaY =
      mouseDragStartYRef.current !== null
        ? Math.abs(e.clientY - mouseDragStartYRef.current)
        : 0;

    isMouseDraggingRef.current = false;
    mouseDragStartXRef.current = null;
    mouseDragStartYRef.current = null;

    if (Math.abs(deltaX) > 75 && Math.abs(deltaX) > deltaY * 1.4) {
      if (deltaX < 0) {
        // Drag ke kiri -> 100 gambar berikutnya
        if (currentPage < totalPages) {
          setCurrentPage((p) => p + 1);
        }
      } else {
        // Drag ke kanan -> 100 gambar sebelumnya
        if (currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }
    }
  };

  // Long press handler: set as image #1
  const startLongPress = (item: DriveMediaItem, clientX: number, clientY: number) => {
    isLongPressTriggeredRef.current = false;
    touchStartPosRef.current = { x: clientX, y: clientY };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {}
      }
      setSelectedItems((prev) => {
        const existingIdx = prev.findIndex(
          (i) => (i.fileId && i.fileId === item.fileId) || i.fileUrl === item.fileUrl
        );
        if (existingIdx !== -1) {
          // Move this item to position #1 (first element)
          const updated = [...prev];
          updated.splice(existingIdx, 1);
          return [item, ...updated];
        }
        // Set this item as #1, putting any other selections after it
        return [item, ...prev];
      });
    }, 420);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const checkMoveCancel = (clientX: number, clientY: number) => {
    if (!touchStartPosRef.current) return;
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelLongPress();
    }
  };

  // Click on item:
  // If clicked after long-press has set #1, subsequent clicks add as #2, #3, etc.
  const handleItemClick = (item: DriveMediaItem) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => (i.fileId && i.fileId === item.fileId) || i.fileUrl === item.fileUrl
      );

      if (existingIdx !== -1) {
        // Toggle off
        return prev.filter((_, idx) => idx !== existingIdx);
      } else {
        // Add to ordered selection (#1, #2, #3, etc.)
        return [...prev, item];
      }
    });
  };

  // Double click chooses single image immediately
  const handleDoubleClick = (item: DriveMediaItem) => {
    onSelect(item.fileUrl, item, [item]);
    if (onSelectMultiple) {
      onSelectMultiple([item.fileUrl], [item]);
    }
    onClose();
  };

  // Final confirmation
  const handleConfirmSelection = () => {
    if (selectedItems.length === 0) return;

    if (selectedItems.length > 1 && onSelectMultiple) {
      onSelectMultiple(
        selectedItems.map((i) => i.fileUrl),
        selectedItems
      );
    } else {
      onSelect(selectedItems[0].fileUrl, selectedItems[0], selectedItems);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[96vw] max-h-[95vh] h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleUploadFile(f);
        }}
      >
        {/* HEADER TOOLBAR: Pencarian, Sort, Pengubah Grid Kotak, Refresh, X dalam satu baris sejajar */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
          {/* Kolom Pencarian */}
          <div className="relative flex-1 min-w-[90px] sm:min-w-[140px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari..."
              className="w-full pl-8 sm:pl-9 pr-6 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Kolom Sort Sejajar */}
          <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-0.5"
              title="Urutkan"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="size">Ukuran</option>
              <option value="name">A-Z</option>
            </select>
          </div>

          {/* Tombol Pengubah Tampilan Grid: Responsif (HP: 2->3->4->2; Desktop: 4->6->8->10->4) */}
          <button
            type="button"
            onClick={handleToggleGridCols}
            className="h-[32px] sm:h-[34px] px-2 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-xl border border-slate-200 flex items-center justify-center gap-1 shrink-0 transition-all cursor-pointer"
            title={
              isDesktop
                ? `Tampilan ${effectiveGridCols} kolom ke samping (${itemsPerPage} gambar). Klik untuk ganti.`
                : `Tampilan ${effectiveGridCols} kolom. Klik untuk ganti.`
            }
          >
            {isDesktop ? (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(effectiveGridCols, 5) }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-3 rounded-xs bg-slate-700 block transition-all"
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-800 font-mono">
                  {effectiveGridCols}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: effectiveGridCols }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-3.5 rounded-xs bg-slate-700 block transition-all"
                  />
                ))}
              </div>
            )}
          </button>

          {/* Tombol Refresh / Sinkronkan */}
          <button
            type="button"
            onClick={() => handleSync(true)}
            disabled={isSyncing}
            className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Sinkronkan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Tombol Kode Apps Script */}
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-xl text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Lihat Kode Google Apps Script (Code.gs)"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-600" />
          </button>

          {/* Tombol X (Tutup) */}
          <button
            type="button"
            onClick={onClose}
            className="w-[32px] sm:w-[34px] h-[32px] sm:h-[34px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DRAG-DROP OVERLAY NOTICE */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-blue-600/90 text-white flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
            <CloudUpload className="w-16 h-16 animate-bounce" />
            <p className="text-base font-bold">Lepaskan file di sini</p>
          </div>
        )}

        {/* UPLOAD STATUS / ERROR BANNER */}
        {isUploading && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs font-bold text-blue-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>{uploadProgress || 'Mengunggah...'}</span>
          </div>
        )}
        {uploadError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SWIPE NAVIGATION SUB-HEADER (Desktop: 100 gambar; Mobile: 40 gambar) */}
        {totalPages > 1 && (
          <div className="px-3 sm:px-4 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 select-none shrink-0">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none font-semibold cursor-pointer text-[11px] sm:text-xs shadow-2xs transition-all active:scale-95"
              title="Lihat halaman sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{isDesktop ? `${itemsPerPage} Sebelumnya` : 'Sebelumnya'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                Halaman {currentPage} / {totalPages}
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                • {filteredAndSortedItems.length} gambar total ({itemsPerPage}/tampilan)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none font-semibold cursor-pointer text-[11px] sm:text-xs shadow-2xs transition-all active:scale-95"
              title="Lihat halaman berikutnya"
            >
              <span>{isDesktop ? `${itemsPerPage} Selanjutnya` : 'Selanjutnya'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* GALLERY WRAPPER (dengan tombol panah melayang yang keren di sisi kiri & kanan) */}
        <div
          className="relative flex-1 flex flex-col min-h-0 overflow-hidden"
          onMouseDown={handleMouseDownSwipe}
          onMouseUp={handleMouseUpSwipe}
        >
          {/* Tombol Panah Kiri Melayang (Desktop) */}
          {totalPages > 1 && currentPage > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 shadow-xl hover:shadow-2xl border border-slate-200/90 backdrop-blur-md items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer group"
              title={`Lihat ${itemsPerPage} gambar sebelumnya (Halaman ${currentPage - 1})`}
              aria-label="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6 -ml-0.5 text-slate-700 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
            </button>
          )}

          {/* Tombol Panah Kanan Melayang (Desktop) */}
          {totalPages > 1 && currentPage < totalPages && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 shadow-xl hover:shadow-2xl border border-slate-200/90 backdrop-blur-md items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer group"
              title={`Lihat ${itemsPerPage} gambar berikutnya (Halaman ${currentPage + 1})`}
              aria-label="Halaman Berikutnya"
            >
              <ChevronRight className="w-6 h-6 -mr-0.5 text-slate-700 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}

          {/* GALLERY GRID SCROLL AREA */}
          <div
            className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 min-h-[280px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {filteredAndSortedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <FileImage className="w-7 h-7 stroke-[1.5]" />
                </div>
                <p className="text-xs text-slate-500">
                  {searchQuery ? 'Tidak ada gambar yang cocok' : 'Belum ada gambar'}
                </p>
              </div>
            ) : (
              <div
                className="grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${effectiveGridCols}, minmax(0, 1fr))`,
                  gap: effectiveGridCols >= 8 ? '6px' : effectiveGridCols >= 6 ? '8px' : '10px',
                }}
              >
                {pagedItems.map((item) => {
                  const selectedIdx = selectedItems.findIndex(
                    (i) => (i.fileId && i.fileId === item.fileId) || i.fileUrl === item.fileUrl
                  );
                  const isSelected = selectedIdx !== -1;
                  const orderNumber = selectedIdx + 1;

                  return (
                    <div
                      key={item.fileId || item.fileUrl}
                      onClick={() => handleItemClick(item)}
                      onDoubleClick={() => handleDoubleClick(item)}
                      onTouchStart={(e) =>
                        startLongPress(item, e.touches[0].clientX, e.touches[0].clientY)
                      }
                      onTouchMove={(e) =>
                        checkMoveCancel(e.touches[0].clientX, e.touches[0].clientY)
                      }
                      onTouchEnd={cancelLongPress}
                      onMouseDown={(e) => startLongPress(item, e.clientX, e.clientY)}
                      onMouseMove={(e) => checkMoveCancel(e.clientX, e.clientY)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`group relative bg-white rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col select-none touch-manipulation ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-600/40 shadow-sm scale-[0.99]'
                          : 'border-slate-200 hover:border-blue-400 hover:shadow-2xs'
                      }`}
                      style={{ WebkitTouchCallout: 'none' }}
                    >
                      {/* THUMBNAIL */}
                      <div
                        className={`relative ${
                          effectiveGridCols >= 8 ? 'aspect-square' : 'aspect-4/3'
                        } bg-slate-100 overflow-hidden flex items-center justify-center pointer-events-none`}
                      >
                        <img
                          src={item.fileUrl}
                          alt={item.fileName}
                          loading="lazy"
                          draggable={false}
                          className="w-full h-full object-cover transition-transform duration-200 pointer-events-none select-none"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />

                        {/* BADGE URUTAN PEMILIHAN (1, 2, 3...) - Minimalis & Jelas */}
                        {isSelected && (
                          <div
                            className={`absolute ${
                              effectiveGridCols >= 8
                                ? 'top-1 left-1 w-5 h-5 text-[10px]'
                                : 'top-1.5 left-1.5 w-6 h-6 sm:w-7 sm:h-7 text-xs sm:text-sm'
                            } rounded-full bg-blue-600 text-white font-black flex items-center justify-center shadow-md ring-2 ring-white z-20 pointer-events-none`}
                          >
                            {orderNumber}
                          </div>
                        )}

                        {/* TOMBOL PREVIEW CEPAT (EYE) & HAPUS PADA HOVER DESKTOP */}
                        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-1 z-10 pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPreviewItem(item);
                            }}
                            className="w-6 h-6 rounded-md bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs cursor-pointer"
                            title="Lihat"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (deleteConfirmId === item.fileId) {
                                handleDelete(item, e);
                              } else {
                                setDeleteConfirmId(item.fileId);
                                setTimeout(() => setDeleteConfirmId(null), 3000);
                              }
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center shadow-xs cursor-pointer ${
                              deleteConfirmId === item.fileId
                                ? 'bg-red-600 text-white'
                                : 'bg-white/90 hover:bg-white text-red-600'
                            }`}
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* METADATA INFO: Minimalis */}
                      <div
                        className={`p-1 ${
                          effectiveGridCols >= 8 ? 'text-[9px]' : 'sm:p-1.5 text-[10px]'
                        } flex items-center justify-between bg-white text-slate-500 pointer-events-none`}
                      >
                        <span className="truncate font-medium text-slate-700 max-w-[80%]">
                          {item.fileName}
                        </span>
                        {isSelected && (
                          <span className="font-bold text-blue-600 shrink-0">#{orderNumber}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER: Minimalis tanpa teks/keterangan panjang, tombol Unggah ke Drive di samping Gunakan Gambar */}
        <div className="px-3 sm:px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          {/* Thumbnails Foto Terpilih (Minimalis, tanpa teks penjelasan) */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[45%] py-0.5">
            {selectedItems.map((item, idx) => (
              <div
                key={item.fileId || item.fileUrl}
                className="relative shrink-0"
                onClick={() => handleItemClick(item)}
              >
                <img
                  src={item.fileUrl}
                  alt=""
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-300 shadow-2xs cursor-pointer"
                />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Tombol Aksi: Batal, Unggah ke Drive, Gunakan Gambar */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 ml-auto shrink-0">
            <input
              ref={modalFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFile(f);
              }}
            />

            {/* Tombol Batal */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 transition-all cursor-pointer"
            >
              Batal
            </button>

            {/* Tombol Unggah ke Drive */}
            <button
              type="button"
              onClick={() => modalFileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Unggah ke Drive"
            >
              {isUploading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Unggah ke Drive</span>
            </button>

            {/* Tombol Gunakan Gambar */}
            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={selectedItems.length === 0}
              className="px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-blue-600/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Gunakan Gambar</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULL PREVIEW LIGHTBOX MODAL */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={previewItem.fileUrl}
              alt={previewItem.fileName}
              className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />

            <div className="mt-4 px-4 py-2 bg-slate-900/90 text-white rounded-xl border border-white/10 flex items-center gap-3 text-xs">
              <span className="font-bold">{previewItem.fileName}</span>
              {previewItem.size && <span>({formatFileSize(previewItem.size)})</span>}
              <button
                type="button"
                onClick={() => handleCopy(previewItem.fileUrl)}
                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer font-bold"
              >
                {copiedUrl === previewItem.fileUrl ? 'Tersalin' : 'Salin URL'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect(previewItem.fileUrl, previewItem, [previewItem]);
                  if (onSelectMultiple) onSelectMultiple([previewItem.fileUrl], [previewItem]);
                  setPreviewItem(null);
                  onClose();
                }}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer font-bold"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Kode Apps Script dari Galeri */}
      {showCodeModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCodeModal(false);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Kode Google Apps Script</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      Code.gs
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Template kode lengkap untuk script.google.com (Mendukung upload &amp; galeri live listFiles)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isCodeCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {isCodeCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua Kode</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-[11px]">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Buka <strong>script.google.com</strong> ➔ Ganti seluruh isi <code>Code.gs</code> ➔ Klik <strong>Deploy</strong> ➔ Pilih <strong>Web App</strong> ➔ Siapa saja (Anyone).
                </span>
              </div>
              <a
                href="https://script.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 shrink-0"
              >
                <span>Buka script.google.com</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-950/90 select-all">
              <pre className="text-[11px] sm:text-xs font-mono text-slate-200 leading-relaxed whitespace-pre font-normal">
                {SAMPLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                {SAMPLE_APPS_SCRIPT_CODE.split('\n').length} baris kode siap pakai
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isCodeCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {isCodeCopied ? 'Tersalin ke Clipboard!' : 'Salin Semua Kode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
