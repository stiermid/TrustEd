import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post, patch, del } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

const PROVIDER_COLORS = {
  'holberton': { bg: '#00C17C', light: '#E6FBF3' },
  'coursera':  { bg: '#0056D3', light: '#EBF2FF' },
  'mit':       { bg: '#A31F34', light: '#FDEAED' },
  'udemy':     { bg: '#A435F0', light: '#F5EBFE' },
  'google':    { bg: '#4285F4', light: '#EBF2FF' },
};
function providerColor(name = '') {
  const k = name.toLowerCase();
  for (const [key, val] of Object.entries(PROVIDER_COLORS)) {
    if (k.includes(key)) return val;
  }
  return { bg: '#057642', light: '#E6F4EC' };
}

function Stars({ rating }) {
  const full = Math.round(rating || 0);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>;
}

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-input">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={n <= (hovered || value) ? 'active' : ''}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >★</button>
      ))}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [reviewSort, setReviewSort] = useState('newest');

  const [enrollStatus, setEnrollStatus] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [editId, setEditId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState('');
  const [connectingId, setConnectingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseRes, discoverRes, enrollmentsRes] = await Promise.all([
        get(`/courses/${id}`),
        get(`/discover/courses/${id}`),
        get('/users/me/enrollments'),
      ]);
      setCourse(courseRes);
      setDiscover(discoverRes.data);
      const myEnrollment = enrollmentsRes.data.find(e => e.course.id === id);
      setEnrollStatus(myEnrollment?.status ?? null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  const loadReviews = useCallback(async () => {
    try {
      const r = await get(`/courses/${id}/reviews?sort=${reviewSort}`);
      setReviews(r.data);
    } catch (err) { console.error(err); }
  }, [id, reviewSort]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  const myReview = reviews.find(r => r.isOwn);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      await post(`/courses/${id}/enroll`);
      setEnrollStatus('PENDING');
    } catch (err) {
      if (err.status === 409) setEnrollStatus('PENDING');
      else console.error(err);
    } finally { setEnrolling(false); }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!rating) { setFormError('Please select a star rating.'); return; }
    setSubmitting(true); setFormError(null);
    try {
      await post(`/courses/${id}/reviews`, { rating, content });
      setShowForm(false); setRating(0); setContent('');
      loadReviews();
    } catch (err) {
      setFormError(err.error?.message || 'Failed to submit review.');
    } finally { setSubmitting(false); }
  }

  async function handleEditReview(e) {
    e.preventDefault(); setSubmitting(true);
    try {
      await patch(`/reviews/${editId}`, { rating: editRating, content: editContent });
      setEditId(null); loadReviews();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('Delete your review?')) return;
    try { await del(`/reviews/${reviewId}`); loadReviews(); }
    catch (err) { console.error(err); }
  }

  async function handleConnect(receiverId) {
    setConnectingId(receiverId);
    try {
      await post('/connections', { receiverId });
      setDiscover(prev => prev.map(u => u.id === receiverId ? { ...u, connectionStatus: 'pending' } : u));
    } catch (err) { console.error(err); }
    finally { setConnectingId(null); }
  }

  if (loading) return <><Navbar /><div className="loading" style={{ padding: 48, textAlign: 'center' }}>Loading…</div></>;
  if (!course) return <><Navbar /><div className="empty">Course not found.</div></>;

  const { bg, light } = providerColor(course.provider);
  const initials = course.provider.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Navbar />

      {/* ── Banner Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${bg}18 0%, ${bg}08 100%)`, borderBottom: `1px solid ${bg}30`, padding: '36px 32px 28px' }}>
        <button onClick={() => navigate('/courses')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 13, padding: 0, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 5 }}>
          ← Back to Courses
        </button>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Logo badge */}
          <div style={{ width: 72, height: 72, borderRadius: 16, background: light, border: `2.5px solid ${bg}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: bg }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: bg, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{course.provider}</span>
              {course.category && <span style={{ fontSize: 12, color: '#666', background: '#fff', padding: '2px 10px', borderRadius: 20, border: '1px solid #E0E0E0' }}>{course.category}</span>}
              {course.featured && <span style={{ fontSize: 11, fontWeight: 700, color: '#a07800', background: 'rgba(212,160,23,0.1)', border: '1px solid #d4a017', padding: '2px 8px', borderRadius: 20 }}>⭐ FEATURED</span>}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#191919', margin: '0 0 8px', letterSpacing: '-0.4px', lineHeight: 1.25 }}>{course.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {course.averageRating != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Stars rating={course.averageRating} />
                  <span style={{ fontSize: 13, color: '#444' }}>{course.averageRating} · {course.reviewCount} review{course.reviewCount !== 1 ? 's' : ''}</span>
                </div>
              ) : <span style={{ fontSize: 13, color: '#888' }}>No reviews yet</span>}
              {course.duration && <span style={{ fontSize: 13, color: '#555' }}>⏱ {course.duration}</span>}
              {course.url && <a href={course.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: bg, fontWeight: 600, textDecoration: 'none' }}>Visit Program ↗</a>}
            </div>
          </div>
          {/* Enroll CTA */}
          <div>
            {enrollStatus === 'VERIFIED'
              ? <span style={{ fontSize: 13, color: '#057642', padding: '8px 16px', border: '1px solid #a7f3d0', borderRadius: 8, background: '#f0fdf4', display: 'block' }}>✅ Enrollment verified</span>
              : enrollStatus === 'PENDING'
              ? <span style={{ fontSize: 13, color: '#888', padding: '8px 16px', border: '1px solid #E0E0E0', borderRadius: 8, background: '#fff', display: 'block' }}>⏳ Enrollment pending</span>
              : enrollStatus === 'REJECTED'
              ? <span style={{ fontSize: 13, color: '#dc2626', padding: '8px 16px', border: '1px solid #fca5a5', borderRadius: 8, background: '#fef2f2', display: 'block' }}>❌ Enrollment rejected</span>
              : !myReview && <button className="btn" onClick={handleEnroll} disabled={enrolling} style={{ borderRadius: 8 }}>{enrolling ? 'Enrolling…' : 'Enroll to Review'}</button>
            }
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E0E0', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {[['overview', 'Overview'], ['reviews', `Reviews (${reviews.length})`], ['people', `People (${discover.length})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ padding: '14px 20px', fontSize: 14, fontWeight: tab === k ? 700 : 500, color: tab === k ? '#191919' : '#666', background: 'none', border: 'none', borderBottom: `2.5px solid ${tab === k ? '#191919' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="page" style={{ paddingTop: 28, maxWidth: 860 }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {course.description && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>About this program</h2>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#444', margin: 0 }}>{course.description}</p>
              </div>
            )}
            {course.skills?.length > 0 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Skills you'll learn</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {course.skills.map(s => (
                    <span key={s} style={{ fontSize: 13, fontWeight: 500, padding: '5px 14px', borderRadius: 20, background: light, color: bg, border: `1.5px solid ${bg}30` }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {course.careerPaths?.length > 0 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Career paths</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {course.careerPaths.map(cp => (
                    <div key={cp} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8 }}>
                      <span style={{ fontSize: 16 }}>💼</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#191919' }}>{cp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '20px 24px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {course.duration && <div><p style={{ fontSize: 12, color: '#888', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</p><p style={{ fontSize: 15, fontWeight: 700, color: '#191919', margin: 0 }}>⏱ {course.duration}</p></div>}
              {course.category && <div><p style={{ fontSize: 12, color: '#888', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</p><p style={{ fontSize: 15, fontWeight: 700, color: '#191919', margin: 0 }}>{course.category}</p></div>}
              <div><p style={{ fontSize: 12, color: '#888', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Learners</p><p style={{ fontSize: 15, fontWeight: 700, color: '#191919', margin: 0 }}>{discover.length}</p></div>
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {tab === 'reviews' && (
          <div>
            {/* Sort + Write Review bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['newest', 'Newest'], ['rating', 'Highest Rated']].map(([v, l]) => (
                  <button key={v} onClick={() => setReviewSort(v)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid', borderColor: reviewSort === v ? 'var(--accent)' : '#E0E0E0', background: reviewSort === v ? 'var(--accent-bg)' : '#fff', color: reviewSort === v ? 'var(--accent)' : '#666', transition: 'all 0.15s' }}>{l}</button>
                ))}
              </div>
              {!myReview && !showForm && enrollStatus === 'VERIFIED' && (
                <button className="btn btn-sm" style={{ borderRadius: 8 }} onClick={() => setShowForm(true)}>+ Write a Review</button>
              )}
              {!myReview && !showForm && enrollStatus !== 'VERIFIED' && (
                <span style={{ fontSize: 13, color: '#888' }}>
                  {enrollStatus === 'PENDING' ? '⏳ Awaiting enrollment verification' : enrollStatus === 'REJECTED' ? '❌ Enrollment rejected' : 'Enroll to write a review'}
                </span>
              )}
            </div>

            {/* Write / Edit form */}
            {(showForm || (myReview && editId === myReview.id)) && (
              <form onSubmit={editId ? handleEditReview : handleSubmitReview}
                style={{ background: '#fff', border: '1.5px solid var(--accent-border)', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#191919', margin: '0 0 14px' }}>{editId ? 'Edit your review' : 'Write a review'}</p>
                {formError && <div className="alert-error" style={{ marginBottom: 12 }}>{formError}</div>}
                <StarInput value={editId ? editRating : rating} onChange={editId ? setEditRating : setRating} />
                <textarea className="input" style={{ marginTop: 12 }} placeholder="Share your honest experience…" value={editId ? editContent : content}
                  onChange={e => editId ? setEditContent(e.target.value) : setContent(e.target.value)} rows={3} required />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="submit" className="btn btn-sm" style={{ borderRadius: 8 }} disabled={submitting || (!editId && !rating)}>{submitting ? '…' : editId ? 'Save changes' : 'Submit Review'}</button>
                  <button type="button" className="btn-outline btn-sm" style={{ borderRadius: 8 }} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                </div>
              </form>
            )}

            {reviews.length === 0 ? (
              <div className="empty">No reviews yet — be the first to share your experience!</div>
            ) : reviews.map(review => (
              <div key={review.id} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F3F2EF', border: '2px solid #E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {review.author ? (review.author.avatarUrl ? <img src={review.author.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : review.author.name?.[0]?.toUpperCase()) : '🔒'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#191919' }}>{review.author ? review.author.name : 'Anonymous Learner'}</p>
                      <Stars rating={review.rating} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {review.isOwn && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => { setEditId(review.id); setEditRating(review.rating); setEditContent(review.content); }}>Edit</button>
                        <button className="btn-ghost btn-sm" style={{ fontSize: 12, color: '#ef4444' }} onClick={() => handleDeleteReview(review.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>{review.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── People ── */}
        {tab === 'people' && (
          <div>
            {discover.length === 0 ? (
              <div className="empty">No other verified learners found for this course yet.</div>
            ) : discover.map(u => (
              <div key={u.id} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt={u.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{u.name?.[0]?.toUpperCase()}</div>
                }
                <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#191919' }}>{u.name}</span>
                {u.connectionStatus === 'accepted' ? <span className="badge badge-verified">Connected</span>
                  : u.connectionStatus === 'pending' ? <span className="badge badge-pending">Pending</span>
                  : <button className="btn btn-sm" disabled={connectingId === u.id} onClick={() => handleConnect(u.id)} style={{ borderRadius: 24 }}>{connectingId === u.id ? '…' : '+ Connect'}</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
