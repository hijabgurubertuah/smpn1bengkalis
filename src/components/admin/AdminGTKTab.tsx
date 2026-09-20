import React, { useState } from 'react';
import { SchoolConfig, GTKItem, GTKFormCustomConfig, GTKFormFieldConfig } from '../../types';
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
  Settings2,
  FileText,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DataGTKForm } from '../common/datagtk';
import { saveSchoolTabConfig, loadSchoolConfig } from '../../lib/firebase';
import { DEFAULT_GTK_FORM_CONFIG, DEFAULT_GTK_FORM_FIELDS } from '../../lib/defaultData';

interface AdminGTKTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
  onRefreshFromFirebase?: () => Promise<void>;
}

export const AdminGTKTab: React.FC<AdminGTKTabProps> = ({ config, onChange, onRefreshFromFirebase }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GTKItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toggle form customization section view
  const [showFormSettings, setShowFormSettings] = useState(false);

  // New field addition state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'tel' | 'email'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);

  const gtkList: GTKItem[] = Array.isArray(config.gtkList) ? config.gtkList : [];
  const isSectionEnabled = config.layoutSections?.showGTK !== false;

  const currentFormConfig: GTKFormCustomConfig = config.gtkFormConfig || DEFAULT_GTK_FORM_CONFIG;
  const currentFormFields: GTKFormFieldConfig[] =
    currentFormConfig.fields && currentFormConfig.fields.length > 0
      ? currentFormConfig.fields
      : DEFAULT_GTK_FORM_FIELDS;

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

  // Reload GTK from Firebase Firestore
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshFromFirebase) {
        await onRefreshFromFirebase();
      } else {
        const latestConfig = await loadSchoolConfig();
        onChange({
          ...config,
          gtkList: Array.isArray(latestConfig.gtkList) ? latestConfig.gtkList : config.gtkList,
          gtkFormConfig: latestConfig.gtkFormConfig || config.gtkFormConfig,
        });
      }
      setToastMessage('Data GTK berhasil diperbarui dari Firebase!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error('Failed to refresh GTK data:', err);
      setToastMessage('Gagal menyegarkan data GTK');
      setTimeout(() => setToastMessage(null), 2000);
    } finally {
      setIsRefreshing(false);
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

  // Form customizer updates
  const updateFormConfig = (patch: Partial<GTKFormCustomConfig>) => {
    const newConfig: GTKFormCustomConfig = {
      ...currentFormConfig,
      ...patch,
      fields: patch.fields || currentFormFields,
    };
    onChange({
      ...config,
      gtkFormConfig: newConfig,
    });
  };

  const updateField = (fieldId: string, patch: Partial<GTKFormFieldConfig>) => {
    const updatedFields = currentFormFields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f));
    updateFormConfig({ fields: updatedFields });
  };

  const deleteField = (fieldId: string) => {
    const updatedFields = currentFormFields.filter((f) => f.id !== fieldId);
    updateFormConfig({ fields: updatedFields });
  };

  const handleAddNewCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const newId = `custom_field_${Date.now()}`;
    const newName = `custom_${newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const newField: GTKFormFieldConfig = {
      id: newId,
      name: newName,
      label: newFieldLabel.trim(),
      placeholder: newFieldPlaceholder.trim() || undefined,
      type: newFieldType,
      required: newFieldRequired,
      enabled: true,
      helperText: '',
    };
    updateFormConfig({ fields: [...currentFormFields, newField] });
    setNewFieldLabel('');
    setNewFieldPlaceholder('');
    setNewFieldRequired(false);
    setShowAddFieldForm(false);
  };

  const handleResetFormToDefault = () => {
    if (confirm('Kembalikan pengaturan teks dan kolom formulir ke bawaan standar?')) {
      onChange({
        ...config,
        gtkFormConfig: DEFAULT_GTK_FORM_CONFIG,
      });
      setToastMessage('Pengaturan formulir direset');
      setTimeout(() => setToastMessage(null), 2000);
    }
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
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Tautan Form Guru & Tombol Aksi Cepat */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Link className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Link Formulir Pengisian GTK Publik</h3>
            <p className="font-mono text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md select-all">
              {getShareableFormUrl()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
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
            <span>Buka Form</span>
          </a>

          <button
            type="button"
            onClick={() => setShowFormSettings((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showFormSettings
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showFormSettings ? 'Tutup Edit Form' : 'Pengaturan Form'}</span>
          </button>
        </div>
      </div>

      {/* 2. PENGATURAN EDIT FORMULIR GTK (Bisa di-Expand/Collapse) */}
      {showFormSettings && (
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-200/80 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pengaturan & Kustomisasi Formulir GTK</h4>
                <p className="text-[11px] text-slate-500">
                  Ubah judul formulir, subjudul, tulisan label kolom, placeholder, hapus kolom, atau tambah kolom baru.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFormToDefault}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                title="Kembalikan ke susunan awal"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>

          {/* Teks Judul & Subjudul Formulir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Judul Formulir (Header Form)
              </label>
              <input
                type="text"
                value={currentFormConfig.formHeaderTitle || ''}
                onChange={(e) => updateFormConfig({ formHeaderTitle: e.target.value })}
                placeholder="Formulir Biodata Pendidik & Tenaga Kependidikan"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teks Tombol Kirim (Submit Button)
              </label>
              <input
                type="text"
                value={currentFormConfig.submitButtonText || ''}
                onChange={(e) => updateFormConfig({ submitButtonText: e.target.value })}
                placeholder="Kirim & Simpan Biodata"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Subjudul / Petunjuk Pengisian Formulir
              </label>
              <textarea
                rows={2}
                value={currentFormConfig.formHeaderSubtitle || ''}
                onChange={(e) => updateFormConfig({ formHeaderSubtitle: e.target.value })}
                placeholder="Lengkapi biodata resmi Anda di bawah ini untuk pendataan..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pesan Notifikasi Berhasil (Sukses Submit)
              </label>
              <input
                type="text"
                value={currentFormConfig.formSuccessMessage || ''}
                onChange={(e) => updateFormConfig({ formSuccessMessage: e.target.value })}
                placeholder="Anda Sudah Berhasil Memasukkan Data!"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Daftar Kolom Formulir (Bisa diubah teksnya, diaktifkan/dinonaktifkan, atau dihapus) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Susunan Kolom Input Formulir ({currentFormFields.length} Kolom)
              </span>
              <button
                type="button"
                onClick={() => setShowAddFieldForm((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddFieldForm ? 'Batal Tambah' : 'Tambah Kolom Baru'}</span>
              </button>
            </div>

            {/* Form Tambah Kolom Baru */}
            {showAddFieldForm && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                <h5 className="text-xs font-bold text-blue-900">Tambah Kolom Input Baru ke Formulir</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Nama Label Kolom *</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Contoh: Mata Pelajaran"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Teks Placeholder</label>
                    <input
                      type="text"
                      value={newFieldPlaceholder}
                      onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                      placeholder="Contoh: Tuliskan nama mapel..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tipe Input</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      <option value="text">Teks Singkat (1 Baris)</option>
                      <option value="textarea">Teks Panjang (Paragraf)</option>
                      <option value="tel">Nomor Telepon / WhatsApp</option>
                      <option value="email">Alamat Email</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Wajib diisi (Required)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddNewCustomField}
                    disabled={!newFieldLabel.trim()}
                    className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    Simpan Kolom
                  </button>
                </div>
              </div>
            )}

            {/* List Field Editor */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {currentFormFields.map((field, idx) => (
                <div
                  key={field.id}
                  className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    field.enabled !== false ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Teks Label Kolom</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Teks Placeholder (Petunjuk dalam kotak)</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="Placeholder..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-300 text-xs text-slate-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Toggle Required */}
                    <button
                      type="button"
                      onClick={() => updateField(field.id, { required: !field.required })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                        field.required
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="Klik untuk ubah wajib / opsional"
                    >
                      {field.required ? 'Wajib' : 'Opsional'}
                    </button>

                    {/* Toggle Active / Enabled */}
                    <button
                      type="button"
                      onClick={() => updateField(field.id, { enabled: field.enabled === false ? true : false })}
                      className={`p-1.5 rounded-lg border cursor-pointer transition ${
                        field.enabled !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                      title={field.enabled !== false ? 'Aktif di formulir' : 'Dinonaktifkan'}
                    >
                      {field.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete field */}
                    <button
                      type="button"
                      onClick={() => deleteField(field.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                      title="Hapus kolom ini dari formulir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Pengaturan Seksi & Judul Carousel */}
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Judul Seksi di Website</label>
            <input
              type="text"
              value={config.gtkSectionTitle || 'Guru & Tenaga Kependidikan'}
              onChange={(e) => onChange({ ...config, gtkSectionTitle: e.target.value })}
              placeholder="Guru & Tenaga Kependidikan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Subjudul Seksi di Website</label>
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

      {/* 4. Daftar Guru (Header + Search + Tombol Refresh Firebase + Cards) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Daftar GTK ({gtkList.length})
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {visibleCount} Aktif
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Refresh Firebase untuk memuat data kiriman publik terkini */}
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer disabled:opacity-60"
              title="Refresh / Muat ulang data terbaru dari Firebase yang dikirim orang lain lewat formulir"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memuat...' : 'Refresh Firebase'}</span>
            </button>

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
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru berdasarkan nama, NIP, atau mata pelajaran..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List of Teachers */}
        {filteredList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <p>Belum ada data guru yang cocok.</p>
            <p className="text-[11px] text-slate-400">
              Klik <strong>Refresh Firebase</strong> jika data baru saja dikirim oleh guru lewat link formulir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 ${
                  item.isVisible !== false
                    ? 'bg-white border-slate-200 shadow-xs'
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
                      {item.submittedByPublic && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Formulir
                        </span>
                      )}
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
              formConfig={currentFormConfig}
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
