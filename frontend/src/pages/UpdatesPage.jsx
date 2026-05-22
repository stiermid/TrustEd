import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import Navbar from '../components/layout/Navbar';

function Av({ user, size = 40 }) {
  const [err, setErr] = useState(false);
  if (user?.avatarUrl && !err)
    return <img src={user.avatarUrl} alt={user.name} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e8e8e8' }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, color: 'var(--accent)', fontWeight: 700, border: '2px solid var(--accent-border)', flexShrink: 0 }}>
      {user?.name?.[0]?.toUpperCase()}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    get('/updates')
      .then(r => setUpdates(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 0 }}>
        <div style={{ paddingTop: 32, paddingBottom: 0, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#191919', marginBottom: 6, letterSpacing: '-0.5px' }}>Updates</h1>
          <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 28 }}>Recent activity from your network</p>

          {loading && <div className="loading">Loading…</div>}

          {!loading && updates.length === 0 && (
            <div className="empty" style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>No updates yet.</p>
              <p style={{ fontSize: 13, color: '#aaa' }}>When your connections review courses, you'll see it here.</p>
              <button className="btn btn-sm" style={{ marginTop: 20, borderRadius: 24 }} onClick={() => navigate('/connections')}>
                Grow your network
              </button>
            </div>
          )}

          {!loading && updates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {updates.map(u => (
                <div
                  key={u.id}
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 20px', cursor: 'pointer' }}
                  onClick={() => navigate(`/courses/${u.course.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Av user={u.user} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, color: '#191919' }}>
                        <span style={{ fontWeight: 700 }}>{u.user.name}</span>
                        <span style={{ color: 'var(--text)' }}> reviewed </span>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{u.course.title}</span>
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>
                        {u.course.provider} · {timeAgo(u.createdAt)}
                      </p>
                    </div>
                    <Stars rating={u.rating} />
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6, borderLeft: '3px solid var(--border)', paddingLeft: 12 }}>
                    {u.content.length > 220 ? u.content.slice(0, 220) + '…' : u.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
