import React, { useState } from 'react';
import { SchoolConfig, FacilityItem, ExtracurricularItem } from '../../types';
import {
  Building2,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  X,
  Sparkles,
  Flag,
  Music,
  HeartHandshake,
  Cpu,
  MessageSquare,
  Award,
  BookOpen,
  Users,
  Target,
  Search,
} from 'lucide-react';
import { ImageUploadButton } from './ImageUploadButton';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminFacilitiesEkskulTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminFacilitiesEkskulTab: React.FC<AdminFacilitiesEkskulTabProps> = ({
  config,
  onChange,
}) => {
  const [subTab, setSubTab] = useState<'facilities' | 'ekskul'>('facilities');
  const [showTitleSettings, setShowTitleSettings] = useState(false);

  const facilities = config.facilities || [];
  const extracurriculars = config.extracurriculars || [];

  // Facility State
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [deleteFacilityConfirmId, setDeleteFacilityConfirmId] = useState<string | null>(null);
  const [facilityFormData, setFacilityFormData] = useState<Omit<FacilityItem, 'id'>>({
    title: '',
    category: 'Teknologi',
    imageUrl: '',
    description: '',
  });

  // Ekskul State
  const [editingEkskul, setEditingEkskul] = useState<ExtracurricularItem | null>(null);
  const [isEkskulModalOpen, setIsEkskulModalOpen] = useState(false);
  const [deleteEkskulConfirmId, setDeleteEkskulConfirmId] = useState<string | null>(null);
  const [ekskulFormData, setEkskulFormData] = useState<Omit<ExtracurricularItem, 'id'>>({
    name: '',
    category: 'Kepanduan',
    coach: '',
    schedule: '',
    icon: 'Trophy',
    description: '',
    imageUrl: '',
  });

  const facilityCategories = ['Teknologi', 'Literasi', 'Sains', 'Olahraga', 'Laboratorium', 'Seni', 'Umum'];
  const ekskulCategories = ['Kepanduan', 'Seni & Budaya', 'Kemanusiaan', 'Sains & Riset', 'Olahraga', 'Bahasa & Komunikasi', 'Keagamaan'];

  const availableIcons = [
    { id: 'Trophy', label: 'Piala / Prestasi', icon: <Trophy className="w-4 h-4 text-amber-600" /> },
    { id: 'Flag', label: 'Bendera / Kepanduan', icon: <Flag className="w-4 h-4 text-red-600" /> },
    { id: 'Music', label: 'Musik / Seni', icon: <Music className="w-4 h-4 text-purple-600" /> },
    { id: 'HeartHandshake', label: 'PMR / Sosial', icon: <HeartHandshake className="w-4 h-4 text-emerald-600" /> },
    { id: 'Cpu', label: 'Robotik / Sains', icon: <Cpu className="w-4 h-4 text-blue-600" /> },
    { id: 'MessageSquare', label: 'Bahasa / Debat', icon: <MessageSquare className="w-4 h-4 text-indigo-600" /> },
    { id: 'Award', label: 'Penghargaan', icon: <Award className="w-4 h-4 text-yellow-600" /> },
    { id: 'BookOpen', label: 'Karya Tulis / Jurnalistik', icon: <BookOpen className="w-4 h-4 text-teal-600" /> },
    { id: 'Users', label: 'Organisasi / OSIS', icon: <Users className="w-4 h-4 text-cyan-600" /> },
    { id: 'Target', label: 'Fokus & Olahraga', icon: <Target className="w-4 h-4 text-rose-600" /> },
  ];

  // --- FACILITY HANDLERS ---
  const handleOpenAddFacility = () => {
    setEditingFacility(null);
    setFacilityFormData({
      title: '',
      category: 'Teknologi',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      description: '',
    });
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacility = (fac: FacilityItem) => {
    setEditingFacility(fac);
    setFacilityFormData({
      title: fac.title,
      category: fac.category,
      imageUrl: fac.imageUrl,
      description: fac.description,
    });
    setIsFacilityModalOpen(true);
  };

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityFormData.title.trim()) {
      alert('Mohon isi judul fasilitas.');
      return;
    }

    let updatedFacilities: FacilityItem[];
    if (editingFacility) {
      updatedFacilities = facilities.map((f) =>
        f.id === editingFacility.id ? { ...facilityFormData, id: editingFacility.id } : f
      );
    } else {
      const newFacility: FacilityItem = {
        ...facilityFormData,
        id: `fac-${Date.now()}`,
      };
      updatedFacilities = [...facilities, newFacility];
    }

    onChange({
      ...config,
      facilities: updatedFacilities,
    });
    setIsFacilityModalOpen(false);
  };

  const handleDeleteFacility = (id: string) => {
    const updated = facilities.filter((f) => f.id !== id);
    onChange({
      ...config,
      facilities: updated,
    });
    setDeleteFacilityConfirmId(null);
  };

  const handleMoveFacility = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= facilities.length) return;
    const updated = [...facilities];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange({
      ...config,
      facilities: updated,
    });
  };

  // --- EKSKUL HANDLERS ---
  const handleOpenAddEkskul = () => {
    setEditingEkskul(null);
    setEkskulFormData({
      name: '',
      category: 'Kepanduan',
      coach: '',
      schedule: 'Setiap Jumat, 15:00 WIB',
      icon: 'Flag',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    });
    setIsEkskulModalOpen(true);
  };

  const handleOpenEditEkskul = (ekskul: ExtracurricularItem) => {
    setEditingEkskul(ekskul);
    setEkskulFormData({
      name: ekskul.name,
      category: ekskul.category,
      coach: ekskul.coach,
      schedule: ekskul.schedule,
      icon: ekskul.icon,
      description: ekskul.description,
      imageUrl: ekskul.imageUrl || '',
    });
    setIsEkskulModalOpen(true);
  };

  const handleSaveEkskul = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ekskulFormData.name.trim()) {
      alert('Mohon isi nama ekstrakurikuler.');
      return;
    }

    let updatedEkskul: ExtracurricularItem[];
    if (editingEkskul) {
      updatedEkskul = extracurriculars.map((ek) =>
        ek.id === editingEkskul.id ? { ...ekskulFormData, id: editingEkskul.id } : ek
      );
    } else {
      const newEkskul: ExtracurricularItem = {
        ...ekskulFormData,
        id: `ekskul-${Date.now()}`,
      };
      updatedEkskul = [...extracurriculars, newEkskul];
    }

    onChange({
      ...config,
      extracurriculars: updatedEkskul,
    });
    setIsEkskulModalOpen(false);
  };

  const handleDeleteEkskul = (id: string) => {
    const updated = extracurriculars.filter((ek) => ek.id !== id);
    onChange({
      ...config,
      extracurriculars: updated,
    });
    setDeleteEkskulConfirmId(null);
  };

  const handleMoveEkskul = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= extracurriculars.length) return;
    const updated = [...extracurriculars];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onChange({
      ...config,
      extracurriculars: updated,
    });
  };

  const handleUpdateTitles = (field: string, value: string) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const renderIconBadge = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'cpu':
        return <Cpu className="w-4 h-4 text-blue-600" />;
      case 'flag':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'music':
        return <Music className="w-4 h-4 text-purple-600" />;
      case 'hearthandshake':
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      case 'messagesquare':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'bookopen':
        return <BookOpen className="w-4 h-4 text-teal-600" />;
      case 'users':
        return <Users className="w-4 h-4 text-cyan-600" />;
      case 'target':
        return <Target className="w-4 h-4 text-rose-600" />;
      case 'award':
        return <Award className="w-4 h-4 text-yellow-600" />;
      case 'trophy':
      default:
        return <Trophy className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Sub-Tabs Switcher */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Sarana Fasilitas &amp; Ekstrakurikuler</span>
            </h3>
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSubTab('facilities')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'facilities'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Fasilitas ({facilities.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('ekskul')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                subTab === 'ekskul'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Ekstrakurikuler ({extracurriculars.length})</span>
            </button>
          </div>
        </div>
      </div>



      {/* ================= FASILITAS TAB ================= */}
      {subTab === 'facilities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">Daftar Fasilitas Instansi</h4>
            <button
              type="button"
              onClick={handleOpenAddFacility}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Fasilitas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((fac, idx) => (
              <div
                key={fac.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex gap-3.5">
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <img
                      src={fac.imageUrl}
                      alt={fac.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="font-bold text-slate-900 text-sm leading-snug">
                      {fac.title}
                    </h5>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {fac.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveFacility(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-white cursor-pointer"
                      title="Geser Ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveFacility(idx, 'down')}
                      disabled={idx === facilities.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-white cursor-pointer"
                      title="Geser Ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditFacility(fac)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {deleteFacilityConfirmId === fac.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                        <button
                          type="button"
                          onClick={() => handleDeleteFacility(fac.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteFacilityConfirmId(null)}
                          className="px-2 py-1 bg-white text-slate-700 text-xs font-semibold rounded border border-slate-300 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteFacilityConfirmId(fac.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 cursor-pointer"
                        title="Hapus Fasilitas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= EKSKUL TAB ================= */}
      {subTab === 'ekskul' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">Daftar Ekstrakurikuler Siswa</h4>
            <button
              type="button"
              onClick={handleOpenAddEkskul}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ekskul</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extracurriculars.map((ek, idx) => (
              <div
                key={ek.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between gap-3"
              >
                 <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 text-sm leading-tight">
                    {ek.name}
                  </h5>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {ek.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveEkskul(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-white cursor-pointer"
                      title="Geser Ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveEkskul(idx, 'down')}
                      disabled={idx === extracurriculars.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-white cursor-pointer"
                      title="Geser Ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditEkskul(ek)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {deleteEkskulConfirmId === ek.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                        <button
                          type="button"
                          onClick={() => handleDeleteEkskul(ek.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteEkskulConfirmId(null)}
                          className="px-2 py-1 bg-white text-slate-700 text-xs font-semibold rounded border border-slate-300 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteEkskulConfirmId(ek.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 cursor-pointer"
                        title="Hapus Ekskul"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT FASILITAS ================= */}
      {isFacilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{editingFacility ? 'Edit Sarana Fasilitas' : 'Tambah Fasilitas Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFacilityModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Fasilitas *
                </label>
                <AutoResizeTextarea
                  minRows={1}
                  required
                  value={facilityFormData.title}
                  onChange={(e) => setFacilityFormData({ ...facilityFormData, title: e.target.value })}
                  placeholder="Contoh: Laboratorium Komputer Modern"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              {/* Photo Upload with Google Drive & Local Compression */}
              <ImageUploadButton
                label="Foto Fasilitas"
                value={facilityFormData.imageUrl}
                onChange={(url) => setFacilityFormData({ ...facilityFormData, imageUrl: url })}
                preset="post"
                aspectRatio="wide"
                placeholder="https://..."
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi / Keterangan Fasilitas
                </label>
                <AutoResizeTextarea
                  minRows={3}
                  value={facilityFormData.description}
                  onChange={(e) => setFacilityFormData({ ...facilityFormData, description: e.target.value })}
                  placeholder="Jelaskan spesifikasi, kegunaan, atau kelengkapan fasilitas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingFacility ? 'Simpan Perubahan' : 'Tambahkan Fasilitas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT EKSKUL ================= */}
      {isEkskulModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>{editingEkskul ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEkskulModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEkskul} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Ekstrakurikuler *
                </label>
                <AutoResizeTextarea
                  minRows={1}
                  required
                  value={ekskulFormData.name}
                  onChange={(e) => setEkskulFormData({ ...ekskulFormData, name: e.target.value })}
                  placeholder="Contoh: Pramuka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <ImageUploadButton
                  label="Foto Cover Kegiatan"
                  value={ekskulFormData.imageUrl || ''}
                  onChange={(url) => setEkskulFormData({ ...ekskulFormData, imageUrl: url })}
                  preset="post"
                  aspectRatio="wide"
                  placeholder="https://... atau tempel link foto cover"
                  allowDriveConverter={true}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi Kegiatan
                </label>
                <AutoResizeTextarea
                  minRows={3}
                  value={ekskulFormData.description}
                  onChange={(e) => setEkskulFormData({ ...ekskulFormData, description: e.target.value })}
                  placeholder="Jelaskan tujuan ekskul, kegiatan rutin, atau prestasi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEkskulModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingEkskul ? 'Simpan Perubahan' : 'Tambahkan Ekskul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
