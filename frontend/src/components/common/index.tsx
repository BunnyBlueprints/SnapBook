import React from 'react';
import { BookingStatus, SeatStatus, ShowStatus } from '../../types';

// ── StatusBadge ───────────────────────────────────────────────────────────────
type AnyStatus = BookingStatus | SeatStatus | ShowStatus | string;
export const StatusBadge: React.FC<{ status: AnyStatus }> = ({ status }) => {
  const cls = status.toLowerCase();
  const icons: Record<string, string> = {
    CONFIRMED: '✓', PENDING: '⏱', FAILED: '✕',
    CANCELLED: '✕', AVAILABLE: '●', BOOKED: '🔒', ACTIVE: '●',
  };
  return <span className={`badge badge-${cls}`}>{icons[status] || '●'} {status}</span>;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
interface SkeletonProps { w?: string; h?: string; style?: React.CSSProperties; }
export const Skeleton: React.FC<SkeletonProps> = ({ w = '100%', h = '1rem', style }) => (
  <div className="skeleton" style={{ width: w, height: h, ...style }} />
);

export const ShowCardSkeleton: React.FC = () => (
  <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
    <Skeleton h="20px" w="40%" />
    <Skeleton h="22px" w="85%" />
    <Skeleton h="14px" w="60%" />
    <Skeleton h="14px" w="95%" />
    <Skeleton h="14px" w="80%" />
    <Skeleton h="6px" style={{ borderRadius: '3px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton h="28px" w="80px" />
      <Skeleton h="34px" w="90px" style={{ borderRadius: '8px' }} />
    </div>
  </div>
);

// ── Alert ─────────────────────────────────────────────────────────────────────
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  onClose?: () => void;
}
const ALERT_ICON = { success: '✓', error: '!', warning: '⚠', info: 'i' };
export const Alert: React.FC<AlertProps> = ({ type, message, title, onClose }) => (
  <div className={`alert alert-${type}`} role="alert">
    <span style={{ fontWeight: 800, flexShrink: 0 }}>{ALERT_ICON[type]}</span>
    <div style={{ flex: 1 }}>
      {title && <div style={{ fontWeight: 700, marginBottom: '.1rem' }}>{title}</div>}
      {message}
    </div>
    {onClose && (
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', flexShrink: 0 }}>✕</button>
    )}
  </div>
);

// ── Empty ─────────────────────────────────────────────────────────────────────
interface EmptyProps { icon?: string; title: string; desc?: string; action?: { label: string; onClick: () => void }; }
export const Empty: React.FC<EmptyProps> = ({ icon = '🎪', title, desc, action }) => (
  <div className="empty">
    <span style={{ fontSize: '3rem' }}>{icon}</span>
    <h3>{title}</h3>
    {desc && <p>{desc}</p>}
    {action && <button className="btn btn-primary" onClick={action.onClick}>{action.label}</button>}
  </div>
);

// ── PageLoader ────────────────────────────────────────────────────────────────
export const PageLoader: React.FC<{ msg?: string }> = ({ msg = 'Loading…' }) => (
  <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
    <div className="spinner" style={{ width: 32, height: 32 }} />
    <span style={{ fontSize: '.875rem', color: 'var(--ink3)' }}>{msg}</span>
  </div>
);
