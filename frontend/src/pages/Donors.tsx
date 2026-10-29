import React, { useEffect, useState } from 'react';
import { HandHeart, Plus } from 'lucide-react';
import { donorsApi } from '../services/api';
import { Modal, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Donors: React.FC = () => {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>({ donor_type: 'Individual', tax_exemption: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await donorsApi.getAll({ search, donor_type: filterType });
      setDonors(res.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.donor_name || !form.donor_type || !form.contact_number) { toast.error('Name, type, and contact required.'); return; }
    setSaving(true);
    try {
      await donorsApi.create(form);
      toast.success('Donor registered.');
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const typeColors: Record<string, string> = {
    Individual: 'bg-blue-50 text-blue-700',
    Organization: 'bg-purple-50 text-purple-700',
    Government: 'bg-green-50 text-green-700',
    NGO: 'bg-orange-50 text-orange-700',
    Corporate: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Donors" subtitle={`${donors.length} registered donors`} icon={<HandHeart size={22} />}
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Add Donor</button>}
      />

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search donors..." className="flex-1 min-w-48" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select w-auto">
          <option value="">All Types</option>
          {['Individual', 'Organization', 'Government', 'NGO', 'Corporate'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : donors.length === 0 ? (
          <EmptyState icon={<HandHeart size={48} />} title="No donors found" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Add Donor</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['#', 'Donor Name', 'Type', 'Contact', 'Email', 'Location', 'Tax Exempt', 'Registered'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {donors.map((d: any, i: number) => (
                  <tr key={d.donor_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium">{d.donor_name}</td>
                    <td className="table-cell"><span className={`badge ${typeColors[d.donor_type] || 'bg-gray-100 text-gray-700'}`}>{d.donor_type}</span></td>
                    <td className="table-cell text-xs text-gray-600">{d.contact_number}</td>
                    <td className="table-cell text-xs text-gray-500">{d.email || '—'}</td>
                    <td className="table-cell text-xs text-gray-500">{d.city || d.address || '—'}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium ${d.tax_exemption ? 'text-green-600' : 'text-gray-400'}`}>
                        {d.tax_exemption ? '✓ Yes' : 'No'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">{d.registration_date ? format(new Date(d.registration_date), 'MMM d, yyyy') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Register Donor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Donor Name *</label>
              <input className="form-input" value={form.donor_name || ''} onChange={e => setForm({ ...form, donor_name: e.target.value })} required placeholder="Full name or organization" />
            </div>
            <div>
              <label className="form-label">Donor Type *</label>
              <select className="form-select" value={form.donor_type} onChange={e => setForm({ ...form, donor_type: e.target.value })}>
                {['Individual', 'Organization', 'Government', 'NGO', 'Corporate'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Contact Number *</label>
              <input className="form-input" value={form.contact_number || ''} onChange={e => setForm({ ...form, contact_number: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="taxexempt" checked={form.tax_exemption} onChange={e => setForm({ ...form, tax_exemption: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="taxexempt" className="form-label mb-0">Tax Exemption Available</label>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <textarea className="form-input h-20 resize-none" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Register Donor'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Donors;
