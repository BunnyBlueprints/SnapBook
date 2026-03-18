import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import ShowCard from '../components/user/ShowCard';
import { ShowCardSkeleton, Empty } from '../components/common';
import './Home.css';

const TYPES = ['ALL', 'MOVIE', 'BUS', 'CONCERT', 'SPORT', 'OTHER'];
const TYPE_EMOJI: Record<string, string> = {
  ALL: '🎪', MOVIE: '🎬', BUS: '🚌', CONCERT: '🎵', SPORT: '🏆', OTHER: '🎠',
};

const Home: React.FC = () => {
  const { shows, loadingShows, fetchShows } = useApp();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchShows(); }, [fetchShows]);

  const visible = useMemo(() =>
    shows.filter(s =>
      (filter === 'ALL' || s.type === filter) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.venue?.toLowerCase().includes(search.toLowerCase()))
    ), [shows, filter, search]);

  return (
    <div className="page">
      {/* Hero */}
      <div className="home-hero">
        <div className="container">
          <div className="hero-text">
            <p className="hero-eyebrow">🎟 Live Events · Movies · Bus Travel</p>
            <h1 className="hero-h1">Book Your<br /><span className="hero-accent">Next Experience</span></h1>
            <p className="hero-sub">Instant seat selection. Concurrency-safe booking. Zero double-booking.</p>
          </div>
          <div className="hero-floats">
            <div className="float-card fc1">🎬 <span>Kalki 2898 AD</span></div>
            <div className="float-card fc2">🏆 <span>IPL Final</span></div>
            <div className="float-card fc3">🎵 <span>Coldplay</span></div>
            <div className="hero-ticket">🎟</div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Search + filters */}
        <div className="home-controls">
          <div className="search-wrap">
            <span className="search-ico">🔍</span>
            <input
              className="search-inp"
              placeholder="Search shows, venues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <div className="type-pills">
            {TYPES.map(t => (
              <button
                key={t}
                className={`type-pill ${filter === t ? 'on' : ''}`}
                onClick={() => setFilter(t)}
              >
                {TYPE_EMOJI[t]} {t}
              </button>
            ))}
          </div>
          {!loadingShows && (
            <span className="results-count">{visible.length} show{visible.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Grid */}
        <div className="grid-3">
          {loadingShows
            ? Array.from({ length: 6 }).map((_, i) => <ShowCardSkeleton key={i} />)
            : visible.length === 0
              ? <div style={{ gridColumn: '1/-1' }}>
                  <Empty
                    icon="🎪"
                    title="No shows found"
                    desc={search ? `No results for "${search}"` : 'No shows available in this category.'}
                    action={(search || filter !== 'ALL') ? { label: 'Clear filters', onClick: () => { setSearch(''); setFilter('ALL'); } } : undefined}
                  />
                </div>
              : visible.map(s => <ShowCard key={s.id} show={s} />)
          }
        </div>
      </div>
    </div>
  );
};

export default Home;
