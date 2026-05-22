import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <NavLink to="/courses" className="nav-brand">TrustEd</NavLink>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/courses" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' })}>Courses</NavLink>
        {user && <>
          <NavLink to="/updates" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' })}>Updates</NavLink>
          <NavLink to="/connections" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' })}>Network</NavLink>
          {user.role === 'ADMIN' && <NavLink to="/admin" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6 })}>Admin</NavLink>}
        </>}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />

        {user ? (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setDropdownOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 6px', borderRadius: 24, border: '1px solid var(--border)', cursor: 'pointer', background: '#fff', userSelect: 'none' }}
            >
              {user.avatarUrl && !avatarErr
                ? <img src={user.avatarUrl} alt={user.name} onError={() => setAvatarErr(true)} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{user.name?.[0]?.toUpperCase()}</div>
              }
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-h)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text)', flexShrink: 0, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="m6 9 6 6 6-6"/></svg>
            </div>

            {dropdownOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
                <button onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  style={{ width: '100%', padding: '11px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-h)', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F2EF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  My Account
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
                <button onClick={handleLogout}
                  style={{ width: '100%', padding: '11px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#dc2626', fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-sm" onClick={() => navigate('/login')} style={{ borderRadius: 24 }}>Sign In</button>
        )}
      </div>
    </nav>
  );
}
