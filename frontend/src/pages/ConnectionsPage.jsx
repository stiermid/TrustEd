import { useState, useEffect, useCallback, useRef } from 'react';
import { get, post, patch, del } from '../lib/api';
import Navbar from '../components/layout/Navbar';

function Av({ user, size = 60 }) {
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt={user.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e8e8e8' }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, color: 'var(--accent)', fontWeight: 700, border: '2px solid var(--accent-border)', flexShrink: 0 }}>
      {user?.name?.[0]?.toUpperCase()}
    </div>
  );
}

function SearchIcon() {
  return <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, background: '#191919', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 14, animation: 'slideUp 0.25s ease', maxWidth: 340 }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18, lineHeight: 1, opacity: 0.7 }}>×</button>
    </div>
  );
}

function ConnectBtn({ status, connId, userId, onSend, onRemove }) {
  if (status === 'PENDING') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 24, border: '1.5px solid #d4a017', color: '#a07800', fontSize: 13, fontWeight: 600, background: 'rgba(212,160,23,0.07)' }}>
      <span style={{ fontSize: 12 }}>⏳</span> Pending
    </span>
  );
  if (status === 'ACCEPTED') return (
    <button onClick={onRemove} style={{ padding: '5px 14px', borderRadius: 24, border: '1.5px solid #ccc', color: '#666', fontSize: 13, fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>Connected</button>
  );
  if (status === 'INCOMING') return (
    <span style={{ fontSize: 12, color: 'var(--text)', fontStyle: 'italic' }}>Sent you a request</span>
  );
  return (
    <button onClick={() => onSend(userId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 24, border: '1.5px solid var(--accent)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, background: 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}>
      + Connect
    </button>
  );
}

const MOCK_PROFILES = [
  { id: 'm1', name: 'Nergiz Memmedova',  avatarUrl: 'https://i.pravatar.cc/150?img=47', institution: 'UNEC University',    connStatus: 'NONE' },
  { id: 'm2', name: 'Kamal Kazimizade',  avatarUrl: 'https://i.pravatar.cc/150?img=12', institution: 'UNEC University',    connStatus: 'NONE' },
  { id: 'm3', name: 'Dinar Qaşimov',     avatarUrl: 'https://i.pravatar.cc/150?img=33', institution: 'Economist (UNEC)',   connStatus: 'NONE' },
  { id: 'm4', name: 'Graay Rayiriya',    avatarUrl: 'https://i.pravatar.cc/150?img=25', institution: 'UNEC University',    connStatus: 'NONE' },
  { id: 'm5', name: 'Ahamhat Uribar',    avatarUrl: 'https://i.pravatar.cc/150?img=18', institution: 'UNEC University',    connStatus: 'NONE' },
  { id: 'm6', name: 'Leyla Hasanova',    avatarUrl: 'https://i.pravatar.cc/150?img=44', institution: 'ADA University',     connStatus: 'NONE' },
  { id: 'm7', name: 'Orkhan Mammadov',   avatarUrl: 'https://i.pravatar.cc/150?img=8',  institution: 'Baku State Univ.',   connStatus: 'NONE' },
  { id: 'm8', name: 'Sabina Aliyeva',    avatarUrl: 'https://i.pravatar.cc/150?img=56', institution: 'UNEC University',    connStatus: 'NONE' },
  { id: 'm9', name: 'Tural Guliyev',     avatarUrl: 'https://i.pravatar.cc/150?img=15', institution: 'UNEC şirkəti',       connStatus: 'NONE' },
];

export default function ConnectionsPage() {
  const [mockProfiles, setMockProfiles] = useState(MOCK_PROFILES);
  const [tab, setTab] = useState('discover');
  const [toast, setToast] = useState(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  const [connections, setConnections] = useState([]);
  const [connSearch, setConnSearch] = useState('');
  const [connLoading, setConnLoading] = useState(false);

  const [requests, setRequests] = useState([]);
  const [sentCount, setSentCount] = useState(0);
  const [reqLoading, setReqLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const prevCount = useRef(null);

  const loadConnections = useCallback(async () => {
    setConnLoading(true);
    try { const r = await get('/connections'); setConnections(r.data); }
    catch (e) { console.error(e); } finally { setConnLoading(false); }
  }, []);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setReqLoading(true);
    try {
      const [rIn, rOut] = await Promise.all([get('/connections/requests'), get('/connections/sent')]);
      const incoming = rIn.data;
      if (prevCount.current !== null && incoming.length > prevCount.current) {
        const n = incoming.length - prevCount.current;
        setToast(`You have ${n} new connection request${n > 1 ? 's' : ''}`);
      }
      prevCount.current = incoming.length;
      setRequests(incoming);
      setSentCount(rOut.data.length);
    } catch (e) { console.error(e); }
    finally { if (!silent) setReqLoading(false); }
  }, []);

  useEffect(() => { loadConnections(); loadRequests(); }, [loadConnections, loadRequests]);
  useEffect(() => { const t = setInterval(() => loadRequests(true), 30000); return () => clearInterval(t); }, [loadRequests]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (query.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try { const r = await get(`/users/search?q=${encodeURIComponent(query)}`); setResults(r.data); }
      catch (e) { console.error(e); } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  async function sendRequest(userId) {
    try {
      await post('/connections', { receiverId: userId });
      setResults(r => r.map(u => u.id === userId ? { ...u, connStatus: 'PENDING' } : u));
      setSentCount(c => c + 1);
    } catch (e) { console.error(e); }
  }

  async function removeConn(id) {
    try {
      await del(`/connections/${id}`);
      loadConnections();
      setResults(r => r.map(u => u.connId === id ? { ...u, connStatus: 'NONE', connId: null } : u));
    } catch (e) { console.error(e); }
  }

  async function respond(id, status) {
    setActionId(id);
    try {
      await patch(`/connections/${id}`, { status });
      if (status === 'ACCEPTED') setToast('Connection accepted!');
      loadRequests(); loadConnections();
    } catch (e) { console.error(e); } finally { setActionId(null); }
  }

  const filteredConns = connections.filter(c => c.user.name?.toLowerCase().includes(connSearch.toLowerCase()));

  const TABS = [
    { key: 'discover', label: 'Discover People' },
    { key: 'network',  label: `My Network (${connections.length})` },
    { key: 'requests', label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}`, highlight: requests.length > 0 },
  ];

  return (
    <>
      <Navbar />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="page" style={{ paddingTop: 0 }}>

        {/* ── Page Header ── */}
        <div style={{ paddingTop: 32, paddingBottom: 0, maxWidth: 900 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#191919', marginBottom: 20, letterSpacing: '-0.5px' }}>Network</h1>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
            {[
              { value: sentCount, label: 'Requests Sent' },
              { value: connections.length, label: 'Connections' },
              { value: requests.length, label: 'Pending' },
            ].map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {i > 0 && <span style={{ width: 1, height: 36, background: 'var(--border)', margin: '0 20px', display: 'block' }}></span>}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#191919', lineHeight: 1, marginBottom: 3 }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="tabs" style={{ marginTop: 8 }}>
          {TABS.map(t => (
            <button key={t.key}
              className={`tab${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
              style={t.highlight && tab !== t.key ? { color: 'var(--accent)', fontWeight: 700 } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Discover ── */}
        {tab === 'discover' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <SearchIcon />
                <input className="input" placeholder="Search people by name…"
                  value={query} onChange={e => setQuery(e.target.value)}
                  style={{ paddingLeft: 42, borderRadius: 28, fontSize: 14, height: 44, boxSizing: 'border-box' }} />
              </div>
              {query.length > 0 && query.length < 2 && <p style={{ fontSize: 12, color: 'var(--text)', marginTop: 6, paddingLeft: 4 }}>Type at least 2 characters.</p>}
            </div>
            {searching && <div className="loading">Searching…</div>}
            {!searching && query.length >= 2 && results.length === 0 && <div className="empty">No users found for "{query}".</div>}
            {!searching && results.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {results.map(u => (
                  <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', textAlign: 'center' }}>
                    <Av user={u} size={64} />
                    <div style={{ minWidth: 0, width: '100%' }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#191919', lineHeight: 1.3 }}>{u.name}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)' }}>TrustEd member</p>
                    </div>
                    <ConnectBtn status={u.connStatus} connId={u.connId} userId={u.id} onSend={sendRequest} onRemove={() => removeConn(u.connId)} />
                  </div>
                ))}
              </div>
            )}
            {!query && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.6px' }}>People you may know</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {mockProfiles.map(u => (
                    <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', textAlign: 'center' }}>
                      <Av user={u} size={64} />
                      <div style={{ minWidth: 0, width: '100%' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#191919', lineHeight: 1.3 }}>{u.name}</p>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)' }}>{u.institution}</p>
                      </div>
                      {u.connStatus === 'PENDING'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 24, border: '1.5px solid #d4a017', color: '#a07800', fontSize: 13, fontWeight: 600, background: 'rgba(212,160,23,0.07)' }}><span style={{ fontSize: 12 }}>⏳</span> Pending</span>
                        : <button onClick={() => setMockProfiles(p => p.map(x => x.id === u.id ? { ...x, connStatus: 'PENDING' } : x))} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 24, border: '1.5px solid var(--accent)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, background: 'transparent', cursor: 'pointer' }}>+ Connect</button>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── My Network ── */}
        {tab === 'network' && (
          <div>
            {connections.length > 0 && (
              <div style={{ marginBottom: 16, maxWidth: 420 }}>
                <div style={{ position: 'relative' }}>
                  <SearchIcon />
                  <input className="input" placeholder="Filter connections…" value={connSearch} onChange={e => setConnSearch(e.target.value)} style={{ paddingLeft: 42, borderRadius: 28, height: 40, boxSizing: 'border-box' }} />
                </div>
              </div>
            )}
            {connLoading ? <div className="loading">Loading…</div>
              : filteredConns.length === 0
                ? <div className="empty">{connections.length === 0 ? 'No connections yet. Use Discover People to find members.' : 'No results.'}</div>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    {filteredConns.map(conn => (
                      <div key={conn.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 16px', textAlign: 'center' }}>
                        <Av user={conn.user} size={64} />
                        <div style={{ minWidth: 0, width: '100%' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#191919', lineHeight: 1.3 }}>{conn.user.name}</p>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text)' }}>Connected {new Date(conn.connectedSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                        </div>
                        <button onClick={() => removeConn(conn.id)} style={{ padding: '4px 14px', borderRadius: 24, border: '1.5px solid #e0e0e0', color: '#888', fontSize: 12, fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )
            }
          </div>
        )}

        {/* ── Requests ── */}
        {tab === 'requests' && (
          <div>
            {reqLoading ? <div className="loading">Loading…</div>
              : requests.length === 0
                ? <div className="empty">No pending connection requests.</div>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {requests.map(req => (
                      <div key={req.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Av user={req.requester} size={56} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#191919' }}>{req.requester.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text)' }}>Sent {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm" disabled={actionId === req.id} onClick={() => respond(req.id, 'ACCEPTED')}>{actionId === req.id ? '…' : 'Accept'}</button>
                          <button style={{ padding: '5px 14px', borderRadius: 24, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, background: 'transparent', cursor: 'pointer' }} disabled={actionId === req.id} onClick={() => respond(req.id, 'REJECTED')}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
            }
          </div>
        )}

      </div>
    </>
  );
}
