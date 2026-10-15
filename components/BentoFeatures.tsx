import React from 'react';
import { QrCode, Lock, Calendar, Layers, Smartphone, Sparkles, Check, ArrowRight } from 'lucide-react';

export const BentoFeatures: React.FC = () => {
  return (
    <section className="py-20 md:py-28 border-b border-neutral-900 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            SOVRANITÀ DIGITALE & VITA QUOTIDIANA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
            L'agenda moderna per la Svizzera. <br />
            <span className="text-neutral-500 font-light">Senza compromessi sulla tua privacy.</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Large Privacy & Sovereignty Feature */}
          <div className="md:col-span-2 p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between relative overflow-hidden group hover:border-neutral-700 transition-colors">
            <div className="max-w-lg z-10">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold mb-5 shadow-md">
                <Lock size={20} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                SOVRANITÀ DEI DATI · nLPD / DSG SVIZZERA
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-1 mb-3">
                I tuoi impegni privati non sono merce per gli algoritmi pubblicitari.
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Google Calendar e i servizi big tech analizzano gli inviti, le visite mediche, i viaggi e le routine della tua famiglia per alimentare profili pubblicitari mirati. Con calendario.ch i dati risiedono fisicamente a Zurigo, sono crittografati e non vengono mai monetizzati o ceduti a terzi.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-900 flex flex-wrap gap-4 text-xs font-mono text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Check size={14} className="text-white" /> Server fisici a Zurigo (Svizzera)
              </span>
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Check size={14} className="text-white" /> Zero cookie di tracciamento pubblicitario
              </span>
            </div>
          </div>

          {/* Card 2: Family & Daily Life */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Calendar size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                CASA & FAMIGLIA
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Un'unica vista per la famiglia.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Coordina gli orari scolastici dei bambini, le lezioni sportive, il pediatra, la spesa settimanale e gli impegni del partner con colori dedicati per ciascun membro.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Profili: Io, Partner, Figli e Casa
            </div>
          </div>

          {/* Card 3: Civic Almanac */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Layers size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                ALMANACCO ELVETICO
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Scadenze svizzere integrate.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Disdetta Cassa Malati LAMal (UFSP) entro il 30 novembre, canone Serafe (CHF 335.-), cambio pneumatici invernali, imposte e vacanze scolastiche cantonali già precaricate.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Copertura 26 Cantoni svizzeri
            </div>
          </div>

          {/* Card 4: Webcal & Apple Sync */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Smartphone size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                INTEGRAZIONE DISPOSITIVI
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Sincronizza iPhone, Mac & Android.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sottoscrivi il feed Webcal RFC 5545 con un tocco: i tuoi eventi personali appaiono direttamente nell'app Calendario di iOS o macOS senza configurazioni complicate.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Compatibile CalDAV, iCal e Outlook
            </div>
          </div>

          {/* Card 5: Optional Pro & TWINT */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <QrCode size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                MODULO PRO OPZIONALE
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Ricevi clienti? Incassi con TWINT.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Per freelance, consulenti, medici e studi: genera un link di prenotazione pubblico che oscura i tuoi impegni privati (mostrati solo come "Occupato") e incassa in franchi svizzeri.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Integrazione nativa con pagine.ch
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
