import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import Navbar from '../components/layout/Navbar';

/* ── Institution metadata ─────────────────────────────────────── */
const INSTITUTION_META = {
  'Holberton School': {
    displayName: 'Holberton School Azerbaijan',
    brandColor: '#E8312A',
    lightColor: '#FDECEA',
    category: 'Education',
    location: 'Baku, Baku City',
    website: 'https://www.holbertonschool.com',
    initial: 'H',
  },
  'Coursera': {
    displayName: 'Coursera',
    brandColor: '#0056D3',
    lightColor: '#EBF2FF',
    category: 'Online Learning',
    location: 'Mountain View, CA',
    website: 'https://www.coursera.org',
    initial: 'C',
  },
};

function getMeta(provider) {
  const key = Object.keys(INSTITUTION_META).find(k => provider?.toLowerCase().includes(k.toLowerCase()));
  if (key) return INSTITUTION_META[key];
  const bg = '#057642';
  return { displayName: provider, brandColor: bg, lightColor: '#E6F4EC', category: 'Education', location: '', website: null, initial: provider?.[0]?.toUpperCase() || '?' };
}

/* ── Stars ────────────────────────────────────────────────────── */
function Stars({ rating }) {
  const full = Math.round(rating || 0);
  return <span style={{ color: '#f59e0b', fontSize: 13, letterSpacing: 1 }}>{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

/* ── Institution card (LinkedIn company-page style) ──────────── */
function InstitutionCard({ provider, courses, onViewCourses }) {
  const meta = getMeta(provider);
  const totalReviews = courses.reduce((s, c) => s + (c.reviewCount || 0), 0);
  const [followed, setFollowed] = useState(false);

  return (
    <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Banner strip */}
      <div style={{ height: 52, background: `linear-gradient(135deg, ${meta.brandColor}CC, ${meta.brandColor}88)` }} />
      <div style={{ padding: '0 20px 20px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ width: 64, height: 64, borderRadius: 12, background: meta.brandColor, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -32, marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{meta.initial}</span>
        </div>
        {/* Name & meta */}
        <h3 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#191919' }}>{meta.displayName}</h3>
        <p style={{ margin: '0 0 2px', fontSize: 13, color: '#444' }}>{meta.category}</p>
        {meta.location && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#666' }}>{meta.location}</p>}
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#444' }}>
            <span style={{ marginRight: 4 }}>👥</span>
            <strong>{courses.length}</strong> program{courses.length !== 1 ? 's' : ''}
          </span>
          {totalReviews > 0 && (
            <span style={{ fontSize: 13, color: '#444' }}>
              <span style={{ marginRight: 4 }}>⭐</span>
              <strong>{totalReviews}</strong> review{totalReviews !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setFollowed(f => !f)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 24, border: followed ? '1.5px solid #E0E0E0' : '1.5px solid #0a66c2', background: followed ? '#fff' : '#0a66c2', color: followed ? '#444' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
            {followed ? '✓ Following' : '+ Follow'}
          </button>
          <button onClick={() => onViewCourses(provider)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 24, border: '1.5px solid #E0E0E0', background: '#fff', color: '#191919', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            View Courses
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Individual course card (used in drill-down view) ─────────── */
function CourseCard({ course, onClick }) {
  const meta = getMeta(course.provider);
  return (
    <div onClick={onClick} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
      <div style={{ height: 5, background: meta.brandColor }} />
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: meta.brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{meta.initial}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: meta.brandColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{meta.displayName}</p>
            {course.category && <p style={{ margin: 0, fontSize: 11, color: '#888' }}>{course.category}</p>}
          </div>
          {course.featured && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#a07800', background: 'rgba(212,160,23,0.1)', border: '1px solid #d4a017', padding: '2px 8px', borderRadius: 20 }}>FEATURED</span>}
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#191919', lineHeight: 1.35 }}>{course.title}</h3>
        {course.description && (
          <p style={{ margin: 0, fontSize: 13, color: '#5f6368', lineHeight: 1.5, flex: 1 }}>
            {course.description.length > 110 ? course.description.slice(0, 110) + '…' : course.description}
          </p>
        )}
        {course.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {course.skills.slice(0, 4).map(s => <span key={s} style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#F3F2EF', color: '#444', border: '1px solid #E0E0E0' }}>{s}</span>)}
            {course.skills.length > 4 && <span style={{ fontSize: 11, color: '#888' }}>+{course.skills.length - 4}</span>}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F0F0F0' }}>
          {course.averageRating != null
            ? <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 5 }}><Stars rating={course.averageRating} />{course.averageRating} · {course.reviewCount} reviews</span>
            : <span style={{ fontSize: 12, color: '#888' }}>No reviews yet</span>}
          {course.duration && <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>⏱ {course.duration}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/courses?limit=100');
      setAllCourses(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const providers = useMemo(() => {
    const map = {};
    allCourses.forEach(c => { if (!map[c.provider]) map[c.provider] = []; map[c.provider].push(c); });
    return map;
  }, [allCourses]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allCourses.filter(c => c.title.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q));
  }, [search, allCourses]);

  const drillCourses = selectedProvider ? (providers[selectedProvider] || []) : [];
  const isSearching = search.trim().length > 0;
  const isDrilling = !!selectedProvider && !isSearching;

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 0 }}>

        {/* Header */}
        <div style={{ paddingTop: 32, paddingBottom: 20 }}>
          {isDrilling ? (
            <>
              <button onClick={() => setSelectedProvider(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 13, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>← All Schools</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {(() => { const m = getMeta(selectedProvider); return (
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: m.brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{m.initial}</span>
                  </div>
                ); })()}
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.3px' }}>{getMeta(selectedProvider).displayName}</h1>
                  <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{drillCourses.length} program{drillCourses.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Courses</h1>
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0 }}>{Object.keys(providers).length} school{Object.keys(providers).length !== 1 ? 's' : ''} · {allCourses.length} programs</p>
            </>
          )}
        </div>

        {/* Search (only on main view) */}
        {!isDrilling && (
          <div style={{ position: 'relative', maxWidth: 480, marginBottom: 28 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9e9e9e', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="input" placeholder="Search schools or programs…" value={search}
              onChange={e => { setSearch(e.target.value); setSelectedProvider(null); }}
              style={{ paddingLeft: 42, borderRadius: 28, height: 44 }} />
          </div>
        )}

        {loading ? <div className="loading">Loading…</div> : (

          /* ── Search results ── */
          isSearching ? (
            <div>
              <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"</p>
              {searchResults.length === 0
                ? <div className="empty">No courses found.</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                    {searchResults.map(c => <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />)}
                  </div>
              }
            </div>

          /* ── Drill-down: courses from one school ── */
          ) : isDrilling ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {drillCourses.map(c => <CourseCard key={c.id} course={c} onClick={() => navigate(`/courses/${c.id}`)} />)}
            </div>

          /* ── Default: institution cards ── */
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {Object.entries(providers).map(([provider, courses]) => (
                <InstitutionCard key={provider} provider={provider} courses={courses} onViewCourses={p => { setSelectedProvider(p); setSearch(''); }} />
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}
