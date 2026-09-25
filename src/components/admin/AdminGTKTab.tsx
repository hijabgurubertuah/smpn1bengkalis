import React, { useState } from 'react';
import { SchoolConfig, GTKItem } from '../../types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Search,
  Save,
  CheckCircle2,
  RefreshCw,
  X,
  Link,
  Sliders,
} from 'lucide-react';
import { DataGTKForm } from '../common/datagtk';
import { saveSchoolTabConfig } from '../../lib/firebase';

interface AdminGTKTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminGTKTab: React.FC<AdminGTKTabProps> = ({ config, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GTKItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const gtkList: GTKItem[] = Array.isArray(config.gtkList) ? config.gtkList : [];
  const isSectionEnabled = config.layoutSections?.showGTK !== false;

  const getShareableFormUrl = () => {
    if (typeof window === 'undefined') return '?form=gtk';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?form=gtk`;
  };

  const handleCopyShareLink = async () => {
    const url = getShareableFormUrl();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn('Failed to copy share link:', e);
    }
  };

  const handleToggleTeacherVisibility = (id: string) => {
    const updated = gtkList.map((item) => {
      if (item.id === id) {
        return { ...item, isVisible: !item.isVisible };
      }
      return item;
    });
    onChange({
      ...config,
      gtkList: updated,
    });
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = gtkList.filter((item) => item.id !== id);
    onChange({
      ...config,
      gtkList: updated,
    });
    setDeleteConfirmId(null);
  };

  const handleSaveTeacherData = (item: GTKItem) => {
    let updatedList: GTKItem[];
    const existingIndex = gtkList.findIndex((g) => g.id === item.id);
    if (existingIndex >= 0) {
      updatedList = [...gtkList];
      updatedList[existingIndex] = item;
    } else {
      updatedList = [item, ...gtkList];
    }

    onChange({
      ...config,
      gtkList: updatedList,
    });

    setIsFormModalOpen(false);
    setEditingItem(null);
    setToastMessage('Data guru tersimpan');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleToggleSectionVisibility = () => {
    onChange({
      ...config,
      layoutSections: {
        ...config.layoutSections,
        showGTK: !isSectionEnabled,
      },
    });
  };

  const filteredList = gtkList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.nip?.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q) ||
      item.quote?.toLowerCase().includes(q)
    );
  });

  const visibleCount = gtkList.filter((i) => i.isVisible !== false).length;

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      const success = await saveSchoolTabConfig('gtk', config);
      if (success) {
        setToastMessage('Tersimpan di Cloud');
      } else {
        setToastMessage('Tersimpan di Draf Lokal');
      }
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Gagal menyimpan');
      setTimeout(() => setToastMessage(null), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Tautan Form Guru (Minimal Bar) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Link className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Link Form Pengisian Guru</h3>
            <p className="font-mono text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md select-all">
              {getShareableFormUrl()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
          </button>
          <a
            href="?form=gtk"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka</span>
          </a>
        </div>
      </div>

      {/* 2. Pengaturan Seksi & Judul (Minimal Box) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-800">Tampilkan Seksi GTK di Beranda</span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSectionEnabled}
              onChange={handleToggleSectionVisibility}
              className="sr-only peer"
            />
            <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Judul Seksi</label>
            <input
              type="text"
              value={config.gtkSectionTitle || 'Guru & Tenaga Kependidikan'}
              onChange={(e) => onChange({ ...config, gtkSectionTitle: e.target.value })}
              placeholder="Guru & Tenaga Kependidikan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Subjudul</label>
            <input
              type="text"
              value={config.gtkSectionSubtitle || ''}
              onChange={(e) => onChange({ ...config, gtkSectionSubtitle: e.target.value })}
              placeholder="Subjudul seksi..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Daftar Guru (Header + Search + Cards) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Guru ({gtkList.length})
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {visibleCount} Aktif
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List of Teachers */}
        {filteredList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada data guru.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 ${
                  item.isVisible !== false
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {item.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[150px]">
                        {item.role}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                      {item.name}
                    </h4>
                    {item.nip && item.nip !== '-' && (
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        NIP: {item.nip}
                      </p>
                    )}
                  </div>
                </div>

                {item.quote && (
                  <p className="text-[11px] italic text-slate-600 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 line-clamp-1">
                    "{item.quote}"
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleTeacherVisibility(item.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
                      item.isVisible !== false
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    {item.isVisible !== false ? (
                      <>
                        <Eye className="w-3 h-3 text-emerald-600" />
                        <span>Tampil</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-slate-400" />
                        <span>Sembunyi</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setIsFormModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {deleteConfirmId === item.id && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
                    <span className="text-[11px] text-red-800 font-semibold truncate">Hapus data?</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-0.5 text-[10px] rounded border border-slate-300 text-slate-600 bg-white"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeacher(item.id)}
                        className="px-2 py-0.5 text-[10px] rounded bg-red-600 text-white font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Data Guru' : 'Tambah Guru'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFormModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DataGTKForm
              initialData={editingItem || undefined}
              existingGtkList={gtkList}
              onSubmitSuccess={handleSaveTeacherData}
              onCancel={() => {
                setIsFormModalOpen(false);
                setEditingItem(null);
              }}
              onExit={() => {
                setIsFormModalOpen(false);
                setEditingItem(null);
              }}
              submitButtonLabel={editingItem ? 'Simpan' : 'Tambah'}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveToCloud}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 transition"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
