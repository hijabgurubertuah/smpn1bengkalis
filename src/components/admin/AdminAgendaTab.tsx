import React, { useState } from 'react';
import { SchoolConfig, AgendaItem } from '../../types';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Tag,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';

interface AdminAgendaTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminAgendaTab: React.FC<AdminAgendaTabProps> = ({ config, onChange }) => {
  const agendas = config.agendas || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<AgendaItem, 'id'>>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Akademik',
    isVisible: true,
  });

  const categories = [
    'Akademik',
    'Kesiswaan',
    'PPDB',
    'Ujian',
    'Libur',
    'Karya Siswa',
    'Rapat',
    'Lomba',
    'Kegiatan Khusus',
  ];

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      date: '',
      time: '07:30 - 12:00 WIB',
      location: 'SMP Negeri 1 Bengkalis',
      category: 'Akademik',
      isVisible: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AgendaItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      category: item.category,
      isVisible: item.isVisible !== false,
    });
    setIsModalOpen(true);
  };

  const handleToggleVisibility = (id: string) => {
    const updatedAgendas = agendas.map((item) => {
      if (item.id === id) {
        return { ...item, isVisible: item.isVisible === false ? true : false };
      }
      return item;
    });
    onChange({
      ...config,
      agendas: updatedAgendas,
    });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date.trim()) {
      alert('Mohon isi judul dan tanggal agenda.');
      return;
    }

    let updatedAgendas: AgendaItem[];
    if (editingItem) {
      updatedAgendas = agendas.map((item) =>
        item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
      );
    } else {
      const newItem: AgendaItem = {
        ...formData,
        id: `agenda-${Date.now()}`,
      };
      updatedAgendas = [newItem, ...agendas];
    }

    onChange({
      ...config,
      agendas: updatedAgendas,
    });
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    const updated = agendas.filter((item) => item.id !== id);
    onChange({
      ...config,
      agendas: updated,
    });
    setDeleteConfirmId(null);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= agendas.length) return;

    const updated = [...agendas];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    onChange({
      ...config,
      agendas: updated,
    });
  };

  const filteredAgendas = agendas.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Info & Add Button */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Agenda Akademik &amp; Kesiswaan</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul agenda, kategori, atau lokasi..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Agendas List */}
      <div className="space-y-3">
        {filteredAgendas.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Belum Ada Agenda</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Tidak ada agenda yang cocok dengan pencarian Anda.'
                : 'Klik tombol "Tambah Agenda" di atas untuk menambahkan jadwal kegiatan baru.'}
            </p>
          </div>
        ) : (
          filteredAgendas.map((item, idx) => {
            const originalIndex = agendas.findIndex((a) => a.id === item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.date}
                      </span>
                      {item.isVisible === false ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                          <EyeOff className="w-3 h-3 text-slate-400" />
                          Disembunyikan
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                          <Eye className="w-3 h-3 text-emerald-600" />
                          Dimunculkan
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug break-words">
                      {item.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.time}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-end">
                  {/* Reorder Buttons */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 mr-1">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(originalIndex, 'up')}
                      disabled={originalIndex === 0}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-white cursor-pointer"
                      title="Geser Ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(originalIndex, 'down')}
                      disabled={originalIndex === agendas.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-white cursor-pointer"
                      title="Geser Ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      item.isVisible !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={item.isVisible !== false ? 'Klik untuk menyembunyikan dari publik' : 'Klik untuk memunculkan di publik'}
                  >
                    {item.isVisible !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Tampil</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden sm:inline">Sembunyi</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                    title="Edit Agenda"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {deleteConfirmId === item.id ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                      <span className="text-[11px] font-bold text-red-700 px-1">Hapus?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer"
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{editingItem ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Agenda / Kegiatan *
                </label>
                <AutoResizeTextarea
                  minRows={2}
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Penilaian Akhir Semester (PAS) Ganjil..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white font-medium"
                />
              </div>

              {/* Status Tampilan Publik Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">Status Tampilan Publik</span>
                  <span className="text-[11px] text-slate-500 block">Pilih apakah agenda ini dimunculkan di portal publik</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isVisible: !formData.isVisible })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    formData.isVisible
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {formData.isVisible ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Dimunculkan</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>Disembunyikan</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori Agenda
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="Contoh: 15 - 20 Desember 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Waktu / Jam
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="Contoh: 07:30 - 12:00 WIB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lokasi / Ruangan
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Contoh: Ruang Kelas &amp; Lab Komputer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
