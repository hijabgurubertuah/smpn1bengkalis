import React, { useState } from 'react';
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
  FileSpreadsheet,
  Copy,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { ImageUploadButton } from '../admin/ImageUploadButton';
import { saveGTKSubmission } from '../../lib/firebase';

interface DataGTKFormProps {
  initialData?: Partial<GTKItem>;
  onSubmitSuccess?: (item: GTKItem) => void;
  onCancel?: () => void;
  isStandalone?: boolean;
  submitButtonLabel?: string;
}

export const DataGTKForm: React.FC<DataGTKFormProps> = ({
  initialData,
  onSubmitSuccess,
  onCancel,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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

    setIsSubmitting(true);

    const submissionItem: GTKItem = {
      id: formData.id || `gtk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: formData.name.trim(),
      nip: formData.nip?.trim() || '-',
      role: formData.role.trim(),
      quote: formData.quote.trim(),
      photoUrl: formData.photoUrl?.trim() || '',
      isVisible: formData.isVisible !== undefined ? formData.isVisible : true,
      phone: formData.phone?.trim() || '',
      email: formData.email?.trim() || '',
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await saveGTKSubmission(submissionItem);
      if (res.success) {
        setSuccessMessage(res.message);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-bold">Perhatian</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && !isStandalone && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-bold">Berhasil</p>
            <p className="text-xs mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* 1. Upload Foto */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-600" />
          <span>Foto Guru</span>
        </label>

        <ImageUploadButton
          label="Foto Guru"
          value={formData.photoUrl || ''}
          onChange={(newUrl) => setFormData((prev) => ({ ...prev, photoUrl: newUrl }))}
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
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{submitButtonLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

interface StandaloneGTKFormPageProps {
  config: SchoolConfig;
}

export const StandaloneGTKFormPage: React.FC<StandaloneGTKFormPageProps> = ({ config }) => {
  const [submittedData, setSubmittedData] = useState<GTKItem | null>(null);

  const schoolName = config.identity?.name || 'Portal Sekolah';
  const schoolLogo = config.identity?.logoUrl || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 py-6 sm:py-12 px-3 sm:px-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl">
        
        {/* Header Branding Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 mb-6 text-center space-y-4">
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

        {/* Main Content: Form or Submitted Success View */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          {submittedData ? (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Data Anda Berhasil Terkirim!
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Terima kasih, biodata Anda telah tersimpan ke sistem sekolah dan akan ditinjau untuk ditampilkan di website publik.
                </p>
              </div>

              {/* Submitted Card Preview */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3 max-w-md mx-auto">
                <div className="flex items-center gap-3.5">
                  {submittedData.photoUrl ? (
                    <img
                      src={submittedData.photoUrl}
                      alt={submittedData.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {submittedData.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                      {submittedData.name}
                    </h4>
                    <p className="text-xs text-blue-600 font-semibold truncate">
                      {submittedData.role}
                    </p>
                    {submittedData.nip && submittedData.nip !== '-' && (
                      <p className="text-[11px] text-slate-500 font-mono">
                        NIP: {submittedData.nip}
                      </p>
                    )}
                  </div>
                </div>

                {submittedData.quote && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs italic text-slate-700 flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>"{submittedData.quote}"</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSubmittedData(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  Kirim Tanggapan Lain
                </button>
              </div>
            </div>
          ) : (
            <DataGTKForm
              isStandalone={true}
              onSubmitSuccess={(item) => setSubmittedData(item)}
              submitButtonLabel="Kirim Biodata Guru Sekarang"
            />
          )}
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
