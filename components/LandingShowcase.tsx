import React, { useState } from 'react';
import { ViewMode, ProfessionalProfile, CalendarEvent, BookingRequest } from '../types';
import { 
  Users, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  QrCode, 
  Heart, 
  Home, 
  CheckSquare, 
  AlertCircle,
  Sun,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';
import { FAMILY_MEMBERS, SWISS_DEADLINES, WASTE_COLLECTION_SCHEDULE, SWISS_WEEKEND_FORECASTS, PIETRO_PIROLA_PROFILE } from '../mockData';
import { BookingWidget } from './BookingWidget';

interface LandingShowcaseProps {
  onViewChange: (mode: ViewMode) => void;
  blockedSlots: { date: string; time: string }[];
  onBookingCreated: (booking: BookingRequest) => void;
}

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({
  onViewChange,
  blockedSlots,
  onBookingCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'family' | 'civic' | 'booking'>('family');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const familyEvents = [
    {
      id: 'f-1',
      time: '07:00 - 08:00',
      title: 'Corsa sul Lungolago di Lugano',
      member: 'Marco',
      category: 'Salute & Sport',
      tagBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      day: 'Lunedì 19 Ott',
    },
    {
      id: 'f-2',
      time: '08:15 - 08:40',
      title: 'Accompagnare Leo alle Scuole Elementari',
      member: 'Leo',
      category: 'Famiglia & Scuola',
      tagBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      day: 'Lunedì 19 Ott',
    },
    {
      id: 'f-3',
      time: '17:30 - 19:00',
      title: 'Allenamento Calcio Sofia (FC Lugano Cornaredo)',
      member: 'Sofia',
      category: 'Sport Bambini',
      tagBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      day: 'Lunedì 19 Ott',
    },
    {
      id: 'f-4',
      time: '11:30 - 12:30',
      title: 'Visita Dentistica di Controllo Dr. Fontana',
      member: 'Marco',
      category: 'Salute & Benessere',
      tagBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      day: 'Martedì 20 Ott',
    },
    {
      id: 'f-5',
      time: '16:30 - 17:30',
      title: 'Lezione Chitarra Sofia al Conservatorio Lugano',
      member: 'Sofia',
      category: 'Musica & Passioni',
      tagBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      day: 'Martedì 20 Ott',
    },
    {
      id: 'f-6',
      time: '19:30 - 22:00',
      title: 'Cena in Famiglia con Elena al Grotto Morchino',
      member: 'Elena',
      category: 'Tempo Libero',
      tagBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      day: 'Martedì 20 Ott',
    },
    {
      id: 'f-7',
      time: '15:00 - 16:00',
      title: 'Visita Pediatrica di Crescita Leo (Dr.ssa Riva)',
      member: 'Leo',
      category: 'Salute Bambini',
      tagBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      day: 'Mercoledì 21 Ott',
    },
    {
      id: 'f-8',
      time: '11:30 - 16:00',
      title: 'Gita in Funicolare sul Monte Brè & Pranzo in Vetta',
      member: 'Tutti',
      category: 'Weekend Famiglia',
      tagBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      day: 'Sabato 24 Ott',
    },
  ];

  const filteredEvents = selectedMember === 'all' 
    ? familyEvents 
    : familyEvents.filter(e => e.member === selectedMember || e.member === 'Tutti');

  return (
    <section className="py-16 md:py-24 border-b border-neutral-900 bg-neutral-950/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/90 text-xs font-mono text-neutral-300 mb-3">
            <Sparkles size={12} className="text-white" />
            <span>UN UNICO SPAZIO PER LA TUA VITA IN SVIZZERA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Esplora come funziona calendario.ch
          </h2>
          <p className="text-sm text-neutral-400 mt-2">
            La tua routine privata al centro, i dati protetti a Zurigo e tutte le specificità della vita elvetica già pronte all'uso.
          </p>
        </div>

        {/* Master Feature Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setActiveTab('family')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'family'
                  ? 'bg-white text-black shadow-lg font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Users size={15} />
              <span>1. Vita Personale & Famiglia</span>
            </button>

            <button
              onClick={() => setActiveTab('civic')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'civic'
                  ? 'bg-white text-black shadow-lg font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Home size={15} />
              <span>2. Almanacco & Scadenze Svizzera</span>
            </button>

            <button
              onClick={() => setActiveTab('booking')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'booking'
                  ? 'bg-white text-black shadow-lg font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Lock size={14} className={activeTab === 'booking' ? 'text-black' : 'text-amber-400'} />
              <span>3. Modulo Professionale (Opzionale)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Vita Personale & Famiglia */}
        {activeTab === 'family' && (
          <div className="rounded-3xl border border-neutral-800 bg-[#0a0a0a] p-6 sm:p-8 animate-in fade-in duration-300 shadow-2xl">
            {/* Top Toolbar in Preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Calendario Famiglia Bernasconi
                  </h3>
                  <span className="px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900 text-[10px] font-mono text-neutral-400">
                    Lugano / Bioggio · Conforme nLPD
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Ogni membro ha i propri colori e orari. Nessun tracciamento pubblicitario, sincronizzazione con Apple Calendar su iPhone.
                </p>
              </div>

              {/* Family Member Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
                <button
                  onClick={() => setSelectedMember('all')}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    selectedMember === 'all'
                      ? 'bg-white text-black font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Tutti (4)
                </button>
                {FAMILY_MEMBERS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m.name)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                      selectedMember === m.name
                        ? 'bg-neutral-800 text-white font-semibold border border-neutral-700'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: m.color }}
                    ></span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${evt.tagBg}`}>
                        {evt.category}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {evt.day}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-white group-hover:text-neutral-200 transition-colors leading-snug">
                      {evt.title}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-300">
                      <Clock size={12} className="text-neutral-500" />
                      {evt.time}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium">
                      {evt.member}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Footer inside showcase */}
            <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Crittografia E2EE Svizzera
                </span>
                <span className="hidden sm:inline text-neutral-700">·</span>
                <span className="hidden sm:inline">Nessuna condivisione con terze parti o reti pubblicitarie</span>
              </div>

              <button
                onClick={() => onViewChange('calendar')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Entra nella tua Agenda Completa</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Almanacco & Scadenze Svizzera */}
        {activeTab === 'civic' && (
          <div className="rounded-3xl border border-neutral-800 bg-[#0a0a0a] p-6 sm:p-8 animate-in fade-in duration-300 shadow-2xl">
            <div className="max-w-2xl mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                  VITA ELVETICA SENZA DIMENTICANZE
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight mt-1">
                Scadenze Ufficiali, Cantoni e Raccolta Rifiuti Locale
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                calendario.ch integra automaticamente le scadenze che ogni residente svizzero deve affrontare, oltre alle vacanze scolastiche del proprio cantone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
              {/* Box 1: Civic Deadlines */}
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-3 uppercase tracking-wider">
                    <AlertCircle size={14} className="text-amber-400" />
                    <span>Scadenze Federali & Fiscali</span>
                  </div>
                  <div className="space-y-3">
                    {SWISS_DEADLINES.slice(0, 3).map((dl) => (
                      <div key={dl.id} className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                          <span className="text-white font-medium">{dl.date}</span>
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300">{dl.canton}</span>
                        </div>
                        <div className="text-xs font-semibold text-white">{dl.title}</div>
                        <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{dl.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Cantonal School Holidays */}
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-3 uppercase tracking-wider">
                    <CalendarIcon size={14} className="text-cyan-400" />
                    <span>Vacanze Scolastiche (Canton Ticino)</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
                      <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1">24 OTT – 01 NOV 2026</div>
                      <div className="text-xs font-semibold text-white">Vacanze d’Autunno DECS</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Scuole dell’obbligo e licei cantonali chiusi</div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60">
                      <div className="text-[11px] font-mono text-neutral-400 mb-1">24 DIC – 06 GEN 2027</div>
                      <div className="text-xs font-semibold text-white">Vacanze di Natale & Capodanno</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Pausa festiva invernale</div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-800 bg-neutral-900/60">
                      <div className="text-[11px] font-mono text-neutral-400 mb-1">06 FEB – 14 FEB 2027</div>
                      <div className="text-xs font-semibold text-white">Settimana di Carnevale (Rabadan)</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Carnevali storici di Bellinzona e Chiasso</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 3: Local Waste & Meteo */}
              <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-3 uppercase tracking-wider">
                    <Package size={14} className="text-emerald-400" />
                    <span>Rifiuti Comunali & Meteo Weekend</span>
                  </div>
                  <div className="space-y-2.5">
                    {WASTE_COLLECTION_SCHEDULE.slice(0, 2).map((w) => (
                      <div key={w.id} className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">{w.title}</div>
                          <div className="text-[11px] text-neutral-400">{w.dayOfWeek}</div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {w.badge.split('·')[0]}
                        </span>
                      </div>
                    ))}

                    <div className="mt-3 pt-3 border-t border-neutral-800">
                      <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 mb-1.5">
                        <Sun size={12} className="text-amber-400" />
                        <span>MeteoSvizzera Previsioni Sabato</span>
                      </div>
                      <div className="text-xs text-white font-medium">Lugano & Ceresio: 19°C Soleggiato</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Ideale per gita in vetta al Monte Brè</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => onViewChange('calendar')}
                className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all flex items-center gap-2"
              >
                <span>Apri l'Almanacco nel Calendario</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Modulo Professionale (Opzionale) */}
        {activeTab === 'booking' && (
          <div className="rounded-3xl border border-neutral-800 bg-[#0a0a0a] p-6 sm:p-8 animate-in fade-in duration-300 shadow-2xl">
            {/* Banner explaining the architecture */}
            <div className="mb-8 p-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0 font-bold">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Hai un’attività, uno studio o ricevi clienti? Attiva il Modulo Booking
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Tutto ciò che aggiungi nella tua vita privata e in famiglia (es. partita di tennis, scuola bambini) <strong className="text-white">oscura automaticamente lo slot</strong> sul tuo link di prenotazione. I clienti vedono solo "Occupato".
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <QrCode size={13} /> Incassi TWINT in CHF
                </span>
              </div>
            </div>

            {/* Embedded Live Widget */}
            <BookingWidget
              profile={PIETRO_PIROLA_PROFILE}
              blockedSlots={blockedSlots}
              onBookingCreated={onBookingCreated}
            />
          </div>
        )}

      </div>
    </section>
  );
};
