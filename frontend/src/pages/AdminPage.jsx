import { useState, useEffect, useCallback } from 'react';
import { get, post, patch, del } from '../lib/api';
import Navbar from '../components/layout/Navbar';

const EMPTY_FORM = { title: '', provider: '', description: '', url: '', category: '', duration: '', skills: '', careerPaths: '', featured: false };

export default function AdminPage() {
  const [tab, setTab] = useState('add');

  // ── Add / Edit course form ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // ── Course list ──
  const [courses, setCourses] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // ── Enrollments ──
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [enrollMsg, setEnrollMsg] = useState(null);

  // ── Reviews moderation ──
  const [reviewCourse, setReviewCourse] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const loadCourses = useCallback(async () => {
    try { const res = await get('/courses?limit=100'); setCourses(res.data); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function startEdit(course) {
    setForm({
      title: course.title, provider: course.provider,
      description: course.description || '', url: course.url || '',
      category: course.category || '', duration: course.duration || '',
      skills: (course.skills || []).join(', '),
      careerPaths: (course.careerPaths || []).join(', '),
      featured: course.featured || false,
    });
    setEditingId(course.id);
    setTab('add');
    setSaveMsg(null);
    window.scrollTo(0, 0);
  }

  function cancelEdit() { setForm(EMPTY_FORM); setEditingId(null); setSaveMsg(null); }

  async function handleSaveCourse(e) {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    const payload = {
      title: form.title, provider: form.provider,
      description: form.description || undefined,
      url: form.url || undefined,
      category: form.category || undefined,
      duration: form.duration || undefined,
      skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      careerPaths: form.careerPaths ? form.careerPaths.split(',').map(s => s.trim()).filter(Boolean) : [],
      featured: form.featured,
    };
    try {
      if (editingId) {
        await patch(`/courses/${editingId}`, payload);
        setSaveMsg({ type: 'success', text: 'Course updated.' });
        setEditingId(null); setForm(EMPTY_FORM);
      } else {
        await post('/courses', payload);
        setSaveMsg({ type: 'success', text: `Course "${form.title}" created.` });
        setForm(EMPTY_FORM);
      }
      loadCourses();
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.error?.message || 'Failed to save course.' });
    } finally { setSaving(false); }
  }

  async function handleDeleteCourse(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try { await del(`/courses/${id}`); loadCourses(); }
    catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  async function loadEnrollments(courseId) {
    setLoadingEnrollments(true); setEnrollMsg(null);
    try { const res = await get(`/courses/${courseId}/enrollments`); setEnrollments(res.data); }
    catch (err) { console.error(err); }
    finally { setLoadingEnrollments(false); }
  }

  async function handleVerify(enrollmentId, status) {
    setActionId(enrollmentId); setEnrollMsg(null);
    try {
      await patch(`/enrollments/${enrollmentId}/verify`, { status });
      setEnrollMsg({ type: 'success', text: `Enrollment ${status.toLowerCase()}.` });
      loadEnrollments(selectedCourse);
    } catch (err) {
      setEnrollMsg({ type: 'error', text: err.error?.message || 'Action failed.' });
    } finally { setActionId(null); }
  }

  async function loadReviewsForCourse(courseId) {
    if (!courseId) return;
    setLoadingReviews(true);
    try { const res = await get(`/courses/${courseId}/reviews`); setReviews(res.data); }
    catch (err) { console.error(err); }
    finally { setLoadingReviews(false); }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('Remove this review?')) return;
    setDeletingReviewId(reviewId);
    try { await del(`/reviews/${reviewId}/admin`); loadReviewsForCourse(reviewCourse); }
    catch (err) { console.error(err); }
    finally { setDeletingReviewId(null); }
  }

  const TABS = [
    { key: 'add',         label: editingId ? '✏️ Edit Course' : 'Add Course' },
    { key: 'manage',      label: `Manage Courses (${courses.length})` },
    { key: 'enrollments', label: 'Verify Enrollments' },
    { key: 'reviews',     label: 'Moderate Reviews' },
  ];

  return (
    <>
      <Navbar />
      <div className="page" style={{ paddingTop: 0 }}>
        <div style={{ paddingTop: 32, paddingBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.4px' }}>Admin Panel</h1>
        </div>

        <div className="tabs">
          {TABS.map(t => <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
        </div>

        {/* ── Add / Edit Course ── */}
        {tab === 'add' && (
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '24px 28px', maxWidth: 620, marginTop: 4 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#191919', marginBottom: 20 }}>{editingId ? 'Edit Course' : 'Create New Course'}</p>
            {saveMsg && <div className={saveMsg.type === 'success' ? 'alert-info' : 'alert-error'} style={{ marginBottom: 16 }}>{saveMsg.text}</div>}
            <form onSubmit={handleSaveCourse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Title *</label>
                  <input className="input" value={form.title} onChange={e => setField('title', e.target.value)} required placeholder="e.g. Machine Learning" />
                </div>
                <div className="form-group">
                  <label>Provider *</label>
                  <input className="input" value={form.provider} onChange={e => setField('provider', e.target.value)} required placeholder="e.g. Holberton School" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input className="input" value={form.category} onChange={e => setField('category', e.target.value)} placeholder="e.g. Web Development" />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input className="input" value={form.duration} onChange={e => setField('duration', e.target.value)} placeholder="e.g. 9 months" />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input className="input" value={form.url} onChange={e => setField('url', e.target.value)} placeholder="https://…" type="url" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Description</label>
                  <textarea className="input" value={form.description} onChange={e => setField('description', e.target.value)} rows={3} placeholder="Short description" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Skills <span style={{ fontWeight: 400, color: '#888' }}>(comma-separated)</span></label>
                  <input className="input" value={form.skills} onChange={e => setField('skills', e.target.value)} placeholder="Python, React, Docker, …" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label>Career Paths <span style={{ fontWeight: 400, color: '#888' }}>(comma-separated)</span></label>
                  <input className="input" value={form.careerPaths} onChange={e => setField('careerPaths', e.target.value)} placeholder="ML Engineer, Data Scientist, …" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setField('featured', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="featured" style={{ cursor: 'pointer', fontWeight: 500 }}>Mark as Featured</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Course'}</button>
                {editingId && <button type="button" className="btn-outline" onClick={cancelEdit}>Cancel</button>}
              </div>
            </form>
          </div>
        )}

        {/* ── Manage Courses ── */}
        {tab === 'manage' && (
          <div style={{ marginTop: 4 }}>
            {courses.length === 0 ? <div className="empty">No courses yet.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {courses.map(c => (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#191919' }}>{c.title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{c.provider}{c.category ? ` · ${c.category}` : ''}{c.duration ? ` · ${c.duration}` : ''}</p>
                    </div>
                    {c.featured && <span style={{ fontSize: 11, fontWeight: 700, color: '#a07800', background: 'rgba(212,160,23,0.1)', border: '1px solid #d4a017', padding: '2px 8px', borderRadius: 20 }}>FEATURED</span>}
                    <span style={{ fontSize: 12, color: '#888' }}>{c.reviewCount} reviews</span>
                    <button className="btn-outline btn-sm" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 24 }} disabled={deletingId === c.id} onClick={() => handleDeleteCourse(c.id, c.title)}>{deletingId === c.id ? '…' : 'Delete'}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Verify Enrollments ── */}
        {tab === 'enrollments' && (
          <div style={{ marginTop: 4 }}>
            <div className="form-group" style={{ maxWidth: 400 }}>
              <label>Select a Course</label>
              <select className="input" value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); if (e.target.value) loadEnrollments(e.target.value); else setEnrollments([]); }}>
                <option value="">— Choose a course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.provider})</option>)}
              </select>
            </div>
            {enrollMsg && <div className={enrollMsg.type === 'success' ? 'alert-info' : 'alert-error'} style={{ maxWidth: 600 }}>{enrollMsg.text}</div>}
            {loadingEnrollments ? <div className="loading">Loading…</div>
              : selectedCourse && enrollments.length === 0 ? <div className="empty">No enrollments for this course.</div>
              : enrollments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {enrollments.map(e => (
                    <div key={e.id} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{e.user.name?.[0]?.toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#191919' }}>{e.user.name}</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                          <span className={`badge badge-${e.status.toLowerCase()}`}>{e.status}</span>
                          {e.user.linkedinConnected && e.user.linkedinProfileUrl
                            ? <a href={e.user.linkedinProfileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)' }}>LinkedIn ↗</a>
                            : <span style={{ fontSize: 12, color: '#888' }}>No LinkedIn</span>}
                        </div>
                      </div>
                      {e.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm" disabled={actionId === e.id || !e.user.linkedinConnected} title={!e.user.linkedinConnected ? 'User must connect LinkedIn first' : ''} onClick={() => handleVerify(e.id, 'VERIFIED')}>Verify</button>
                          <button className="btn-outline btn-sm" disabled={actionId === e.id} onClick={() => handleVerify(e.id, 'REJECTED')}>Reject</button>
                        </div>
                      )}
                      {e.status !== 'PENDING' && e.verifiedAt && <span style={{ fontSize: 12, color: '#888' }}>{new Date(e.verifiedAt).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
              ) : null}
          </div>
        )}

        {/* ── Moderate Reviews ── */}
        {tab === 'reviews' && (
          <div style={{ marginTop: 4 }}>
            <div className="form-group" style={{ maxWidth: 400 }}>
              <label>Select a Course</label>
              <select className="input" value={reviewCourse} onChange={e => { setReviewCourse(e.target.value); loadReviewsForCourse(e.target.value); }}>
                <option value="">— Choose a course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.provider})</option>)}
              </select>
            </div>
            {loadingReviews ? <div className="loading">Loading…</div>
              : reviewCourse && reviews.length === 0 ? <div className="empty">No reviews for this course.</div>
              : reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>{r.author ? r.author.name : 'Anonymous'}</span>
                          <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          <span style={{ fontSize: 12, color: '#888' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{r.content}</p>
                      </div>
                      <button style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #fca5a5', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }} disabled={deletingReviewId === r.id} onClick={() => handleDeleteReview(r.id)}>{deletingReviewId === r.id ? '…' : 'Remove'}</button>
                    </div>
                  ))}
                </div>
              ) : null}
          </div>
        )}
      </div>
    </>
  );
}
