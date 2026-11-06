import React from 'react';
import { CalendarEvent, Booking, SlotType, ViewMode } from '../types';
import {
  parseKey,
  keyFromDate,
  addDays,
  addDaysToKey,
  startOfWeek,
  MESI_IT,
  GIORNI_IT,
  GIORNI_BREVI_IT,
  capitalize,
  formatMinutesToClock,
  getHoliday
} from '../services/swissHolidays';
import { getBookingsOn, calculateFreeSlots } from '../services/calendarEngine';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentView: ViewMode;
  cursorDate: string; // YYYY-MM-DD
  onSelectDate: (k: string) => void;
  onNavigatePeriod: (direction: number) => void;
  onGoToToday: () => void;
  onOpenSlots: () => void;
  onSelectBooking: (b: Booking) => void;
  events: CalendarEvent[];
  bookings: Booking[];
  slotTypes: SlotType[];
}

const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 864e5 + 1) / 7);
};

const initials = (n: string) =>
  n.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/**
 * Colonna laterale della proposta B.
 * Settimana e giorno: numero grande, periodo con frecce, scheda "Slot condivisi".
 * Mese: numero del mese, "Prossime prenotazioni" e legenda.
 */
export const Sidebar: React.FC<Props> = ({
  currentView,
  cursorDate,
  onNavigatePeriod,
  onGoToToday,
  onOpenSlots,
  onSelectBooking,
  events,
  bookings,
  slotTypes
}) => {
  const c = parseKey(cursorDate);
  const todayKey = keyFromDate(new Date());
  const isMonth = currentView === 'month';
  const isDay = currentView === 'day';

  // periodo mostrato
  let keys: string[] = [];
  let label = '';
  let big = '';
  let title: React.ReactNode = '';
  let onToday = false;
  if (isMonth) {
    big = String(c.getMonth() + 1);
    title = (<>{capitalize(MESI_IT[c.getMonth()])}<br />{c.getFullYear()}</>);
    const t = new Date();
    onToday = t.getMonth() === c.getMonth() && t.getFullYear() === c.getFullYear();
  } else if (isDay) {
    keys = [cursorDate];
    label = capitalize(GIORNI_IT[c.getDay()]);
    big = String(c.getDate());
    title = `${capitalize(MESI_IT[c.getMonth()])} ${c.getFullYear()}`;
    onToday = cursorDate === todayKey;
  } else {
    const m = startOfWeek(c);
    keys = Array.from({ length: 7 }, (_, i) => keyFromDate(addDays(m, i)));
    const a = parseKey(keys[0]);
    const b = parseKey(keys[6]);
    label = 'Settimana';
    big = String(isoWeek(c));
    title =
      a.getMonth() === b.getMonth()
        ? `${a.getDate()} – ${b.getDate()} ${MESI_IT[a.getMonth()]}`
        : `${a.getDate()} ${MESI_IT[a.getMonth()].slice(0, 3)}. – ${b.getDate()} ${MESI_IT[b.getMonth()].slice(0, 3)}.`;
    onToday = keys.includes(todayKey);
  }

  const holiday = isDay ? getHoliday(cursorDate) : undefined;

  // slot condivisi nel periodo
  const slotRows = slotTypes
    .filter((t) => t.active)
    .map((t) => {
      const free = keys.reduce((s, k) => s + calculateFreeSlots(k, t, events, bookings).length, 0);
      const booked = keys.reduce((s, k) => s + getBookingsOn(bookings, k).filter((b) => b.typeId === t.id).length, 0);
      return { t, free, booked };
    });

  // prossime prenotazioni (vista mese)
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = bookings
    .filter((b) => b.status !== 'cancelled' && (b.date > todayKey || (b.date === todayKey && b.end > nowMin)))
    .sort((a, b) => (a.date + String(a.start).padStart(4, '0')).localeCompare(b.date + String(b.start).padStart(4, '0')))
    .slice(0, 4);
  const whenLabel = (b: Booking) => {
    const d = parseKey(b.date);
    const day =
      b.date === todayKey ? 'Oggi' : b.date === addDaysToKey(todayKey, 1) ? 'Domani' : `${GIORNI_BREVI_IT[d.getDay()]} ${d.getDate()}`;
    const t = slotTypes.find((x) => x.id === b.typeId);
    return `${day}, ${formatMinutesToClock(b.start)}${t ? ` · ${t.name}` : ''}`;
  };

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <aside className="b-side" aria-label="Periodo e riepilogo">
      <div className="b-card b-hero">
        {label && <span className="lbl">{label}</span>}
        <span className={`big${isMonth ? ' month' : ''}`}>{big}</span>
        <div className={`row${isMonth ? ' end' : ''}`}>
          <h1 className={isMonth ? 'month' : ''}>{title}</h1>
          <button type="button" className="b-arrow" onClick={() => onNavigatePeriod(-1)} aria-label={isMonth ? 'Mese precedente' : isDay ? 'Giorno precedente' : 'Settimana precedente'}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="b-arrow" onClick={() => onNavigatePeriod(1)} aria-label={isMonth ? 'Mese successivo' : isDay ? 'Giorno successivo' : 'Settimana successiva'}>
            <ChevronRight size={16} />
          </button>
        </div>
        {holiday && <span className="b-empty" style={{ color: 'var(--accent)', marginTop: 6 }}>{holiday}</span>}
        {!onToday && (
          <button type="button" className="today-link" onClick={onGoToToday}>
            Torna a oggi
          </button>
        )}
      </div>

      {isMonth ? (
        <>
          <section className="b-card b-sec" style={{ gap: 6 }}>
            <h2 style={{ marginBottom: 6 }}>Prossime prenotazioni</h2>
            {upcoming.length ? (
              upcoming.map((b, i) => (
                <button key={b.id} type="button" className={`b-next${i === 0 ? ' first' : ''}`} onClick={() => onSelectBooking(b)}>
                  <span className="b-ini">{initials(b.name)}</span>
                  <span className="who">
                    <b>{b.name}</b>
                    <small>{whenLabel(b)}{b.status === 'pending' ? ' · da confermare' : ''}</small>
                  </span>
                </button>
              ))
            ) : (
              <span className="b-empty">Nessuna prenotazione in arrivo.</span>
            )}
          </section>
          <section className="b-card b-legend" aria-label="Legenda">
            <span><i style={{ background: 'var(--own-bg)' }} />Impegno</span>
            <span><i style={{ background: 'var(--bk-bg)', boxShadow: 'inset 0 0 0 1px var(--bk-border)' }} />Prenotato</span>
            <span><i style={{ border: '1px dashed var(--accent)' }} />Slot libero</span>
          </section>
        </>
      ) : (
        <section className="b-card b-sec">
          <h2>Slot condivisi</h2>
          {slotRows.length ? (
            slotRows.map(({ t, free, booked }) => (
              <button key={t.id} type="button" className="b-slot" onClick={onOpenSlots}>
                <b>{t.name} · {t.duration} min</b>
                <span className="b-bar" aria-hidden="true">
                  <i style={{ width: `${free + booked ? Math.round((booked / (free + booked)) * 100) : 0}%` }} />
                </span>
                <small>{plural(booked, 'prenotato', 'prenotati')} · {plural(free, 'libero', 'liberi')}</small>
              </button>
            ))
          ) : (
            <span className="b-empty">Nessuno slot attivo.</span>
          )}
          <button type="button" className="b-link" onClick={onOpenSlots}>
            Gestisci pagina pubblica
          </button>
        </section>
      )}
    </aside>
  );
};
