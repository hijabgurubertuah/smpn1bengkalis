import React, { useState, useEffect } from 'react';
import { GTKItem, SchoolConfig } from '../../types';
import {
  User,
  GraduationCap,
  Award,
  Quote,
  Send,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  X,
  Edit3,
  LogOut,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ImageUploadButton } from '../admin/ImageUploadButton';
import { saveGTKSubmission, loadSchoolConfig } from '../../lib/firebase';

interface DataGTKFormProps {
  initialData?: Partial<GTKItem>;
  existingGtkList?: GTKItem[];
  onSubmitSuccess?: (item: GTKItem) => void;
  onCancel?: () => void;
  onExit?: () => void;
  isStandalone?: boolean;
  submitButtonLabel?: string;
}

export const DataGTKForm: React.FC<DataGTKFormProps> = ({
  initialData,
  existingGtkList,
  onSubmitSuccess,
  onCancel,
  onExit,
  isStandalone = false,
  submitButtonLabel = 'Kirim & Simpan Biodata',
}) => {
  const [formData, setFormData] = useState<Partial<GTKItem>>({
    id: initialData?.id || '',
    name: initialData?.name || '',
    nip: initialData?.nip || '',
    role: initialData?.role || '',
    quote: initialData?.quote || '',
    photoUrl: initialData?.photoUrl || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    isVisible: initialData?.isVisible !== undefined ? initialData.isVisible : true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal / Popup state for duplicate entry detection
  const [duplicateItem, setDuplicateItem] = useState<GTKItem | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Success popup state for completed submission
  const [savedItem, setSavedItem] = useState<GTKItem | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Local list of existing teachers for instant duplicate verification
  const [loadedGtkList, setLoadedGtkList] = useState<GTKItem[]>(existingGtkList || []);

  useEffect(() => {
    if (!existingGtkList || existingGtkList.length === 0) {
      loadSchoolConfig().then((cfg) => {
        if (Array.isArray(cfg.gtkList)) {
          setLoadedGtkList(cfg.gtkList);
        }
      });
    } else {
      setLoadedGtkList(existingGtkList);
    }
  }, [existingGtkList]);

  // Handle standard exit action
  const handleExitAction = () => {
    if (onExit) {
      onExit();
    } else if (onCancel) {
      onCancel();
    } else if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('form');
      if (url.hash === '#datagtk') url.hash = '';
      window.location.href = url.pathname + (url.search ? url.search : '');
    }
  };

  const checkDuplicate = (name: string, nip: string, currentId?: string): GTKItem | null => {
    const cleanName = name.trim().toLowerCase();
    const cleanNip = nip.trim();

    return (
      loadedGtkList.find((item) => {
        // Skip comparing against self when already in edit mode with matching ID
        if (currentId && item.id === currentId) return false;

        // Check matching NIP (if provided and valid)
        if (
          cleanNip &&
          cleanNip !== '-' &&
          cleanNip !== '' &&
          item.nip &&
          item.nip.trim() !== '-' &&
          item.nip.trim() !== '' &&
          item.nip.trim() === cleanNip
        ) {
          return true;
        }

        // Check matching full name (case-insensitive)
        if (cleanName && item.name && item.name.trim().toLowerCase() === cleanName) {
          return true;
        }

        return false;
      }) || null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Guard: Prevent submit if image upload is still in progress
    if (isUploadingImage) {
      setErrorMessage('Harap tunggu hingga proses pengunggahan foto selesai.');
      return;
    }

    // Validation
    if (!formData.name?.trim()) {
      setErrorMessage('Harap masukkan Nama Lengkap beserta gelar.');
      return;
    }
    if (!formData.role?.trim()) {
      setErrorMessage('Harap masukkan Tugas yang di-Ampu / Jabatan / Mata Pelajaran.');
      return;
    }
    if (!formData.quote?.trim()) {
      setErrorMessage('Harap masukkan Kata-kata Mutiara atau motto pendidikan.');
      return;
    }

    // Check duplicate if not already explicitly editing that specific item ID
    const duplicate = checkDuplicate(
      formData.name || '',
      formData.nip || '',
      formData.id || undefined
    );

    if (duplicate) {
      setDuplicateItem(duplicate);
      setShowDuplicateModal(true);
      return;
    }

    await executeSaveData(formData.id || `gtk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  };

  const executeSaveData = async (targetId: string) => {
    setIsSubmitting(true);
    setShowDuplicateModal(false);

    const submissionItem: GTKItem = {
      id: targetId,
      name: (formData.name || '').trim(),
      nip: formData.nip?.trim() || '-',
      role: (formData.role || '').trim(),
      quote: (formData.quote || '').trim(),
      photoUrl: formData.photoUrl?.trim() || '',
      isVisible: formData.isVisible !== undefined ? formData.isVisible : true,
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await saveGTKSubmission(submissionItem);
      if (res.success) {
        setSavedItem(submissionItem);
        setSuccessMessage(res.message);
        setShowSuccessModal(true);
        if (onSubmitSuccess) {
          onSubmitSuccess(submissionItem);
        }
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Gagal menyimpan biodata: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load existing duplicate data into form for editing
  const handleEditExisting = () => {
    if (duplicateItem) {
      setFormData({
        id: duplicateItem.id,
        name: duplicateItem.name || '',
        nip: duplicateItem.nip || '',
        role: duplicateItem.role || '',
        quote: duplicateItem.quote || '',
        photoUrl: duplicateItem.photoUrl || '',
        phone: duplicateItem.phone || '',
        email: duplicateItem.email || '',
        isVisible: duplicateItem.isVisible !== undefined ? duplicateItem.isVisible : true,
      });
      setShowDuplicateModal(false);
      setErrorMessage(null);
      setSuccessMessage(`Memuat data "${duplicateItem.name}" untuk diedit.`);
    }
  };

  return (
    <div className="relative">
      {/* Top Header Bar with Exit X Button */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {formData.id ? 'Edit Biodata GTK' : 'Formulir Data Guru & GTK'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {formData.id ? 'Memperbarui data yang sudah terdaftar' : 'Lengkapi biodata resmi pendidik'}
            </p>
          </div>
        </div>

        {/* Exit X Button on top */}
        <button
          type="button"
          onClick={handleExitAction}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          title="Tutup Formulir (Keluar)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold">Perhatian</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && !showSuccessModal && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold">Informasi</p>
              <p className="mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* 1. Upload Foto */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Foto Guru</span>
            </label>
            {isUploadingImage && (
              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sedang mengunggah...</span>
              </span>
            )}
          </div>

          <ImageUploadButton
            label="Foto Guru"
            value={formData.photoUrl || ''}
            onChange={(newUrl) => setFormData((prev) => ({ ...prev, photoUrl: newUrl }))}
            onProcessingChange={(uploading) => setIsUploadingImage(uploading)}
            preset="avatar"
            aspectRatio="square"
            layout="horizontal"
            placeholder="Link foto atau unggah..."
          />
        </div>

        {/* 2. Informasi Utama (Nama & NIP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>Nama Lengkap & Gelar <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nama dan gelar..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>NIP / NUPTK</span>
            </label>
            <input
              type="text"
              value={formData.nip || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, nip: e.target.value }))}
              placeholder="NIP / '-' jika belum ada"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* 3. Tugas yang di Ampu */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Tugas yang di-Ampu / Jabatan <span className="text-red-500">*</span></span>
          </label>
          <input
            type="text"
            required
            value={formData.role || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            placeholder="Mata pelajaran / tugas..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* 4. Kata-kata Mutiara */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Quote className="w-3.5 h-3.5 text-blue-600" />
            <span>Kata-kata Mutiara <span className="text-red-500">*</span></span>
          </label>
          <textarea
            required
            rows={2}
            value={formData.quote || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, quote: e.target.value }))}
            placeholder="Kata-kata mutiara / motto pendidikan..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* 5. Kontak Tambahan (Opsional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>WhatsApp (Opsional)</span>
            </label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="08..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Email (Opsional)</span>
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="email@..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleExitAction}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Keluar</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className={`px-5 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition ${
              isUploadingImage
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : isUploadingImage ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menunggu Foto...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{formData.id ? 'Perbarui Biodata' : submitButtonLabel}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL POPUP: Sudah Pernah Mengisi Biodata (Duplikat Terdeteksi) */}
      {showDuplicateModal && duplicateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Anda Sudah Pernah Mengisi Biodata!
                </h4>
                <p className="text-xs text-slate-500">
                  Data dengan Nama atau NIP ini sudah tersimpan di sistem sekolah.
                </p>
              </div>
            </div>

            {/* Existing Profile Card Preview */}
            <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-3">
                {duplicateItem.photoUrl ? (
                  <img
                    src={duplicateItem.photoUrl}
                    alt={duplicateItem.name}
                    className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                    {duplicateItem.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {duplicateItem.name}
                  </h5>
                  <p className="text-xs text-amber-800 font-semibold truncate">
                    {duplicateItem.role}
                  </p>
                  {duplicateItem.nip && duplicateItem.nip !== '-' && (
                    <p className="text-[10px] font-mono text-slate-500">
                      NIP: {duplicateItem.nip}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Apakah Anda ingin <strong>mengedit data yang sudah ada</strong> atau membatalkan?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleEditExisting}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Biodata Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POPUP: Berhasil Memasukkan / Memperbarui Data */}
      {showSuccessModal && savedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                Anda Sudah Berhasil Memasukkan Data!
              </h4>
              <p className="text-xs text-slate-600">
                Terima kasih, biodata <strong>{savedItem.name}</strong> telah tersimpan ke sistem database sekolah.
              </p>
            </div>

            {/* Preview Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left space-y-2">
              <div className="flex items-center gap-3">
                {savedItem.photoUrl ? (
                  <img
                    src={savedItem.photoUrl}
                    alt={savedItem.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {savedItem.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {savedItem.name}
                  </h5>
                  <p className="text-xs text-blue-600 font-semibold truncate">
                    {savedItem.role}
                  </p>
                  {savedItem.nip && savedItem.nip !== '-' && (
                    <p className="text-[10px] font-mono text-slate-500">
                      NIP: {savedItem.nip}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions: Edit Again & Exit */}
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Lagi</span>
              </button>
              
              <button
                type="button"
                onClick={handleExitAction}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit (Selesai)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StandaloneGTKFormPageProps {
  config: SchoolConfig;
}

export const StandaloneGTKFormPage: React.FC<StandaloneGTKFormPageProps> = ({ config }) => {
  const schoolName = config.identity?.name || 'Portal Sekolah';
  const schoolLogo = config.identity?.logoUrl || '';

  const handleExitToHome = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('form');
      if (url.hash === '#datagtk') url.hash = '';
      window.location.href = url.pathname + (url.search ? url.search : '');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 py-6 sm:py-12 px-3 sm:px-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl">
        
        {/* Header Branding Card with Exit X Button */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 mb-6 text-center space-y-4 relative">
          {/* Top Right Exit Button */}
          <button
            type="button"
            onClick={handleExitToHome}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Keluar ke Beranda Sekolah"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt={schoolName}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-2xl">
                GTK
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide uppercase">
              <GraduationCap className="w-3.5 h-3.5" />
              Formulir Biodata Pendidik & Tenaga Kependidikan
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Lengkapi biodata resmi Anda di bawah ini untuk pendataan dan penampilan profil di carousel website sekolah.
            </p>
          </div>
        </div>

        {/* Main Form Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          <DataGTKForm
            isStandalone={true}
            existingGtkList={config.gtkList || []}
            onExit={handleExitToHome}
            submitButtonLabel="Kirim Biodata Guru Sekarang"
          />
        </div>

        {/* Security / Privacy Badge */}
        <div className="mt-6 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>Formulir resmi mandiri • Terhubung langsung ke database {schoolName}</span>
        </div>

      </div>
    </div>
  );
};
