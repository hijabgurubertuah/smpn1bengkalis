import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Heart,
  Send,
  ShieldCheck,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit2,
  Edit3,
  Trash2,
  Check,
  X,
  Pin,
  CornerDownRight,
} from 'lucide-react';
import { CommentItem, CommentModerationConfig } from '../../types';
import {
  fetchComments,
  postComment,
  toggleLikeComment,
  getBrowserDeviceId,
  getSavedCommenterName,
  saveCommenterName,
  saveLocalGuestProfile,
  subscribeToComments,
  checkProfanity,
  containsLink,
  getProfanityFilterConfig,
  subscribeToProfanityFilterConfig,
  updateCommentContent,
  deleteComment,
} from '../../lib/comments';

interface CommentsSectionProps {
  targetId?: string; // 'general' or articleId
  targetTitle?: string;
  compact?: boolean;
  className?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  targetId = 'general',
  targetTitle = 'Halaman Utama Portal',
  compact = false,
  className = '',
}) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [customName, setCustomName] = useState<string>(() => getSavedCommenterName());
  const [nameError, setNameError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [filterConfig, setFilterConfig] = useState<CommentModerationConfig>(() => getProfanityFilterConfig());
  const [profanityWarning, setProfanityWarning] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const formCardRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reply states
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyTargetUser, setReplyTargetUser] = useState<string>('');
  const [replyRootParentId, setReplyRootParentId] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const handleNameChange = (val: string) => {
    setCustomName(val);
    saveCommenterName(val);
    saveLocalGuestProfile(val);
    if (nameError) setNameError(null);
  };

  // Auto expand reply textarea
  useEffect(() => {
    if (replyingToId && replyTextareaRef.current) {
      replyTextareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(replyTextareaRef.current.scrollHeight, 42), 200);
      replyTextareaRef.current.style.height = `${newHeight}px`;
    }
  }, [replyText, replyingToId]);

  const handleStartReply = (comment: CommentItem) => {
    const rootId = comment.parentId || comment.id;
    setReplyingToId(comment.id);
    setReplyTargetUser(comment.userName);
    setReplyRootParentId(rootId);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyTargetUser('');
    setReplyRootParentId('');
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !replyingToId) return;

    const nameToUse = customName.trim();
    if (!nameToUse) {
      setErrorMessage('Silakan tulis nama Anda terlebih dahulu sebelum membalas komentar.');
      return;
    }

    saveCommenterName(nameToUse);
    const guestUser = saveLocalGuestProfile(nameToUse);

    const { isProfane } = checkProfanity(replyText, filterConfig.badWords);
    if (isProfane && filterConfig.autoHideFlagged) {
      setSuccessNotice('Balasan Anda telah dikirim dan menunggu tinjauan admin.');
      setTimeout(() => setSuccessNotice(null), 4000);
    }

    setIsSubmittingReply(true);
    try {
      await postComment({
        targetId,
        targetTitle,
        userName: nameToUse,
        userEmail: guestUser.email,
        content: replyText.trim(),
        parentId: replyRootParentId,
        parentUserName: replyTargetUser,
      });

      await loadTargetComments();
      handleCancelReply();
    } catch (err) {
      setErrorMessage('Gagal mengirim balasan. Mohon coba lagi.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Auto expand main textarea as user types long comments
  useEffect(() => {
    if (mainTextareaRef.current) {
      mainTextareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(mainTextareaRef.current.scrollHeight, 42), 260);
      mainTextareaRef.current.style.height = `${newHeight}px`;
    }
  }, [commentText]);

  // Auto expand edit textarea as user edits text
  useEffect(() => {
    if (editingCommentId && editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(editTextareaRef.current.scrollHeight, 42), 220);
      editTextareaRef.current.style.height = `${newHeight}px`;
    }
  }, [editingText, editingCommentId]);

  const scrollToFormCard = () => {
    if (formCardRef.current) {
      formCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Trigger multi-stage scroll to handle iOS Safari / Android keyboard pop-up animation delays
    setTimeout(scrollToFormCard, 50);
    setTimeout(scrollToFormCard, 250);
    setTimeout(scrollToFormCard, 500);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleViewportResize = () => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') {
        scrollToFormCard();
      }
    };
    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  const handleStartEdit = (comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
    setConfirmDeleteId(null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) {
      await executeDeleteComment(commentId);
      return;
    }
    setIsSavingEdit(true);
    try {
      await updateCommentContent(commentId, editingText.trim());
      setEditingCommentId(null);
      setEditingText('');
      await loadTargetComments();
    } catch (err) {
      console.error('Failed to update comment:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const executeDeleteComment = async (commentId: string) => {
    // 1. Instant optimistic UI removal (no native browser popups that get blocked on HP)
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (editingCommentId === commentId) {
      setEditingCommentId(null);
      setEditingText('');
    }
    setConfirmDeleteId(null);

    // 2. Execute deletion in storage & cloud database
    try {
      await deleteComment(commentId);
      await loadTargetComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Load comments for target
  const loadTargetComments = async () => {
    try {
      const data = await fetchComments(targetId);
      setComments(data);
    } catch (err) {
      console.warn('Failed to load comments for target:', err);
    }
  };

  useEffect(() => {
    loadTargetComments();

    // Subscribe to realtime comments
    const unsubscribeComments = subscribeToComments(targetId, (updatedList) => {
      setComments(updatedList);
    });

    // Listen for local storage changes (e.g. from Admin Dashboard tab deletion)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smpn1_cached_comments_v1') {
        loadTargetComments();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (unsubscribeComments) unsubscribeComments();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [targetId]);

  // Subscribe to real-time profanity filter config from cloud
  useEffect(() => {
    const unsub = subscribeToProfanityFilterConfig((cfg) => {
      setFilterConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Realtime profanity check on typing
  useEffect(() => {
    if (!commentText.trim()) {
      setProfanityWarning([]);
      return;
    }
    const { isProfane, matchedWords } = checkProfanity(
      commentText,
      filterConfig.badWords
    );
    if (isProfane && filterConfig.profanityFilterEnabled) {
      setProfanityWarning(matchedWords);
    } else {
      setProfanityWarning([]);
    }
  }, [commentText, filterConfig]);

  // Handle Submit Comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setNameError(null);

    const nameToUse = customName.trim();
    if (!nameToUse) {
      setNameError('Silakan masukkan nama Anda.');
      nameInputRef.current?.focus();
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) {
      setErrorMessage('Isi komentar tidak boleh kosong.');
      mainTextareaRef.current?.focus();
      return;
    }

    if (trimmed.length < 3) {
      setErrorMessage('Komentar terlalu pendek (minimal 3 karakter).');
      return;
    }

    setIsSubmitting(true);
    try {
      saveCommenterName(nameToUse);
      const guestUser = saveLocalGuestProfile(nameToUse);

      const saved = await postComment({
        targetId,
        targetTitle,
        userName: nameToUse,
        userEmail: guestUser.email,
        content: trimmed,
      });

      setCommentText('');

      if (saved.status === 'pending') {
        setSuccessNotice('Komentar Anda telah dikirim dan menunggu tinjauan admin.');
        setTimeout(() => setSuccessNotice(null), 4000);
      } else {
        setSuccessNotice(null);
        await loadTargetComments();
      }
    } catch (err) {
      setErrorMessage('Gagal mengirim komentar. Mohon periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for stable device/user identifier
  const getDeviceUserIdentifier = (): string => {
    return getBrowserDeviceId();
  };

  // Handle Like Comment (1 like per browser)
  const handleLike = (commentId: string) => {
    const identifier = getDeviceUserIdentifier();

    // 1. Instant synchronous optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const likedList = c.likedByEmails || [];
          const hasLiked = likedList.includes(identifier);
          const newLikedList = hasLiked
            ? likedList.filter((e) => e !== identifier)
            : [...likedList, identifier];
          const newLikesCount = hasLiked
            ? Math.max(0, (c.likesCount || 1) - 1)
            : (c.likesCount || 0) + 1;

          return {
            ...c,
            likesCount: newLikesCount,
            likedByEmails: newLikedList,
          };
        }
        return c;
      })
    );

    // 2. Persist in background asynchronously
    toggleLikeComment(commentId, identifier).catch((err) => {
      console.warn('Failed to sync like status:', err);
    });
  };

  // Filter and group visible comments:
  // 1. Filter approved, or pending if posted by this browser
  // 2. Separate into topLevelComments and repliesMap
  // 3. Sort topLevel (pinned first, then newest) and replies (oldest first)
  const { topLevelComments, repliesMap, totalVisibleCount } = useMemo(() => {
    const browserId = getBrowserDeviceId();
    const guestEmail = `${browserId}@tamu.portal`;

    // Deduplicate comments by unique ID
    const uniqueMap = new Map<string, CommentItem>();
    comments.forEach((c) => {
      if (c && c.id) {
        uniqueMap.set(c.id, c);
      }
    });
    const uniqueComments = Array.from(uniqueMap.values());

    const approvedOrOwn = uniqueComments.filter((c) => {
      if (c.status === 'approved') return true;
      if (c.status === 'pending' && c.userEmail && c.userEmail.toLowerCase() === guestEmail.toLowerCase()) {
        return true;
      }
      return false;
    });

    const topLevel: CommentItem[] = [];
    const replies: Record<string, CommentItem[]> = {};

    const topLevelIds = new Set(approvedOrOwn.filter((c) => !c.parentId).map((c) => c.id));

    approvedOrOwn.forEach((c) => {
      if (c.parentId && (topLevelIds.has(c.parentId) || uniqueComments.some((p) => p.id === c.parentId))) {
        if (!replies[c.parentId]) replies[c.parentId] = [];
        replies[c.parentId].push(c);
      } else {
        topLevel.push(c);
      }
    });

    topLevel.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    Object.keys(replies).forEach((parentId) => {
      replies[parentId].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeA - timeB;
      });
    });

    return {
      topLevelComments: topLevel,
      repliesMap: replies,
      totalVisibleCount: approvedOrOwn.length,
    };
  }, [comments]);

  const userIdentifier = getDeviceUserIdentifier();

  const renderCommentCard = (comment: CommentItem, isReply: boolean = false) => {
    const hasLiked = comment.likedByEmails?.includes(userIdentifier);
    const isAuthor =
      (comment.userEmail && comment.userEmail === `${userIdentifier}@tamu.portal`) ||
      (Boolean(customName.trim()) && comment.userName.trim().toLowerCase() === customName.trim().toLowerCase() && Boolean(comment.userEmail?.includes(userIdentifier)));

    return (
      <div
        key={comment.id}
        className={`bg-white border rounded-xl p-2.5 sm:p-3 shadow-2xs transition-all ${
          comment.status === 'pending'
            ? 'border-amber-300 bg-amber-50/40'
            : isReply
            ? 'border-slate-200/80 bg-slate-50/40'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Header Komentar */}
        <div className="flex items-start justify-between gap-2">
          {/* Left: Avatar & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            {comment.userAvatar ? (
              <img
                src={comment.userAvatar}
                alt={comment.userName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {comment.userName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  {comment.userName}
                </span>

                {comment.isPinned && !isReply && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-800 border border-amber-300/80 px-1.5 py-0.2 rounded-md font-bold shadow-2xs">
                    <Pin className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                    <span>Disematkan</span>
                  </span>
                )}

                {isAuthor && (
                  <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md font-semibold">
                    Anda
                  </span>
                )}
              </div>

              <div className="text-[10px] text-slate-400 mt-0.5">
                <span>
                  {new Date(comment.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions (Author Edit & Delete + Reply + Like) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {comment.status === 'pending' && (
              <span className="text-[9px] sm:text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                Menunggu Tinjauan
              </span>
            )}

            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={() => handleStartEdit(comment)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-all cursor-pointer"
                  title="Edit komentar saya"
                  aria-label="Edit komentar"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                </button>

                {confirmDeleteId === comment.id ? (
                  <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-in fade-in duration-150 shrink-0">
                    <span className="text-[10px] font-bold text-rose-700">Hapus?</span>
                    <button
                      type="button"
                      onClick={() => executeDeleteComment(comment.id)}
                      className="px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(comment.id)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all cursor-pointer"
                    title="Hapus komentar saya"
                    aria-label="Hapus komentar"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                )}
              </>
            )}

            {/* Tombol Balas (Hanya untuk komentar tingkat utama / bukan balasan) */}
            {!isReply && (
              <button
                type="button"
                onClick={() => handleStartReply(comment)}
                className="p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/80 transition-all cursor-pointer active:scale-90"
                title="Balas komentar ini"
                aria-label="Balas komentar"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </button>
            )}

            {/* Tombol Like */}
            <button
              type="button"
              onClick={() => handleLike(comment.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-90 ${
                hasLiked
                  ? 'text-rose-600 bg-rose-50 border border-rose-200'
                  : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
              title="Sukai komentar ini"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform ${
                  hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'
                }`}
              />
              <span className="text-[11px] font-bold">{comment.likesCount || 0}</span>
            </button>
          </div>
        </div>

        {/* Comment Content / Inline Edit Form */}
        {editingCommentId === comment.id ? (
          <div className="mt-2 pl-9 sm:pl-10.5 space-y-2">
            <textarea
              ref={editTextareaRef}
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              placeholder="Ketik komentar Anda (kosongkan untuk menghapus)..."
              className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 resize-none transition-all overflow-y-auto min-h-[42px] max-h-[220px]"
              rows={1}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Batal
              </button>

              {editingText.trim() === '' ? (
                <button
                  type="button"
                  onClick={() => executeDeleteComment(comment.id)}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
                  title="Semua teks telah dihapus. Klik untuk menghapus komentar."
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Komentar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSaveEdit(comment.id)}
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 pl-9 sm:pl-10.5">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">
              {comment.content}
            </p>
          </div>
        )}

        {/* Inline Reply Form Box */}
        {replyingToId === comment.id && (
          <div className="mt-2.5 pl-9 sm:pl-10.5 border-l-2 border-blue-400/80 animate-in fade-in duration-200">
            <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-blue-800 font-bold">
                <span className="flex items-center gap-1">
                  <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Membalas <strong className="text-blue-900">@{replyTargetUser}</strong></span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {!customName.trim() && (
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Nama Anda (wajib untuk membalas)..."
                  maxLength={40}
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
                />
              )}

              <textarea
                ref={replyTextareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Tulis balasan untuk @${replyTargetUser}...`}
                className="w-full text-xs sm:text-sm p-2 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 resize-none transition-all overflow-y-auto min-h-[42px] max-h-[180px]"
                rows={1}
                autoFocus
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isSubmittingReply || !replyText.trim() || !customName.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Balasan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
              Tanggapan & Komentar
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              {totalVisibleCount} tanggapan publik
            </p>
          </div>
        </div>
      </div>

      {/* Comment Form Card (No login required - open for everyone) */}
      <div
        ref={formCardRef}
        className={`bg-slate-50/95 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 mb-3.5 shadow-2xs focus-within:ring-2 focus-within:ring-blue-400/30 focus-within:border-blue-400 transition-all scroll-mt-6 sm:scroll-mt-24 ${
          isFocused ? 'border-blue-400/80 bg-blue-50/20' : ''
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Identity & Name Input Bar */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {(customName.trim() || 'P').charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <input
                ref={nameInputRef}
                type="text"
                value={customName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Tuliskan Nama Anda di sini..."
                maxLength={40}
                className={`w-full text-xs sm:text-sm font-semibold px-2.5 py-1.5 bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 transition-all ${
                  nameError
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {nameError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}

          {/* Textarea with Send Icon Button placed on the right side */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={mainTextareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={handleInputFocus}
                onTouchStart={handleInputFocus}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Tuliskan komentar santun Anda di sini... (Tekan Enter untuk kirim)"
                rows={1}
                className="w-full text-xs sm:text-sm px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-slate-800 placeholder-slate-400 resize-none transition-all shadow-2xs overflow-y-auto min-h-[42px] max-h-[260px]"
                maxLength={800}
              />
            </div>

            {/* Send Button: Icon Only */}
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              title="Kirim Komentar"
              aria-label="Kirim Komentar"
              className="h-[38px] w-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer disabled:cursor-not-allowed mb-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Link Plain Text Info Notice */}
          {containsLink(commentText) && (
            <div className="flex items-start gap-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px] leading-tight">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Informasi Tautan:</span> Tautan (link) yang Anda tulis tidak dapat diklik dan hanya tampil sebagai teks biasa.
              </div>
            </div>
          )}

          {/* Profanity Warning */}
          {profanityWarning.length > 0 && (
            <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-tight">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Perhatian:</span> Kata tidak pantas terdeteksi ({profanityWarning.join(', ')}). Komentar akan ditinjau terlebih dahulu oleh Admin.
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}
        </form>
      </div>

      {/* List of Comments */}
      <div className="space-y-3">
        {topLevelComments.map((parentComment) => {
          const childReplies = repliesMap[parentComment.id] || [];
          return (
            <div key={parentComment.id} className="space-y-2">
              {/* Top Level Parent Comment */}
              {renderCommentCard(parentComment, false)}

              {/* Indented Child Replies Thread */}
              {childReplies.length > 0 && (
                <div className="ml-4 sm:ml-7 pl-2.5 sm:pl-3 border-l-2 border-blue-200/80 space-y-2 mt-1.5">
                  {childReplies.map((reply) => renderCommentCard(reply, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
