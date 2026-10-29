import React, { useEffect, useState } from 'react';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { operationsApi, disastersApi, locationsApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const RescueOperations: React.FC = () => {
  const [operations, setOperations] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ status: 'Planned', people_rescued: 0 });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canEdit = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, dRes, lRes]: any[] = await Promise.all([
        operationsApi.getAll({ search, status: filterStatus }),
        disastersApi.getAll(),
        locationsApi.getAll(),
      ]);
      setOperations(oRes.data || []);
      setDisasters(dRes.data || []);
      setLocations(lRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const openModal = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { ...item, start_time: item.start_time?.slice(0, 16), end_time: item.end_time?.slice(0, 16) } : { status: 'Planned', people_rescued: 0 });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_id || !form.operation_name) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      if (editItem) { await operationsApi.update(editItem.operation_id, form); toast.success('Operation updated.'); }
      else { await operationsApi.create(form); toast.success('Rescue operation created.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const totalRescued = operations.reduce((s: number, o: any) => s + (o.people_rescued || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Rescue Operations" subtitle={`${operations.length} operations, ${totalRescued.toLocaleString()} rescued`} icon={<Shield size={22} />}
        actions={canEdit && <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> New Operation</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Active', 'Planned', 'Completed', 'Cancelled'].map(s => (
          <div key={s} className="card text-center cursor-pointer" onClick={() => setFilterStatus(s === filterStatus ? '' : s)}>
            <div className="text-2xl font-bold text-gray-900">{operations.filter(o => o.status === s).length}</div>
            <div className="text-xs font-medium text-gray-500 mt-1">{s}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search operations..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {['Planned', 'Active', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : operations.length === 0 ? (
          <EmptyState icon={<Shield size={48} />} title="No rescue operations" action={canEdit && <button onClick={() => openModal()} className="btn-primary">New Operation</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['#', 'Operation', 'Disaster', 'Location', 'Coordinator', 'Start', 'Rescued', 'Status', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {operations.map((o: any, i: number) => (
                  <tr key={o.operation_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium">{o.operation_name}</div>
                      {o.description && <div className="text-xs text-gray-400 truncate max-w-xs">{o.description}</div>}
                    </td>
                    <td className="table-cell text-xs">{o.disaster_name}</td>
                    <td className="table-cell text-xs text-gray-500">{o.city || o.location_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-500">{o.coordinator_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{o.start_time ? format(new Date(o.start_time), 'MMM d, HH:mm') : '—'}</td>
                    <td className="table-cell font-bold text-green-700">{o.people_rescued || 0}</td>
                    <td className="table-cell"><StatusBadge status={o.status} /></td>
                    <td className="table-cell">
                      {canEdit && <div className="flex gap-1">
                        <button onClick={() => openModal(o)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                        {user?.role_name === 'Admin' && <button onClick={() => setDeleteId(o.operation_id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>}
                      </div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Operation' : 'New Rescue Operation'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Operation Name *</label>
              <input className="form-input" value={form.operation_name || ''} onChange={e => setForm({ ...form, operation_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Disaster *</label>
              <select className="form-select" value={form.disaster_id || ''} onChange={e => setForm({ ...form, disaster_id: e.target.value })} required>
                <option value="">Select disaster</option>
                {disasters.map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <select className="form-select" value={form.location_id || ''} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                <option value="">Select location</option>
                {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Start Time</label>
              <input type="datetime-local" className="form-input" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="datetime-local" className="form-input" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div>
              <label className="form-label">People Rescued</label>
              <input type="number" className="form-input" value={form.people_rescued || 0} onChange={e => setForm({ ...form, people_rescued: e.target.value })} min="0" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || 'Planned'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Planned', 'Active', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-input h-24 resize-none" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Create Operation'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && operationsApi.delete(deleteId).then(() => { toast.success('Deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Operation" message="Delete this rescue operation?" confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default RescueOperations;
