import React, { useEffect, useState } from 'react';
import { Hospital, Plus, Edit2 } from 'lucide-react';
import { medicalApi, locationsApi, affectedPeopleApi, disastersApi } from '../services/api';
import { Modal, StatusBadge, LoadingSpinner, EmptyState, PageHeader, SearchBar } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const MedicalFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'facilities' | 'cases'>('facilities');
  const [search, setSearch] = useState('');
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [editFacility, setEditFacility] = useState<any>(null);
  const [editCase, setEditCase] = useState<any>(null);
  const [facilityForm, setFacilityForm] = useState<any>({ facility_type: 'Hospital', status: 'Active', available_beds: 0, emergency_available: false });
  const [caseForm, setCaseForm] = useState<any>({ case_type: 'Injury', case_status: 'Admitted' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';
  const canManage = isAdmin || user?.role_name === 'Disaster Coordinator';

  const load = async () => {
    setLoading(true);
    try {
      const [fRes, cRes, lRes, pRes, dRes]: any[] = await Promise.all([
        medicalApi.getFacilities({ search }),
        medicalApi.getCases(),
        locationsApi.getAll(),
        affectedPeopleApi.getAll(),
        disastersApi.getAll(),
      ]);
      setFacilities(fRes.data || []);
      setCases(cRes.data || []);
      setLocations(lRes.data || []);
      setPeople(pRes.data || []);
      setDisasters(dRes.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openFacilityModal = (item?: any) => { setEditFacility(item || null); setFacilityForm(item || { facility_type: 'Hospital', status: 'Active', available_beds: 0, emergency_available: false }); setFacilityModalOpen(true); };
  const openCaseModal = (item?: any) => { setEditCase(item || null); setCaseForm(item ? { ...item, discharge_date: item.discharge_date?.slice(0, 16) } : { case_type: 'Injury', case_status: 'Admitted' }); setCaseModalOpen(true); };

  const handleFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityForm.facility_name || !facilityForm.facility_type) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      if (editFacility) { await medicalApi.updateFacility(editFacility.facility_id, facilityForm); toast.success('Facility updated.'); }
      else { await medicalApi.createFacility(facilityForm); toast.success('Facility added.'); }
      setFacilityModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseForm.case_type) { toast.error('Case type required.'); return; }
    setSaving(true);
    try {
      if (editCase) { await medicalApi.updateCase(editCase.case_id, caseForm); toast.success('Case updated.'); }
      else { await medicalApi.createCase(caseForm); toast.success('Case created.'); }
      setCaseModalOpen(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const caseStatusColor: Record<string, string> = { Admitted: 'text-blue-700', 'Under Treatment': 'text-purple-700', Discharged: 'text-green-700', Critical: 'text-red-700 font-bold', Deceased: 'text-gray-600' };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Medical Management" subtitle="Facilities and Cases" icon={<Hospital size={22} />}
        actions={
          <div className="flex gap-2">
            {canManage && <button onClick={() => openCaseModal()} className="btn-secondary">New Case</button>}
            {isAdmin && <button onClick={() => openFacilityModal()} className="btn-primary"><Plus size={16} /> Add Facility</button>}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Facilities', value: facilities.filter(f => f.status === 'Active').length, cls: 'bg-green-50 text-green-700' },
          { label: 'Total Beds', value: facilities.reduce((s: number, f: any) => s + (f.available_beds || 0), 0), cls: 'bg-blue-50 text-blue-700' },
          { label: 'Active Cases', value: cases.filter(c => c.case_status === 'Under Treatment' || c.case_status === 'Admitted').length, cls: 'bg-orange-50 text-orange-700' },
          { label: 'Critical Cases', value: cases.filter(c => c.case_status === 'Critical').length, cls: 'bg-red-50 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`card text-center ${s.cls}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['facilities', 'cases'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-primary-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {tab === 'facilities' ? `Facilities (${facilities.length})` : `Cases (${cases.length})`}
          </button>
        ))}
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${activeTab}...`} className="ml-auto w-64" />
      </div>

      {loading ? <LoadingSpinner /> : activeTab === 'facilities' ? (
        facilities.length === 0 ? <EmptyState icon={<Hospital size={48} />} title="No facilities found" /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {facilities.map((f: any) => (
              <div key={f.facility_id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{f.facility_name}</h3>
                    <p className="text-xs text-gray-500">{f.city || f.location_name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge status={f.status} />
                    {isAdmin && <button onClick={() => openFacilityModal(f)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={13} className="text-gray-400" /></button>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{f.facility_type}</span>
                  {f.emergency_available && <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">🚨 Emergency</span>}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-600">🛏️ Available Beds: <strong>{f.available_beds}</strong></div>
                  {f.contact_number && <div className="text-gray-500">📞 {f.contact_number}</div>}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card p-0 overflow-hidden">
          {cases.length === 0 ? <EmptyState icon={<Hospital size={48} />} title="No medical cases" action={canManage && <button onClick={() => openCaseModal()} className="btn-primary">New Case</button>} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Person', 'Facility', 'Disaster', 'Case Type', 'Injury', 'Status', 'Admission', 'Actions'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {cases.map((c: any) => (
                    <tr key={c.case_id} className={`table-row ${c.case_status === 'Critical' ? 'bg-red-50/30' : ''}`}>
                      <td className="table-cell"><div className="font-medium">{c.person_name || '—'}</div><div className="text-xs text-gray-400">{c.age ? `${c.age}y` : ''} {c.gender || ''}</div></td>
                      <td className="table-cell text-xs">{c.facility_name || '—'}</td>
                      <td className="table-cell text-xs text-gray-500">{c.disaster_name || '—'}</td>
                      <td className="table-cell text-xs"><span className="px-2 py-0.5 bg-gray-100 rounded">{c.case_type}</span></td>
                      <td className="table-cell text-xs max-w-xs truncate">{c.injury_description || '—'}</td>
                      <td className="table-cell"><span className={`text-xs font-medium ${caseStatusColor[c.case_status] || ''}`}>{c.case_status}</span></td>
                      <td className="table-cell text-xs text-gray-400">{c.admission_date ? format(new Date(c.admission_date), 'MMM d, yyyy') : '—'}</td>
                      <td className="table-cell">
                        {canManage && <button onClick={() => openCaseModal(c)} className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg"><Edit2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Facility Modal */}
      <Modal isOpen={facilityModalOpen} onClose={() => setFacilityModalOpen(false)} title={editFacility ? 'Edit Facility' : 'Add Medical Facility'}>
        <form onSubmit={handleFacility} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Facility Name *</label>
              <input className="form-input" value={facilityForm.facility_name || ''} onChange={e => setFacilityForm({ ...facilityForm, facility_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Type *</label>
              <select className="form-select" value={facilityForm.facility_type} onChange={e => setFacilityForm({ ...facilityForm, facility_type: e.target.value })}>
                {['Hospital', 'Clinic', 'Field Medical Unit', 'Trauma Center'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <select className="form-select" value={facilityForm.location_id || ''} onChange={e => setFacilityForm({ ...facilityForm, location_id: e.target.value })}>
                <option value="">Select location</option>
                {locations.map((l: any) => <option key={l.location_id} value={l.location_id}>{l.location_name}, {l.city}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Contact Number</label>
              <input className="form-input" value={facilityForm.contact_number || ''} onChange={e => setFacilityForm({ ...facilityForm, contact_number: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Available Beds</label>
              <input type="number" className="form-input" value={facilityForm.available_beds || 0} onChange={e => setFacilityForm({ ...facilityForm, available_beds: e.target.value })} min="0" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={facilityForm.status} onChange={e => setFacilityForm({ ...facilityForm, status: e.target.value })}>
                {['Active', 'Full', 'Closed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="emergency" checked={facilityForm.emergency_available} onChange={e => setFacilityForm({ ...facilityForm, emergency_available: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
              <label htmlFor="emergency" className="form-label mb-0">Emergency Available</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setFacilityModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editFacility ? 'Update' : 'Add Facility'}</button>
          </div>
        </form>
      </Modal>

      {/* Case Modal */}
      <Modal isOpen={caseModalOpen} onClose={() => setCaseModalOpen(false)} title={editCase ? 'Update Medical Case' : 'Create Medical Case'}>
        <form onSubmit={handleCase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Affected Person</label>
              <select className="form-select" value={caseForm.person_id || ''} onChange={e => setCaseForm({ ...caseForm, person_id: e.target.value })}>
                <option value="">Select person</option>
                {people.map((p: any) => <option key={p.person_id} value={p.person_id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Facility</label>
              <select className="form-select" value={caseForm.facility_id || ''} onChange={e => setCaseForm({ ...caseForm, facility_id: e.target.value })}>
                <option value="">Select facility</option>
                {facilities.map((f: any) => <option key={f.facility_id} value={f.facility_id}>{f.facility_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Disaster</label>
              <select className="form-select" value={caseForm.disaster_id || ''} onChange={e => setCaseForm({ ...caseForm, disaster_id: e.target.value })}>
                <option value="">Select disaster</option>
                {disasters.map((d: any) => <option key={d.disaster_id} value={d.disaster_id}>{d.disaster_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Case Type *</label>
              <select className="form-select" value={caseForm.case_type} onChange={e => setCaseForm({ ...caseForm, case_type: e.target.value })}>
                {['Injury', 'Illness', 'Trauma', 'Missing', 'Deceased'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Case Status</label>
              <select className="form-select" value={caseForm.case_status} onChange={e => setCaseForm({ ...caseForm, case_status: e.target.value })}>
                {['Admitted', 'Under Treatment', 'Discharged', 'Critical', 'Deceased'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Discharge Date</label>
              <input type="datetime-local" className="form-input" value={caseForm.discharge_date || ''} onChange={e => setCaseForm({ ...caseForm, discharge_date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Injury Description</label>
              <textarea className="form-input h-20 resize-none" value={caseForm.injury_description || ''} onChange={e => setCaseForm({ ...caseForm, injury_description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Treatment</label>
              <textarea className="form-input h-20 resize-none" value={caseForm.treatment || ''} onChange={e => setCaseForm({ ...caseForm, treatment: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t">
            <button type="button" onClick={() => setCaseModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editCase ? 'Update' : 'Create Case'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MedicalFacilities;
