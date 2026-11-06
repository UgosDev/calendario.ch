import React, { useEffect, useRef } from 'react';
import { ViewMode, UssoUser, VaultSyncStatus } from '../types';
import { getDisplayName, getInitials } from '../services/ussoAuth';
import { Sparkles, Search, Plus, ShieldCheck, Database, Snowflake } from 'lucide-react';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const views: { mode: ViewMode; label: string }[] = [
    { mode: 'month', label: 'Mese' },
    { mode: 'week', label: 'Settimana' },
    { mode: 'day', label: 'Giorno' },
    { mode: 'agenda', label: 'Agenda' },
    { mode: 'slots', label: 'Slot condivisi' },
    { mode: 'embed', label: 'Incorpora' }
  ];

  return (
    <header className="top">
      {/* Logo Sovrano */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectView('week');
        }}
        className="logo"
        aria-label="calendario.ch, torna al calendario"
      >
        <span>calendario.ch</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#b08a3e"
          strokeWidth="1.6"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4l-5.6 4.1 2.1-6.7L3 9.8h6.8z" />
        </svg>
      </a>

      {/* Tabs Viste */}
      <nav className="views" aria-label="Viste Principali">
        {views.map((v) => (
          <button
            key={v.mode}
            onClick={() => onSelectView(v.mode)}
            aria-current={currentView === v.mode ? 'page' : undefined}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {/* Ricerca Rapida con shortcut / */}
      <div className="search" role="search">
        <Search size={16} />
        <label className="sr" htmlFor="global-search">
          Cerca impegni e prenotazioni
        </label>
        <input
          id="global-search"
          ref={searchInputRef}
          type="search"
          placeholder="Cerca (/)"
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Tasto Neve Stagionale */}
      <button
        type="button"
        onClick={onToggleSnow}
        className={`icon-btn ${snowEnabled ? 'text-[#b08a3e] border-[#b08a3e]' : 'text-[#868b82]'}`}
        title={snowEnabled ? 'Disattiva animazione neve' : 'Attiva animazione neve'}
        aria-label="Attiva/Disattiva Neve"
      >
        <Snowflake size={17} />
      </button>

      {/* Badge Caveau Archivio.ch */}
      <button
        type="button"
        onClick={onOpenAccountModal}
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#163a2a] bg-[#f4efe4] text-xs font-semibold text-[#163a2a] hover:bg-[#e9e2d3]"
        title="Stato sincronizzazione Caveau Archivio.ch (Ginevra dc4-a)"
      >
        <Database size={13} className="text-[#163a2a]" />
        <span>Vault dc4-a</span>
        <span
          className={`w-2 h-2 rounded-full ${
            syncStatus.state === 'synced'
              ? 'bg-emerald-600'
              : syncStatus.state === 'syncing'
              ? 'bg-amber-500 animate-pulse'
              : 'bg-neutral-400'
          }`}
        />
      </button>

      {/* Pill Account USSO */}
      <button
        type="button"
        onClick={onOpenAccountModal}
        className="inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-[#163a2a] bg-[#fbf8f1] hover:bg-[#f4efe4] text-xs font-bold text-[#163a2a]"
        aria-label="Gestisci profilo USSO e impostazioni"
      >
        <span className="w-6 h-6 rounded-full bg-[#163a2a] text-white flex items-center justify-center text-[10px]">
          {getInitials(user)}
        </span>
        <span className="max-w-[110px] truncate">{getDisplayName(user)}</span>
        <ShieldCheck size={14} className="text-[#b08a3e]" />
      </button>

      {/* Bottone Nuovo */}
      <button
        type="button"
        onClick={onOpenNewEvent}
        className="btn dark btn-new"
      >
        <Plus size={16} /> Nuovo
      </button>
    </header>
  );
};
