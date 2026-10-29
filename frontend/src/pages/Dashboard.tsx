import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Users, Package, Clock, Heart, Shield, Building2,
  DollarSign, TrendingUp, Activity, Truck, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { dashboardApi } from '../services/api';
import { StatCard, LoadingSpinner, StatusBadge, SeverityBadge, ErrorMessage } from '../components/ui';
import { format } from 'date-fns';

const COLORS = ['#1d4ed8','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#be185d','#059669'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await dashboardApi.getStats();
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const { stats, charts } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time disaster relief monitoring & coordination</p>
        </div>
        <button onClick={load} className="btn-secondary gap-2">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Active Alert Banner */}
      {stats.activeDisasters > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-700 font-semibold text-sm">
            {stats.activeDisasters} Active Disaster{stats.activeDisasters > 1 ? 's' : ''} — Immediate coordination required
          </span>
          <button onClick={() => navigate('/disasters')} className="ml-auto text-xs text-red-600 underline font-medium">View All</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Disasters"
          value={stats.activeDisasters}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
          subtitle="Requiring immediate response"
        />
        <StatCard
          title="Affected People"
          value={stats.affectedPeople}
          icon={<Users className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
          subtitle="Registered in system"
        />
        <StatCard
          title="Resources Available"
          value={stats.availableResources?.toLocaleString()}
          icon={<Package className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          subtitle="Total inventory units"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Active Volunteers"
          value={stats.activeVolunteers}
          icon={<Heart className="w-6 h-6 text-pink-600" />}
          color="bg-pink-50"
          subtitle="Registered volunteers"
        />
        <StatCard
          title="Rescue Operations"
          value={stats.activeOperations}
          icon={<Shield className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50"
          subtitle="Currently active"
        />
        <StatCard
          title="Relief Centers"
          value={stats.reliefCenters}
          icon={<Building2 className="w-6 h-6 text-teal-600" />}
          color="bg-teal-50"
          subtitle="Operational centers"
        />
        <StatCard
          title="Total Donations"
          value={`₹${(stats.totalDonations / 100000).toFixed(1)}L`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
          subtitle="Verified donations"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Disasters by Type */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" /> Disasters by Type
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.disastersByType} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type_name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
              <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Disasters" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Distribution */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-600" /> Distribution Timeline
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts.monthlyDistribution}>
              <defs>
                <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="total" stroke="#1d4ed8" fill="url(#distGrad)" name="Units Distributed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donation Trend */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" /> Donation Trend (₹)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.donationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v/100000).toFixed(1)}L`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`₹${(v/100000).toFixed(2)}L`, 'Donations']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} name="Donations" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Low Inventory */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">⚠️ Low Stock Alert</h3>
          <div className="space-y-3">
            {charts.topInventory?.slice(0, 5).map((item: any, i: number) => {
              const pct = item.minimum_stock > 0 ? Math.min((item.total_qty / item.minimum_stock) * 100, 200) : 100;
              const isLow = item.total_qty <= item.minimum_stock;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLow ? 'bg-red-500' : 'bg-green-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.resource_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="progress-bar flex-1 h-1.5">
                        <div className={`progress-fill h-1.5 ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{item.total_qty} {item.unit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Disasters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Recent Disasters
          </h3>
          <button onClick={() => navigate('/disasters')} className="text-xs text-primary-600 font-medium hover:underline">View all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Disaster</th>
                <th className="table-header">Type</th>
                <th className="table-header">Severity</th>
                <th className="table-header">Status</th>
                <th className="table-header">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {charts.recentDisasters?.map((d: any) => (
                <tr key={d.disaster_id} className="table-row cursor-pointer" onClick={() => navigate('/disasters')}>
                  <td className="table-cell font-medium text-gray-900">{d.disaster_name}</td>
                  <td className="table-cell text-gray-500">{d.type_name}</td>
                  <td className="table-cell"><SeverityBadge severity={d.severity} /></td>
                  <td className="table-cell"><StatusBadge status={d.status} /></td>
                  <td className="table-cell text-gray-500">{d.start_date ? format(new Date(d.start_date), 'MMM d, yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
