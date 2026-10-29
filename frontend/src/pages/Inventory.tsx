import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, Archive, AlertTriangle } from 'lucide-react';
import { inventoryApi, resourcesApi, locationsApi } from '../services/api';
import { Modal, LoadingSpinner, EmptyState, PageHeader, SearchBar, StockBadge } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({ quantity_available: 0 });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, rRes, lRes, cRes]: any[] = await Promise.all([
        inventoryApi.getAll({ search, location_id: filterLocation, category_id: filterCategory, stock_status: filterStock }),
        resourcesApi.getAll(),
        locationsApi.getAll(),
        resourcesApi.getCategories(),
      ]);
      setInventory(iRes.data || []);
      setResources(rRes.data || []);
      setLocations(lRes.data || []);
      setCategories(cRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterLocation, filterCategory, filterStock]);

  const openEdit = (item: any) => { setEditItem(item); setForm({ quantity_available: item.quantity_available }); setModalOpen(true); };
  const openCreate = () => { setEditItem(null); setForm({ quantity_available: 0 }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity_available < 0) { toast.error('Quantity cannot be negative.'); return; }
    setSaving(true);
    try {
      if (editItem) { await inventoryApi.update(editItem.inventory_id, form); toast.success('Inventory updated.'); }
      else { await inventoryApi.create(form); toast.success('Inventory record created.'); }
      setModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const lowStockCount = inventory.filter(i => i.stock_status === 'Low Stock').length;
  const outOfStockCount = inventory.filter(i => i.stock_status === 'Out of Stock').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Resource Inventory" subtitle="Track available resources across locations" icon={<Archive size={22} />}
        actions={isAdmin && <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Inventory</button>}
      />

      {/* Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {outOfStockCount > 0 && <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><AlertTriangle size={16} /><strong>{outOfStockCount}</strong> resource(s) out of stock</div>}
          {lowStockCount > 0 && <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700"><AlertTriangle size={16} /><strong>{lowStockCount}</strong> resource(s) low on stock</div>}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search resources..." className="flex-1 min-w-48" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-select w-auto">
          <option value="">All Categories</option>
          {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
        </select>
        <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="form-select w-auto">
          <option value="">All Locations</option>
          {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}</option>)}
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value)} className="form-select w-auto">
          <option value="">All Stock Status</option>
          {['Available', 'Low Stock', 'Out of Stock'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingSpinner /> : inventory.length === 0 ? (
          <EmptyState icon={<Package size={48} />} title="No inventory records" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Resource', 'Category', 'Location', 'Unit', 'Available', 'Min. Stock', 'Status', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item: any) => (
                  <tr key={item.inventory_id} className={`table-row ${item.stock_status === 'Out of Stock' ? 'bg-red-50/30' : item.stock_status === 'Low Stock' ? 'bg-amber-50/30' : ''}`}>
                    <td className="table-cell font-medium text-gray-900">{item.resource_name}</td>
                    <td className="table-cell text-xs"><span className="px-2 py-1 bg-gray-100 rounded">{item.category_name}</span></td>
                    <td className="table-cell text-xs text-gray-600">{item.location_name}, {item.city}</td>
                    <td className="table-cell text-gray-500">{item.unit}</td>
                    <td className="table-cell">
                      <span className={`font-bold ${item.quantity_available === 0 ? 'text-red-600' : item.quantity_available <= item.minimum_stock ? 'text-amber-600' : 'text-green-700'}`}>
                        {item.quantity_available?.toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">{item.minimum_stock}</td>
                    <td className="table-cell"><StockBadge status={item.stock_status} /></td>
                    <td className="table-cell text-xs text-gray-400">{item.last_updated ? new Date(item.last_updated).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      {isAdmin && <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? `Update: ${editItem.resource_name}` : 'Add Inventory'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editItem && (
            <>
              <div>
                <label className="form-label">Resource *</label>
                <select className="form-select" value={form.resource_id || ''} onChange={e => setForm({ ...form, resource_id: e.target.value })} required>
                  <option value="">Select resource</option>
                  {resources.map((r: any) => <option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Location *</label>
                <select className="form-select" value={form.location_id || ''} onChange={e => setForm({ ...form, location_id: e.target.value })} required>
                  <option value="">Select location</option>
                  {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}, {l.city}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="form-label">Quantity Available *</label>
            <input type="number" className="form-input" value={form.quantity_available || 0} onChange={e => setForm({ ...form, quantity_available: parseInt(e.target.value) })} required min="0" />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
