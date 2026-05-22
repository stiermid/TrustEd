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
            onClick={() => signInOAuth('google')}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
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
