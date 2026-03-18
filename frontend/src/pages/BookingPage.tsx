import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Show, Seat, Booking } from '../types';
import { showApi, bookingApi } from '../api';
import SeatGrid from '../components/booking/SeatGrid';
import { Alert, PageLoader, StatusBadge } from '../components/common';
import { format } from 'date-fns';
import './BookingPage.css';

type Step = 'seats' | 'details' | 'result';
interface Form { name: string; email: string; phone: string; }
interface Errors { name?: string; email?: string; phone?: string; }

const validate = (f: Form): Errors => {
  const e: Errors = {};
  if (!f.name.trim())  e.name  = 'Name is required';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Invalid email';
  if (!f.phone.trim()) e.phone = 'Phone is required';
  return e;
};

const POLL_MS = 15_000; // refresh seat availability every 15s

const BookingPage: React.FC = () => {
  const { id: showId } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [show, setShow]       = useState<Show | null>(null);
  const [seats, setSeats]     = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep]       = useState<Step>('seats');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiErr, setApiErr]   = useState('');
  const [loadingShow, setLoadingShow] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [form, setForm]       = useState<Form>({ name: '', email: '', phone: '' });
  const [errors, setErrors]   = useState<Errors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  // Fetch show + seats
  const loadSeats = useCallback(async () => {
    if (!showId) return;
    setLoadingSeats(true);
    try { setSeats(await showApi.getSeats(showId)); } catch {}
    finally { setLoadingSeats(false); }
  }, [showId]);

  useEffect(() => {
    if (!showId) return;
    Promise.all([showApi.getById(showId), showApi.getSeats(showId)])
      .then(([s, st]) => { setShow(s); setSeats(st); })
      .catch(() => setApiErr('Show not found'))
      .finally(() => setLoadingShow(false));
  }, [showId]);

  // Poll seat availability every 15s to detect concurrent bookings
  useEffect(() => {
    if (step !== 'seats') return;
    pollRef.current = setInterval(loadSeats, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [step, loadSeats]);

  // Clear deselected seats if they get booked by someone else
  useEffect(() => {
    const bookedIds = new Set(seats.filter(s => s.status === 'BOOKED').map(s => s.id));
    setSelected(prev => prev.filter(id => !bookedIds.has(id)));
  }, [seats]);

  useEffect(() => { if (step === 'details') nameRef.current?.focus(); }, [step]);

  const toggleSeat = useCallback((id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleFormChange = (field: keyof Form, val: string) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep('result');
    submitBooking();
  };

  const submitBooking = async () => {
    if (!showId || !selected.length) return;
    setSubmitting(true); setApiErr('');
    try {
      const res = await bookingApi.create({
        show_id: showId,
        seat_ids: selected,
        user_name: form.name.trim(),
        user_email: form.email.trim().toLowerCase(),
        user_phone: form.phone.trim(),
      });
      setBooking(res.booking || res.data || null);
      // Refresh seats to reflect newly booked status
      await loadSeats();
    } catch (err: any) {
      setApiErr(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingShow) return <PageLoader msg="Loading show details…" />;
  if (apiErr && !show) return (
    <div className="page container">
      <Alert type="error" message={apiErr} />
      <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => nav('/')}>← Back</button>
    </div>
  );

  const totalPrice = selected.length * Number(show?.price || 0);
  const selectedSeats = seats.filter(s => selected.includes(s.id));

  return (
    <div className="page">
      <div className="bp-layout container">

        {/* ── Left — Show info sidebar ── */}
        <aside className="bp-sidebar">
          <div className="card bp-show-card">
            <button className="back-link" onClick={() => nav('/')}>← Back to shows</button>
            <div className={`type-tag tag-${show?.type}`} style={{ width: 'fit-content' }}>
              {show?.type}
            </div>
            <h2 className="bp-show-name">{show?.name}</h2>
            {show?.venue && <p className="bp-venue">📍 {show.venue}</p>}
            <div className="bp-show-meta">
              <div className="bp-meta-row">
                <span>📅</span>
                <span>{show?.start_time ? format(new Date(show.start_time), 'EEE, dd MMM yyyy') : ''}</span>
              </div>
              <div className="bp-meta-row">
                <span>🕐</span>
                <span>{show?.start_time ? format(new Date(show.start_time), 'h:mm a') : ''}</span>
              </div>
              <div className="bp-meta-row">
                <span>💺</span>
                <span>{show?.available_seats} seats left of {show?.total_seats}</span>
              </div>
            </div>
            <hr className="bp-divider" />
            {/* Order summary */}
            <div className="order-summary">
              <div className="os-title">Order Summary</div>
              {selected.length === 0 ? (
                <p className="os-empty">No seats selected yet</p>
              ) : (
                <>
                  <div className="os-seats">
                    {selectedSeats.map(s => (
                      <div key={s.id} className="os-seat-row">
                        <span className="os-seat-code">{s.seat_code}</span>
                        <span className="os-seat-price">₹{Number(show?.price).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="os-total">
                    <span>Total</span>
                    <span className="os-total-val">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ── Right — Steps ── */}
        <div className="bp-main">
          {/* Step indicator */}
          <div className="bp-steps">
            {(['seats', 'details', 'result'] as Step[]).map((s, i) => {
              const isDone  = ['details','result'].indexOf(step) > i - 1 && step !== s;
              const isActive = step === s;
              return (
                <React.Fragment key={s}>
                  <div className={`bps ${isActive ? 'active' : isDone ? 'done' : ''}`}>
                    <div className="bps-num">{isDone ? '✓' : i + 1}</div>
                    <span className="bps-label">{['Select Seats','Your Details','Confirmation'][i]}</span>
                  </div>
                  {i < 2 && <div className={`bps-line ${isDone ? 'done' : ''}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Step 1: Seat selection ── */}
          {step === 'seats' && (
            <div className="card bp-card">
              <div className="bp-card-head">
                <h2>Select Your Seats</h2>
                <p>
                  Choose up to 10 seats.
                  {loadingSeats && <span className="refreshing"> Refreshing…</span>}
                </p>
              </div>
              <SeatGrid
                seats={seats}
                selected={selected}
                onToggle={toggleSeat}
                maxSelect={10}
              />
              <div className="bp-step-footer">
                <button className="btn btn-ghost" onClick={() => nav('/')}>Cancel</button>
                <button
                  className="btn btn-primary btn-lg"
                  disabled={selected.length === 0}
                  onClick={() => setStep('details')}
                >
                  Continue with {selected.length} seat{selected.length !== 1 ? 's' : ''} →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Details form ── */}
          {step === 'details' && (
            <div className="card bp-card">
              <div className="bp-card-head">
                <h2>Your Details</h2>
                <p>We'll send your booking confirmation to these details.</p>
              </div>
              <form onSubmit={handleDetailsSubmit} noValidate className="bp-form">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    ref={nameRef}
                    type="text"
                    className={`form-input ${errors.name ? 'err' : ''}`}
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => handleFormChange('name', e.target.value)}
                    autoComplete="name"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`form-input ${errors.email ? 'err' : ''}`}
                      placeholder="you@email.com"
                      value={form.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                      autoComplete="email"
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className={`form-input ${errors.phone ? 'err' : ''}`}
                      placeholder="9XXXXXXXXX"
                      value={form.phone}
                      onChange={e => handleFormChange('phone', e.target.value)}
                      autoComplete="tel"
                      maxLength={10}
                    />
                    {errors.phone && <span className="form-error">{errors.phone}</span>}
                  </div>
                </div>

                {/* Selected seats summary */}
                <div className="selected-recap">
                  <span className="sr-label">Your seats:</span>
                  {selectedSeats.map(s => (
                    <span key={s.id} className="sr-badge">{s.seat_code}</span>
                  ))}
                  <span className="sr-total">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="bp-step-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep('seats')}>← Change Seats</button>
                  <button type="submit" className="btn btn-primary btn-lg">Confirm Booking →</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 'result' && (
            <div className="card bp-card bp-result">
              {submitting ? (
                <div className="result-processing">
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                  <h2>Processing your booking…</h2>
                  <p>Please don't close this page</p>
                </div>
              ) : booking ? (
                <>
                  <div className={`result-icon ${booking.status.toLowerCase()}`}>
                    {booking.status === 'CONFIRMED' ? '🎉' : '😞'}
                  </div>
                  <h2 className="result-title">
                    {booking.status === 'CONFIRMED' ? 'Booking Confirmed!' : 'Booking Failed'}
                  </h2>
                  <p className="result-sub">
                    {booking.status === 'CONFIRMED'
                      ? `Your seats for ${show?.name} are confirmed.`
                      : 'The seats were just taken by another user. Please go back and choose different seats.'}
                  </p>

                  <StatusBadge status={booking.status} />

                  {booking.status === 'CONFIRMED' && (
                    <>
                      <div className="result-ticket">
                        <div className="rt-header">
                          <span className={`type-tag tag-${show?.type}`}>{show?.type}</span>
                          <code className="rt-id">{booking.id.slice(0, 8).toUpperCase()}</code>
                        </div>
                        <div className="rt-name">{show?.name}</div>
                        <div className="rt-meta">
                          <div>📅 {show?.start_time ? format(new Date(show.start_time), 'dd MMM yyyy, h:mm a') : ''}</div>
                          <div>📍 {show?.venue}</div>
                          <div>👤 {booking.user_name}</div>
                          <div>💺 {booking.seat_codes.join(', ')}</div>
                        </div>
                        <div className="rt-divider">
                          <span /><span className="rt-dot">●●●●●●●●●●●●●●●</span><span />
                        </div>
                        <div className="rt-total">
                          <span>Total Paid</span>
                          <span className="rt-amount">₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {apiErr && <Alert type="error" message={apiErr} />}

                  <div className="result-actions">
                    <button className="btn btn-ghost" onClick={() => nav('/')}>Back to Shows</button>
                    {booking.status === 'FAILED' && (
                      <button className="btn btn-primary" onClick={() => { setSelected([]); setStep('seats'); loadSeats(); }}>
                        Choose Different Seats
                      </button>
                    )}
                  </div>
                </>
              ) : apiErr ? (
                <>
                  <Alert type="error" message={apiErr} />
                  <div className="result-actions" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-ghost" onClick={() => nav('/')}>Home</button>
                    <button className="btn btn-primary" onClick={() => { setStep('seats'); loadSeats(); }}>Try Again</button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
