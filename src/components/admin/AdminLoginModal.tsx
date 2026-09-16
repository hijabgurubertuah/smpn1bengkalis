import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  configuredPassword?: string;
  schoolName: string;
  users?: Array<{ name: string; password: string }>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  configuredPassword = 'smpn1bks',
  users = [],
}) => {
  // Lock body scroll while login modal is open
  useBodyScrollLock(isOpen);

  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const inputVal = inputPassword.trim().toLowerCase();
    const defaultAdminPassword = (configuredPassword || 'smpn1bks').trim().toLowerCase();

    setTimeout(() => {
      let matchedRole: 'superadmin' | 'admin' | null = null;
      let matchedName = '';

      if (inputVal === 'superadmin123') {
        matchedRole = 'superadmin';
        matchedName = 'Super Admin';
      } else if (users && users.length > 0) {
        const foundUser = users.find((u) => u.password?.trim().toLowerCase() === inputVal);
        if (foundUser) {
          matchedRole = 'admin';
          matchedName = foundUser.name;
        }
      }

      if (!matchedRole && inputVal === defaultAdminPassword) {
        matchedRole = 'admin';
        matchedName = 'Admin Utama';
      }

      if (matchedRole) {
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_role', matchedRole);
        localStorage.setItem('admin_user_name', matchedName);
        setIsSubmitting(false);
        setInputPassword('');
        onSuccess();
      } else {
        setIsSubmitting(false);
        setErrorMsg('Kata sandi salah. Silakan coba kembali.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3.5 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-slate-950/75 backdrop-blur-xs overscroll-contain touch-none animate-in fade-in duration-200 h-[100dvh] w-full">
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative overscroll-contain animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Minimal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-400/30 text-blue-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Login
            </h2>
          </div>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inputPassword}
              className="w-2/3 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{isSubmitting ? 'Memverifikasi...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
