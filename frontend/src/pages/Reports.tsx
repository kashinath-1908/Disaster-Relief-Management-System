import React, { useState } from 'react';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
import { reportsApi, disastersApi } from '../services/api';
import { LoadingSpinner, EmptyState, PageHeader, SeverityBadge, StatusBadge } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const REPORT_TYPES = [
  { value: 'disaster_statistics', label: 'Disaster Statistics' },
  { value: 'resource_inventory', label: 'Resource Inventory' },
  { value: 'donations', label: 'Donations Report' },
  { value: 'volunteers', label: 'Volunteer Summary' },
  { value: 'rescue_operations', label: 'Rescue Operations' },
];

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('disaster_statistics');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res: any = await reportsApi.get({ report_type: reportType });
      setData(res.data || []);
      setGenerated(true);
      toast.success(`Report generated: ${data.length} records.`);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  };

  const renderTable = () => {
    if (!data.length) return <EmptyState icon={<BarChart3 size={48} />} title="No data for this report" />;
    const keys = Object.keys(data[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>{keys.map(k => <th key={k} className="table-header capitalize">{k.replace(/_/g, ' ')}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row: any, i: number) => (
              <tr key={i} className="table-row">
                {keys.map(k => (
                  <td key={k} className="table-cell text-xs">
                    {k === 'severity' ? <SeverityBadge severity={row[k]} /> :
                     k === 'status' ? <StatusBadge status={row[k]} /> :
                     k === 'amount' && row[k] ? `₹${parseFloat(row[k]).toLocaleString('en-IN')}` :
                     (k.includes('date') || k.includes('_at')) && row[k] ? format(new Date(row[k]), 'MMM d, yyyy') :
                     row[k] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Reports" subtitle="Generate and export system reports" icon={<BarChart3 size={22} />} />

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="form-label">Select Report Type</label>
            <select className="form-select text-base" value={reportType} onChange={e => { setReportType(e.target.value); setGenerated(false); setData([]); }}>
              {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={generateReport} disabled={loading} className="btn-primary flex-1">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Generate
            </button>
            {data.length > 0 && (
              <button onClick={exportCSV} className="btn-secondary"><Download size={16} /> CSV</button>
            )}
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner message="Generating report..." /> : generated && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{REPORT_TYPES.find(r => r.value === reportType)?.label} — {data.length} records</span>
          </div>
          {renderTable()}
        </div>
      )}

      {!generated && !loading && (
        <div className="card">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">Select a report type and click Generate</h3>
            <p className="text-sm text-gray-400 mt-2">Reports can be exported as CSV files</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
