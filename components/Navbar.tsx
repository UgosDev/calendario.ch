import React, { useEffect, useRef, useState } from 'react';
import { ViewMode, UssoUser, VaultSyncStatus } from '../types';
import { getDisplayName, getInitials } from '../services/ussoAuth';
import { TEMA } from '../config';
import { toggleTaccuinoBubble } from '../services/taccuinoBridge';
import { Search, Plus, ChevronDown, X, Snowflake, List, Code2, User, StickyNote } from 'lucide-react';

interface Props {
  currentView: ViewMode;
  onSelectView: (v: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNewEvent: () => void;
  onOpenAccountModal: () => void;
  user: UssoUser | null;
  syncStatus: VaultSyncStatus;
  snowEnabled: boolean;
  onToggleSnow: () => void;
}

/**
 * Intestazione della proposta B: logo, viste a pillola, Nuovo.
 * Agenda e Incorpora stanno nel menu "Altro"; ricerca e account sono icone tonde.
 */
export const Navbar: React.FC<Props> = ({
  currentView,
  onSelectView,
  searchQuery,
  onSearchChange,
  onOpenNewEvent,
  onOpenAccountModal,
  user,
  syncStatus,
  snowEnabled,
  onToggleSnow
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // "/" apre la ricerca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // chiude il menu "Altro" cliccando fuori
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [moreOpen]);

  const main: { mode: ViewMode; label: string }[] = [
    { mode: 'month', label: 'Mese' },
    { mode: 'week', label: 'Settimana' },
    { mode: 'day', label: 'Giorno' },
    { mode: 'slots', label: 'Slot condivisi' }
  ];
  const extra: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'agenda', label: 'Agenda', icon: <List size={16} /> },
    { mode: 'embed', label: 'Incorpora su altri siti', icon: <Code2 size={16} /> }
  ];
  const extraActive = extra.some((x) => x.mode === currentView);

  const dot =
    syncStatus.state === 'synced' ? '#2f8a57' : syncStatus.state === 'syncing' ? '#c98a12' : '#a19e95';
  const dotLabel =
    syncStatus.state === 'synced' ? 'archivio sincronizzato' : syncStatus.state === 'syncing' ? 'sincronizzazione in corso' : 'archivio non sincronizzato';

  return (
    <header className="b-top">
      <a
        href="#"
        className="b-logo"
        aria-label="calendario.ch, torna alla settimana"
        onClick={(e) => {
          e.preventDefault();
          onSelectView('week');
        }}
      >
        <span>calendario<span className="tld">.ch</span></span>
        {TEMA === 'natale' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--gold)' }} strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4l-5.6 4.1 2.1-6.7L3 9.8h6.8z" />
          </svg>
        )}
      </a>

      <nav className="b-views" aria-label="Viste">
        {main.map((v) => (
          <button key={v.mode} type="button" onClick={() => onSelectView(v.mode)} aria-current={currentView === v.mode ? 'page' : undefined}>
            {v.label}
          </button>
        ))}
        <div className="b-more" ref={moreRef}>
          <button type="button" className={extraActive ? 'on' : ''} aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
            Altro <ChevronDown size={14} />
          </button>
          {moreOpen && (
            <div className="b-menu" role="menu">
              {extra.map((x) => (
                <button
                  key={x.mode}
                  type="button"
                  role="menuitem"
                  aria-current={currentView === x.mode ? 'page' : undefined}
                  onClick={() => {
                    setMoreOpen(false);
                    onSelectView(x.mode);
                  }}
                >
                  {x.icon}
                  {x.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {searchOpen || searchQuery ? (
        <div className="b-search" role="search">
          <Search size={16} aria-hidden="true" />
          <label className="sr" htmlFor="global-search">Cerca impegni e prenotazioni</label>
          <input
            id="global-search"
            ref={searchInputRef}
            type="search"
            placeholder="Cerca"
            autoComplete="off"
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
          />
          <button
            type="button"
            aria-label="Chiudi la ricerca"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onSearchChange('');
              setSearchOpen(false);
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button type="button" className="b-round" aria-label="Cerca" title="Cerca (/)" onClick={() => setSearchOpen(true)}>
          <Search size={17} />
        </button>
      )}

      {/* Tasto Rapido Post-It Bolla Fluttuante taccuino.ch */}
      <button
        type="button"
        className="b-round"
        onClick={() => toggleTaccuinoBubble()}
        aria-label="Bolla fluttuante taccuino.ch"
        title="Post-it fluttuante (taccuino.ch)"
      >
        <StickyNote size={17} />
      </button>

      {TEMA === 'natale' && (
        <button type="button" className="b-round" onClick={onToggleSnow} aria-label={snowEnabled ? 'Disattiva la neve' : 'Attiva la neve'} style={{ color: snowEnabled ? 'var(--gold)' : 'var(--off)' }}>
          <Snowflake size={17} />
        </button>
      )}

      <button
        type="button"
        className="b-round b-avatar"
        onClick={onOpenAccountModal}
        aria-label={`Account USSO: ${getDisplayName(user)}, ${dotLabel}`}
        title={`${getDisplayName(user)} · ${dotLabel}`}
      >
        {/^[A-Za-zÀ-ÿ]/.test(getInitials(user)) ? getInitials(user) : <User size={17} />}
        <span className="b-dot" style={{ background: dot }} aria-hidden="true" />
      </button>

      <button type="button" onClick={onOpenNewEvent} className="b-new">
        <Plus size={16} /> Nuovo
      </button>
    </header>
  );
};
