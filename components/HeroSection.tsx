import React from 'react';
import { ViewMode } from '../types';
import { ArrowRight, ShieldCheck, QrCode, Calendar as CalendarIcon, CheckCircle2, Zap, Lock, Home, Briefcase } from 'lucide-react';

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
            🇨🇭 CALENDARIO.CH · L'AGENDA DIGITALE SOVRANA DELLA SVIZZERA · CONFORME nLPD
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
          Il calendario della tua vita. <br />
          <span className="text-neutral-500 font-light">Protetto in Svizzera.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 mb-10 leading-relaxed font-normal">
          L'alternativa elvetica e sicura a Google e Apple Calendar. Pensata per la tua routine quotidiana, 
          la famiglia e la gestione di casa: scuola dei figli, scadenze civiche (Cassa Malati LAMal, Serafe, imposte), 
          rifiuti comunali e festività cantonali. <span className="text-white font-medium">Senza pubblicità, crittografata a Zurigo.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16">
          <button
            onClick={() => onViewChange('calendar')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-sm transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 active:scale-95"
          >
            <CalendarIcon size={16} />
            <span>Apri la tua Agenda Personale</span>
          </button>

          <button
            onClick={() => onViewChange('calendar')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Home size={15} className="text-neutral-400" />
            <span>Famiglia & Almanacco Svizzero</span>
          </button>

          <button
            onClick={() => onViewChange('booking')}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-neutral-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
          >
            <Briefcase size={13} />
            <span>Hai un'attività? Modulo Pro →</span>
          </button>
        </div>

        {/* Key Metrics / Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Lock size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">nLPD / DSG</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">Zero Pubblicità</div>
            <div className="text-xs text-neutral-500 mt-0.5">I tuoi impegni non sono profilati</div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Home size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">FAMIGLIA</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">Condivisione Casa</div>
            <div className="text-xs text-neutral-500 mt-0.5">Scuola, sport, pediatra e partner</div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <CalendarIcon size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">SVIZZERA</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">Almanacco Civico</div>
            <div className="text-xs text-neutral-500 mt-0.5">LAMal, Serafe, cantoni e rifiuti</div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-950/60 backdrop-blur-md text-left">
            <div className="flex items-center gap-2 text-neutral-400 mb-1">
              <Zap size={15} className="text-white" />
              <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">WEBCAL</span>
            </div>
            <div className="text-lg font-bold text-white tracking-tight">Sync iPhone & Mac</div>
            <div className="text-xs text-neutral-500 mt-0.5">Nativo con Apple e Outlook</div>
          </div>
        </div>
      </div>
    </section>
  );
};
