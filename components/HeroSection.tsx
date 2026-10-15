import React from 'react';
import { ViewMode } from '../types';
import { ArrowRight, ShieldCheck, QrCode, Calendar as CalendarIcon, CheckCircle2, Zap, Lock } from 'lucide-react';

interface HeroSectionProps {
  onViewChange: (mode: ViewMode) => void;
  onOpenEmbedModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onViewChange,
  onOpenEmbedModal,
}) => {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-neutral-900 bg-grid-dots">
      {/* Glow highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Monospace Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-950/80 backdrop-blur-md mb-8 animate-in fade-in duration-500">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span className="font-mono text-xs text-neutral-300 tracking-wider uppercase">
            CALENDARIO.CH · RETE UNHUB SVIZZERA · TWINT NATIVO
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
          Lo scheduling svizzero <br />
          <span className="text-neutral-500 font-light">di massima precisione.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 mb-10 leading-relaxed font-normal">
          Basta catene infinite di email. Sincronizzazione in tempo reale con Outlook e Google, 
          custodia sicura dei dati a Zurigo secondo la nuova LPD elvetica e incassi istantanei 
          di consulenze e caparre tramite <span className="text-white font-medium">TWINT in CHF</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16">
          <button
            onClick={() => onViewChange('calendar')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-sm transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 active:scale-95"
          >
            <Lock size={15} />
            <span>Apri Agenda Privata</span>
          </button>

          <button
            onClick={() => onViewChange('booking')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Vetrina Pubblica (Pietro Pirola)</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => onViewChange('dashboard')}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-neutral-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Dashboard</span>
          </button>

          <button
            onClick={onOpenEmbedModal}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-neutral-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
          >
            <span>&lt;/&gt; Embed pagine.ch</span>
          </button>
        </div>

        {/* Key Metrics / Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <QrCode size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">TWINT</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">Incassi CHF</div>
            <div className="text-xs text-neutral-500 mt-0.5">Caparre e tariffe orarie</div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Lock size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">LPD 2026</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">100% Svizzero</div>
            <div className="text-xs text-neutral-500 mt-0.5">Zero profilazione estera</div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <CalendarIcon size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">Sync 365</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">Zero Conflitti</div>
            <div className="text-xs text-neutral-500 mt-0.5">Outlook, Apple, Google</div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Zap size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">UnHub</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">1-Click Embed</div>
            <div className="text-xs text-neutral-500 mt-0.5">Nativo per pagine.ch</div>
          </div>
        </div>
      </div>
    </section>
  );
};
