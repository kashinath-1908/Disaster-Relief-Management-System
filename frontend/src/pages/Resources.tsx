import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, Tags } from 'lucide-react';
import { resourcesApi } from '../services/api';
import { Modal, ConfirmDialog, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Resources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'resources' | 'categories'>('resources');
  const [resModalOpen, setResModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editRes, setEditRes] = useState<any>(null);
  const [deleteResId, setDeleteResId] = useState<number | null>(null);
  const [resForm, setResForm] = useState<any>({ minimum_stock: 0 });
  const [catForm, setCatForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, cRes]: any[] = await Promise.all([
        resourcesApi.getAll({ search, category_id: filterCategory }),
        resourcesApi.getCategories(),
      ]);
      setResources(rRes.data || []);
      setCategories(cRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterCategory]);

  const openResModal = (item?: any) => { setEditRes(item || null); setResForm(item || { minimum_stock: 0 }); setResModalOpen(true); };

  const handleRes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.category_id || !resForm.resource_name || !resForm.unit) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      if (editRes) { await resourcesApi.update(editRes.resource_id, resForm); toast.success('Resource updated.'); }
      else { await resourcesApi.create(resForm); toast.success('Resource created.'); }
      setResModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.category_name) { toast.error('Category name required.'); return; }
    setSaving(true);
    try {
      await resourcesApi.createCategory(catForm);
      toast.success('Category created.');
      setCatModalOpen(false); setCatForm({}); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Resources" subtitle="Manage relief resources and categories" icon={<Package size={22} />}
        actions={
          isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setCatModalOpen(true)} className="btn-secondary"><Tags size={16} /> Add Category</button>
              <button onClick={() => openResModal()} className="btn-primary"><Plus size={16} /> Add Resource</button>
            </div>
          )
        }
      />

      <div className="flex gap-2">
        {(['resources', 'categories'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-primary-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {tab === 'resources' ? `Resources (${resources.length})` : `Categories (${categories.length})`}
          </button>
        ))}
        {activeTab === 'resources' && (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Search..." className="ml-auto w-64" />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="form-select w-auto">
              <option value="">All Categories</option>
              {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </>
        )}
      </div>

      {loading ? <LoadingSpinner /> : activeTab === 'resources' ? (
        <div className="card p-0 overflow-hidden">
          {resources.length === 0 ? <EmptyState icon={<Package size={48} />} title="No resources found" action={isAdmin && <button onClick={() => openResModal()} className="btn-primary">Add Resource</button>} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>{['#', 'Resource', 'Category', 'Unit', 'Min. Stock', 'Description', isAdmin ? 'Actions' : ''].map(h => h && <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {resources.map((r: any, i: number) => (
                    <tr key={r.resource_id} className="table-row">
                      <td className="table-cell text-gray-400">{i + 1}</td>
                      <td className="table-cell font-medium">{r.resource_name}</td>
                      <td className="table-cell"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{r.category_name}</span></td>
                      <td className="table-cell text-gray-500">{r.unit}</td>
                      <td className="table-cell text-gray-500">{r.minimum_stock}</td>
                      <td className="table-cell text-xs text-gray-400 max-w-xs truncate">{r.description || '—'}</td>
                      {isAdmin && (
                        <td className="table-cell">
                          <div className="flex gap-1">
                            <button onClick={() => openResModal(r)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>
                            <button onClick={() => setDeleteResId(r.resource_id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((c: any) => (
            <div key={c.category_id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
                  <Tags size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">{c.category_name}</h3>
                  <p className="text-xs text-gray-400">{resources.filter(r => r.category_id === c.category_id).length} resources</p>
                </div>
              </div>
              {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={resModalOpen} onClose={() => setResModalOpen(false)} title={editRes ? 'Edit Resource' : 'Add Resource'}>
        <form onSubmit={handleRes} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Resource Name *</label>
              <input className="form-input" value={resForm.resource_name || ''} onChange={e => setResForm({ ...resForm, resource_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Category *</label>
              <select className="form-select" value={resForm.category_id || ''} onChange={e => setResForm({ ...resForm, category_id: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Unit *</label>
              <input className="form-input" value={resForm.unit || ''} onChange={e => setResForm({ ...resForm, unit: e.target.value })} required placeholder="e.g., Kg, Pieces, Cans" />
            </div>
            <div>
              <label className="form-label">Minimum Stock</label>
              <input type="number" className="form-input" value={resForm.minimum_stock || 0} onChange={e => setResForm({ ...resForm, minimum_stock: e.target.value })} min="0" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-input h-20 resize-none" value={resForm.description || ''} onChange={e => setResForm({ ...resForm, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setResModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editRes ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={catModalOpen} onClose={() => { setCatModalOpen(false); setCatForm({}); }} title="Add Resource Category" size="sm">
        <form onSubmit={handleCat} className="space-y-4">
          <div>
            <label className="form-label">Category Name *</label>
            <input className="form-input" value={catForm.category_name || ''} onChange={e => setCatForm({ ...catForm, category_name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-input h-20 resize-none" value={catForm.description || ''} onChange={e => setCatForm({ ...catForm, description: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setCatModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create Category'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteResId !== null} onClose={() => setDeleteResId(null)}
        onConfirm={() => deleteResId && resourcesApi.delete(deleteResId).then(() => { toast.success('Resource deleted.'); load(); }).catch((e: any) => toast.error(e.message))}
        title="Delete Resource" message="Delete this resource? Inventory records will also be affected." confirmText="Delete" isDestructive
      />
    </div>
  );
};

export default Resources;
