import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Show, Booking, CreateShowPayload, ShowType } from '../types';
import { showApi, bookingApi } from '../api';
import { Alert, Empty, StatusBadge, Skeleton } from '../components/common';
import { format } from 'date-fns';
import './AdminPage.css';

type Tab = 'overview' | 'shows' | 'bookings';

const SHOW_TYPES: ShowType[] = ['MOVIE','BUS','CONCERT','SPORT','OTHER'];
const defaultForm = (): CreateShowPayload => ({
  name:'', type:'MOVIE', venue:'', description:'',
  start_time:'', end_time:'', total_seats: 40, price: 250,
});

const AdminPage: React.FC = () => {
  const { auth, shows, loadingShows, fetchShows, invalidateShows } = useApp();
  const nav = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [allShows, setAllShows] = useState<Show[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateShowPayload>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success'|'error'; text: string } | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated || auth.role !== 'admin') nav('/login');
  }, [auth, nav]);

  const loadAdmin = useCallback(async () => {
    setLoadingAdmin(true);
    try { setAllShows(await showApi.listAll()); }
    catch {}
    finally { setLoadingAdmin(false); }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const r = await bookingApi.listAll({ limit: 50 } as any);
      setBookings(r.data || []);
    } catch {}
    finally { setLoadingBookings(false); }
  }, []);

  useEffect(() => {
    if (tab === 'overview') { fetchShows(); loadAdmin(); }
    if (tab === 'shows') loadAdmin();
    if (tab === 'bookings') loadBookings();
  }, [tab, fetchShows, loadAdmin, loadBookings]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await showApi.create(form);
      setMsg({ type: 'success', text: 'Show created successfully!' });
      setForm(defaultForm()); setShowForm(false);
      invalidateShows(); loadAdmin();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to create show' });
    } finally { setSaving(false); }
  };

  const handleCancel = async (id: string, name: string) => {
    if (!window.confirm(`Cancel "${name}"? All bookings will be cancelled.`)) return;
    try {
      await showApi.cancel(id);
      setMsg({ type: 'success', text: 'Show cancelled.' });
      invalidateShows(); loadAdmin();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to cancel show' });
    }
  };

  // Stats
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const pending   = bookings.filter(b => b.status === 'PENDING').length;
  const revenue   = bookings.filter(b => b.status === 'CONFIRMED').reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div className="page">
      <div className="container">
        <div className="adm-header">
          <div>
            <h1 className="page-title" style={{ fontSize:'1.75rem', fontWeight:800 }}>Admin Dashboard</h1>
            <p style={{ color:'var(--ink2)', fontSize:'.9rem' }}>Manage shows, seats and bookings</p>
          </div>
          <div style={{ display:'flex', gap:'.75rem' }}>
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setTab('shows'); setMsg(null); }}>
              + New Show
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tabs">
          {(['overview','shows','bookings'] as Tab[]).map(t => (
            <button key={t} className={`adm-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {msg && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />
          </div>
        )}

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div>
            <div className="adm-stats">
              {[
                { label:'Active Shows',       value: shows.filter(s => s.status === 'ACTIVE').length, icon:'🎭' },
                { label:'Total Seats',        value: shows.reduce((s,x) => s + x.total_seats, 0),   icon:'💺' },
                { label:'Confirmed Bookings', value: confirmed, icon:'✅' },
                { label:'Revenue (₹)',        value: `₹${revenue.toLocaleString('en-IN')}`, icon:'💰' },
              ].map(stat => (
                <div key={stat.label} className="adm-stat card">
                  <span className="adm-stat-icon">{stat.icon}</span>
                  <span className="adm-stat-val">{stat.value}</span>
                  <span className="adm-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="adm-recent card">
              <div className="adm-section-head">
                <h3>Recent Shows</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('shows')}>View all</button>
              </div>
              {loadingShows
                ? Array.from({length:4}).map((_,i) => <Skeleton key={i} h="48px" style={{ margin:'.4rem 0', borderRadius:'8px' }} />)
                : shows.slice(0,5).map(s => (
                  <div key={s.id} className="adm-row" onClick={() => nav(`/booking/${s.id}`)}>
                    <span className={`type-tag tag-${s.type}`}>{s.type}</span>
                    <div className="adm-row-info">
                      <span className="adm-row-name">{s.name}</span>
                      <span className="adm-row-sub">{s.venue} · {format(new Date(s.start_time), 'dd MMM, h:mm a')}</span>
                    </div>
                    <span className="adm-row-seats">{s.available_seats}/{s.total_seats} left</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── Shows Tab ── */}
        {tab === 'shows' && (
          <div>
            {showForm && (
              <div className="card adm-form-card">
                <div className="adm-form-head">
                  <h3>Create New Show</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
                <form onSubmit={handleCreate} className="adm-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Show Name *</label>
                      <input className="form-input" placeholder="e.g. Kalki 2898 AD" value={form.name}
                        onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-select" value={form.type}
                        onChange={e => setForm(p => ({...p, type: e.target.value as ShowType}))}>
                        {SHOW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue</label>
                    <input className="form-input" placeholder="e.g. PVR IMAX Mumbai" value={form.venue || ''}
                      onChange={e => setForm(p => ({...p, venue: e.target.value}))} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Start Time *</label>
                      <input type="datetime-local" className="form-input" value={form.start_time}
                        onChange={e => setForm(p => ({...p, start_time: e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input type="datetime-local" className="form-input" value={form.end_time || ''}
                        onChange={e => setForm(p => ({...p, end_time: e.target.value}))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Total Seats *</label>
                      <input type="number" className="form-input" min={1} max={500} value={form.total_seats}
                        onChange={e => setForm(p => ({...p, total_seats: +e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price per Seat (₹) *</label>
                      <input type="number" className="form-input" min={0} value={form.price}
                        onChange={e => setForm(p => ({...p, price: +e.target.value}))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" placeholder="Short description…" value={form.description || ''}
                      onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2} />
                  </div>
                  <div style={{ display:'flex', gap:'.75rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><div className="spinner" />Creating…</> : 'Create Show'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="card" style={{ overflow:'hidden' }}>
              <div className="adm-section-head" style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
                <h3>All Shows ({allShows.length})</h3>
                <button className="btn btn-ghost btn-sm" onClick={loadAdmin} disabled={loadingAdmin}>Refresh</button>
              </div>
              {loadingAdmin
                ? <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'.75rem'}}>
                    {Array.from({length:5}).map((_,i) => <Skeleton key={i} h="52px" style={{borderRadius:'8px'}} />)}
                  </div>
                : allShows.length === 0
                  ? <Empty title="No shows yet" desc="Create your first show above." />
                  : <table className="adm-table">
                      <thead>
                        <tr><th>Show</th><th>Type</th><th>Date</th><th>Seats</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {allShows.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{fontWeight:700,fontSize:'.875rem',color:'var(--ink)'}}>{s.name}</div>
                              <div style={{fontSize:'.72rem',color:'var(--ink3)'}}>{s.venue}</div>
                            </td>
                            <td><span className={`type-tag tag-${s.type}`}>{s.type}</span></td>
                            <td style={{fontSize:'.82rem',color:'var(--ink2)'}}>{format(new Date(s.start_time), 'dd MMM yy, h:mm a')}</td>
                            <td>
                              <div style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
                                <div style={{width:60,height:5,background:'var(--bg3)',borderRadius:3,overflow:'hidden'}}>
                                  <div style={{width:`${(s.booked_seats/s.total_seats)*100}%`,height:'100%',background:'var(--accent)',borderRadius:3}} />
                                </div>
                                <span style={{fontSize:'.78rem',color:'var(--ink2)'}}>{s.booked_seats}/{s.total_seats}</span>
                              </div>
                            </td>
                            <td style={{fontWeight:700,fontSize:'.875rem'}}>₹{Number(s.price).toLocaleString('en-IN')}</td>
                            <td><StatusBadge status={s.status} /></td>
                            <td>
                              <div style={{display:'flex',gap:'.4rem'}}>
                                <button className="btn btn-ghost btn-sm" onClick={() => nav(`/booking/${s.id}`)}>View</button>
                                {s.status === 'ACTIVE' && (
                                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(s.id, s.name)}>Cancel</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              }
            </div>
          </div>
        )}

        {/* ── Bookings Tab ── */}
        {tab === 'bookings' && (
          <div className="card" style={{ overflow:'hidden' }}>
            <div className="adm-section-head" style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
              <h3>All Bookings ({bookings.length})</h3>
              <button className="btn btn-ghost btn-sm" onClick={loadBookings} disabled={loadingBookings}>Refresh</button>
            </div>
            {loadingBookings
              ? <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'.75rem'}}>
                  {Array.from({length:6}).map((_,i) => <Skeleton key={i} h="52px" style={{borderRadius:'8px'}} />)}
                </div>
              : bookings.length === 0
                ? <Empty icon="🎟" title="No bookings yet" desc="Bookings will appear here once users start booking." />
                : <table className="adm-table">
                    <thead>
                      <tr><th>Customer</th><th>Show</th><th>Seats</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div style={{fontWeight:700,fontSize:'.875rem'}}>{b.user_name}</div>
                            <div style={{fontSize:'.72rem',color:'var(--ink3)'}}>{b.user_email}</div>
                          </td>
                          <td>
                            <div style={{fontSize:'.875rem',fontWeight:600,color:'var(--ink)'}}>{b.show_name}</div>
                            <div style={{fontSize:'.72rem',color:'var(--ink3)'}}>{b.start_time ? format(new Date(b.start_time), 'dd MMM, h:mm a') : ''}</div>
                          </td>
                          <td style={{fontSize:'.82rem'}}>{b.seat_codes?.join(', ')}</td>
                          <td style={{fontWeight:700,fontSize:'.875rem'}}>₹{Number(b.total_amount).toLocaleString('en-IN')}</td>
                          <td><StatusBadge status={b.status} /></td>
                          <td style={{fontSize:'.78rem',color:'var(--ink3)'}}>{format(new Date(b.created_at), 'dd MMM, h:mm a')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
