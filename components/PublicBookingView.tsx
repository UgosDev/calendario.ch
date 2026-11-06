import React, { useState } from 'react';
import { SlotType, Booking } from '../types';
import {
  parseKey,
  keyFromDate,
  addDaysToKey,
  GIORNI_BREVI_IT,
  GIORNI_IT,
  MESI_IT,
  formatLongDate,
  formatMinutesToClock,
  capitalize
} from '../services/swissHolidays';
import { calculateFreeSlots } from '../services/calendarEngine';
import { generateIcs, downloadFile } from '../services/vaultService';
import { formatChf, formatUcoin } from '../services/ucoinService';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Download,
  CreditCard,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

interface Props {
  slotType: SlotType;
  ownerName: string;
  events: any[];
  bookings: Booking[];
  onBookingCreated: (b: Booking) => void;
  onClose?: () => void;
  isEmbed?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const PublicBookingView: React.FC<Props> = ({
  slotType,
  ownerName,
  events,
  bookings,
  onBookingCreated,
  onClose,
  isEmbed = false
}) => {
  const todayKey = keyFromDate(new Date());

  // Trova i giorni disponibili con almeno 1 slot libero
  const availableDays: string[] = [];
  for (let i = 0; i <= slotType.horizon && availableDays.length < 14; i++) {
    const k = addDaysToKey(todayKey, i);
    const frees = calculateFreeSlots(k, slotType, events, bookings);
    if (frees.length > 0) {
      availableDays.push(k);
    }
  }

  const [selectedDate, setSelectedDate] = useState<string>(availableDays[0] || todayKey);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  // Dati Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Step di conferma
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const freeSlotsForDate = calculateFreeSlots(selectedDate, slotType, events, bookings);
  const selectedDateObj = parseKey(selectedDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Inserisci il tuo nome e cognome.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Inserisci un indirizzo e-mail valido per la conferma.');
      return;
    }
    if (selectedTime === null) {
      setError('Seleziona un orario tra quelli disponibili.');
      return;
    }

    const newBooking: Booking = {
      id: uid(),
      typeId: slotType.id,
      date: selectedDate,
      start: selectedTime,
      end: selectedTime + slotType.duration,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      note: note.trim(),
      status: slotType.confirm === 'manual' ? 'pending' : 'confirmed',
      priceChf: slotType.priceChf || 0,
      isPaid: Boolean(slotType.priceChf),
      created: new Date().toISOString()
    };

    onBookingCreated(newBooking);
    setConfirmedBooking(newBooking);
  };

  const handleDownloadIcs = () => {
    if (!confirmedBooking) return;
    const ics = generateIcs({
      id: confirmedBooking.id,
      title: `${slotType.name} con ${ownerName}`,
      description: `Incontro prenotato su calendario.ch.\nNote: ${confirmedBooking.note || 'Nessuna'}`,
      location:
        slotType.place === 'sede'
          ? 'In Sede'
          : slotType.place === 'video'
          ? 'Videoconferenza protetta'
          : 'Telefono',
      date: confirmedBooking.date,
      startMinutes: confirmedBooking.start,
      endMinutes: confirmedBooking.end
    });
    downloadFile(`appuntamento-${confirmedBooking.date}.ics`, ics);
  };

  // ── Schermata Finale di Conferma ──
  if (confirmedBooking) {
    const isPending = confirmedBooking.status === 'pending';
    const d = parseKey(confirmedBooking.date);

    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-[#fbf8f1] border-1.5 border-[#163a2a] rounded-2xl shadow-xl flex flex-col gap-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#163a2a] text-white flex items-center justify-center mx-auto shadow-md">
          <CheckCircle size={32} className="text-[#b08a3e]" />
        </div>

        <div>
          <span className="lbl text-[#b3202a]">
            {isPending ? 'Richiesta Inviata' : 'Prenotazione Confermata'}
          </span>
          <h2 className="text-2xl font-bold text-[#163a2a] mt-1 mb-2">
            {slotType.name}
          </h2>
          <p className="text-xs text-[#4f5a52] max-w-md mx-auto m-0">
            {isPending
              ? `${ownerName} verificherà la tua richiesta e riceverai conferma all'indirizzo ${confirmedBooking.email}.`
              : `Il riepilogo e il promemoria sono stati inviati all'indirizzo ${confirmedBooking.email}.`}
          </p>
        </div>

        {/* Box Data e Ora */}
        <div className="p-4 rounded-xl bg-[#f4efe4] border border-[#163a2a] flex items-center justify-center gap-6">
          <span className="bignum text-5xl leading-none text-[#b3202a]">
            {d.getDate()}
          </span>
          <div className="text-left">
            <b className="text-base text-[#163a2a] block">
              {capitalize(GIORNI_IT[d.getDay()])}, {MESI_IT[d.getMonth()]} {d.getFullYear()}
            </b>
            <span className="text-sm font-semibold text-[#4f5a52]">
              {formatMinutesToClock(confirmedBooking.start)}–
              {formatMinutesToClock(confirmedBooking.end)} ({slotType.duration} min)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="btn dark flex items-center justify-center gap-2"
          >
            <Download size={16} /> Aggiungi al Calendario (.ics)
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmedBooking(null);
              setSelectedTime(null);
            }}
            className="btn line"
          >
            Prenota un altro orario
          </button>
        </div>

        <div className="pt-4 border-t border-[#e4dccb] flex items-center justify-center gap-2 text-xs text-[#4f5a52]">
          <ShieldCheck size={14} className="text-[#163a2a]" />
          <span>calendario.ch • Dati custoditi su Archivio.ch (Bunker Ginevra)</span>
        </div>
      </div>
    );
  }

  // ── Schermata di Selezione e Form ──
  return (
    <div className={`max-w-2xl mx-auto ${isEmbed ? 'p-3' : 'p-6 my-6'} bg-[#fbf8f1] border-1.5 border-[#163a2a] rounded-2xl shadow-xl flex flex-col gap-6`}>
      {/* Intestazione */}
      <div className="flex items-start justify-between border-b border-[#163a2a] pb-4">
        <div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#4f5a52] hover:text-[#163a2a] flex items-center gap-1 mb-2 font-bold"
            >
              <ArrowLeft size={14} /> Torna all'agenda
            </button>
          )}
          <span className="lbl text-[#4f5a52]">Prenotazione Online</span>
          <h1 className="text-2xl font-bold text-[#163a2a] m-0">{slotType.name}</h1>
          <div className="flex items-center gap-3 text-xs text-[#4f5a52] mt-1">
            <span className="flex items-center gap-1">
              <Clock size={13} /> {slotType.duration} min
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {slotType.place === 'sede'
                ? 'In Sede'
                : slotType.place === 'video'
                ? 'Videoconferenza'
                : 'Telefono'}
            </span>
            {slotType.priceChf ? (
              <>
                <span>•</span>
                <span className="font-bold text-[#163a2a] flex items-center gap-1">
                  <CreditCard size={13} className="text-[#b08a3e]" />
                  {formatChf(slotType.priceChf)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#4f5a52] block">Professionista:</span>
          <b className="text-sm text-[#163a2a]">{ownerName}</b>
        </div>
      </div>

      {slotType.desc && (
        <p className="text-xs text-[#4f5a52] -mt-2 m-0 bg-[#f4efe4] p-3 rounded-xl border border-[#e4dccb]">
          {slotType.desc}
        </p>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-[#fbeeee] border border-[#b3202a] text-[#b3202a] text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 1. Selettore Giorno */}
      <div>
        <span className="lbl text-[#163a2a] block mb-2">1. Scegli il Giorno</span>
        {availableDays.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableDays.map((k) => {
              const d = parseKey(k);
              const isSelected = k === selectedDate;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setSelectedDate(k);
                    setSelectedTime(null);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-1.5 transition-all min-w-[62px] ${
                    isSelected
                      ? 'bg-[#163a2a] text-white border-[#163a2a] shadow-sm'
                      : 'bg-[#f4efe4] text-[#163a2a] border-[#163a2a] hover:bg-[#e9e2d3]'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider font-semibold opacity-85">
                    {GIORNI_BREVI_IT[d.getDay()]}
                  </span>
                  <span className="text-lg font-bold">{d.getDate()}</span>
                  <span className="text-[10px] opacity-75">
                    {MESI_IT[d.getMonth()].slice(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#4f5a52] py-4">
            Al momento non ci sono slot liberi disponibili. Riprova più avanti.
          </p>
        )}
      </div>

      {/* 2. Selettore Orario */}
      {availableDays.length > 0 && (
        <div>
          <span className="lbl text-[#163a2a] block mb-2">
            2. Scegli l'Orario per {formatLongDate(selectedDate)}
          </span>
          {freeSlotsForDate.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {freeSlotsForDate.map((fs) => {
                const isSelected = selectedTime === fs.start;
                return (
                  <button
                    key={fs.start}
                    type="button"
                    onClick={() => setSelectedTime(fs.start)}
                    className={`h-11 rounded-xl border-1.5 font-bold text-xs tabular-nums flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#b3202a] text-white border-[#b3202a] shadow-md'
                        : 'bg-[#f4efe4] text-[#163a2a] border-[#163a2a] hover:bg-[#e9e2d3]'
                    }`}
                  >
                    {formatMinutesToClock(fs.start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#4f5a52]">
              Tutti gli slot per questa giornata sono già stati prenotati.
            </p>
          )}
        </div>
      )}

      {/* 3. Form Dati Cliente */}
      {selectedTime !== null && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-3 border-t border-[#163a2a]">
          <span className="lbl text-[#163a2a] block">3. I Tuoi Recapiti</span>

          <div className="grid2">
            <label className="field">
              <span>Nome e Cognome *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Mario Rossi"
              />
            </label>
            <label className="field">
              <span>Indirizzo E-mail *</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario.rossi@esempio.ch"
              />
            </label>
          </div>

          <div className="grid2">
            <label className="field">
              <span>Numero di Telefono (facoltativo)</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+41 79 123 45 67"
              />
            </label>
            <div className="p-3 rounded-xl bg-[#f4efe4] border border-[#e4dccb] flex items-center gap-2 text-xs text-[#4f5a52]">
              <ShieldCheck size={18} className="text-[#163a2a] flex-shrink-0" />
              <span>Conformità nLPD: i tuoi dati non verranno mai ceduti o tracciati.</span>
            </div>
          </div>

          <label className="field">
            <span>Nota per l'incontro (facoltativa)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Spiega brevemente di cosa desideri parlare o cosa ti serve."
              maxLength={800}
            />
          </label>

          <button
            type="submit"
            className="btn big red w-full mt-2 font-bold shadow-md flex items-center justify-center gap-2"
          >
            {slotType.confirm === 'manual'
              ? 'Invia Richiesta di Prenotazione'
              : `Conferma Prenotazione alle ${formatMinutesToClock(selectedTime)}`}
          </button>
        </form>
      )}
    </div>
  );
};
