import React, { useEffect, useRef, useCallback } from 'react';
import { Seat } from '../../types';
import './SeatGrid.css';

interface Props {
  seats: Seat[];
  selected: string[];           // seat IDs
  onToggle: (id: string) => void;
  maxSelect?: number;
  disabled?: boolean;
}

const SeatGrid: React.FC<Props> = ({ seats, selected, onToggle, maxSelect = 10, disabled = false }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Group seats by row
  const rows = React.useMemo(() => {
    const map: Record<string, Seat[]> = {};
    for (const s of seats) {
      if (!map[s.row_label]) map[s.row_label] = [];
      map[s.row_label].push(s);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const selectedSet = new Set(selected);
    grid.querySelectorAll<HTMLButtonElement>('[data-seat-id]').forEach(btn => {
      const id = btn.dataset.seatId!;
      btn.classList.toggle('selected', selectedSet.has(id));
      if (btn.dataset.status === 'AVAILABLE') {
        btn.disabled = disabled || (!selectedSet.has(id) && selected.length >= maxSelect);
      }
    });
  }, [selected, maxSelect, disabled]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-seat-id]');
    if (!btn || btn.disabled) return;
    onToggle(btn.dataset.seatId!);
  }, [onToggle]);

  return (
    <div className="seat-grid-wrap">
      {/* Screen indicator */}
      <div className="screen-label">
        <div className="screen-bar" />
        <span>SCREEN / STAGE / FRONT</span>
      </div>

      {/* Legend */}
      <div className="seat-legend">
        <span><span className="legend-dot available" />Available</span>
        <span><span className="legend-dot selected" />Selected</span>
        <span><span className="legend-dot booked" />Booked</span>
      </div>

      {/* Grid — click handled at container level for performance */}
      <div className="seat-rows" ref={gridRef} onClick={handleClick}>
        {rows.map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="seat-row">
            <span className="row-label">{rowLabel}</span>
            <div className="row-seats">
              {rowSeats.map(seat => {
                const isBooked = seat.status === 'BOOKED';
                const isSel    = selected.includes(seat.id);
                const isDisabled = disabled || isBooked
                  || (!isSel && selected.length >= maxSelect);
                return (
                  <button
                    key={seat.id}
                    className={`seat ${seat.status.toLowerCase()} ${isSel ? 'selected' : ''}`}
                    data-seat-id={seat.id}
                    data-status={seat.status}
                    disabled={isDisabled}
                    title={isBooked ? `${seat.seat_code} — Booked` : `${seat.seat_code}`}
                    aria-label={`Seat ${seat.seat_code} ${seat.status}`}
                    aria-pressed={isSel}
                  >
                    <span className="seat-code">{seat.seat_code}</span>
                  </button>
                );
              })}
            </div>
            <span className="row-label">{rowLabel}</span>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="seat-selection-summary">
          <span className="sel-codes">
            {selected.slice(0, 8).map(id => {
              const s = seats.find(x => x.id === id);
              return s ? <span key={id} className="sel-badge">{s.seat_code}</span> : null;
            })}
            {selected.length > 8 && <span className="sel-badge more">+{selected.length - 8}</span>}
          </span>
          <span className="sel-count">{selected.length} seat{selected.length !== 1 ? 's' : ''} selected</span>
        </div>
      )}
    </div>
  );
};

export default SeatGrid;
