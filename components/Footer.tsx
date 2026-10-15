import React from 'react';
import { Calendar, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-900 bg-black text-neutral-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
              <Calendar size={13} />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              calendario<span className="text-neutral-500 font-normal">.ch</span>
            </span>
            <span className="px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-950 text-[10px] font-mono text-neutral-400">
              Swiss Made 🇨🇭
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            <a href="https://pagine.ch" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              pagine.ch
            </a>
            <a href="https://domande.ch" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              domande.ch
            </a>
            <a href="https://usso.ch" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              USSO.ch
            </a>
            <a href="https://lameteo.ch" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              LaMeteo.ch
            </a>
            <a href="https://two-dots.pro" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              two-dots.pro
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
          <div>
            Parte della rete <strong className="text-neutral-300">UnHub.ch</strong> · Server crittografati a Zurigo e Berna.
          </div>
          <div className="flex items-center gap-1">
            <span>Conforme nLPD 2026</span>
            <span>·</span>
            <span>TWINT® compatibile</span>
            <span>·</span>
            <span>© 2026 calendario.ch</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
