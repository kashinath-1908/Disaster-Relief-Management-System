import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, Edit2, Trash2 } from 'lucide-react';
import { tasksApi, disastersApi, operationsApi, usersApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, PriorityBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const ReliefTasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ priority: 'Medium', status: 'Pending' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const canCreate = user?.role_name === 'Admin' || user?.role_name === 'Disaster Coordinator';
  const isVolunteer = user?.role_name === 'Volunteer';

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, dRes, oRes, uRes]: any[] = await Promise.all([
        tasksApi.getAll({ search, status: filterStatus, priority: filterPriority }),
        disastersApi.getAll(),
        operationsApi.getAll(),
        user?.role_name === 'Admin' ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);
      setTasks(tRes.data || []);
      setDisasters(dRes.data || []);
      setOperations(oRes.data || []);
      setUsers(uRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterPriority]);

  const openModal = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { ...item, deadline: item.deadline?.slice(0, 16) } : { priority: 'Medium', status: 'Pending' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.disaster_id || !form.task_name) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      if (editItem) { await tasksApi.update(editItem.task_id, form); toast.success('Task updated.'); }
      else { await tasksApi.create(form); toast.success('Task created.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (task: any, status: string) => {
    try {
      await tasksApi.update(task.task_id, { ...task, status });
      toast.success(`Task marked as ${status}.`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Relief Tasks" subtitle={`${tasks.length} tasks`} icon={<ClipboardList size={22} />}
        actions={canCreate && <button onClick={() => openModal()} className="btn-primary"><Plus size={16} /> Create Task</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Pending', 'Assigned', 'In Progress', 'Completed'].map(s => (
          <div key={s} className={`card text-center cursor-pointer hover:shadow-md transition-shadow ${filterStatus === s ? 'ring-2 ring-primary-500' : ''}`} onClick={() => setFilterStatus(s === filterStatus ? '' : s)}>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === s).length}</div>
            <div className="text-xs font-medium text-gray-500 mt-1">{s}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tasks..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Statuses</option>
          {['Pending', 'Assigned', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="form-select w-auto">
          <option value="">All Priorities</option>
          {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : tasks.length === 0 ? (
          <EmptyState icon={<ClipboardList size={48} />} title="No tasks found" action={canCreate && <button onClick={() => openModal()} className="btn-primary">Create Task</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['#', 'Task', 'Disaster', 'Assigned To', 'Priority', 'Deadline', 'Status', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {tasks.map((t: any, i: number) => (
                  <tr key={t.task_id} className={`table-row ${t.priority === 'Critical' && t.status !== 'Completed' ? 'bg-red-50/20' : ''}`}>
                    <td className="table-cell text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium">{t.task_name}</div>
                      {t.description && <div className="text-xs text-gray-400 truncate max-w-xs">{t.description}</div>}
                    </td>
                    <td className="table-cell text-xs text-gray-600">{t.disaster_name}</td>
                    <td className="table-cell text-xs text-gray-500">{t.assigned_to_name || '—'}</td>
                    <td className="table-cell"><PriorityBadge priority={t.priority} /></td>
                    <td className="table-cell text-xs text-gray-500">
                      {t.deadline ? (
                        <span className={new Date(t.deadline) < new Date() && t.status !== 'Completed' ? 'text-red-600 font-medium' : ''}>
                          {format(new Date(t.deadline), 'MMM d, yyyy')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-cell"><StatusBadge status={t.status} /></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {(canCreate || (isVolunteer && t.assigned_to === user?.user_id)) && (
                          <button onClick={() => openModal(t)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                        )}
                        {isVolunteer && t.status === 'Assigned' && (
                          <button onClick={() => updateStatus(t, 'In Progress')} className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Start</button>
                        )}
                        {isVolunteer && t.status === 'In Progress' && (
                          <button onClick={() => updateStatus(t, 'Completed')} className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Complete</button>
                        )}
                        {user?.role_name === 'Admin' && (
                          <button onClick={() => setDeleteId(t.task_id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Task' : 'Create Relief Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Task Name *</label>
              <input className="form-input" value={form.task_name || ''} onChange={e => setForm({ ...form, task_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Disaster *</label>
              <select className="form-select" value={form.disaster_id || ''} onChange={e => setForm({ ...form, disaster_id: e.target.value })} required>
                <option value="">Select disaster</option>
                {disasters.map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Operation</label>
              <select className="form-select" value={form.operation_id || ''} onChange={e => setForm({ ...form, operation_id: e.target.value })}>
                <option value="">None</option>
                {operations.map((o: any) => <option key={o.operation_id} value={o.operation_id}>{o.operation_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority || 'Medium'} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status || 'Pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Pending', 'Assigned', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Assign To</label>
              <select className="form-select" value={form.assigned_to || ''} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u: any) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.role_name})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Deadline</label>
              <input type="datetime-local" className="form-input" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-input h-24 resize-none" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && tasksApi.delete(deleteId).then(() => { toast.success('Deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Task" message="Delete this task?" confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default ReliefTasks;
