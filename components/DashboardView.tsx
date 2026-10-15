import React, { useState } from 'react';
import { ProfessionalProfile, BookingRequest, BookingService } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Building, 
  Video, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { downloadIcsFile } from '../icsGenerator';

interface DashboardViewProps {
  profile: ProfessionalProfile;
  bookings: BookingRequest[];
  onOpenBooking: () => void;
  onOpenEmbedModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  bookings,
  onOpenBooking,
  onOpenEmbedModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'availability' | 'integrations'>('bookings');

  const personalUrl = `https://calendario.ch/${profile.handle}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(personalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="p-6 sm:p-8 rounded-3xl border border-neutral-800 bg-[#0a0a0a] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img 
            src={profile.avatarUrl} 
            alt={profile.name} 
            className="w-16 h-16 rounded-2xl object-cover border border-neutral-700 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Pannello di Controllo · {profile.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-300">
                PRO ELVETICO
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {profile.role} · <strong className="text-white">{profile.company}</strong> (Bioggio Lugano)
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-xs text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 truncate max-w-xs">
                {personalUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                title="Copia link personale"
              >
                {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span className="hidden sm:inline">{copiedLink ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenBooking}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <span>Vedi Pagina Pubblica</span>
            <ArrowUpRight size={13} />
          </button>

          <button
            onClick={onOpenEmbedModal}
            className="px-4 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <span>Widget pagine.ch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>APPUNTAMENTI</span>
            <CalendarIcon size={14} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-white">14</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>+3 questo mese</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>PRESENZA CLIENTI</span>
            <CheckCircle2 size={14} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-white">98.5%</div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Zero no-show grazie a SMS +41
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>INCASSI TWINT</span>
            <QrCode size={14} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-white">CHF 360.00</div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Consulenze corporate LPP
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
            <span>TEMPO RISPARMIATO</span>
            <Clock size={14} className="text-white" />
          </div>
          <div className="text-2xl font-bold text-white">~ 7.5 ore</div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Zero scambi di email inutili
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-neutral-800 flex items-center gap-1">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'bookings'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <CalendarIcon size={14} />
          <span>Appuntamenti Ricevuti</span>
          <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-mono flex items-center justify-center">
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Sliders size={14} />
          <span>Servizi & Tariffe CHF</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'availability'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Clock size={14} />
          <span>Orari & Sede Bioggio</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'integrations'
              ? 'border-white text-white'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck size={14} />
          <span>Sync Calendari & LPD</span>
        </button>
      </div>

      {/* Tab 1: Bookings List */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Elenco prenotazioni sincronizzate</span>
            <span className="font-mono text-[11px]">Sede MT Financial Consulting Sagl</span>
          </div>

          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-white">{b.clientName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Confermato
                    </span>
                    {b.isPaidWithTwint && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 border border-neutral-700 text-white font-bold flex items-center gap-1">
                        <QrCode size={10} />
                        TWINT: CHF {b.priceChf} ({b.twintRef})
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-300 font-medium">{b.serviceName}</div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 font-mono">
                    <span className="text-white flex items-center gap-1">
                      <CalendarIcon size={12} className="text-neutral-400" />
                      {b.date} alle {b.timeSlot} ({b.durationMinutes} min)
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {b.clientPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {b.clientEmail}
                    </span>
                  </div>

                  {b.clientNotes && (
                    <div className="text-xs text-neutral-400 italic bg-neutral-950 p-2.5 rounded-xl border border-neutral-900 mt-2">
                      "{b.clientNotes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => downloadIcsFile(b)}
                    className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
                    title="Scarica file evento .ics"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Esporta .ics</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Services */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.services.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-white">{s.title}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-white font-bold">
                    {s.priceChf === 0 ? 'Gratuito' : `CHF ${s.priceChf}`}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{s.description}</p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500 flex justify-between border-t border-neutral-900">
                  <span>Durata: {s.durationMinutes} min</span>
                  <span>{s.isTwintAccepted ? 'TWINT abilitato' : 'Gratuito'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Availability */}
      {activeTab === 'availability' && (
        <div className="p-6 rounded-3xl border border-neutral-800 bg-[#0a0a0a] space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-white">Orari di Ricevimento Studio Bioggio</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900">
              <span className="text-white font-sans font-medium">Lunedì – Venerdì</span>
              <span className="text-neutral-300">09:00 – 12:00 / 14:00 – 17:30</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-900">
              <span className="text-white font-sans font-medium">Sabato – Domenica</span>
              <span className="text-neutral-500">Chiuso (o su richiesta speciale)</span>
            </div>
          </div>
          <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-900">
            📍 Sede operativa: <strong className="text-white">Via Lugano 1A, 6934 Bioggio (TI)</strong>
          </div>
        </div>
      )}

      {/* Tab 4: Calendar Sync */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">Microsoft 365 / Outlook</div>
              <div className="text-xs text-neutral-400 mt-0.5">Sincronizzazione a due vie attiva</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              Connesso
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">Google Calendar</div>
              <div className="text-xs text-neutral-400 mt-0.5">Sincronizzazione eventi attiva</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              Connesso
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">TWINT Gateway Svizzera</div>
              <div className="text-xs text-neutral-400 mt-0.5">Terminale esercente MT Financial Sagl</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
              Attivo CHF
            </span>
          </div>

          <div className="p-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-white">Custodia Dati nLPD</div>
              <div className="text-xs text-neutral-400 mt-0.5">Data Center certificato a Zurigo (CH)</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-white text-black text-xs font-mono font-bold">
              100% Svizzero
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
