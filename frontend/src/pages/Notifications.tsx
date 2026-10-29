import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { LoadingSpinner, EmptyState, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

const typeIcons: Record<string, string> = {
  'Disaster Alert': '🚨', 'Resource Request': '📦', 'Request Approval': '✅',
  'Low Inventory': '⚠️', 'Volunteer Assignment': '🤝', 'Rescue Update': '⛑️',
  'Medical Emergency': '🏥', 'Donation Update': '💚', 'General': '🔔',
};

const typeColors: Record<string, string> = {
  'Disaster Alert': 'border-red-300 bg-red-50',
  'Resource Request': 'border-blue-300 bg-blue-50',
  'Request Approval': 'border-green-300 bg-green-50',
  'Low Inventory': 'border-amber-300 bg-amber-50',
  'Volunteer Assignment': 'border-purple-300 bg-purple-50',
  'Rescue Update': 'border-orange-300 bg-orange-50',
  'Medical Emergency': 'border-red-400 bg-red-50',
  'Donation Update': 'border-green-300 bg-green-50',
  'General': 'border-gray-300 bg-gray-50',
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { user } = useAuthStore();
  const isAdmin = user?.role_name === 'Admin';

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await notificationsApi.getAll();
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e: any) { toast.error(e.message); }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch (e: any) { toast.error(e.message); }
  };

  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        icon={<Bell size={22} />}
        actions={
          unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary gap-2">
              <CheckCheck size={16} /> Mark all read
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : displayed.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title={filter === 'unread' ? 'No unread notifications' : 'No notifications'} />
      ) : (
        <div className="space-y-2">
          {displayed.map((n: any) => (
            <div
              key={n.notification_id}
              className={`card p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${typeColors[n.notification_type] || 'border-gray-300'} ${!n.is_read ? 'shadow-md' : 'opacity-75'}`}
              onClick={() => !n.is_read && markRead(n.notification_id)}
            >
              <div className="text-2xl flex-shrink-0 mt-0.5">{typeIcons[n.notification_type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-semibold text-gray-900 ${!n.is_read ? 'text-primary-800' : ''}`}>{n.title}</h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!n.is_read && <div className="w-2 h-2 bg-primary-600 rounded-full" />}
                    <span className="text-xs text-gray-400">{n.created_at ? format(new Date(n.created_at), 'MMM d, HH:mm') : '—'}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-500">{n.notification_type}</span>
                  {n.disaster_name && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs">📍 {n.disaster_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
