import React, { useState } from 'react';
import { CalendarEvent, Booking, SlotType } from '../types';
import {
  parseKey,
  keyFromDate,
  addDays,
  startOfWeek,
  MESI_IT,
  GIORNI_IT,
  GIORNI_BREVI_IT,
  capitalize,
  getHoliday
} from '../services/swissHolidays';
import { eventOccursOn } from '../services/calendarEngine';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface Props {
  cursorDate: string; // YYYY-MM-DD
  onSelectDate: (k: string) => void;
  onNavigatePeriod: (direction: number) => void;
  onGoToToday: () => void;
  events: CalendarEvent[];
  bookings: Booking[];
  slotTypes: SlotType[];
}

export const Sidebar: React.FC<Props> = ({
  cursorDate,
  onSelectDate,
  onNavigatePeriod,
  onGoToToday,
  events,
  bookings,
  slotTypes
}) => {
  const currentDate = parseKey(cursorDate);
  const todayKey = keyFromDate(new Date());

  // Stato navigazione mini calendario (mese indipendente o collegato)
  const [miniMonthDate, setMiniMonthDate] = useState<Date>(
    new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );

  const prevMiniMonth = () => {
    setMiniMonthDate(new Date(miniMonthDate.getFullYear(), miniMonthDate.getMonth() - 1, 1));
  };
  const nextMiniMonth = () => {
    setMiniMonthDate(new Date(miniMonthDate.getFullYear(), miniMonthDate.getMonth() + 1, 1));
  };

  // Costruzione griglia mini mese
  const firstDayOfMonth = new Date(miniMonthDate.getFullYear(), miniMonthDate.getMonth(), 1);
  const startGrid = startOfWeek(firstDayOfMonth);
  const miniCells: { key: string; date: Date; isOut: boolean; isToday: boolean; isSelected: boolean; hasDot: boolean; holidayName?: string }[] = [];

  for (let i = 0; i < 42; i++) {
    const d = addDays(startGrid, i);
    const k = keyFromDate(d);
    const isOut = d.getMonth() !== miniMonthDate.getMonth();
    const isToday = k === todayKey;
    const isSelected = k === cursorDate;
    const hol = getHoliday(k);

    const hasEvents = events.some((e) => eventOccursOn(e, k));
    const hasBookings = bookings.some((b) => b.date === k && b.status !== 'cancelled');

    miniCells.push({
      key: k,
      date: d,
      isOut,
      isToday,
      isSelected,
      hasDot: hasEvents || hasBookings,
      holidayName: hol
    });
  }

  const cursorHoliday = getHoliday(cursorDate);

  return (
    <aside className="side" aria-label="Navigazione e riepilogo">
      {/* Hero Data Odierna o Selezionata */}
      <div className="hero">
        <span className="lbl text-[#4f5a52]">Giorno Selezionato</span>
        <span className="bignum">{currentDate.getDate()}</span>
        <h1 className="h1 text-[#163a2a]">
          {capitalize(GIORNI_IT[currentDate.getDay()])}
        </h1>
        <div className="sub text-xs text-[#4f5a52]">
          {MESI_IT[currentDate.getMonth()]} {currentDate.getFullYear()}
          {cursorHoliday ? (
            <span className="block text-[#b3202a] font-bold mt-0.5">
              • {cursorHoliday}
            </span>
          ) : null}
        </div>

        {/* Tasti Navigazione Rapida */}
        <div className="navrow">
          <button
            type="button"
            onClick={() => onNavigatePeriod(-1)}
            className="icon-btn"
            aria-label="Periodo precedente"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onGoToToday}
            className="pill text-xs hover:bg-[#f4efe4]"
          >
            Oggi
          </button>
          <button
            type="button"
            onClick={() => onNavigatePeriod(1)}
            className="icon-btn"
            aria-label="Periodo successivo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Mini Calendario Mese */}
      <section className="mini side-extra" aria-label="Mini calendario">
        <div className="mini-head">
          <span className="text-xs uppercase tracking-wider text-[#163a2a]">
            {capitalize(MESI_IT[miniMonthDate.getMonth()])} {miniMonthDate.getFullYear()}
          </span>
          <div>
            <button type="button" onClick={prevMiniMonth} aria-label="Mese precedente">
              <ChevronLeft size={14} />
            </button>
            <button type="button" onClick={nextMiniMonth} aria-label="Mese successivo">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="mini-grid">
          {GIORNI_BREVI_IT.slice(1)
            .concat(GIORNI_BREVI_IT.slice(0, 1))
            .map((dn) => (
              <span key={dn} className="dn">
                {dn}
              </span>
            ))}

          {miniCells.slice(0, 35).map((cell) => {
            const cls = [
              cell.isOut ? 'out' : '',
              cell.holidayName ? 'hol' : '',
              cell.isToday ? 'today' : cell.isSelected ? 'sel' : '',
              cell.hasDot ? 'dot' : ''
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={cell.key}
                type="button"
                className={cls}
                onClick={() => onSelectDate(cell.key)}
                aria-label={`${cell.date.getDate()} ${MESI_IT[cell.date.getMonth()]}${
                  cell.holidayName ? ` (${cell.holidayName})` : ''
                }`}
              >
                {cell.date.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      {/* Statistiche & Legenda Sovrana */}
      <div className="side-extra flex flex-col gap-2 pt-3 border-t border-[#163a2a] text-xs text-[#4f5a52]">
        <span className="font-bold text-[#163a2a] uppercase tracking-wider text-[11px]">
          Legenda Agenda
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#163a2a]" />
          <span>Impegni personali / lavoro</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#b3202a]" />
          <span>Prenotazioni clienti esterne</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-dashed border-[#b3202a]" />
          <span>Slot disponibili per prenotazione</span>
        </div>
      </div>
    </aside>
  );
};
