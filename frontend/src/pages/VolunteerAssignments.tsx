import React, { useEffect, useState } from 'react';
import { ClipboardList, Edit2 } from 'lucide-react';
import { volunteersApi, disastersApi, tasksApi } from '../services/api';
import { Modal, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const VolunteerAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canManage = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await volunteersApi.getAssignments({ search, status: filterStatus });
      setAssignments(res.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const openEdit = (a: any) => { setEditItem(a); setEditForm({ status: a.status }); setEditModalOpen(true); };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await volunteersApi.createAssignment({ assignment_id: editItem.assignment_id, ...editForm, _update: true });
      toast.success('Assignment updated.');
      setEditModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const stats = {
    active: assignments.filter(a => a.status === 'Assigned' || a.status === 'In Progress').length,
    completed: assignments.filter(a => a.status === 'Completed').length,
    total: assignments.length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Volunteer Assignments" subtitle={`${stats.total} total assignments`} icon={<ClipboardList size={22} />} />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: stats.active, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Completed', value: stats.completed, cls: 'bg-green-50 text-green-700' },
          { label: 'Total', value: stats.total, cls: 'bg-gray-50 text-gray-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search volunteer or disaster..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {['Assigned', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : assignments.length === 0 ? (
          <EmptyState icon={<ClipboardList size={48} />} title="No assignments found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['#', 'Volunteer', 'Disaster', 'Task', 'Start Time', 'End Time', 'Status', canManage ? 'Actions' : ''].filter(Boolean).map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {assignments.map((a: any, i: number) => (
                  <tr key={a.assignment_id} className="table-row">
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium">{a.volunteer_name}</div>
                      <div className="text-xs text-gray-400">{a.volunteer_email}</div>
                    </td>
                    <td className="table-cell text-xs">{a.disaster_name}</td>
                    <td className="table-cell text-xs text-gray-500">{a.task_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{a.start_time ? format(new Date(a.start_time), 'MMM d, HH:mm') : '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{a.end_time ? format(new Date(a.end_time), 'MMM d, HH:mm') : '—'}</td>
                    <td className="table-cell"><StatusBadge status={a.status} /></td>
                    {canManage && (
                      <td className="table-cell">
                        <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Assignment Status" size="sm">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={editForm.status || ''} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              {['Assigned', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VolunteerAssignments;
