import React, { useState } from 'react';
import { SchoolConfig, SchoolUser } from '../../types';
import { Users, Plus, Trash2, Edit2, Key, AlertCircle, ShieldAlert, Check } from 'lucide-react';

interface AdminUsersTabProps {
  config: SchoolConfig;
  onChange: (updated: SchoolConfig) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ config, onChange }) => {
  const users = config.users || [];
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const name = newUserName.trim();
    const password = newUserPassword.trim();

    if (!name || !password) {
      setErrorMsg('Nama dan password tidak boleh kosong.');
      return;
    }

    if (password === 'superadmin123' || password === (config.adminPassword || 'smpn1bks')) {
      setErrorMsg('Password ini dicadangkan untuk peran admin utama/superadmin.');
      return;
    }

    const isPasswordDuplicate = users.some((u) => u.password === password);
    if (isPasswordDuplicate) {
      setErrorMsg('Password ini sudah digunakan oleh admin lain. Password harus unik.');
      return;
    }

    const updatedUsers = [...users, { name, password }];
    onChange({
      ...config,
      users: updatedUsers,
    });

    setNewUserName('');
    setNewUserPassword('');
  };

  const handleDeleteUser = (indexToDelete: number) => {
    const updatedUsers = users.filter((_, i) => i !== indexToDelete);
    onChange({
      ...config,
      users: updatedUsers,
    });
    if (editingIndex === indexToDelete) {
      setEditingIndex(null);
    }
  };

  const handleStartEdit = (index: number, user: SchoolUser) => {
    setEditingIndex(index);
    setEditingName(user.name);
    setEditingPassword(user.password);
    setErrorMsg('');
  };

  const handleSaveEdit = (indexToSave: number) => {
    setErrorMsg('');
    const name = editingName.trim();
    const password = editingPassword.trim();

    if (!name || !password) {
      setErrorMsg('Nama dan password tidak boleh kosong.');
      return;
    }

    if (password === 'superadmin123' || password === (config.adminPassword || 'smpn1bks')) {
      setErrorMsg('Password ini dicadangkan untuk peran admin utama/superadmin.');
      return;
    }

    const isPasswordDuplicate = users.some((u, i) => i !== indexToSave && u.password === password);
    if (isPasswordDuplicate) {
      setErrorMsg('Password ini sudah digunakan oleh admin lain. Password harus unik.');
      return;
    }

    const updatedUsers = users.map((u, i) => (i === indexToSave ? { name, password } : u));
    onChange({
      ...config,
      users: updatedUsers,
    });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form to Add User */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 self-start">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Plus className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Tambah Akun Admin Baru</h3>
          </div>

          <form onSubmit={handleAddUser} className="space-y-3.5">
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap Admin
              </label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Misal: Andini Errananda"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi (Hanya Password)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Misal: andini"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-900 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Kata sandi unik yang langsung digunakan saat login untuk masuk sebagai pengguna ini.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambahkan Pengguna</span>
            </button>
          </form>
        </div>

        {/* Users List Table */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Daftar Pengguna Aktif</h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 font-bold text-slate-600 bg-slate-100 rounded-full border border-slate-200">
              {users.length} Akun
            </span>
          </div>

          {users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-semibold">Belum ada akun admin tambahan</p>
              <p className="text-[10px]">Hanya akun Admin Utama dan Super Admin bawaan yang aktif saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-2">No</th>
                    <th className="py-3 px-2">Nama Pengguna</th>
                    <th className="py-3 px-2">Kata Sandi</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user, index) => {
                    const isEditing = editingIndex === index;
                    return (
                      <tr key={index} className="text-xs font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-2 text-slate-400 font-bold">{index + 1}</td>
                        <td className="py-3.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          ) : (
                            <span className="font-bold text-slate-800">{user.name}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                            />
                          ) : (
                            <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold">
                              {user.password}
                            </code>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(index)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Simpan"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Batal"
                                >
                                  Batal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(index, user)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Ubah"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(index)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
