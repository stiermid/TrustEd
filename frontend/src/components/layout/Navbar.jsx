import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <NavLink to="/courses" className="nav-brand">TrustEd</NavLink>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavLink to="/courses" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' })}>Courses</NavLink>
        <NavLink to="/connections" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' })}>Network</NavLink>
        <NavLink to="/profile" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' })}>Profile</NavLink>
        {user?.role === 'ADMIN' && <NavLink to="/admin" style={({ isActive }) => ({ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--text-h)' : 'var(--text)', textDecoration: 'none', padding: '6px 12px', borderRadius: 6 })}>Admin</NavLink>}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />

        <button className="btn-ghost" style={{ padding: '6px 8px', color: 'var(--text)' }} title="Notifications">
          <BellIcon />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 6px', borderRadius: 24, border: '1px solid var(--border)', cursor: 'pointer', background: '#fff', marginLeft: 2 }} onClick={handleLogout} title="My Account — click to sign out">
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt={user.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{user?.name?.[0]?.toUpperCase()}</div>
          }
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-h)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>My Account</span>
        </div>
      </div>
    </nav>
  );
}
