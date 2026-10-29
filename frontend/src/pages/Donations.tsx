import React, { useEffect, useState } from 'react';
import { HandHeart, Plus, Edit2 } from 'lucide-react';
import { donationsApi, donorsApi, disastersApi, resourcesApi } from '../services/api';
import { Modal, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const Donations: React.FC = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({ donation_type: 'Monetary', amount: '', quantity: '' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';

  const load = async () => {
    setLoading(true);
    try {
      const [dRes, donRes, disRes, resRes]: any[] = await Promise.all([
        donationsApi.getAll({ search, status: filterStatus, donation_type: filterType }),
        donorsApi.getAll(),
        disastersApi.getAll(),
        resourcesApi.getAll(),
      ]);
      setDonations(dRes.data || []);
      setDonors(donRes.data || []);
      setDisasters(disRes.data || []);
      setResources(resRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donor_id || !form.donation_type) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      await donationsApi.create(form);
      toast.success('Donation recorded.');
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await donationsApi.update(editItem.donation_id, { status: editItem.status });
      toast.success('Status updated.');
      setStatusModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const totalMonetary = donations.filter(d => d.donation_type === 'Monetary' && ['Verified', 'Received'].includes(d.status)).reduce((s: number, d: any) => s + (d.amount || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Donations" subtitle={`${donations.length} donations, ₹${(totalMonetary / 100000).toFixed(2)}L verified`} icon={<HandHeart size={22} />}
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Record Donation</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Monetary', value: `₹${(totalMonetary / 100000).toFixed(1)}L`, cls: 'bg-green-50 text-green-700' },
          { label: 'Pending', value: donations.filter(d => d.status === 'Pending').length, cls: 'bg-yellow-50 text-yellow-700' },
          { label: 'Monetary Donations', value: donations.filter(d => d.donation_type === 'Monetary').length, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Material Donations', value: donations.filter(d => d.donation_type === 'Material').length, cls: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search donors..." className="flex-1 min-w-48" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-auto">
          <option value="">All Types</option>
          {['Monetary', 'Material'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {['Pending', 'Verified', 'Received', 'Rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : donations.length === 0 ? (
          <EmptyState icon={<HandHeart size={48} />} title="No donations found" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Record Donation</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['#', 'Donor', 'Type', 'Amount/Resource', 'Disaster', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {donations.map((d: any, i: number) => (
                  <tr key={d.donation_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium">{d.donor_name}</div>
                      <div className="text-xs text-gray-400">{d.donor_type}</div>
                    </td>
                    <td className="table-cell"><span className={`badge ${d.donation_type === 'Monetary' ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>{d.donation_type}</span></td>
                    <td className="table-cell font-semibold">
                      {d.donation_type === 'Monetary' ? <span className="text-green-700">₹{parseFloat(d.amount || 0).toLocaleString('en-IN')}</span> : <span className="text-purple-700">{d.quantity} × {d.resource_name}</span>}
                    </td>
                    <td className="table-cell text-xs text-gray-500">{d.disaster_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{d.donation_date ? format(new Date(d.donation_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="table-cell"><StatusBadge status={d.status} /></td>
                    <td className="table-cell">
                      {isAdmin && (
                        <button onClick={() => { setEditItem({ ...d }); setStatusModalOpen(true); }} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Donation">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Donor *</label>
              <select className="form-select" value={form.donor_id || ''} onChange={e => setForm({ ...form, donor_id: e.target.value })} required>
                <option value="">Select donor</option>
                {donors.map((d: any) => <option key={d.donor_id} value={d.donor_id}>{d.donor_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Donation Type *</label>
              <select className="form-select" value={form.donation_type} onChange={e => setForm({ ...form, donation_type: e.target.value, amount: '', quantity: '', resource_id: '' })}>
                {['Monetary', 'Material'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Disaster</label>
              <select className="form-select" value={form.disaster_id || ''} onChange={e => setForm({ ...form, disaster_id: e.target.value })}>
                <option value="">General donation</option>
                {disasters.map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
              </select>
            </div>
            {form.donation_type === 'Monetary' ? (
              <div>
                <label className="form-label">Amount (₹) *</label>
                <input type="number" className="form-input" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1" placeholder="e.g., 50000" />
              </div>
            ) : (
              <>
                <div>
                  <label className="form-label">Resource *</label>
                  <select className="form-select" value={form.resource_id || ''} onChange={e => setForm({ ...form, resource_id: e.target.value })} required>
                    <option value="">Select resource</option>
                    {resources.map((r: any) => <option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.unit})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Quantity *</label>
                  <input type="number" className="form-input" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: e.target.value })} required min="1" />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Record Donation'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Donation Status" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={editItem?.status || ''} onChange={e => setEditItem({ ...editItem, status: e.target.value })}>
              {['Pending', 'Verified', 'Received', 'Rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button onClick={() => setStatusModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleStatusUpdate} disabled={saving} className="btn-primary">{saving ? 'Updating...' : 'Update'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Donations;
