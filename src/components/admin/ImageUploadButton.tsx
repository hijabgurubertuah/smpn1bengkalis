import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  CloudUpload,
  AlertTriangle,
  Zap,
  X,
  Clipboard,
  Image as ImageIcon,
} from 'lucide-react';
import {
  compressAndResizeImage,
  convertGoogleDriveUrl,
  formatFileSize,
  CompressionOptions,
} from '../../lib/imageOptimizer';
import {
  uploadFileViaAppsScript,
  getStoredAppsScriptConfig,
} from '../../lib/googleAppsScript';
import {
  DriveMediaItem,
  getStoredDriveMedia,
  subscribeDriveMedia,
} from '../../lib/driveMediaStorage';
import { DriveMediaGalleryModal } from './DriveMediaGalleryModal';

interface ImageUploadButtonProps {
  label: string;
  value: string;
  onChange: (newUrl: string) => void;
  preset?: 'favicon' | 'logo' | 'avatar' | 'banner' | 'post';
  aspectRatio?: 'square' | 'wide' | 'banner';
  layout?: 'vertical' | 'horizontal' | 'auto';
  placeholder?: string;
  allowDriveConverter?: boolean;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  label,
  value,
  onChange,
  preset = 'banner',
  aspectRatio = 'wide',
  layout = 'auto',
  placeholder = 'Tempel link Google Drive atau URL gambar...',
  allowDriveConverter = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check stored Google Apps Script configuration
  const [gasConfig, setGasConfig] = useState(getStoredAppsScriptConfig());
  const isGasAvailable = Boolean(gasConfig?.webAppUrl && gasConfig?.webAppUrl.trim().length > 15 && gasConfig.enabled !== false);

  // 4 Tabs: 'gas' (Drive), 'gallery' (Galeri Drive), 'local' (WebP), 'url' (Link)
  const [uploadMode, setUploadMode] = useState<'gas' | 'gallery' | 'local' | 'url'>('gas');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Drive Gallery state
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryMedia, setGalleryMedia] = useState<DriveMediaItem[]>([]);

  useEffect(() => {
    const current = getStoredAppsScriptConfig();
    setGasConfig(current);
    if (!current?.webAppUrl) {
      setUploadMode('local');
    }

    // Load stored drive media
    setGalleryMedia(getStoredDriveMedia());
    const unsub = subscribeDriveMedia((items) => {
      setGalleryMedia(items);
    });
    return () => unsub();
  }, []);

  const getPresetOptions = (): CompressionOptions => {
    switch (preset) {
      case 'favicon':
        return { maxWidth: 128, maxHeight: 128, quality: 0.85, format: 'image/png' };
      case 'logo':
        return { maxWidth: 400, maxHeight: 400, quality: 0.85, format: 'image/png' };
      case 'avatar':
        return { maxWidth: 600, maxHeight: 600, quality: 0.82, format: 'image/webp' };
      case 'banner':
        return { maxWidth: 1400, maxHeight: 800, quality: 0.8, format: 'image/webp' };
      case 'post':
      default:
        return { maxWidth: 1200, maxHeight: 800, quality: 0.8, format: 'image/webp' };
    }
  };

  /**
   * Handle Upload via Google Apps Script (Direct to Google Drive)
   */
  const handleGasUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Pilih file gambar yang valid.');
      return;
    }

    const currentConfig = getStoredAppsScriptConfig();
    if (!currentConfig || !currentConfig.webAppUrl) {
      setUploadError(
        'Google Apps Script belum dikonfigurasi. Silakan buka tab "Google Drive & Sheets" di menu Admin untuk memasukkan URL Web App Anda.'
      );
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setSuccessInfo(null);
    setProcessingStatus('Mengunggah ke Google Drive...');

    try {
      const result = await uploadFileViaAppsScript(file, {
        webAppUrl: currentConfig.webAppUrl,
        folderId: currentConfig.folderId,
        spreadsheetId: currentConfig.spreadsheetId,
        onProgress: (status) => setProcessingStatus(status),
      });

      onChange(result.fileUrl);
      setSuccessInfo(`Tersimpan di Google Drive (${formatFileSize(result.size)})`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setUploadError(`Gagal ke Google Drive: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  /**
   * Handle Fast Local WebP Compression
   */
  const handleLocalCompression = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Pilih file gambar yang valid.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    setSuccessInfo(null);
    setProcessingStatus('Mengompresi gambar ke WebP...');

    try {
      const compressed = await compressAndResizeImage(file, getPresetOptions());
      onChange(compressed.dataUrl);
      setSuccessInfo(`Kompresi selesai (${formatFileSize(compressed.compressedSize)})`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setUploadError(`Gagal kompresi: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleProcessFile = (file: File) => {
    if (uploadMode === 'gas') {
      if (isGasAvailable) {
        handleGasUpload(file);
      } else {
        setUploadError(
          'Google Apps Script belum dikonfigurasi. Atur di tab "Google Drive & Sheets", atau gunakan WebP.'
        );
      }
    } else {
      handleLocalCompression(file);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleUrlChange = (newText: string) => {
    if (allowDriveConverter && newText.includes('drive.google.com')) {
      const converted = convertGoogleDriveUrl(newText);
      if (converted !== newText) {
        setSuccessInfo('Tautan Google Drive otomatis dikonversi ke CDN publik.');
        onChange(converted);
        return;
      }
    }
    onChange(newText);
  };

  const isVerticalLayout = layout === 'vertical' || aspectRatio === 'banner';

  const getPreviewClasses = () => {
    if (aspectRatio === 'square') return 'w-20 h-20 rounded-xl';
    if (aspectRatio === 'banner') return 'w-full h-44 sm:h-56 rounded-xl shadow-xs';
    return isVerticalLayout ? 'w-full h-40 sm:h-48 rounded-xl' : 'w-full sm:w-44 h-28 rounded-xl';
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-xs font-bold text-slate-700 uppercase">
        {label}
      </label>

      {/* Main Container */}
      <div className={isVerticalLayout ? "flex flex-col gap-3 items-stretch w-full" : "flex flex-col sm:flex-row gap-3 items-start"}>
        {/* Preview Thumbnail with Top-Right Red X Delete Button */}
        {value && (
          <div className={`relative overflow-hidden border border-slate-200 bg-slate-100 shrink-0 ${getPreviewClasses()}`}>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            
            {/* Red X Button at top-right corner */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuccessInfo(null);
                setUploadError(null);
              }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
              title="Hapus gambar"
              aria-label="Hapus gambar"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex-1 w-full space-y-2">
          {/* 4 Method Tabs: Drive, Galeri, WebP, Link */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setUploadMode('gas')}
              className={`py-1.5 px-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                uploadMode === 'gas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Unggah baru ke Google Drive via Apps Script"
            >
              <Zap className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="truncate">Drive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadMode('gallery');
                setIsGalleryModalOpen(true);
              }}
              className={`py-1.5 px-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                uploadMode === 'gallery'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Buka galeri gambar Google Drive"
            >
              <ImageIcon className={`w-3 h-3 shrink-0 ${uploadMode === 'gallery' ? 'text-amber-300' : 'text-blue-500'}`} />
              <span className="truncate">Galeri</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('local')}
              className={`py-1.5 px-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                uploadMode === 'local'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kompresi WebP lokal super cepat"
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">WebP</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadMode('url')}
              className={`py-1.5 px-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                uploadMode === 'url'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tempel URL tautan gambar atau Google Drive"
            >
              <LinkIcon className="w-3 h-3 text-blue-500 shrink-0" />
              <span className="truncate">Link</span>
            </button>
          </div>

          {/* Hidden File Input for Drag / Click (Drive & WebP) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileInputChange}
          />

          {/* Mode 1 & 3: Dropzone for Drive or WebP upload */}
          {(uploadMode === 'gas' || uploadMode === 'local') && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (isProcessing) return;
                fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : uploadMode === 'gas'
                  ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs py-1">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{processingStatus || 'Memproses...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  {uploadMode === 'gas' ? (
                    <CloudUpload className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Upload className="w-4 h-4 text-slate-600" />
                  )}
                  <span className="font-bold text-slate-800">
                    {uploadMode === 'gas'
                      ? 'Pilih Gambar ke Google Drive'
                      : 'Pilih Gambar untuk WebP'}
                  </span>
                  <span className="text-slate-400">atau seret ke sini</span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Custom Gallery View */}
          {uploadMode === 'gallery' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(true)}
                className="w-full py-2.5 px-3 border border-blue-200 hover:border-blue-400 bg-blue-50/60 hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Pilih dari Galeri Google Drive</span>
              </button>

              {/* Quick thumbnail selector row if items exist */}
              {galleryMedia.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                  {galleryMedia.slice(0, 6).map((media) => (
                    <button
                      key={media.fileId || media.fileUrl}
                      type="button"
                      onClick={() => {
                        onChange(media.fileUrl);
                        setSuccessInfo(`Gambar dipilih: ${media.fileName}`);
                      }}
                      className={`relative w-11 h-9 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer hover:scale-105 ${
                        value === media.fileUrl
                          ? 'border-blue-600 ring-2 ring-blue-600/40 shadow-xs'
                          : 'border-slate-200 hover:border-blue-400'
                      }`}
                      title={`Pilih ${media.fileName}`}
                    >
                      <img
                        src={media.fileUrl}
                        alt={media.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                  {galleryMedia.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setIsGalleryModalOpen(true)}
                      className="h-9 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold shrink-0 border border-slate-200 cursor-pointer flex items-center justify-center"
                    >
                      +{galleryMedia.length - 6}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mode 4: Direct URL Input with Paste Button */}
          {uploadMode === 'url' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={value.startsWith('data:') ? '' : value}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={placeholder || 'Tempel link Google Drive atau URL gambar...'}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    if (clipboardText) {
                      handleUrlChange(clipboardText.trim());
                    }
                  } catch (err) {
                    console.error('Gagal membaca clipboard:', err);
                  }
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center justify-center"
                title="Tempel dari Clipboard (Paste)"
                aria-label="Tempel dari Clipboard"
              >
                <Clipboard className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          )}

          {/* Error messages */}
          {uploadError && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Success message */}
          {successInfo && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Drive Media Gallery Modal (Tampilan Sendiri untuk Penyimpanan Google Drive) */}
      <DriveMediaGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={(selectedUrl, item) => {
          onChange(selectedUrl);
          setSuccessInfo(`Gambar dipilih: ${item.fileName}`);
          setIsGalleryModalOpen(false);
        }}
        currentValue={value}
        title={`Penyimpanan Gambar Google Drive — ${label || 'Media'}`}
      />
    </div>
  );
};

