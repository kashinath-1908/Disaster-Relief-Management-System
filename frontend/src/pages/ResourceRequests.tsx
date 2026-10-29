import React, { useEffect, useState } from 'react';
import { GitPullRequest, Plus, Edit2 } from 'lucide-react';
import { requestsApi, disastersApi, resourcesApi, locationsApi } from '../services/api';
import { Modal, StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const ResourceRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({ priority: 'Medium', quantity_requested: 1 });
  const [statusForm, setStatusForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, dRes, resRes, lRes]: any[] = await Promise.all([
        requestsApi.getAll({ search, status: filterStatus, priority: filterPriority }),
        disastersApi.getAll(),
        resourcesApi.getAll(),
        locationsApi.getAll(),
      ]);
      setRequests(rRes.data || []);
      setDisasters(dRes.data || []);
      setResources(resRes.data || []);
      setLocations(lRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterPriority]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_id || !form.resource_id || !form.quantity_requested) { toast.error('Fill required fields.'); return; }
    if (form.quantity_requested <= 0) { toast.error('Quantity must be positive.'); return; }
    setSaving(true);
    try {
      await requestsApi.create(form);
      toast.success('Request submitted successfully.');
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await requestsApi.update(editItem.request_id, statusForm);
      toast.success('Request status updated.');
      setStatusModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const openStatusModal = (item: any) => {
    setEditItem(item);
    setStatusForm({ status: item.status, priority: item.priority });
    setStatusModalOpen(true);
  };

  const stats = {
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    critical: requests.filter(r => r.priority === 'Critical').length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Resource Requests" subtitle={`${requests.length} total requests`} icon={<GitPullRequest size={22} />}
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> New Request</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: stats.pending, cls: 'bg-yellow-50 text-yellow-700' },
          { label: 'Approved', value: stats.approved, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Critical Priority', value: stats.critical, cls: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search requests..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {['Pending', 'Approved', 'Rejected', 'Processing', 'Delivered'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="form-select w-auto">
          <option value="">All Priorities</option>
          {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : requests.length === 0 ? (
          <EmptyState icon={<GitPullRequest size={48} />} title="No resource requests" action={<button onClick={() => setModalOpen(true)} className="btn-primary">New Request</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#', 'Disaster', 'Resource', 'Qty', 'Location', 'Requester', 'Priority', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any, i: number) => (
                  <tr key={r.request_id} className={`table-row ${r.priority === 'Critical' && r.status === 'Pending' ? 'bg-red-50/20' : ''}`}>
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell text-xs font-medium">{r.disaster_name}</td>
                    <td className="table-cell">
                      <div className="font-medium">{r.resource_name}</div>
                      <div className="text-xs text-gray-400">{r.unit}</div>
                    </td>
                    <td className="table-cell font-bold text-primary-700">{r.quantity_requested?.toLocaleString()}</td>
                    <td className="table-cell text-xs text-gray-500">{r.location_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-500">{r.requester_name}</td>
                    <td className="table-cell"><PriorityBadge priority={r.priority} /></td>
                    <td className="table-cell"><StatusBadge status={r.status} /></td>
                    <td className="table-cell text-xs text-gray-400">{r.request_date ? format(new Date(r.request_date), 'MMM d') : '—'}</td>
                    <td className="table-cell">
                      {canManage && (
                        <button onClick={() => openStatusModal(r)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg" title="Update status"><Edit2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Resource Request">
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <select className="form-select" value={form.resource_id || ''} onChange={e => setForm({ ...form, resource_id: e.target.value })} required>
                <option value="">Select resource</option>
                {resources.map((r: any) => <option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Quantity Requested *</label>
              <input type="number" className="form-input" value={form.quantity_requested || 1} onChange={e => setForm({ ...form, quantity_requested: parseInt(e.target.value) })} required min="1" />
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority || 'Medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Delivery Location</label>
              <select className="form-select" value={form.location_id || ''} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                <option value="">Select location</option>
                {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}, {l.city}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Request Status" size="sm">
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={statusForm.status || ''} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
              {['Pending', 'Approved', 'Rejected', 'Processing', 'Delivered'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" value={statusForm.priority || ''} onChange={e => setStatusForm({ ...statusForm, priority: e.target.value })}>
              {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setStatusModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ResourceRequests;
