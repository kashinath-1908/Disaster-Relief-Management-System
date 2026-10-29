import React, { useEffect, useState } from 'react';
import { Truck, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { transportApi, operationsApi } from '../services/api';
import { Modal, ConfirmDialog, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const Transportation: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState<any>({ vehicle_type: 'Truck', availability_status: 'Available' });
  const [assignForm, setAssignForm] = useState<any>({ status: 'Scheduled' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';
  const canManage = isAdmin || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, aRes, oRes]: any[] = await Promise.all([
        transportApi.getVehicles({ search, availability_status: filterStatus }),
        transportApi.getAssignments(),
        operationsApi.getAll(),
      ]);
      setVehicles(vRes.data || []);
      setAssignments(aRes.data || []);
      setOperations(oRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus]);

  const openVehicleModal = (item?: any) => { setEditItem(item || null); setVehicleForm(item || { vehicle_type: 'Truck', availability_status: 'Available' }); setVehicleModalOpen(true); };

  const handleVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_number || !vehicleForm.vehicle_type) { toast.error('Vehicle number and type required.'); return; }
    setSaving(true);
    try {
      if (editItem) { await transportApi.updateVehicle(editItem.vehicle_id, vehicleForm); toast.success('Vehicle updated.'); }
      else { await transportApi.createVehicle(vehicleForm); toast.success('Vehicle added.'); }
      setVehicleModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.vehicle_id || !assignForm.source_location || !assignForm.destination_location) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      await transportApi.createAssignment(assignForm);
      toast.success('Transport assignment created.');
      setAssignModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const typeIcons: Record<string, string> = { Truck: '🚛', Van: '🚐', Ambulance: '🚑', Helicopter: '🚁', Boat: '⛵', Bus: '🚌', SUV: '🚙' };
  const statusColors: Record<string, string> = { Available: 'bg-green-50 border-green-200', 'In Use': 'bg-blue-50 border-blue-200', 'Under Maintenance': 'bg-amber-50 border-amber-200', 'Out of Service': 'bg-red-50 border-red-200' };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Transportation" subtitle={`${vehicles.length} vehicles`} icon={<Truck size={22} />}
        actions={
          <div className="flex gap-2">
            {canManage && <button onClick={() => setAssignModalOpen(true)} className="btn-secondary">Create Assignment</button>}
            {isAdmin && <button onClick={() => openVehicleModal()} className="btn-primary"><Plus size={16} /> Add Vehicle</button>}
          </div>
        }
      />

      <div className="card p-4 flex gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by vehicle number or driver..." className="flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-select w-auto">
          <option value="">All Status</option>
          {['Available', 'In Use', 'Under Maintenance', 'Out of Service'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Vehicle Cards */}
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicles.map((v: any) => (
            <div key={v.vehicle_id} className={`card border ${statusColors[v.availability_status] || 'border-gray-200'} hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeIcons[v.vehicle_type] || '🚗'}</span>
                  <div>
                    <div className="font-bold text-gray-900">{v.vehicle_number}</div>
                    <div className="text-xs text-gray-500">{v.vehicle_type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={v.availability_status} />
                  {isAdmin && (
                    <>
                      <button onClick={() => openVehicleModal(v)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={13} className="text-gray-400" /></button>
                      <button onClick={() => setDeleteId(v.vehicle_id)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={13} className="text-gray-400" /></button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                {v.driver_name && <div>🚗 {v.driver_name} {v.driver_phone && <span className="text-xs text-gray-400">({v.driver_phone})</span>}</div>}
                {v.capacity && <div>📦 Capacity: {v.capacity?.toLocaleString()} kg</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transport Assignments */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Transport Assignments</h3>
        {assignments.length === 0 ? <p className="text-sm text-gray-500">No assignments yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Vehicle', 'Route', 'Operation', 'Departure', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.transport_assignment_id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium">{a.vehicle_number}</div>
                      <div className="text-xs text-gray-400">{a.vehicle_type} • {a.driver_name}</div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium truncate max-w-24">{a.source_location}</span>
                        <ArrowRight size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate max-w-24">{a.destination_location}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{a.operation_name || '—'}</td>
                    <td className="table-cell text-xs text-gray-400">{a.departure_time ? format(new Date(a.departure_time), 'MMM d, HH:mm') : '—'}</td>
                    <td className="table-cell"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vehicle Modal */}
      <Modal isOpen={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} title={editItem ? 'Edit Vehicle' : 'Add Vehicle'} size="sm">
        <form onSubmit={handleVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vehicle Number *</label>
              <input className="form-input uppercase" value={vehicleForm.vehicle_number || ''} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_number: e.target.value.toUpperCase() })} required />
            </div>
            <div>
              <label className="form-label">Type *</label>
              <select className="form-select" value={vehicleForm.vehicle_type || 'Truck'} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}>
                {['Truck', 'Van', 'Ambulance', 'Helicopter', 'Boat', 'Bus', 'SUV'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Capacity (kg)</label>
              <input type="number" className="form-input" value={vehicleForm.capacity || ''} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} min="0" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={vehicleForm.availability_status || 'Available'} onChange={e => setVehicleForm({ ...vehicleForm, availability_status: e.target.value })}>
                {['Available', 'In Use', 'Under Maintenance', 'Out of Service'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Driver Name</label>
              <input className="form-input" value={vehicleForm.driver_name || ''} onChange={e => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Driver Phone</label>
              <input className="form-input" value={vehicleForm.driver_phone || ''} onChange={e => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setVehicleModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editItem ? 'Update' : 'Add Vehicle'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Create Transport Assignment">
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vehicle *</label>
              <select className="form-select" value={assignForm.vehicle_id || ''} onChange={e => setAssignForm({ ...assignForm, vehicle_id: e.target.value })} required>
                <option value="">Select vehicle</option>
                {vehicles.filter(v => v.availability_status === 'Available').map((v: any) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number} ({v.vehicle_type})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Operation</label>
              <select className="form-select" value={assignForm.operation_id || ''} onChange={e => setAssignForm({ ...assignForm, operation_id: e.target.value })}>
                <option value="">None</option>
                {operations.filter(o => o.status === 'Active' || o.status === 'Planned').map((o: any) => <option key={o.operation_id} value={o.operation_id}>{o.operation_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Source *</label>
              <input className="form-input" value={assignForm.source_location || ''} onChange={e => setAssignForm({ ...assignForm, source_location: e.target.value })} required placeholder="e.g., NDMA Warehouse, Delhi" />
            </div>
            <div>
              <label className="form-label">Destination *</label>
              <input className="form-input" value={assignForm.destination_location || ''} onChange={e => setAssignForm({ ...assignForm, destination_location: e.target.value })} required placeholder="e.g., Relief Camp, Mumbai" />
            </div>
            <div>
              <label className="form-label">Departure</label>
              <input type="datetime-local" className="form-input" value={assignForm.departure_time || ''} onChange={e => setAssignForm({ ...assignForm, departure_time: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Arrival</label>
              <input type="datetime-local" className="form-input" value={assignForm.arrival_time || ''} onChange={e => setAssignForm({ ...assignForm, arrival_time: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setAssignModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create Assignment'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && transportApi.deleteVehicle(deleteId).then(() => { toast.success('Vehicle deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Vehicle" message="Delete this vehicle?" confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default Transportation;
