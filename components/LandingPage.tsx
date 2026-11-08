import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  Share2,
  CheckCircle2,
  ArrowRight,
  Globe2,
  ExternalLink,
  FileText,
  Sparkles,
  Check,
  ChevronRight,
  CalendarDays,
  QrCode,
  Smartphone,
  Layers,
  Building2,
  UserCheck
} from 'lucide-react';
import { UssoBadgeIcon, UssoLogo, UssoSecurityBadge } from './UssoLogo';
import { UssoAuthButton } from './UssoAuthButton';
import { TEMA } from '../config';

interface LandingPageProps {
  onLogin: () => void;
  onPreviewBooking: () => void;
  onOpenLegal: (tab: 'privacy' | 'impressum' | 'terms') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onPreviewBooking,
  onOpenLegal
}) => {
  // Stato interattivo per la card anteprima hero
  const [selectedDay, setSelectedDay] = useState<'oggi' | 'domani' | 'mercoledi'>('oggi');
  const [selectedSlot, setSelectedSlot] = useState<string | null>('14:30');

  const slotsMap = {
    oggi: ['09:30', '11:00', '14:30', '16:00'],
    domani: ['10:00', '11:30', '15:00', '17:30'],
    mercoledi: ['09:00', '10:30', '14:00', '15:30']
  };

  const dayLabels = {
    oggi: 'Oggi',
    domani: 'Domani',
    mercoledi: 'Mercoledì'
  };

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] flex flex-col font-sans selection:bg-[var(--accent-soft)] selection:text-[var(--accent)]">
      {/* ── 1. Navbar Pubblica della Landing ── */}
      <header className="sticky top-0 z-40 bg-[var(--page)]/90 backdrop-blur-md border-b border-[var(--edge)] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <a
          href="#"
          className="b-logo flex items-center gap-1 text-base font-bold tracking-tight text-[var(--ink)]"
          aria-label="calendario.ch, torna all'inizio"
        >
          <span>
            calendario<span className="text-[var(--muted)] font-medium">.ch</span>
          </span>
          {TEMA === 'natale' && (
            <span className="text-[var(--gold)] ml-1" aria-hidden="true">★</span>
          )}
        </a>

        {/* Link di navigazione interna */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--muted)]" aria-label="Navigazione principale">
          <a href="#funzionalita" className="hover:text-[var(--ink)] transition-colors">
            Funzionalità
          </a>
          <a href="#come-funziona" className="hover:text-[var(--ink)] transition-colors">
            Come funziona
          </a>
          <a href="#sicurezza" className="hover:text-[var(--ink)] transition-colors">
            Sovranità & nLPD
          </a>
          <button
            type="button"
            onClick={onPreviewBooking}
            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            Demo Prenotazione
          </button>
        </nav>

        {/* Azioni Rapide */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
          >
            <ShieldCheck size={14} className="text-[var(--accent)]" />
            <span>nLPD RS 235.1</span>
          </button>

          <UssoAuthButton
            action="login"
            size="sm"
            onClick={onLogin}
            className="shadow-xs"
          />
        </div>
      </header>

      {/* ── 2. Hero Section Principale ── */}
      <main className="flex-1 flex flex-col">
        <section className="relative px-4 sm:px-8 lg:px-12 pt-12 pb-16 lg:pt-20 lg:pb-24 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Colonna Sinistra: Copywriting & CTA */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              {/* Kicker Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--edge)] shadow-2xs self-start">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Calendario & Prenotazioni Sovrane Svizzere
                </span>
              </div>

              {/* Titolo Principale in stile Elvetico */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--ink)] leading-[1.08] text-balance">
                Il tuo tempo.
                <br />
                <span className="text-[var(--accent)]">Sotto il tuo controllo.</span>
              </h1>

              {/* Descrizione del servizio */}
              <p className="text-base sm:text-lg text-[var(--muted)] font-normal leading-relaxed max-w-2xl">
                <strong className="text-[var(--ink)] font-semibold">calendario.ch</strong> è l&apos;agenda personale e professionale indipendente. Gestisci i tuoi impegni senza profilazione pubblicitaria, condividi link per prenotare consulenze e sincronizza tutto in sicurezza sul Caveau svizzero di <strong className="text-[var(--ink)] font-semibold">archivio.ch</strong>.
              </p>

              {/* Blocco Azioni CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <UssoAuthButton
                  size="lg"
                  action="login"
                  label="Accedi con USSO.ch"
                  onClick={onLogin}
                  className="w-full sm:w-auto"
                />

                <button
                  type="button"
                  onClick={onPreviewBooking}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-[var(--edge)] bg-white hover:bg-[var(--paper)] text-[var(--ink)] font-bold text-sm shadow-xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  <span>Prova pagina prenotazione</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Nota di Garanzia USSO & nLPD */}
              <div className="pt-2 flex flex-col gap-2">
                <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                  <UssoBadgeIcon className="w-4 h-4 shrink-0" />
                  <span>
                    Accesso universale e biometrico con <strong>Passkey FIDO2</strong>. Nessuna password, zero tracker.
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[var(--muted)] font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Check size={14} className="text-[var(--accent)]" /> Hosting a Ginevra (dc4-a)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check size={14} className="text-[var(--accent)]" /> Conforme nLPD RS 235.1
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check size={14} className="text-[var(--accent)]" /> Standard iCal / WebCal
                  </span>
                </div>
              </div>
            </div>

            {/* Colonna Destra: Mockup Interattivo del Calendario Sovrano */}
            <div className="lg:col-span-5 w-full">
              <div className="relative bg-white rounded-3xl border border-[var(--edge)] shadow-lg p-5 sm:p-7 flex flex-col gap-5 overflow-hidden transition-shadow hover:shadow-xl">
                {/* Header della Card Interattiva */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[var(--ink)] m-0 leading-tight">
                        Consulenza Sovrana
                      </h2>
                      <p className="text-xs text-[var(--muted)] m-0">
                        30 minuti · Videochiamata protetta
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Slot Attivi
                  </span>
                </div>

                {/* Selettore Giorno (Simulazione) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Seleziona una data disponibile:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['oggi', 'domani', 'mercoledi'] as const).map((dayKey) => (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => {
                          setSelectedDay(dayKey);
                          setSelectedSlot(slotsMap[dayKey][0]);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          selectedDay === dayKey
                            ? 'bg-[var(--ink)] text-white border-[var(--ink)] shadow-xs'
                            : 'bg-[var(--paper)] text-[var(--muted)] border-transparent hover:border-[var(--edge)]'
                        }`}
                      >
                        {dayLabels[dayKey]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selettore Orari / Slot */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Orari liberi (Fuso Zurigo / Ginevra):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {slotsMap[selectedDay].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedSlot(time)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                          selectedSlot === time
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                            : 'bg-white text-[var(--ink)] border-[var(--edge)] hover:bg-[var(--paper)]'
                        }`}
                      >
                        <span>{time}</span>
                        {selectedSlot === time && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Box Riepilogo Interattivo */}
                <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--line)] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)]">Slot selezionato:</span>
                    <strong className="text-[var(--ink)] font-bold">
                      {dayLabels[selectedDay]} ore {selectedSlot}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1 border-t border-[var(--line)]">
                    <span className="flex items-center gap-1">
                      <Lock size={12} className="text-emerald-600" />
                      Zero profilazione
                    </span>
                    <span>Crittografia AES-256</span>
                  </div>
                </div>

                {/* Pulsante rapido verso USSO */}
                <button
                  type="button"
                  onClick={onLogin}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--ink)] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <UssoBadgeIcon className="w-4 h-4 shrink-0" />
                  <span>Accedi con USSO per gestire la tua agenda</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Barra delle Metriche Sovrane (4 Pilastri Numerici) ── */}
        <section className="border-y border-[var(--edge)] bg-white py-8 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-black text-[var(--ink)] tracking-tight">0</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Tracker Commerciali
              </span>
              <p className="text-[11px] text-[var(--muted)] m-0">Zero Google Analytics, Meta o pixel terzi</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-black text-[var(--accent)] tracking-tight">100%</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Server in Svizzera
              </span>
              <p className="text-[11px] text-[var(--muted)] m-0">Infrastruttura Infomaniak dc4-a Ginevra</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-black text-[var(--ink)] tracking-tight">FIDO2</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Accesso Biometrico
              </span>
              <p className="text-[11px] text-[var(--muted)] m-0">Touch ID, Face ID o chiavi hardware</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-black text-[var(--accent)] tracking-tight">RFC 5545</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Standard Aperto iCal
              </span>
              <p className="text-[11px] text-[var(--muted)] m-0">Compatibilità universale con tutti i calendari</p>
            </div>
          </div>
        </section>

        {/* ── 4. Griglia Bento delle Funzionalità (Caratteristiche) ── */}
        <section id="funzionalita" className="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
          <div className="max-w-2xl mb-12 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              Perché scegliere calendario.ch
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)] mt-2">
              Costruito per chi ha a cuore la propria privacy e quella dei propri clienti.
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] mt-3">
              Un’alternativa elvetica rigorosa a Calendly e Google Calendar: niente cessione di dati a terzi, niente cookie invasivi, solo un’esperienza fluida e sicura.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: nLPD e Sovranità */}
            <div className="p-6 rounded-3xl bg-white border border-[var(--edge)] flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--accent)] flex items-center justify-center">
                  <ShieldCheck size={26} />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] m-0">
                  Sovranità & nLPD
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  Nessun accordo di trasferimento dati transfrontaliero opaco. I tuoi impegni e le informazioni dei tuoi interlocutori risiedono esclusivamente nel datacenter dc4-a di Ginevra, nel rispetto rigoroso della nLPD (RS 235.1).
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Leggi conformità nLPD <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Condivisione Slot */}
            <div className="p-6 rounded-3xl bg-white border border-[var(--edge)] flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center">
                  <Share2 size={26} />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] m-0">
                  Prenotazioni Online
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  Condividi il tuo link personale (es. <code className="px-1.5 py-0.5 rounded bg-[var(--paper)] text-[var(--ink)] font-mono text-[11px]">/tuonome/consulenza</code>) o un QR code stampabile. I clienti prenotano nei tuoi spazi liberi senza visualizzare i dettagli dei tuoi appuntamenti privati.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={onPreviewBooking}
                  className="text-xs font-bold text-[var(--ink)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Guarda la pagina pubblica <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 3: Caveau Archivio.ch */}
            <div className="p-6 rounded-3xl bg-white border border-[var(--edge)] flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--accent)] flex items-center justify-center">
                  <Lock size={26} />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] m-0">
                  Caveau Archivio.ch
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  La tua agenda non scompare se cambi browser o dispositivo. Viene salvata e sincronizzata in crittografia sul Caveau personale di <strong>archivio.ch</strong>, a cui solo la tua identità USSO può accedere.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Cifratura AES-256 a riposo
                </span>
              </div>
            </div>

            {/* Card 4: Integrazione UnHub & Pagine.ch */}
            <div className="p-6 rounded-3xl bg-white border border-[var(--edge)] flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center">
                  <Layers size={26} />
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] m-0">
                  Ecosistema UnHub
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  Incorpora il modulo con un solo click sul tuo sito vetrina realizzato con <strong>pagine.ch</strong>, genera note d&apos;incontro automatiche su <strong>taccuino.ch</strong> ed esporta feed <strong>WebCal</strong> (.ics) per Apple Calendar e Outlook.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[var(--line)]">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Zero vendor lock-in
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. "Come Funziona" Workflow Step-by-Step ── */}
        <section id="come-funziona" className="py-16 sm:py-24 bg-white border-y border-[var(--edge)] px-4 sm:px-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-12 text-left">
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                Inizia in tre passaggi
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)] mt-2">
                Come funziona calendario.ch
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[var(--page)] border border-[var(--edge)]">
                <span className="text-3xl font-black text-[var(--accent)]">01.</span>
                <h3 className="text-base font-bold text-[var(--ink)] m-0">
                  Accedi con USSO.ch
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  Nessuna email di verifica da attendere, nessuna password vulnerabile: tocca il sensore d&apos;impronta o Face ID del tuo dispositivo per attivare la sessione sicura.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[var(--page)] border border-[var(--edge)]">
                <span className="text-3xl font-black text-[var(--accent)]">02.</span>
                <h3 className="text-base font-bold text-[var(--ink)] m-0">
                  Definisci i tuoi slot
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  Imposta la durata degli incontri (es. 15, 30 o 60 minuti), le pause cuscinetto per non sovrapporre gli appuntamenti e gli orari di apertura settimanali.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[var(--page)] border border-[var(--edge)]">
                <span className="text-3xl font-black text-[var(--accent)]">03.</span>
                <h3 className="text-base font-bold text-[var(--ink)] m-0">
                  Condividi e ricevi
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed m-0">
                  Condividi il tuo link o incorpora il widget sul tuo sito. Chi prenota sceglie un orario libero e l&apos;impegno appare direttamente nella tua vista calendario.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <UssoAuthButton
                size="lg"
                action="login"
                label="Attiva la tua agenda con USSO"
                onClick={onLogin}
              />
            </div>
          </div>
        </section>

        {/* ── 6. Sezione Sicurezza & Garanzia Svizzera ── */}
        <section id="sicurezza" className="py-16 sm:py-24 px-4 sm:px-8 max-w-5xl mx-auto w-full">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--ink)] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="flex flex-col gap-4 text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold self-start border border-white/10">
                <ShieldCheck size={14} className="text-[#36a9e1]" />
                <span>Legge Federale sulla Protezione dei Dati (nLPD)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Privacy reale, certificata dalla Confederazione Svizzera.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
                I calendari aziendali e sanitari contengono dati sensibili. A differenza delle soluzioni commerciali basate su Cloud Act statunitense, calendario.ch conserva e processa i dati esclusivamente entro i confini federali elvetici.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="underline hover:text-white cursor-pointer"
                >
                  Informativa Privacy Completa →
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLegal('impressum')}
                  className="underline hover:text-white cursor-pointer"
                >
                  Impressum & Responsabile Legale →
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0">
              <UssoSecurityBadge text="Infrastruttura Sovrana Ginevra dc4-a" />
              <UssoAuthButton
                size="md"
                onClick={onLogin}
                className="bg-white text-[var(--ink)] hover:bg-slate-100"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ── 7. Footer Ufficiale Ecosistema UnHub ── */}
      <footer className="border-t border-[var(--edge)] bg-white py-12 px-4 sm:px-8 text-xs text-[var(--muted)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 font-bold text-[var(--ink)] text-sm">
              <span>calendario<span className="text-[var(--muted)] font-medium">.ch</span></span>
            </div>
            <span className="hidden sm:inline text-[var(--line)]">|</span>
            <span>UnHub Sovereign Ecosystem · Svizzera</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Protezione dati (nLPD)
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('impressum')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Impressum
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Condizioni d&apos;uso
            </button>
            <a
              href="https://pagine.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--ink)] transition-colors inline-flex items-center gap-1"
            >
              pagine.ch <ExternalLink size={12} />
            </a>
            <a
              href="https://usso.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--ink)] transition-colors inline-flex items-center gap-1"
            >
              usso.ch <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-[var(--line)] text-center text-[11px] text-[var(--muted)]">
          <p className="m-0">
            © {new Date().getFullYear()} calendario.ch · Conforme alla Legge federale sulla protezione dei dati (nLPD RS 235.1). Nessun cookie di profilazione.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
