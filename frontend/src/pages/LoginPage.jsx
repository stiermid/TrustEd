import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) navigate('/courses', { replace: true });
  }, [user, navigate]);

  async function signInOAuth(provider) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email for a confirmation link.');
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 12px' }}>
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
          </defs>
          {/* Background squircle */}
          <rect width="80" height="80" rx="20" fill="url(#bgGrad)" />
          {/* Left book page */}
          <path d="M38 22 C36 21 27 17 17 19 C15 20 15 21 15 23 L15 50 C15 52 17 53 19 53 C27 54 38 54 38 55 Z" fill="rgba(255,255,255,0.92)" />
          {/* Right book page */}
          <path d="M42 22 C44 21 53 17 63 19 C65 20 65 21 65 23 L65 50 C65 52 63 53 61 53 C53 54 42 54 42 55 Z" fill="rgba(209,250,229,0.80)" />
          {/* Checkmark badge circle */}
          <circle cx="57" cy="57" r="14" fill="#065F46" />
          <circle cx="57" cy="57" r="13" fill="#059669" />
          {/* Checkmark */}
          <path d="M50.5 57.5 L55 62 L63.5 52.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="login-logo">TrustEd</p>
        <p className="login-sub">
          Honest course reviews — anonymous by default,<br />
          revealed only to people you trust.
        </p>
        {error && <div className="alert-error">{error}</div>}
        {message && <div className="alert-info">{message}</div>}

        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="btn-ghost btn-sm"
            style={{ display: 'inline', padding: 0, color: 'var(--accent)' }}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <div className="divider-text"><span>or</span></div>

        <div className="oauth-buttons">
          <button
            className="btn-oauth"
            onClick={() => signInOAuth('linkedin_oidc')}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>
        </div>
      </div>
    </div>
  );
}
