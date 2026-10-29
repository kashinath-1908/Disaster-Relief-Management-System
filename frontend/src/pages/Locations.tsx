import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { locationsApi } from '../services/api';
import { Modal, ConfirmDialog, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ location_type: 'City' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await locationsApi.getAll();
      const all: any[] = res.data || [];
      setLocations(search ? all.filter(l => l.location_name?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()) || l.state?.toLowerCase().includes(search.toLowerCase())) : all);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openModal = (item?: any) => { setEditItem(item || null); setForm(item || { location_type: 'City' }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location_name || !form.city || !form.state) { toast.error('Name, city, and state are required.'); return; }
    setSaving(true);
    try {
      if (editItem) { await locationsApi.update(editItem.location_id, form); toast.success('Location updated.'); }
      else { await locationsApi.create(form); toast.success('Location added.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const stateGroups = locations.reduce((acc: any, l: any) => {
    const state = l.state || 'Other';
    if (!acc[state]) acc[state] = [];
    acc[state].push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Locations" subtitle={`${locations.length} registered locations`} icon={<MapPin size={22} />}
        actions={isAdmin && <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Add Location</button>}
      />

      <div className="card p-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, city, or state..." className="max-w-lg" />
      </div>

      {loading ? <LoadingSpinner /> : locations.length === 0 ? (
        <EmptyState icon={<MapPin size={48} />} title="No locations found" />
      ) : (
        <div className="space-y-6">
          {Object.entries(stateGroups).map(([state, items]: [string, any]) => (
            <div key={state} className="card">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                📍 {state}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((l: any) => (
                  <div key={l.location_id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{l.location_name}</div>
                      <div className="text-xs text-gray-500">{l.city} {l.pincode ? `- ${l.pincode}` : ''}</div>
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded mt-1 inline-block">{l.location_type || 'Area'}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(l)} className="p-1 hover:bg-white rounded text-gray-400 hover:text-blue-600"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteId(l.location_id)} className="p-1 hover:bg-white rounded text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Location' : 'Add Location'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Location Name *</label>
              <input className="form-input" value={form.location_name || ''} onChange={e => setForm({ ...form, location_name: e.target.value })} required placeholder="e.g., Dharavi Relief Center" />
            </div>
            <div>
              <label className="form-label">City *</label>
              <input className="form-input" value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} required placeholder="e.g., Mumbai" />
            </div>
            <div>
              <label className="form-label">State *</label>
              <input className="form-input" value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} required placeholder="e.g., Maharashtra" />
            </div>
            <div>
              <label className="form-label">Pincode</label>
              <input className="form-input" value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="400001" />
            </div>
            <div>
              <label className="form-label">Location Type</label>
              <select className="form-select" value={form.location_type || 'City'} onChange={e => setForm({ ...form, location_type: e.target.value })}>
                {['City', 'Town', 'Village', 'Rural Area', 'District', 'Industrial Area', 'Coastal Area', 'Forest Area'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Latitude</label>
              <input type="number" step="any" className="form-input" value={form.latitude || ''} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="19.0760" />
            </div>
            <div>
              <label className="form-label">Longitude</label>
              <input type="number" step="any" className="form-input" value={form.longitude || ''} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="72.8777" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Add Location'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && locationsApi.delete(deleteId).then(() => { toast.success('Location deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Location" message="Delete this location? Any connected records may be affected." confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default Locations;
