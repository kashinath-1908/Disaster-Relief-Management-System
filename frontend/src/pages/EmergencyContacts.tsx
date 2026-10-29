import React, { useEffect, useState } from 'react';
import { Phone, Plus, Edit2, Trash2 } from 'lucide-react';
import { emergencyApi, locationsApi } from '../services/api';
import { Modal, ConfirmDialog, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const serviceIcons: Record<string, string> = {
  'Police': '🚔', 'Fire': '🚒', 'Ambulance': '🚑', 'Hospital': '🏥',
  'Disaster Management': '🛡️', 'Search & Rescue': '⛑️',
};

const serviceColors: Record<string, string> = {
  'Police': 'border-blue-400 bg-blue-50',
  'Fire': 'border-red-400 bg-red-50',
  'Ambulance': 'border-red-300 bg-red-50',
  'Hospital': 'border-green-400 bg-green-50',
  'Disaster Management': 'border-amber-400 bg-amber-50',
  'Search & Rescue': 'border-orange-400 bg-orange-50',
};

const EmergencyContacts: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ service_type: 'Police', availability: '24/7' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, lRes]: any[] = await Promise.all([emergencyApi.getAll({ search, service_type: filterType }), locationsApi.getAll()]);
      setContacts(cRes.data || []);
      setLocations(lRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterType]);

  const openModal = (item?: any) => {
    setEditItem(item || null);
    setForm(item || { service_type: 'Police', availability: '24/7' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_name || !form.service_type || !form.contact_number) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      if (editItem) { await emergencyApi.update(editItem.contact_id, form); toast.success('Contact updated.'); }
      else { await emergencyApi.create(form); toast.success('Emergency contact added.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const grouped = contacts.reduce((acc: any, c: any) => {
    const type = c.service_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Emergency Contacts" subtitle={`${contacts.length} emergency contacts`} icon={<Phone size={22} />}
        actions={isAdmin && <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Add Contact</button>}
      />

      {/* National Helplines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { num: '112', label: 'National Emergency', icon: '🆘', cls: 'bg-red-600' },
          { num: '108', label: 'Ambulance', icon: '🚑', cls: 'bg-green-600' },
          { num: '101', label: 'Fire Emergency', icon: '🔥', cls: 'bg-orange-600' },
          { num: '1800-180-5999', label: 'Flood Helpline', icon: '🌊', cls: 'bg-blue-600' },
        ].map(h => (
          <div key={h.num} className={`${h.cls} rounded-xl p-4 text-white text-center`}>
            <div className="text-3xl mb-1">{h.icon}</div>
            <div className="text-2xl font-bold">{h.num}</div>
            <div className="text-xs opacity-90 mt-1">{h.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search contacts..." className="flex-1 min-w-48" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-auto">
          <option value="">All Types</option>
          {['Police', 'Fire', 'Ambulance', 'Hospital', 'Disaster Management', 'Search & Rescue'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Grouped Cards */}
      {loading ? <LoadingSpinner /> : contacts.length === 0 ? <EmptyState icon={<Phone size={48} />} title="No contacts found" /> : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, items]: [string, any]) => (
            <div key={type}>
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                {serviceIcons[type] || '📞'} {type}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((c: any) => (
                  <div key={c.contact_id} className={`card hover:shadow-md transition-shadow border-l-4 ${serviceColors[c.service_type] || 'border-gray-300'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{c.service_name}</h4>
                        <p className="text-xs text-gray-500">{c.city || c.location_name || 'National'}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={() => openModal(c)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={13} className="text-gray-400" /></button>
                          <button onClick={() => setDeleteId(c.contact_id)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={13} className="text-gray-400" /></button>
                        </div>
                      )}
                    </div>
                    <a href={`tel:${c.contact_number}`} className="text-xl font-bold text-primary-700 hover:text-primary-900">{c.contact_number}</a>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{c.availability}</span>
                      {c.address && <span className="text-xs text-gray-400 truncate">{c.address}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Contact' : 'Add Emergency Contact'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Service Name *</label>
              <input className="form-input" value={form.service_name || ''} onChange={e => setForm({ ...form, service_name: e.target.value })} required placeholder="e.g., Mumbai Police Control Room" />
            </div>
            <div>
              <label className="form-label">Service Type *</label>
              <select className="form-select" value={form.service_type || 'Police'} onChange={e => setForm({ ...form, service_type: e.target.value })}>
                {['Police', 'Fire', 'Ambulance', 'Hospital', 'Disaster Management', 'Search & Rescue'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Contact Number *</label>
              <input className="form-input" value={form.contact_number || ''} onChange={e => setForm({ ...form, contact_number: e.target.value })} required placeholder="+91-22-12345678" />
            </div>
            <div>
              <label className="form-label">Location</label>
              <select className="form-select" value={form.location_id || ''} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                <option value="">Select location</option>
                {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Availability</label>
              <select className="form-select" value={form.availability || '24/7'} onChange={e => setForm({ ...form, availability: e.target.value })}>
                {['24/7', 'Business Hours', 'On Call'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Add Contact'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && emergencyApi.delete(deleteId).then(() => { toast.success('Deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Contact" message="Delete this emergency contact?" confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default EmergencyContacts;
