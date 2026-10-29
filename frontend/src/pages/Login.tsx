import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.full_name}!`);
      // Role-based redirect
      if (user.role_name === 'Admin' || user.role_name === 'Disaster Coordinator') navigate('/dashboard');
      else navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@reliefhub.org', password: 'Admin@123' },
      coordinator: { email: 'coordinator1@reliefhub.org', password: 'Admin@123' },
      volunteer: { email: 'volunteer1@reliefhub.org', password: 'Admin@123' },
      donor: { email: 'donor@tatafoundation.org', password: 'Admin@123' },
    };
    const c = creds[role];
    if (c) { setEmail(c.email); setPassword(c.password); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f2154 0%, #1e3a8a 50%, #0f2154 100%)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Relief Hub</h1>
              <p className="text-blue-300 text-sm">Disaster Management System</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Coordinating Relief Operations When It Matters Most
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            A comprehensive platform for managing disaster response, tracking resources, coordinating volunteers, and providing timely assistance to affected communities.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🚨', label: 'Active Disaster Tracking' },
              { icon: '📦', label: 'Resource Management' },
              { icon: '🤝', label: 'Volunteer Coordination' },
              { icon: '🏥', label: 'Medical Management' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span>{f.icon}</span>
                <span className="text-sm text-blue-100">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Mobile Logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Relief Hub</h1>
                <p className="text-gray-400 text-xs">Disaster Management System</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to access the platform</p>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus required />
              </div>
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className="form-input pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 active:bg-primary-900 transition-colors disabled:opacity-60">
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Quick Login */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-3">Quick Login (Demo)</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'admin', label: '👑 Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                  { role: 'coordinator', label: '🛡️ Coordinator', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { role: 'volunteer', label: '🤝 Volunteer', color: 'bg-green-50 text-green-700 border-green-200' },
                  { role: 'donor', label: '💚 Donor', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                ].map(q => (
                  <button key={q.role} onClick={() => quickLogin(q.role)} className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:shadow-sm ${q.color}`}>
                    {q.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">Password: <code className="bg-gray-100 px-1 rounded">Admin@123</code></p>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
