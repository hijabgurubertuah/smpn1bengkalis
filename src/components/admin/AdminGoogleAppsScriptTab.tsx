import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Folder,
  RefreshCw,
  ExternalLink,
  FolderHeart,
  Code2,
  Copy,
  Check,
  X,
  BookOpen,
} from 'lucide-react';
import { SchoolConfig, GoogleAppsScriptConfig } from '../../types';
import {
  testAppsScriptConnection,
  uploadFileViaAppsScript,
  getStoredAppsScriptConfig,
  saveStoredAppsScriptConfig,
  DEFAULT_APPS_SCRIPT_WEB_APP_URL,
  DEFAULT_APPS_SCRIPT_FOLDER_ID,
  AppsScriptUploadResult,
  SAMPLE_APPS_SCRIPT_CODE,
} from '../../lib/googleAppsScript';
import { DriveMediaGalleryModal } from './DriveMediaGalleryModal';

interface AdminGoogleAppsScriptTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminGoogleAppsScriptTab: React.FC<AdminGoogleAppsScriptTabProps> = ({
  config,
  onChange,
}) => {
  const currentGasConfig: GoogleAppsScriptConfig = config.googleAppsScript || {
    enabled: true,
    webAppUrl: DEFAULT_APPS_SCRIPT_WEB_APP_URL || '',
    folderId: DEFAULT_APPS_SCRIPT_FOLDER_ID || '',
    spreadsheetId: '',
    autoCreateFolder: true,
    testStatus: 'untested',
  };

  if (!currentGasConfig.webAppUrl && DEFAULT_APPS_SCRIPT_WEB_APP_URL) {
    currentGasConfig.webAppUrl = DEFAULT_APPS_SCRIPT_WEB_APP_URL;
  }
  if (!currentGasConfig.folderId && DEFAULT_APPS_SCRIPT_FOLDER_ID) {
    currentGasConfig.folderId = DEFAULT_APPS_SCRIPT_FOLDER_ID;
  }

  const [formData, setFormData] = useState<GoogleAppsScriptConfig>(currentGasConfig);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [testUploading, setTestUploading] = useState(false);
  const [testUploadResult, setTestUploadResult] = useState<AppsScriptUploadResult | null>(null);
  const [testUploadError, setTestUploadError] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(SAMPLE_APPS_SCRIPT_CODE);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = SAMPLE_APPS_SCRIPT_CODE;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  useEffect(() => {
    const stored = getStoredAppsScriptConfig();
    if (stored && stored.webAppUrl) {
      setFormData((prev) => ({
        ...prev,
        ...stored,
      }));
    }
  }, []);

  const handleFieldChange = (field: keyof GoogleAppsScriptConfig, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
    };
    setFormData(updated);
    saveStoredAppsScriptConfig(updated);
    onChange({
      ...config,
      googleAppsScript: updated,
    });
  };

  const handleRunTest = async () => {
    if (!formData.webAppUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Web App terlebih dahulu.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testAppsScriptConnection(formData.webAppUrl);
      setTestResult(res);

      const updated = {
        ...formData,
        lastTestedAt: new Date().toLocaleTimeString('id-ID'),
        testStatus: res.success ? ('success' as const) : ('error' as const),
        testMessage: res.message,
      };
      setFormData(updated);
      saveStoredAppsScriptConfig(updated);
      onChange({
        ...config,
        googleAppsScript: updated,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: 'Koneksi gagal: ' + msg,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.webAppUrl.trim()) {
      setTestUploadError('Isi URL Web App terlebih dahulu.');
      return;
    }

    setTestUploading(true);
    setTestUploadError(null);
    setTestUploadResult(null);

    try {
      const res = await uploadFileViaAppsScript(file, {
        webAppUrl: formData.webAppUrl,
        folderId: formData.folderId,
        spreadsheetId: formData.spreadsheetId,
      });
      setTestUploadResult(res);
    } catch (uploadErr: unknown) {
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      setTestUploadError(msg);
    } finally {
      setTestUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Pengaturan URL & Target */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Google Drive & Sheets API</span>
          </h3>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-600">Aktif</span>
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleFieldChange('enabled', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
          </label>
        </div>

        <div className="space-y-3">
          {/* Web App URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                URL Web App Google Apps Script
              </label>

              {formData.webAppUrl !== DEFAULT_APPS_SCRIPT_WEB_APP_URL && (
                <button
                  type="button"
                  onClick={() => {
                    handleFieldChange('webAppUrl', DEFAULT_APPS_SCRIPT_WEB_APP_URL);
                    if (DEFAULT_APPS_SCRIPT_FOLDER_ID) {
                      handleFieldChange('folderId', DEFAULT_APPS_SCRIPT_FOLDER_ID);
                    }
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Reset Default
                </button>
              )}
            </div>

            <input
              type="url"
              value={formData.webAppUrl}
              onChange={(e) => handleFieldChange('webAppUrl', e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Folder ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Folder Google Drive
              </label>
              <div className="relative">
                <Folder className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.folderId || ''}
                  onChange={(e) => handleFieldChange('folderId', e.target.value)}
                  placeholder="ID Folder..."
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Spreadsheet ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID Spreadsheet Log (Opsional)
              </label>
              <div className="relative">
                <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.spreadsheetId || ''}
                  onChange={(e) => handleFieldChange('spreadsheetId', e.target.value)}
                  placeholder="ID Spreadsheet..."
                  className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Test connection result notice */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{testResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRunTest}
              disabled={testing || !formData.webAppUrl.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>

            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
              <CloudUpload className={`w-3.5 h-3.5 ${testUploading ? 'animate-bounce' : ''}`} />
              <span>{testUploading ? 'Mengunggah...' : 'Tes Unggah File'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={testUploading || !formData.webAppUrl.trim()}
                onChange={handleTestUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              title="Buka galeri gambar yang pernah diunggah dengan thumbnail rapi"
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span>Buka Galeri Foto Drive</span>
            </button>

            {/* Tombol Kode Apps Script */}
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ring-1 ring-slate-700 hover:ring-slate-500"
              title="Buka dan salin kode Google Apps Script (Code.gs)"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Kode Apps Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Kartu Panduan & Akses Cepat Kode Sumber Google Apps Script */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Kode Sumber Google Apps Script (Code.gs)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                  Versi Lengkap + Galeri Drive
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Mendukung upload otomatis, direct link CDN berkecepatan tinggi, dan penarikan file folder Drive ke galeri.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Buka &amp; Salin Kode</span>
            </button>
            <a
              href="https://script.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all flex items-center gap-1"
            >
              <span>script.google.com</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* 4 Langkah Praktis Deploy */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Buka Apps Script</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Buka <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-mono">script.google.com</a> dan buat project baru.
            </p>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Tempel Kode</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Klik tombol <strong className="text-amber-300">Kode Apps Script</strong>, salin kodenya, dan gantikan isi <span className="font-mono text-white">Code.gs</span>.
            </p>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Deploy Web App</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Deploy &gt; New deployment &gt; Jenis: Web app &gt; Akses: <strong className="text-white">Anyone (Siapa saja)</strong>.
            </p>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">4</span>
              <span>Salin URL Web App</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Salin URL akhiran <span className="font-mono text-white">/exec</span> lalu simpan ke input URL di atas.
            </p>
          </div>
        </div>
      </div>

      {/* Test Upload Results */}
      {testUploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{testUploadError}</span>
        </div>
      )}

      {testUploadResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Upload Berhasil: {testUploadResult.fileName}</span>
          </div>

          <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-100 text-xs">
            <img
              src={testUploadResult.fileUrl}
              alt="Preview"
              className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0"
            />
            <div className="flex items-center gap-3 text-xs">
              <a
                href={testUploadResult.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Lihat Gambar CDN</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={testUploadResult.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:underline flex items-center gap-1"
              >
                <span>Buka Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Drive Media Gallery Modal */}
      <DriveMediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(selectedUrl) => {
          // If selected in tester tab, we can show it as a selected preview
          setIsGalleryOpen(false);
        }}
        title="Penyimpanan Gambar Google Drive (Galeri Apps Script)"
      />

      {/* Modal Kode Sumber Google Apps Script */}
      {showCodeModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCodeModal(false);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                    <span>Kode Google Apps Script</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      Code.gs
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Salin seluruh kode ini ke project Google Apps Script (script.google.com)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Tombol Salin */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {isCopied ? (
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

                {/* Tombol Tutup */}
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick guide banner */}
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
                <span>script.google.com</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

            {/* Code container */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950/90 select-all">
              <pre className="text-[11px] sm:text-xs font-mono text-slate-200 leading-relaxed whitespace-pre font-normal">
                {SAMPLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                {SAMPLE_APPS_SCRIPT_CODE.split('\n').length} baris kode siap pakai (Upload + Live listFiles)
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
                  onClick={handleCopyCode}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua Kode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
