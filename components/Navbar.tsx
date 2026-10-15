import React from 'react';
import { ViewMode } from '../types';
import { Calendar, LayoutDashboard, Share2, ShieldCheck, ArrowRight, ExternalLink, Lock } from 'lucide-react';

interface NavbarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onOpenEmbedModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewChange,
  onOpenEmbedModal,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-900/80 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onViewChange('landing')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-105">
              <Calendar size={18} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">
                calendario<span className="text-neutral-500 font-normal">.ch</span>
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-neutral-400 -mt-0.5">
                L’Agenda della Svizzera
              </span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-800 bg-neutral-950 text-[11px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Server Svizzera (Zurigo) · nLPD</span>
          </div>
        </div>

        {/* View Switchers & Navigation */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onViewChange('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-900/60 border border-neutral-800'
            }`}
          >
            <Calendar size={13} className={viewMode === 'calendar' ? 'text-black' : 'text-white'} />
            <span>Mia Agenda</span>
          </button>

          <button
            onClick={() => onViewChange('booking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'booking'
                ? 'bg-neutral-900 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <span className="hidden sm:inline text-neutral-500 font-mono text-[10px]">PRO</span>
            <span>Vetrina Booking</span>
          </button>

          <button
            onClick={() => onViewChange('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'dashboard'
                ? 'bg-neutral-900 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
            }`}
          >
            <LayoutDashboard size={13} />
            <span className="hidden sm:inline">Dashboard Pro</span>
          </button>

          <button
            onClick={onOpenEmbedModal}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/60 border border-neutral-900 hover:border-neutral-800 transition-all"
            title="Genera codice embed per pagine.ch"
          >
            <Share2 size={13} />
            <span>Embed pagine.ch</span>
          </button>

          <a
            href="https://pagine.ch"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-1 active:scale-95"
          >
            <span>Torna a pagine.ch</span>
            <ArrowRight size={12} />
          </a>
        </nav>
      </div>
    </header>
  );
};
