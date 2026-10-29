import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', password: '', confirm_password: '', role_id: '4' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e: any = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ ...form, role_id: parseInt(form.role_id) });
      toast.success('Account created successfully! Welcome!');
      navigate('/dashboard');
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setLoading(false);
    }
  };

  const F = (name: string, label: string, type = 'text', opts?: any) => (
    <div>
      <label className="form-label">{label}</label>
      <input type={type} className={`form-input ${errors[name] ? 'border-red-400 focus:ring-red-400' : ''}`}
        value={(form as any)[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} {...opts} />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(135deg, #0f2154 0%, #1e3a8a 100%)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-blue-200 mt-2">Join the Relief Hub platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {errors.general && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-5">
              <AlertCircle size={16} />{errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {F('full_name', 'Full Name *', 'text', { placeholder: 'Rajesh Kumar Sharma', required: true })}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email Address *</label>
                <input type="email" className={`form-input ${errors.email ? 'border-red-400' : ''}`} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="form-label">Phone Number *</label>
                <input type="tel" className={`form-input ${errors.phone ? 'border-red-400' : ''}`} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91-9876543210" required />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Your full address" />
            </div>

            <div>
              <label className="form-label">Register As</label>
              <select className="form-select" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })}>
                <option value="3">🤝 Volunteer — Participate in relief activities</option>
                <option value="4">💚 Donor — Donate resources or funds</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Note: Admin and Coordinator roles are assigned by system administrators.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} className={`form-input pr-10 ${errors.password ? 'border-red-400' : ''}`} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="form-label">Confirm Password *</label>
                <input type="password" className={`form-input ${errors.confirm_password ? 'border-red-400' : ''}`} value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="••••••••" required />
                {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 transition-colors disabled:opacity-60 mt-2">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
