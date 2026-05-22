import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

function FeatureCard({ icon, title, description }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 14, padding: '28px 24px', flex: '1 1 220px', minWidth: 0 }}>
      <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
}

export default function HeroPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/courses', { replace: true });
  }, [user, loading, navigate]);

  async function handleLinkedIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: window.location.origin + '/courses' },
    });
  }

  if (loading || user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #f8faff 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid #E8E8E8', background: '#fff' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#057642', letterSpacing: '-0.5px' }}>TrustEd</span>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '8px 22px', borderRadius: 24, border: '1.5px solid #057642', background: '#fff', color: '#057642', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 860, width: '100%' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600, color: '#057642', marginBottom: 28 }}>
            <span>✦</span> Honest reviews from real learners
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800, color: '#191919', letterSpacing: '-1.5px', lineHeight: 1.1, margin: '0 0 20px' }}>
            Course reviews you can actually <span style={{ color: '#057642' }}>trust</span>
          </h1>

          <p style={{ fontSize: 18, color: '#555', maxWidth: 520, lineHeight: 1.65, margin: '0 auto 40px' }}>
            Anonymous by default, revealed only to people you trust. Verified by LinkedIn so you know reviews come from real graduates.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            <button onClick={handleLinkedIn}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 28px', borderRadius: 12, border: 'none', background: '#0A66C2', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Continue with LinkedIn
            </button>
          </div>

          <button onClick={() => navigate('/courses')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888', textDecoration: 'underline', padding: 4 }}>
            Browse courses without signing in →
          </button>

          {/* Feature cards */}
          <div className="hero-features" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 64 }}>
            <FeatureCard
              icon="🔒"
              title="Anonymous by default"
              description="Write honest reviews without fear. Your identity is only revealed to people you've connected with."
            />
            <FeatureCard
              icon="✅"
              title="LinkedIn-verified"
              description="Admins verify enrollments via LinkedIn, so every review comes from someone who actually took the course."
            />
            <FeatureCard
              icon="🤝"
              title="Connect with alumni"
              description="Discover and connect with other verified learners from the same course. Build your network with people who share your path."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', fontSize: 13, color: '#aaa', borderTop: '1px solid #F0F0F0' }}>
        © 2026 TrustEd · Honest course reviews
      </div>
    </div>
  );
}
