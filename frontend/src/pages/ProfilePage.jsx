import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { get, patch, post } from '../lib/api';
import { supabase } from '../lib/supabase';
import Navbar from '../components/layout/Navbar';

function Avatar({ user, size = 64 }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent-bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, color: 'var(--accent)', fontWeight: 700,
      border: '2px solid var(--accent-border)', flexShrink: 0,
    }}>
      {user?.name?.[0]?.toUpperCase()}
    </div>
  );
}

const STATUS_STYLE = {
  VERIFIED: { bg: '#dcfce7', color: '#166534', label: 'Verified' },
  PENDING:  { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);

  const [editing, setEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLinkedIn, setFormLinkedIn] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [connectingLinkedIn, setConnectingLinkedIn] = useState(false);
  const [linkedInMsg, setLinkedInMsg] = useState(null);

  const [enrollments, setEnrollments] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [connLoading, setConnLoading] = useState(false);
  const [connTab, setConnTab] = useState('network');
  const [connSearch, setConnSearch] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await get('/users/me/enrollments');
      setEnrollments(res.data);
    } catch (err) { console.error(err); }
    finally { setCoursesLoading(false); }
  }, []);

  const loadConnections = useCallback(async () => {
    setConnLoading(true);
    try {
      const [reqRes, connRes] = await Promise.all([get('/connections/requests'), get('/connections')]);
      setRequests(reqRes.data);
      setConnections(connRes.data);
    } catch (err) { console.error(err); }
    finally { setConnLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'courses') loadCourses();
    if (tab === 'connections') loadConnections();
  }, [tab, loadCourses, loadConnections]);

  if (authLoading) return <><Navbar /><div className="loading">Loading…</div></>;

  const displayUser = profile || user;

  function startEdit() {
    setFormName(displayUser.name || '');
    setFormLinkedIn(displayUser.linkedinProfileUrl || '');
    setEditing(true);
    setSaveError(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      const updated = await patch('/users/me', { name: formName, linkedinProfileUrl: formLinkedIn });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.error?.message || 'Failed to save changes.');
    } finally { setSaving(false); }
  }

  async function handleConnectLinkedIn() {
    setConnectingLinkedIn(true); setLinkedInMsg(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
        options: { redirectTo: window.location.origin + '/profile' },
      });
      if (error) throw error;
    } catch (err) {
      setLinkedInMsg(err.message || 'Could not initiate LinkedIn connection.');
      setConnectingLinkedIn(false);
    }
  }

  async function handleSyncLinkedIn() {
    setConnectingLinkedIn(true); setLinkedInMsg(null);
    try {
      const updated = await post('/auth/linkedin/connect', {});
      setProfile(prev => ({ ...(prev || user), ...updated }));
      setLinkedInMsg('LinkedIn connected successfully!');
    } catch (err) {
      setLinkedInMsg(err.error?.message || 'LinkedIn sync failed.');
    } finally { setConnectingLinkedIn(false); }
  }

  async function handleRespond(id, status) {
    setActionId(id);
    try { await patch(`/connections/${id}`, { status }); loadConnections(); }
    catch (err) { console.error(err); }
    finally { setActionId(null); }
  }

  const filteredConns = connections.filter(c =>
    c.user.name?.toLowerCase().includes(connSearch.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── Profile Header ── */}
        <div className="card" style={{ marginTop: 28, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <Avatar user={displayUser} size={88} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-h)' }}>{displayUser.name}</h2>
              <span className={`badge badge-${displayUser.role === 'ADMIN' ? 'accent' : 'pending'}`}>{displayUser.role}</span>
              {displayUser.linkedinConnected && <span className="badge badge-verified">LinkedIn Connected</span>}
            </div>
            <p className="text-sm text-muted" style={{ margin: '2px 0 6px' }}>{displayUser.email}</p>
            {displayUser.linkedinProfileUrl && (
              <a href={displayUser.linkedinProfileUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn Profile ↗
              </a>
            )}
          </div>
          {!editing && (
            <button className="btn-outline btn-sm" onClick={startEdit} style={{ alignSelf: 'flex-start' }}>Edit Profile</button>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="tabs" style={{ marginTop: 24 }}>
          {[['profile', 'Profile'], ['courses', 'My Courses'], ['connections', `Connections${requests.length > 0 ? ` (${requests.length})` : ''}`]].map(([k, l]) => (
            <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => { setTab(k); setEditing(false); }}>{l}</button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <div className="card card-flat" style={{ borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            {editing ? (
              <form onSubmit={handleSave} style={{ maxWidth: 480 }}>
                {saveError && <div className="alert-error">{saveError}</div>}
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="input" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label>Email address</label>
                  <input className="input" value={displayUser.email} disabled style={{ opacity: 0.55 }} />
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>Managed by your authentication provider.</span>
                </div>
                <div className="form-group">
                  <label>LinkedIn Profile URL</label>
                  <input className="input" value={formLinkedIn} onChange={e => setFormLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div className="flex gap-2" style={{ marginTop: 8 }}>
                  <button type="submit" className="btn btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ maxWidth: 480 }}>
                <div style={{ display: 'grid', gap: 20 }}>
                  {[['Full Name', displayUser.name], ['Email', displayUser.email], ['LinkedIn URL', displayUser.linkedinProfileUrl || '—']].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text)' }}>{label}</p>
                      <p style={{ margin: 0, color: 'var(--text-h)', fontSize: 15 }}>{val}</p>
                    </div>
                  ))}
                </div>
                <hr className="divider" />
                <p style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 8, fontSize: 14 }}>LinkedIn Verification</p>
                {displayUser.linkedinConnected ? (
                  <div className="flex gap-3" style={{ alignItems: 'center' }}>
                    <span className="badge badge-verified">Connected</span>
                    <span className="text-sm text-muted">Required for enrollment verification.</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted" style={{ marginBottom: 10 }}>Connect LinkedIn to be eligible for enrollment verification.</p>
                    {linkedInMsg && <div className="alert-info" style={{ marginBottom: 10 }}>{linkedInMsg}</div>}
                    <div className="flex gap-2">
                      <button className="btn btn-sm" onClick={handleConnectLinkedIn} disabled={connectingLinkedIn}>{connectingLinkedIn ? '…' : 'Connect LinkedIn'}</button>
                      <button className="btn-outline btn-sm" onClick={handleSyncLinkedIn} disabled={connectingLinkedIn}>Sync (already linked)</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Courses Tab ── */}
        {tab === 'courses' && (
          <div style={{ paddingTop: 20 }}>
            {coursesLoading ? (
              <div className="loading">Loading courses…</div>
            ) : enrollments.length === 0 ? (
              <div className="empty">No course enrollments yet. Browse courses to enroll.</div>
            ) : (
              <div className="grid">
                {enrollments.map(e => {
                  const s = STATUS_STYLE[e.status] || STATUS_STYLE.PENDING;
                  return (
                    <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--text-h)' }}>{e.course.title}</p>
                          <p className="text-sm text-muted" style={{ marginTop: 2 }}>{e.course.provider}</p>
                        </div>
                        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text)' }}>
                        Enrolled {new Date(e.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {e.verifiedAt && ` · Verified ${new Date(e.verifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                      </p>
                      {e.course.url && (
                        <a href={e.course.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>View course ↗</a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Connections Tab ── */}
        {tab === 'connections' && (
          <div style={{ paddingTop: 8 }}>
            <div className="tabs">
              <button className={`tab${connTab === 'network' ? ' active' : ''}`} onClick={() => setConnTab('network')}>My Network ({connections.length})</button>
              <button className={`tab${connTab === 'requests' ? ' active' : ''}`} onClick={() => setConnTab('requests')}>Requests {requests.length > 0 && `(${requests.length})`}</button>
            </div>
            {connLoading ? <div className="loading">Loading…</div> : connTab === 'network' ? (
              <div style={{ paddingTop: 8 }}>
                {connections.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <input className="input" placeholder="Search connections…" value={connSearch} onChange={e => setConnSearch(e.target.value)} style={{ maxWidth: 320 }} />
                  </div>
                )}
                {filteredConns.length === 0 ? (
                  <div className="empty">{connections.length === 0 ? 'No connections yet. Discover people on course pages.' : 'No results found.'}</div>
                ) : (
                  <div className="grid">
                    {filteredConns.map(conn => (
                      <div key={conn.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Avatar user={conn.user} size={48} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-h)' }}>{conn.user.name}</p>
                          <p className="text-sm text-muted">Connected {new Date(conn.connectedSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                        </div>
                        <span className="badge badge-verified">1st</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              requests.length === 0 ? (
                <div className="empty">No pending connection requests.</div>
              ) : (
                <div className="card card-flat" style={{ marginTop: 16 }}>
                  {requests.map(req => (
                    <div key={req.id} className="connection-row">
                      <div className="user-info">
                        <Avatar user={req.requester} size={38} />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-h)' }}>{req.requester.name}</p>
                          <p className="text-sm text-muted">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-sm" disabled={actionId === req.id} onClick={() => handleRespond(req.id, 'ACCEPTED')}>Accept</button>
                        <button className="btn-outline btn-sm" disabled={actionId === req.id} onClick={() => handleRespond(req.id, 'REJECTED')}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

      </div>
    </>
  );
}
