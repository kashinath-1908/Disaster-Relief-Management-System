import React, { useEffect, useState } from 'react';
import { Heart, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { volunteersApi, disastersApi, tasksApi } from '../services/api';
import { Modal, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

const Volunteers: React.FC = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [assignForm, setAssignForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, aRes, dRes, tRes]: any[] = await Promise.all([
        volunteersApi.getAll({ search, availability: filterAvailability, verification_status: filterVerification }),
        volunteersApi.getAssignments(),
        disastersApi.getAll(),
        tasksApi.getAll(),
      ]);
      setVolunteers(vRes.data || []);
      setAssignments(aRes.data || []);
      setDisasters(dRes.data || []);
      setTasks(tRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterAvailability, filterVerification]);

  const openEdit = (v: any) => { setEditItem(v); setEditForm({ skills: v.skills, availability: v.availability, verification_status: v.verification_status }); setEditModalOpen(true); };
  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await volunteersApi.update(editItem.volunteer_id, editForm);
      toast.success('Volunteer updated.');
      setEditModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.volunteer_id || !assignForm.disaster_id) { toast.error('Select volunteer and disaster.'); return; }
    setSaving(true);
    try {
      await volunteersApi.createAssignment(assignForm);
      toast.success('Volunteer assigned.');
      setAssignModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const stats = {
    available: volunteers.filter(v => v.availability === 'Available').length,
    assigned: volunteers.filter(v => v.availability === 'Assigned').length,
    verified: volunteers.filter(v => v.verification_status === 'Verified').length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Volunteer Management" subtitle={`${volunteers.length} registered volunteers`} icon={<Heart size={22} />}
        actions={canManage && <button onClick={() => setAssignModalOpen(true)} className="btn-primary"><Plus size={16} /> Create Assignment</button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', value: stats.available, cls: 'bg-green-50 text-green-700' },
          { label: 'Assigned', value: stats.assigned, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Verified', value: stats.verified, cls: 'bg-purple-50 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search volunteers..." className="flex-1 min-w-48" />
        <select value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)} className="form-select w-auto">
          <option value="">All Availability</option>
          {['Available', 'Assigned', 'Unavailable'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)} className="form-select w-auto">
          <option value="">All Verification</option>
          {['Pending', 'Verified', 'Rejected'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : volunteers.length === 0 ? (
          <EmptyState icon={<Heart size={48} />} title="No volunteers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#', 'Name', 'Contact', 'Skills', 'Availability', 'Verification', 'Registered', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v: any, i: number) => (
                  <tr key={v.volunteer_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">{v.full_name?.[0]}</div>
                        <div>
                          <div className="font-medium">{v.full_name}</div>
                          <div className="text-xs text-gray-400">{v.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{v.phone || '—'}</td>
                    <td className="table-cell text-xs max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {v.skills?.split(',').slice(0, 3).map((s: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell"><StatusBadge status={v.availability} /></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {v.verification_status === 'Verified' ? <CheckCircle size={14} className="text-green-500" /> : v.verification_status === 'Rejected' ? <XCircle size={14} className="text-red-500" /> : <span className="text-yellow-500">⏳</span>}
                        <span className="text-xs text-gray-600">{v.verification_status}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-400">{v.registration_date ? format(new Date(v.registration_date), 'MMM d, yyyy') : '—'}</td>
                    <td className="table-cell">
                      {canManage && <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Assignments */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Assignments</h3>
        {assignments.length === 0 ? <p className="text-sm text-gray-500">No assignments yet.</p> : (
          <div className="space-y-3">
            {assignments.slice(0, 5).map((a: any) => (
              <div key={a.assignment_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-sm">{a.volunteer_name}</span>
                  <span className="text-gray-400 text-sm"> → </span>
                  <span className="text-sm text-gray-600">{a.disaster_name}</span>
                  {a.task_name && <div className="text-xs text-gray-400">{a.task_name}</div>}
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Volunteer" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="form-label">Skills</label>
            <textarea className="form-input h-24 resize-none" value={editForm.skills || ''} onChange={e => setEditForm({ ...editForm, skills: e.target.value })} placeholder="First Aid, Search & Rescue, ..." />
          </div>
          <div>
            <label className="form-label">Availability</label>
            <select className="form-select" value={editForm.availability || 'Available'} onChange={e => setEditForm({ ...editForm, availability: e.target.value })}>
              {['Available', 'Assigned', 'Unavailable'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Verification Status</label>
            <select className="form-select" value={editForm.verification_status || 'Pending'} onChange={e => setEditForm({ ...editForm, verification_status: e.target.value })}>
              {['Pending', 'Verified', 'Rejected'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Update</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Create Volunteer Assignment" size="sm">
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="form-label">Volunteer *</label>
            <select className="form-select" value={assignForm.volunteer_id || ''} onChange={e => setAssignForm({ ...assignForm, volunteer_id: e.target.value })} required>
              <option value="">Select volunteer</option>
              {volunteers.filter(v => v.verification_status === 'Verified').map((v: any) => (
                <option key={v.volunteer_id} value={v.volunteer_id}>{v.full_name} ({v.availability})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Disaster *</label>
            <select className="form-select" value={assignForm.disaster_id || ''} onChange={e => setAssignForm({ ...assignForm, disaster_id: e.target.value })} required>
              <option value="">Select disaster</option>
              {disasters.filter(d => d.status === 'Active' || d.status === 'Reported').map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Task</label>
            <select className="form-select" value={assignForm.task_id || ''} onChange={e => setAssignForm({ ...assignForm, task_id: e.target.value })}>
              <option value="">Select task (optional)</option>
              {tasks.filter(t => !assignForm.disaster_id || t.disaster_id == assignForm.disaster_id).map((t: any) => (
                <option key={t.task_id} value={t.task_id}>{t.task_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Start Time</label>
              <input type="datetime-local" className="form-input" value={assignForm.start_time || ''} onChange={e => setAssignForm({ ...assignForm, start_time: e.target.value })} />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="datetime-local" className="form-input" value={assignForm.end_time || ''} onChange={e => setAssignForm({ ...assignForm, end_time: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Assign</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Volunteers;
