import React, { useEffect, useState } from 'react';
import { UserCog, Edit2, Trash2 } from 'lucide-react';
import { usersApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const Users: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, rRes]: any[] = await Promise.all([usersApi.getAll(), usersApi.getRoles()]);
      const allUsers = uRes.data || [];
      setUsers(search ? allUsers.filter((u: any) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : allUsers);
      setRoles(rRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openModal = (item: any) => { setEditItem(item); setForm({ full_name: item.full_name, email: item.email, phone: item.phone, address: item.address, status: item.status, role_id: roles.find(r => r.role_name === item.role_name)?.role_id }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.update(editItem.user_id, form);
      toast.success('User updated.');
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const roleColors: Record<string, string> = { Admin: 'bg-purple-100 text-purple-700', 'Disaster Coordinator': 'bg-blue-100 text-blue-700', Volunteer: 'bg-green-100 text-green-700', Donor: 'bg-orange-100 text-orange-700' };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="User Management" subtitle={`${users.length} registered users`} icon={<UserCog size={22} />} />

      <div className="card p-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search users by name or email..." className="max-w-md" />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <EmptyState icon={<UserCog size={48} />} title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['#', 'User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u: any, i: number) => (
                  <tr key={u.user_id} className={`table-row ${u.user_id === currentUser?.user_id ? 'bg-blue-50/20' : ''}`}>
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">{u.full_name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="font-medium">{u.full_name} {u.user_id === currentUser?.user_id && <span className="text-xs text-blue-500">(you)</span>}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-600">{u.email}</td>
                    <td className="table-cell text-xs text-gray-500">{u.phone || '—'}</td>
                    <td className="table-cell"><span className={`badge ${roleColors[u.role_name] || 'bg-gray-100 text-gray-600'}`}>{u.role_name}</span></td>
                    <td className="table-cell"><StatusBadge status={u.status} /></td>
                    <td className="table-cell text-xs text-gray-400">{u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openModal(u)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                        {u.user_id !== currentUser?.user_id && (
                          <button onClick={() => setDeleteId(u.user_id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role_id || ''} onChange={e => setForm({ ...form, role_id: e.target.value })}>
                {roles.map((r: any) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['active', 'inactive', 'suspended'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Update User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && usersApi.delete(deleteId).then(() => { toast.success('User deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete User" message="Permanently delete this user account? This cannot be undone." confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default Users;
