import React, { useState } from 'react';
import { User, Mail, Lock, Briefcase, MapPin } from 'lucide-react';

export default function SignupScreen({ onSignup, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', category: 'Tutoring', location: 'Kimironko' });
  const [error, setError] = useState(null);

  const handleChange = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e && e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.password) return setError('Please fill the required fields.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    // Basic email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(form.email)) return setError('Please enter a valid email address.');

    // Caller should handle real signup
    onSignup && onSignup({ ...form });
  };

  return (
    <div className="page-wrap prod-typography">
      <div className="single-strand">
        <div className="header-pill">
          <div className="pill-icon"> <User size={16} /> </div>
        </div>

        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold">Create your account</h1>
          <p className="text-gray-600 mt-2">Join SkillSync to connect with opportunities</p>
        </header>

        <div className="content-card auth-card">
          <form onSubmit={handleSubmit} aria-label="Signup form">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label-muted">Full Name</label>
                <div className="input-with-icon">
                  <User className="absolute" size={18} aria-hidden="true" />
                  <input value={form.name} onChange={handleChange('name')} type="text" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" placeholder="Jane Doe" />
                </div>
              </div>

              <div>
                <label className="label-muted">Email</label>
                <div className="input-with-icon">
                  <Mail className="absolute" size={18} aria-hidden="true" />
                  <input value={form.email} onChange={handleChange('email')} type="email" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label className="label-muted">Password</label>
                <div className="input-with-icon">
                  <Lock className="absolute" size={18} aria-hidden="true" />
                  <input value={form.password} onChange={handleChange('password')} type="password" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" placeholder="••••••••" />
                </div>
              </div>

              <div>
                <label className="label-muted">Confirm</label>
                <div className="input-with-icon">
                  <Lock className="absolute" size={18} aria-hidden="true" />
                  <input value={form.confirm} onChange={handleChange('confirm')} type="password" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" placeholder="••••••••" />
                </div>
              </div>

              <div>
                <label className="label-muted">Skill Category</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} aria-hidden="true" />
                  <select value={form.category} onChange={handleChange('category')} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white">
                    <option>Tutoring</option>
                    <option>Tech Support</option>
                    <option>Events</option>
                    <option>Marketing</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-muted">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} aria-hidden="true" />
                  <select value={form.location} onChange={handleChange('location')} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white">
                    <option>Kimironko</option>
                    <option>Kacyiru</option>
                    <option>Bumbogo</option>
                    <option>Remera</option>
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 mt-4">{error}</div>}

            <div className="mt-6">
              <button type="submit" className="w-full signup-cta">Create account</button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-gray-600">Already have an account? <button onClick={onSwitchToLogin} className="login-box">Log in</button></p>
            <div className="mt-4 text-sm text-gray-600">Or preview the app:</div>
            <div className="flex gap-2 justify-center mt-3">
              <button onClick={() => onSignup && onSignup({}, 'student')} className="px-3 py-2 rounded-full border">Preview Student</button>
              <button onClick={() => onSignup && onSignup({}, 'provider')} className="px-3 py-2 rounded-full border">Preview Provider</button>
              <button onClick={() => onSignup && onSignup({}, 'admin')} className="px-3 py-2 rounded-full border">Preview Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
