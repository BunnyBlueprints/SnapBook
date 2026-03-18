import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Show } from '../../types';
import { format } from 'date-fns';
import './ShowCard.css';

const TYPE_EMOJI: Record<string, string> = {
  MOVIE: '🎬', BUS: '🚌', CONCERT: '🎵', SPORT: '🏆', OTHER: '🎪',
};

interface Props { show: Show; }

const ShowCard: React.FC<Props> = ({ show }) => {
  const nav = useNavigate();
  const pct = Math.round((show.booked_seats / show.total_seats) * 100);
  const isSoldOut = show.available_seats === 0;
  const isAlmostFull = !isSoldOut && pct >= 75;

  return (
    <div className={`show-card card ${isSoldOut ? 'sold-out' : ''}`} onClick={() => nav(`/booking/${show.id}`)}>
      {/* Top strip */}
      <div className="sc-strip">
        <span className={`type-tag tag-${show.type}`}>{TYPE_EMOJI[show.type]} {show.type}</span>
        {isSoldOut && <span className="sc-sold">SOLD OUT</span>}
        {isAlmostFull && !isSoldOut && <span className="sc-hot">🔥 Almost full</span>}
      </div>

      {/* Title */}
      <h3 className="sc-name">{show.name}</h3>
      {show.venue && <p className="sc-venue">📍 {show.venue}</p>}
      {show.description && <p className="sc-desc">{show.description}</p>}

      {/* Date / time */}
      <div className="sc-time">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        {format(new Date(show.start_time), 'EEE, dd MMM yyyy · h:mm a')}
      </div>

      {/* Seat bar */}
      <div className="sc-seats">
        <div className="sc-bar-wrap">
          <div className="sc-bar" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--red)' : pct >= 60 ? 'var(--amber)' : 'var(--green)' }} />
        </div>
        <span className="sc-avail">{isSoldOut ? 'No seats' : `${show.available_seats} seats left`}</span>
      </div>

      {/* Footer */}
      <div className="sc-footer">
        <div className="sc-price">
          <span className="sc-price-label">From</span>
          <span className="sc-price-val">₹{Number(show.price).toLocaleString('en-IN')}</span>
        </div>
        <button
          className={`btn btn-sm ${isSoldOut ? 'btn-ghost' : 'btn-primary'}`}
          disabled={isSoldOut}
          onClick={e => { e.stopPropagation(); nav(`/booking/${show.id}`); }}
        >
          {isSoldOut ? 'Sold Out' : 'Book Now →'}
        </button>
      </div>
    </div>
  );
};

export default ShowCard;
