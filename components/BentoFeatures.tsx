import React from 'react';
import { QrCode, Lock, Calendar, Layers, Smartphone, Sparkles, Check, ArrowRight } from 'lucide-react';

export const BentoFeatures: React.FC = () => {
  return (
    <section className="py-20 md:py-28 border-b border-neutral-900 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-14">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            PROGETTATO PER IL MERCATO ELVETICO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-2">
            Perché i professionisti svizzeri <br />
            scelgono <span className="text-neutral-500 font-light">calendario.ch</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Large TWINT Feature */}
          <div className="md:col-span-2 p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between relative overflow-hidden group hover:border-neutral-700 transition-colors">
            <div className="max-w-md z-10">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold mb-5 shadow-md">
                <QrCode size={20} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                ESCLUSIVA ELVETICA
              </span>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-1 mb-3">
                Pagamenti TWINT e CHF nativi all'atto della prenotazione.
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Nessun tool straniero (Calendly, Doodle) gestisce TWINT in modo nativo. Con calendario.ch puoi richiedere una caparra confirmatoria o saldare l'intera consulenza in franchi svizzeri prima dell'incontro.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-900 flex flex-wrap gap-4 text-xs font-mono text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Check size={14} className="text-white" /> Zero commissioni occulte
              </span>
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Check size={14} className="text-white" /> Accredito diretto conto bancario
              </span>
            </div>
          </div>

          {/* Card 2: LPD Privacy Bunker */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Lock size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                CONFORMITÀ nLPD
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Server a Zurigo. Nessun tracking.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                I dati dei tuoi clienti, i numeri telefonici e le note riservate non escono mai dal territorio elvetico. Conforme al segreto professionale per avvocati, fiduciari e medici.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              🇨🇭 Legge federale sulla protezione dei dati
            </div>
          </div>

          {/* Card 3: Multi-Calendar Sync */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Calendar size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                DUE VIE
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Sincronizzazione Outlook & Google.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Quando aggiungi un impegno personale sul tuo smartphone o in ufficio su Microsoft 365, quello slot sparisce istantaneamente da calendario.ch.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Zero conflitti di overbooking
            </div>
          </div>

          {/* Card 4: pagine.ch Embed */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Layers size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                RETE UNHUB
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Blocco nativo per pagine.ch.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Incolla il tuo handle nel builder di pagine.ch e il widget si integra armoniosamente nel tema grafico del tuo sito senza richiedere codice.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Integrazione con USSO.ch Single Sign-On
            </div>
          </div>

          {/* Card 5: SMS Notifications */}
          <div className="p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col justify-between hover:border-neutral-700 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center font-bold mb-5">
                <Smartphone size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                NO-SHOW = ZERO
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1 mb-3">
                Promemoria SMS ed Email svizzeri.
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Invio di notifiche 24 ore e 1 ora prima dell'incontro con link per disdetta o riprogrammazione immediata.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900 text-[11px] font-mono text-neutral-500">
              Prefisso internazionale +41 integrato
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
