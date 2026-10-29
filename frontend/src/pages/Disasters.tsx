import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Edit2, Trash2, Eye, Filter } from 'lucide-react';
import { disastersApi, locationsApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, SeverityBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const SEVERITIES = ['Low', 'Moderate', 'High', 'Critical'];
const STATUSES = ['Reported', 'Active', 'Under Control', 'Resolved'];

const Disasters: React.FC = () => {
  const [disasters, setDisasters] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ severity: 'Moderate', status: 'Reported' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';
  const isCoordinator = user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, tRes]: any[] = await Promise.all([
        disastersApi.getAll({ status: filterStatus, severity: filterSeverity, type: filterType, search }),
        disastersApi.getTypes()
      ]);
      setDisasters(dRes.data || []);
      setTypes(tRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus, filterSeverity, filterType, search]);

  const openModal = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { ...item, start_date: item.start_date?.split('T')[0], end_date: item.end_date?.split('T')[0] } : { severity: 'Moderate', status: 'Reported' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_name || !form.disaster_type_id || !form.start_date || !form.severity) {
      toast.error('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await disastersApi.update(editItem.disaster_id, form);
        toast.success('Disaster updated successfully.');
      } else {
        await disastersApi.create(form);
        toast.success('Disaster registered successfully.');
      }
      setModalOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await disastersApi.delete(id);
      toast.success('Disaster deleted.');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Disaster Management"
        subtitle={`${disasters.length} disaster${disasters.length !== 1 ? 's' : ''} registered`}
        icon={<AlertTriangle size={22} />}
        actions={
          (isAdmin || isCoordinator) && (
            <button onClick={() => openModal()} className="btn-primary">
              <Plus size={16} /> Register Disaster
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search disasters..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="form-select w-auto">
          <option value="">All Severities</option>
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-auto">
          <option value="">All Types</option>
          {types.map((t: any) => <option key={t.disaster_type_id} value={t.disaster_type_id}>{t.type_name}</option>)}
        </select>
        {(filterStatus || filterSeverity || filterType || search) && (
          <button onClick={() => { setFilterStatus(''); setFilterSeverity(''); setFilterType(''); setSearch(''); }} className="text-xs text-gray-500 hover:text-red-600">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : disasters.length === 0 ? (
          <EmptyState icon={<AlertTriangle size={48} />} title="No disasters found" description="Register the first disaster or adjust your filters." action={
            (isAdmin || isCoordinator) && <button onClick={() => openModal()} className="btn-primary">Register Disaster</button>
          } />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Disaster Name</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Severity</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Start Date</th>
                  <th className="table-header">Reported By</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disasters.map((d: any, idx: number) => (
                  <tr key={d.disaster_id} className="table-row">
                    <td className="table-cell text-gray-400">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="font-semibold text-gray-900">{d.disaster_name}</div>
                      {d.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{d.description}</div>}
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">{d.type_name}</span>
                    </td>
                    <td className="table-cell"><SeverityBadge severity={d.severity} /></td>
                    <td className="table-cell"><StatusBadge status={d.status} /></td>
                    <td className="table-cell text-gray-500 text-xs">{d.start_date ? format(new Date(d.start_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="table-cell text-gray-500 text-xs">{d.reported_by_name || '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {(isAdmin || isCoordinator) && (
                          <>
                            <button onClick={() => openModal(d)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={15} />
                            </button>
                            {isAdmin && (
                              <button onClick={() => setDeleteId(d.disaster_id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
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

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Disaster' : 'Register New Disaster'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Disaster Name *</label>
              <input type="text" className="form-input" value={form.disaster_name || ''} onChange={e => setForm({ ...form, disaster_name: e.target.value })} required placeholder="e.g., Maharashtra Flood 2024" />
            </div>
            <div>
              <label className="form-label">Disaster Type *</label>
              <select className="form-select" value={form.disaster_type_id || ''} onChange={e => setForm({ ...form, disaster_type_id: e.target.value })} required>
                <option value="">Select type</option>
                {types.map((t: any) => <option key={t.disaster_type_id} value={t.disaster_type_id}>{t.type_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Severity *</label>
              <select className="form-select" value={form.severity || 'Moderate'} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || 'Reported'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-input h-24 resize-none" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the disaster..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update Disaster' : 'Register Disaster'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Disaster"
        message="Are you sure you want to delete this disaster? All related data (affected people, operations, requests) may be affected."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};

export default Disasters;
