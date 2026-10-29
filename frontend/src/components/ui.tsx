import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

// ── STATUS BADGE ─────────────────────────────────────────────
interface StatusBadgeProps { status: string; }
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const configs: Record<string, string> = {
    // Disasters
    Active: 'bg-red-100 text-red-700 border-red-200',
    Reported: 'bg-amber-100 text-amber-700 border-amber-200',
    'Under Control': 'bg-blue-100 text-blue-700 border-blue-200',
    Resolved: 'bg-green-100 text-green-700 border-green-200',
    // Requests
    Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Approved: 'bg-blue-100 text-blue-700 border-blue-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200',
    Processing: 'bg-purple-100 text-purple-700 border-purple-200',
    Delivered: 'bg-green-100 text-green-700 border-green-200',
    // Operations
    Planned: 'bg-gray-100 text-gray-700 border-gray-200',
    Completed: 'bg-green-100 text-green-700 border-green-200',
    Cancelled: 'bg-red-100 text-red-700 border-red-200',
    // Volunteers
    Available: 'bg-green-100 text-green-700 border-green-200',
    Assigned: 'bg-blue-100 text-blue-700 border-blue-200',
    Unavailable: 'bg-gray-100 text-gray-700 border-gray-200',
    Verified: 'bg-green-100 text-green-700 border-green-200',
    // Medical
    Admitted: 'bg-blue-100 text-blue-700 border-blue-200',
    'Under Treatment': 'bg-purple-100 text-purple-700 border-purple-200',
    Discharged: 'bg-green-100 text-green-700 border-green-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
    Deceased: 'bg-gray-100 text-gray-700 border-gray-200',
    // Transport
    Scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    'En Route': 'bg-amber-100 text-amber-700 border-amber-200',
    Arrived: 'bg-green-100 text-green-700 border-green-200',
    // General
    Full: 'bg-red-100 text-red-700 border-red-200',
    Closed: 'bg-gray-100 text-gray-700 border-gray-200',
    'Under Setup': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200',
    suspended: 'bg-red-100 text-red-700 border-red-200',
    'In Use': 'bg-blue-100 text-blue-700 border-blue-200',
    'Under Maintenance': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Out of Service': 'bg-red-100 text-red-700 border-red-200',
    Received: 'bg-green-100 text-green-700 border-green-200',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const cls = configs[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  return <span className={`badge border ${cls}`}>{status}</span>;
};

// ── PRIORITY BADGE ───────────────────────────────────────────
interface PriorityBadgeProps { priority: string; }
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const configs: Record<string, string> = {
    Low: 'bg-gray-100 text-gray-600',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700 font-semibold',
  };
  return <span className={`badge ${configs[priority] || 'bg-gray-100 text-gray-600'}`}>{priority}</span>;
};

// ── SEVERITY BADGE ───────────────────────────────────────────
interface SeverityBadgeProps { severity: string; }
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const configs: Record<string, string> = {
    Low: 'bg-green-100 text-green-700',
    Moderate: 'bg-yellow-100 text-yellow-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-red-100 text-red-700 font-semibold',
  };
  return <span className={`badge ${configs[severity] || 'bg-gray-100 text-gray-600'}`}>{severity}</span>;
};

// ── STOCK BADGE ──────────────────────────────────────────────
export const StockBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, string> = {
    Available: 'bg-green-100 text-green-700',
    'Low Stock': 'bg-amber-100 text-amber-700',
    'Out of Stock': 'bg-red-100 text-red-700',
  };
  return <span className={`badge ${configs[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

// ── LOADING SPINNER ──────────────────────────────────────────
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

// ── EMPTY STATE ──────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }> = 
  ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    {icon && <div className="text-gray-300">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
    {action}
  </div>
);

// ── ERROR MESSAGE ────────────────────────────────────────────
export const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <AlertCircle className="w-12 h-12 text-red-400" />
    <p className="text-red-600 font-medium">{message}</p>
    {onRetry && <button onClick={onRetry} className="btn-secondary text-sm">Try Again</button>}
  </div>
);

// ── MODAL ────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-4xl' };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-in`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ── CONFIRM DIALOG ───────────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
}
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDestructive = false }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-in">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={isDestructive ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// ── SEARCH BAR ───────────────────────────────────────────────
import { Search } from 'lucide-react';
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="form-input pl-9 pr-4"
    />
  </div>
);

// ── CAPACITY BAR ─────────────────────────────────────────────
interface CapacityBarProps { current: number; total: number; label?: string; }
export const CapacityBar: React.FC<CapacityBarProps> = ({ current, total, label }) => {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-xs text-gray-500"><span>{label}</span><span>{current}/{total}</span></div>}
      <div className="progress-bar"><div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} /></div>
      {!label && <div className="text-xs text-gray-500 text-right">{current}/{total} ({Math.round(pct)}%)</div>}
    </div>
  );
};

// ── STAT CARD ────────────────────────────────────────────────
interface StatCardProps { title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string; trend?: string; }
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend }) => (
  <div className="stat-card">
    <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      {trend && <p className="text-xs text-green-600 font-medium mt-0.5">{trend}</p>}
    </div>
  </div>
);

// ── PAGE HEADER ──────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; actions?: React.ReactNode; icon?: React.ReactNode; }
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, icon }) => (
  <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
    <div className="flex items-center gap-3">
      {icon && <div className="p-2.5 bg-primary-50 rounded-xl text-primary-700">{icon}</div>}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ── ALERT BANNER ─────────────────────────────────────────────
interface AlertBannerProps { type: 'info' | 'success' | 'warning' | 'error'; message: string; }
export const AlertBanner: React.FC<AlertBannerProps> = ({ type, message }) => {
  const configs = {
    info: { cls: 'bg-blue-50 border-blue-200 text-blue-700', icon: <Info className="w-4 h-4" /> },
    success: { cls: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
    warning: { cls: 'bg-amber-50 border-amber-200 text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> },
    error: { cls: 'bg-red-50 border-red-200 text-red-700', icon: <AlertCircle className="w-4 h-4" /> },
  };
  const { cls, icon } = configs[type];
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${cls} text-sm`}>
      {icon}{message}
    </div>
  );
};
