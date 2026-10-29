import React, { useEffect, useState } from 'react';
import { Share2, Plus, AlertCircle } from 'lucide-react';
import { distributionsApi, disastersApi, resourcesApi, reliefCentersApi, inventoryApi, locationsApi } from '../services/api';
import { Modal, LoadingSpinner, EmptyState, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Distribution: React.FC = () => {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>({ quantity_distributed: 1, location_id: 10 });
  const [saving, setSaving] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dists, disRes, resRes, cenRes, invRes]: any[] = await Promise.all([
        distributionsApi.getAll(),
        disastersApi.getAll(),
        resourcesApi.getAll(),
        reliefCentersApi.getAll(),
        inventoryApi.getAll(),
      ]);
      setDistributions(dists.data || []);
      setDisasters(disRes.data || []);
      setResources(resRes.data || []);
      setCenters(cenRes.data || []);
      setInventory(invRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleResourceChange = (resourceId: string, locationId: string) => {
    const inv = inventory.find(i => i.resource_id == resourceId && i.location_id == locationId);
    setSelectedInventory(inv || null);
    setForm((prev: any) => ({ ...prev, resource_id: resourceId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_id || !form.resource_id || !form.quantity_distributed) {
      toast.error('Fill all required fields.'); return;
    }
    if (form.quantity_distributed <= 0) { toast.error('Quantity must be positive.'); return; }
    if (selectedInventory && form.quantity_distributed > selectedInventory.quantity_available) {
      toast.error(`Insufficient stock. Only ${selectedInventory.quantity_available} available.`); return;
    }
    setSaving(true);
    try {
      await distributionsApi.create(form);
      toast.success('Resources distributed successfully! Inventory updated.');
      setModalOpen(false); setSelectedInventory(null);
      setForm({ quantity_distributed: 1, location_id: 10 });
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const totalDistributed = distributions.reduce((sum: number, d: any) => sum + d.quantity_distributed, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Resource Distribution" subtitle={`${totalDistributed.toLocaleString()} total units distributed`} icon={<Share2 size={22} />}
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Distribute Resources</button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Distributions', value: distributions.length, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Units Distributed', value: totalDistributed.toLocaleString(), cls: 'bg-green-50 text-green-700' },
          { label: 'Disasters Served', value: new Set(distributions.map((d: any) => d.disaster_id)).size, cls: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : distributions.length === 0 ? (
          <EmptyState icon={<Share2 size={48} />} title="No distributions recorded" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Distribute Resources</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#', 'Resource', 'Disaster', 'Relief Center', 'Qty Distributed', 'Distributed By', 'Date'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributions.map((d: any, i: number) => (
                  <tr key={d.distribution_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell font-medium">{d.resource_name} <span className="text-xs text-gray-400">({d.unit})</span></td>
                    <td className="table-cell text-xs text-gray-600">{d.disaster_name}</td>
                    <td className="table-cell text-xs text-gray-500">{d.center_name || '—'}</td>
                    <td className="table-cell font-bold text-green-700">{d.quantity_distributed?.toLocaleString()}</td>
                    <td className="table-cell text-xs text-gray-500">{d.distributed_by_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{d.distribution_date ? format(new Date(d.distribution_date), 'MMM d, yyyy HH:mm') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelectedInventory(null); }} title="Distribute Resources">
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedInventory && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
              selectedInventory.quantity_available > selectedInventory.minimum_stock ? 'bg-green-50 border-green-200 text-green-700' :
              selectedInventory.quantity_available > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-red-50 border-red-200 text-red-700'
            }`}>
              <AlertCircle size={16} />
              Available stock: <strong>{selectedInventory.quantity_available} {selectedInventory.unit}</strong>
              {selectedInventory.quantity_available === 0 && ' — Out of Stock!'}
              {selectedInventory.quantity_available > 0 && selectedInventory.quantity_available <= selectedInventory.minimum_stock && ' — Low Stock'}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Disaster *</label>
              <select className="form-select" value={form.disaster_id || ''} onChange={e => setForm({ ...form, disaster_id: e.target.value })} required>
                <option value="">Select disaster</option>
                {disasters.filter(d => d.status === 'Active' || d.status === 'Reported').map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Resource *</label>
              <select className="form-select" value={form.resource_id || ''} onChange={e => handleResourceChange(e.target.value, form.location_id)} required>
                <option value="">Select resource</option>
                {resources.map((r: any) => <option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Source Location</label>
              <select className="form-select" value={form.location_id || 10} onChange={e => { setForm({ ...form, location_id: e.target.value }); if (form.resource_id) handleResourceChange(form.resource_id, e.target.value); }}>
                {inventory.filter((i: any) => !form.resource_id || i.resource_id == form.resource_id).map((i: any) => (
                  <option key={`${i.resource_id}-${i.location_id}`} value={i.location_id}>{i.location_name}, {i.city} (Stock: {i.quantity_available})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Relief Center</label>
              <select className="form-select" value={form.center_id || ''} onChange={e => setForm({ ...form, center_id: e.target.value })}>
                <option value="">Select center</option>
                {centers.filter(c => c.status === 'Active').map((c: any) => <option key={c.center_id} value={c.center_id}>{c.center_name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Quantity to Distribute *</label>
              <input type="number" className="form-input" value={form.quantity_distributed || 1} onChange={e => setForm({ ...form, quantity_distributed: parseInt(e.target.value) })} required min="1" max={selectedInventory?.quantity_available || 99999} />
              {selectedInventory && <p className="text-xs text-gray-400 mt-1">Max available: {selectedInventory.quantity_available}</p>}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            ℹ️ Distributing resources will automatically deduct from inventory. This action triggers a database transaction and cannot be undone.
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => { setModalOpen(false); setSelectedInventory(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || selectedInventory?.quantity_available === 0} className="btn-success">
              {saving ? 'Processing...' : 'Distribute Resources'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Distribution;
