import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { reliefCentersApi, locationsApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar, CapacityBar } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const ReliefCenters: React.FC = () => {
  const [centers, setCenters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ center_type: 'Shelter', status: 'Active', current_occupancy: 0 });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canEdit = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, lRes]: any[] = await Promise.all([
        reliefCentersApi.getAll({ search, status: filterStatus }),
        locationsApi.getAll(),
      ]);
      setCenters(cRes.data || []);
      setLocations(lRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const openModal = (item?: any) => {
    setEditItem(item || null);
    setForm(item || { center_type: 'Shelter', status: 'Active', current_occupancy: 0 });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location_id || !form.center_name || !form.center_type || !form.capacity) { toast.error('Fill required fields.'); return; }
    if (parseInt(form.current_occupancy) > parseInt(form.capacity)) { toast.error('Occupancy cannot exceed capacity.'); return; }
    setSaving(true);
    try {
      if (editItem) { await reliefCentersApi.update(editItem.center_id, form); toast.success('Center updated.'); }
      else { await reliefCentersApi.create(form); toast.success('Relief center created.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const stats = {
    active: centers.filter(c => c.status === 'Active').length,
    full: centers.filter(c => c.status === 'Full').length,
    totalCapacity: centers.reduce((a: number, c: any) => a + c.capacity, 0),
    totalOccupied: centers.reduce((a: number, c: any) => a + c.current_occupancy, 0),
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Relief Centers" subtitle={`${centers.length} centers registered`} icon={<Building2 size={22} />}
        actions={canEdit && <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Add Center</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Centers', value: stats.active, cls: 'bg-green-50 text-green-700' },
          { label: 'Full Centers', value: stats.full, cls: 'bg-red-50 text-red-700' },
          { label: 'Total Capacity', value: stats.totalCapacity.toLocaleString(), cls: 'bg-blue-50 text-blue-700' },
          { label: 'Current Occupancy', value: stats.totalOccupied.toLocaleString(), cls: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search centers..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {['Active', 'Full', 'Closed', 'Under Setup'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Cards */}
      {loading ? <LoadingSpinner /> : centers.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="No relief centers" action={canEdit && <button onClick={() => openModal()} className="btn-primary">Add Center</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {centers.map((c: any) => {
            const pct = c.capacity > 0 ? (c.current_occupancy / c.capacity) * 100 : 0;
            const statusColor = pct >= 90 ? 'border-red-200' : pct >= 70 ? 'border-amber-200' : 'border-green-200';
            return (
              <div key={c.center_id} className={`card hover:shadow-md transition-shadow border-l-4 ${statusColor}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.center_name}</h3>
                    <p className="text-xs text-gray-500">{c.location_name}, {c.city}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={c.status} />
                    {canEdit && (
                      <>
                        <button onClick={() => openModal(c)} className="p-1 hover:bg-blue-50 rounded"><Edit2 size={14} className="text-gray-400" /></button>
                        {user?.role_name === 'Admin' && <button onClick={() => setDeleteId(c.center_id)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={14} className="text-gray-400" /></button>}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c.center_type}</span>
                  {c.contact_number && <span className="text-xs text-gray-500">📞 {c.contact_number}</span>}
                </div>
                <CapacityBar current={c.current_occupancy} total={c.capacity} />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Occupied: <strong className="text-gray-700">{c.current_occupancy}</strong></span>
                  <span>Available: <strong className="text-green-700">{c.capacity - c.current_occupancy}</strong></span>
                  <span>Total: <strong>{c.capacity}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Relief Center' : 'Add Relief Center'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Center Name *</label>
              <input className="form-input" value={form.center_name || ''} onChange={e => setForm({ ...form, center_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Location *</label>
              <select className="form-select" value={form.location_id || ''} onChange={e => setForm({ ...form, location_id: e.target.value })} required>
                <option value="">Select location</option>
                {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Center Type *</label>
              <select className="form-select" value={form.center_type || 'Shelter'} onChange={e => setForm({ ...form, center_type: e.target.value })}>
                {['Shelter', 'Food Distribution', 'Medical', 'Multi-Purpose'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Capacity *</label>
              <input type="number" className="form-input" value={form.capacity || ''} onChange={e => setForm({ ...form, capacity: e.target.value })} required min="1" />
            </div>
            <div>
              <label className="form-label">Current Occupancy</label>
              <input type="number" className="form-input" value={form.current_occupancy || 0} onChange={e => setForm({ ...form, current_occupancy: e.target.value })} min="0" />
            </div>
            <div>
              <label className="form-label">Contact Number</label>
              <input className="form-input" value={form.contact_number || ''} onChange={e => setForm({ ...form, contact_number: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || 'Active'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Active', 'Full', 'Closed', 'Under Setup'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Create Center'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && reliefCentersApi.delete(deleteId).then(() => { toast.success('Center deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Center" message="Delete this relief center?" confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default ReliefCenters;
