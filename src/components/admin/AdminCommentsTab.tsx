import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Heart,
  Mail,
  Clock,
  X,
  RefreshCw,
  Pin,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { CommentItem, NewsArticle } from '../../types';
import {
  fetchComments,
  deleteComment,
  moderateComment,
  togglePinComment,
} from '../../lib/comments';

interface AdminCommentsTabProps {
  articles: NewsArticle[];
}

export const AdminCommentsTab: React.FC<AdminCommentsTabProps> = ({ articles }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Custom confirmation modal state to replace window.confirm for iframe and mobile safety
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load comments
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchComments();
      setComments(data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load comments in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action: Single Delete Comment
  const handleDelete = (commentId: string, authorName?: string) => {
    const confirmMsg = authorName
      ? `Apakah Anda yakin ingin menghapus komentar dari "${authorName}" secara permanen?`
      : 'Apakah Anda yakin ingin menghapus komentar ini secara permanen?';

    setShowConfirmModal({
      isOpen: true,
      title: 'Hapus Komentar secara Permanen',
      message: confirmMsg,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setDeletingId(commentId);
        try {
          await deleteComment(commentId);
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          setSelectedIds((prev) => prev.filter((id) => id !== commentId));
          setActionNotice({
            message: 'Komentar berhasil dihapus secara permanen!',
            type: 'success',
          });
          setTimeout(() => setActionNotice(null), 3500);
        } catch (err) {
          setActionNotice({
            message: 'Gagal menghapus komentar. Silakan coba lagi.',
            type: 'error',
          });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  // Action: Bulk Delete Selected Comments
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    setShowConfirmModal({
      isOpen: true,
      title: 'Hapus Semua Komentar Terpilih',
      message: `Apakah Anda yakin ingin menghapus ${selectedIds.length} komentar yang dipilih secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Semua',
      isDanger: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          for (const id of selectedIds) {
            await deleteComment(id);
          }
          setComments((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
          setSelectedIds([]);
          setActionNotice({
            message: `${selectedIds.length} komentar berhasil dihapus secara permanen.`,
            type: 'success',
          });
          setTimeout(() => setActionNotice(null), 3500);
        } catch (err) {
          setActionNotice({
            message: 'Gagal menghapus beberapa komentar.',
            type: 'error',
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Action: Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await moderateComment(id, 'approved');
      }
      setComments((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: 'approved' } : c))
      );
      setSelectedIds([]);
      setActionNotice({
        message: `${selectedIds.length} komentar berhasil disetujui dan ditayangkan!`,
        type: 'success',
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Action: Bulk Reject / Hide
  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await moderateComment(id, 'rejected');
      }
      setComments((prev) =>
        prev.map((c) => (selectedIds.includes(c.id) ? { ...c, status: 'rejected' } : c))
      );
      setSelectedIds([]);
      setActionNotice({
        message: `${selectedIds.length} komentar berhasil disembunyikan.`,
        type: 'success',
      });
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Action: Single Approve Comment
  const handleApprove = async (commentId: string) => {
    await moderateComment(commentId, 'approved');
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: 'approved' } : c))
    );
    setActionNotice({
      message: 'Komentar disetujui dan ditayangkan di publik.',
      type: 'success',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Action: Single Reject / Hide Comment
  const handleReject = async (commentId: string) => {
    await moderateComment(commentId, 'rejected');
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: 'rejected' } : c))
    );
    setActionNotice({
      message: 'Komentar disembunyikan dari publik.',
      type: 'success',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Action: Pin / Unpin Comment
  const handleTogglePin = async (commentId: string, currentPinned: boolean) => {
    const nextPinned = !currentPinned;
    await togglePinComment(commentId, nextPinned);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isPinned: nextPinned } : c))
    );
    setActionNotice({
      message: nextPinned ? 'Komentar disematkan di bagian atas.' : 'Sematan komentar dilepas.',
      type: 'success',
    });
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.userName?.toLowerCase().includes(q);
        const matchesEmail = c.userEmail?.toLowerCase().includes(q);
        const matchesContent = c.content?.toLowerCase().includes(q);
        const matchesTitle = c.targetTitle?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesContent && !matchesTitle) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Target filter
      if (targetFilter !== 'all') {
        if (targetFilter === 'general' && c.targetId !== 'general') return false;
        if (targetFilter !== 'general' && c.targetId !== targetFilter) return false;
      }

      return true;
    });
  }, [comments, searchQuery, statusFilter, targetFilter]);

  // Bulk selection toggles
  const isAllSelected = useMemo(() => {
    return (
      filteredComments.length > 0 &&
      selectedIds.length === filteredComments.length
    );
  }, [filteredComments, selectedIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComments.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Statistics
  const stats = useMemo(() => {
    const total = comments.length;
    const approved = comments.filter((c) => c.status === 'approved').length;
    const pendingOrFlagged = comments.filter(
      (c) => c.status === 'pending' || c.isFlaggedProfanity
    ).length;
    const totalLikes = comments.reduce((acc, c) => acc + (c.likesCount || 0), 0);

    return { total, approved, pendingOrFlagged, totalLikes };
  }, [comments]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Pengelola Komentar
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <p className="text-[11px] font-medium text-slate-500">Total Komentar</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
            <p className="text-[11px] font-medium text-emerald-700">Disetujui / Tayang</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-800 mt-0.5">{stats.approved}</p>
          </div>
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
            <p className="text-[11px] font-medium text-amber-700">Ditandai / Perlu Tinjauan</p>
            <p className="text-lg sm:text-xl font-bold text-amber-800 mt-0.5">{stats.pendingOrFlagged}</p>
          </div>
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
            <p className="text-[11px] font-medium text-rose-700">Total Suka (❤️)</p>
            <p className="text-lg sm:text-xl font-bold text-rose-800 mt-0.5">{stats.totalLikes}</p>
          </div>
        </div>
      </div>

      {/* Global Notification Toast */}
      {actionNotice && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-2xs ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* LIST & MODERATION TABLE */}
      <div className="space-y-4">
          {/* Controls Bar: Search & Filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, email pengirim, atau isi komentar..."
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="approved">Disetujui (Tayang)</option>
                <option value="pending">Tertahan (Pending)</option>
                <option value="rejected">Ditolak / Sembunyi</option>
              </select>

              {/* Filter Target */}
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 max-w-[200px] truncate"
              >
                <option value="all">Semua Lokasi Berita</option>
                <option value="general">Halaman Utama Portal</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    Berita: {a.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadData}
                className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Muat Ulang Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bulk Selection Toolbar */}
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>{selectedIds.length} komentar dipilih</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Setujui</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkReject}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Sembunyikan</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih</span>
                </button>
              </div>
            </div>
          )}

          {/* Table Container - Wide Memanjang Table */}
          {filteredComments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Tidak ada komentar yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">
                Komentar dari pengunjung akan tercantum di tabel ini.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3.5 text-center w-10">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-slate-500 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                          title="Pilih Semua"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-3 w-[200px]">Pengirim</th>
                      <th className="py-3 px-3 min-w-[280px]">Isi Komentar & Balasan</th>
                      <th className="py-3 px-3 w-[180px]">Lokasi / Target</th>
                      <th className="py-3 px-3 w-[140px]">Tanggal & Waktu</th>
                      <th className="py-3 px-3 w-[70px] text-center">Suka</th>
                      <th className="py-3 px-3 w-[120px] text-center">Status</th>
                      <th className="py-3 px-3 w-[180px] text-center">Aksi Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {filteredComments.map((item, idx) => {
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-blue-50/40' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                          }`}
                        >
                          {/* Checkbox Select */}
                          <td className="py-3 px-3.5 text-center align-top">
                            <button
                              type="button"
                              onClick={() => toggleSelectOne(item.id)}
                              className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer mt-1"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Pengirim */}
                          <td className="py-3 px-3 align-top">
                            <div className="flex items-start gap-2.5">
                              {item.userAvatar ? (
                                <img
                                  src={item.userAvatar}
                                  alt={item.userName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs mt-0.5"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5">
                                  {item.userName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate text-xs">
                                  {item.userName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.userEmail || 'Pengunjung Local'}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Isi Komentar */}
                          <td className="py-3 px-3 align-top">
                            <div className="space-y-1">
                              {item.parentUserName && (
                                <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md mb-1">
                                  Balasan → @{item.parentUserName}
                                </span>
                              )}

                              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line break-words max-w-md">
                                {item.content}
                              </p>
                            </div>
                          </td>

                          {/* Target / Lokasi */}
                          <td className="py-3 px-3 align-top">
                            <span className="text-[11px] font-medium text-slate-700 block truncate max-w-[170px]" title={item.targetTitle || 'Halaman Utama'}>
                              {item.targetTitle || 'Halaman Utama'}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {item.targetId}
                            </span>
                          </td>

                          {/* Waktu */}
                          <td className="py-3 px-3 align-top whitespace-nowrap text-[11px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {new Date(item.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 ml-4 block">
                              {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          {/* Suka */}
                          <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                              <Heart className="w-3 h-3 fill-rose-500" />
                              {item.likesCount || 0}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                            {item.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Tayang
                              </span>
                            )}
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                            {item.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                                <XCircle className="w-3 h-3" />
                                Sembunyi
                              </span>
                            )}
                          </td>

                          {/* Aksi Management */}
                          <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* Approve Button */}
                              {item.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(item.id)}
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                                  title="Setujui komentar"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Pin Button */}
                              {item.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(item.id, Boolean(item.isPinned))}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    item.isPinned
                                      ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                  }`}
                                  title={item.isPinned ? 'Lepas sematan' : 'Sematkan di paling atas'}
                                >
                                  <Pin className={`w-4 h-4 ${item.isPinned ? 'fill-amber-600 text-amber-700' : ''}`} />
                                </button>
                              )}

                              {/* Hide / Reject Button */}
                              {item.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleReject(item.id)}
                                  className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-lg transition-colors cursor-pointer"
                                  title="Sembunyikan dari publik"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete Permanently Button */}
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, item.userName)}
                                disabled={deletingId === item.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg border border-rose-200 hover:border-rose-600 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                title="Hapus komentar ini secara permanen"
                              >
                                {deletingId === item.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="p-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Menampilkan <strong>{filteredComments.length}</strong> dari <strong>{comments.length}</strong> komentar.
                </span>
                <span className="text-[11px]">
                  * Dihapus permanen dari penyimpanan Firestore & lokal.
                </span>
              </div>
            </div>
          )}
        </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                showConfirmModal.isDanger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50/80 text-blue-600'
              }`}>
                {showConfirmModal.isDanger ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {showConfirmModal.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {showConfirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const callback = showConfirmModal.onConfirm;
                  setShowConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                  await callback();
                }}
                className={`px-4 py-2 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-sm ${
                  showConfirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {showConfirmModal.confirmText || 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
