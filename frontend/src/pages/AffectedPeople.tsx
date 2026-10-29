import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { affectedPeopleApi, disastersApi, locationsApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const AffectedPeople: React.FC = () => {
  const [people, setPeople] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDisaster, setFilterDisaster] = useState('');
  const [filterInjury, setFilterInjury] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ gender: 'Male', injury_status: 'None', family_size: 1 });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canEdit = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, dRes, lRes]: any[] = await Promise.all([
        affectedPeopleApi.getAll({ search, disaster_id: filterDisaster, injury_status: filterInjury }),
        disastersApi.getAll(),
        locationsApi.getAll(),
      ]);
      setPeople(pRes.data || []);
      setDisasters(dRes.data || []);
      setLocations(lRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterDisaster, filterInjury]);

  const openModal = (item?: any) => {
    setEditItem(item || null);
    setForm(item || { gender: 'Male', injury_status: 'None', family_size: 1 });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_id || !form.full_name || !form.gender) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      if (editItem) { await affectedPeopleApi.update(editItem.person_id, form); toast.success('Updated.'); }
      else { await affectedPeopleApi.create(form); toast.success('Person registered.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const stats = {
    total: people.length,
    injured: people.filter(p => p.injury_status !== 'None').length,
    severe: people.filter(p => p.injury_status === 'Severe' || p.injury_status === 'Critical').length,
    special: people.filter(p => p.special_needs).length,
  };

  const injuryColor: Record<string, string> = {
    None: 'text-green-600', Minor: 'text-yellow-600', Moderate: 'text-orange-600', Severe: 'text-red-600', Critical: 'text-red-800 font-bold',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Affected People" subtitle={`${people.length} registered`} icon={<Users size={22} />}
        actions={canEdit && <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Register Person</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registered', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Have Injuries', value: stats.injured, color: 'bg-orange-50 text-orange-700' },
          { label: 'Severe/Critical', value: stats.severe, color: 'bg-red-50 text-red-700' },
          { label: 'Special Needs', value: stats.special, color: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.color}`}>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name..." className="flex-1 min-w-48" />
        <select value={filterDisaster} onChange={e => setFilterDisaster(e.target.value)} className="form-select w-auto">
          <option value="">All Disasters</option>
          {disasters.map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
        </select>
        <select value={filterInjury} onChange={e => setFilterInjury(e.target.value)} className="form-select w-auto">
          <option value="">All Injury Status</option>
          {['None', 'Minor', 'Moderate', 'Severe', 'Critical'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : people.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title="No affected people registered" action={
            canEdit && <button onClick={() => openModal()} className="btn-primary">Register Person</button>
          } />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#', 'Name', 'Age/Gender', 'Disaster', 'Location', 'Family', 'Injury', 'Special Needs', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((p: any, i: number) => (
                  <tr key={p.person_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium">{p.full_name}</td>
                    <td className="table-cell text-gray-500">{p.age || '?'} / {p.gender}</td>
                    <td className="table-cell text-xs">{p.disaster_name}</td>
                    <td className="table-cell text-xs text-gray-500">{p.city || p.location_name || '—'}</td>
                    <td className="table-cell text-center">{p.family_size}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium ${injuryColor[p.injury_status] || ''}`}>{p.injury_status}</span>
                    </td>
                    <td className="table-cell text-xs text-gray-500 max-w-xs truncate">{p.special_needs || '—'}</td>
                    <td className="table-cell">
                      {canEdit && (
                        <div className="flex gap-1">
                          <button onClick={() => openModal(p)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                          {user?.role_name === 'Admin' && <button onClick={() => setDeleteId(p.person_id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Person' : 'Register Affected Person'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
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
              <label className="form-label">Age</label>
              <input type="number" className="form-input" value={form.age || ''} onChange={e => setForm({ ...form, age: e.target.value })} min="0" max="120" />
            </div>
            <div>
              <label className="form-label">Gender *</label>
              <select className="form-select" value={form.gender || 'Male'} onChange={e => setForm({ ...form, gender: e.target.value })}>
                {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Family Size</label>
              <input type="number" className="form-input" value={form.family_size || 1} onChange={e => setForm({ ...form, family_size: e.target.value })} min="1" />
            </div>
            <div>
              <label className="form-label">Injury Status</label>
              <select className="form-select" value={form.injury_status || 'None'} onChange={e => setForm({ ...form, injury_status: e.target.value })}>
                {['None', 'Minor', 'Moderate', 'Severe', 'Critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Special Needs</label>
              <textarea className="form-input h-20 resize-none" value={form.special_needs || ''} onChange={e => setForm({ ...form, special_needs: e.target.value })} placeholder="e.g., Diabetic, requires insulin..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Register'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && affectedPeopleApi.delete(deleteId).then(() => { toast.success('Deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Record" message="Delete this affected person record?" confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default AffectedPeople;
