import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, MapPin, Users, Building2, Package,
  Archive, FileText, Truck, Heart, HandHeart, Shield, ClipboardList,
  Car, Hospital, Phone, Bell, Settings, LogOut, Menu, X, ChevronDown,
  UserCog, BarChart3, Boxes, GitPullRequest, Share2, Ambulance,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
  { label: 'Disasters', icon: <AlertTriangle size={18} />, href: '/disasters', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Locations', icon: <MapPin size={18} />, href: '/locations', roles: ['Admin'] },
  { label: 'Affected People', icon: <Users size={18} />, href: '/affected-people' },
  { label: 'Relief Centers', icon: <Building2 size={18} />, href: '/relief-centers' },
  { label: 'Resources', icon: <Package size={18} />, href: '/resources', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Inventory', icon: <Archive size={18} />, href: '/inventory', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Resource Requests', icon: <GitPullRequest size={18} />, href: '/resource-requests' },
  { label: 'Distribution', icon: <Share2 size={18} />, href: '/distribution', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Volunteers', icon: <Heart size={18} />, href: '/volunteers', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Vol. Assignments', icon: <ClipboardList size={18} />, href: '/volunteer-assignments', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Donors', icon: <HandHeart size={18} />, href: '/donors', roles: ['Admin'] },
  { label: 'Donations', icon: <Boxes size={18} />, href: '/donations' },
  { label: 'Rescue Operations', icon: <Shield size={18} />, href: '/rescue-operations', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Relief Tasks', icon: <FileText size={18} />, href: '/relief-tasks' },
  { label: 'Transportation', icon: <Truck size={18} />, href: '/transportation', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Medical Facilities', icon: <Hospital size={18} />, href: '/medical-facilities', roles: ['Admin'] },
  { label: 'Medical Cases', icon: <Ambulance size={18} />, href: '/medical-cases', roles: ['Admin', 'Disaster Coordinator'] },
  { label: 'Emergency Contacts', icon: <Phone size={18} />, href: '/emergency-contacts' },
  { label: 'Notifications', icon: <Bell size={18} />, href: '/notifications' },
  { label: 'Users', icon: <UserCog size={18} />, href: '/users', roles: ['Admin'] },
  { label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports', roles: ['Admin', 'Disaster Coordinator'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role_name || '')
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full sidebar">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Relief Hub</p>
              <p className="text-blue-300 text-xs">Disaster Management</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden lg:flex"
          >
            <Menu className="w-4 h-4 text-blue-300" />
          </button>
        </div>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-blue-300 text-xs truncate">{user?.role_name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-primary-800 text-white rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col h-screen sticky top-0 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
        <SidebarContent />
      </div>
    </>
  );
};
