import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export default function LoginScreen({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e && e.preventDefault();
    setError(null);
    if (!email || !password) return setError('Please enter email and password.');
    // Minimal client-side validation for production readiness
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) return setError('Please enter a valid email address.');

    // Simulate success; caller should perform real auth
    onLogin && onLogin({ email });
  };

  return (
    <div className="page-wrap prod-typography">
      <div className="single-strand">
        <div className="header-pill">
          <div className="pill-icon"> <Mail size={16} /> </div>
        </div>

        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue to SkillSync</p>
        </header>

        <div className="content-card auth-card">
          <form onSubmit={handleSubmit} aria-label="Login form">
            <div className="mb-4">
              <label className="label-muted" htmlFor="loginEmail">Email</label>
              <div className="input-with-icon">
                <Mail className="absolute" size={18} aria-hidden="true" />
                <input id="loginEmail" value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" placeholder="you@example.com" />
              </div>
            </div>

            <div className="mb-4">
              <label className="label-muted" htmlFor="loginPassword">Password</label>
              <div className="input-with-icon">
                <Lock className="absolute" size={18} aria-hidden="true" />
                <input id="loginPassword" value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl" placeholder="••••••••" />
              </div>
            </div>

            {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

            <button type="submit" className="w-full signup-cta">Log in</button>
          </form>

          <div className="text-center mt-4">
            <p className="text-gray-600">Don't have an account? <button onClick={onSwitchToSignup} className="login-box">Sign up</button></p>
            <div className="mt-4 text-sm text-gray-600">Or preview the app:</div>
            <div className="flex gap-2 justify-center mt-3">
              <button onClick={() => onLogin && onLogin({}, 'student')} className="px-3 py-2 rounded-full border">Preview Student</button>
              <button onClick={() => onLogin && onLogin({}, 'provider')} className="px-3 py-2 rounded-full border">Preview Provider</button>
              <button onClick={() => onLogin && onLogin({}, 'admin')} className="px-3 py-2 rounded-full border">Preview Admin</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
