import React from 'react';
import { CalendarEvent, Booking, SlotType } from '../types';
import {
  parseKey,
  keyFromDate,
  addDays,
  startOfWeek,
  GIORNI_BREVI_IT,
  formatMinutesToClock,
  getHoliday,
  formatLongDate
} from '../services/swissHolidays';
import { getEventsOn, getBookingsOn, calculateFreeSlots } from '../services/calendarEngine';

interface Props {
  cursorDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  bookings: Booking[];
  slotTypes: SlotType[];
  onSelectDate: (k: string) => void;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectBooking: (b: Booking) => void;
  onNewEventOnDate: (k: string) => void;
}

export const MonthView: React.FC<Props> = ({
  cursorDate,
  events,
  bookings,
  slotTypes,
  onSelectDate,
  onSelectEvent,
  onSelectBooking,
  onNewEventOnDate
}) => {
  const currentMonthDate = parseKey(cursorDate);
  const firstOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
  const startGrid = startOfWeek(firstOfMonth);
  const todayKey = keyFromDate(new Date());

  // Calcolo se servono 5 o 6 settimane
  const endCheck = addDays(startGrid, 35);
  const totalWeeks = endCheck.getMonth() === firstOfMonth.getMonth() ? 6 : 5;

  const cells: {
    key: string;
    date: Date;
    isOut: boolean;
    isWeekend: boolean;
    isToday: boolean;
    holiday?: string;
  }[] = [];

  for (let i = 0; i < totalWeeks * 7; i++) {
    const d = addDays(startGrid, i);
    const k = keyFromDate(d);
    cells.push({
      key: k,
      date: d,
      isOut: d.getMonth() !== firstOfMonth.getMonth(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday: k === todayKey,
      holiday: getHoliday(k)
    });
  }

  const daysHeaders = GIORNI_BREVI_IT.slice(1).concat(GIORNI_BREVI_IT.slice(0, 1));

  return (
    <div className="card">
      {/* Intestazione Giorni */}
      <div className="m-head">
        {daysHeaders.map((dh) => (
          <span key={dh} className="lbl text-center text-[#4f5a52]">
            {dh}
          </span>
        ))}
      </div>

      {/* Matrice Mese */}
      <div className="m-grid">
        {cells.map((cell) => {
          const dayEvents = getEventsOn(events, cell.key);
          const dayBookings = getBookingsOn(bookings, cell.key);

          // Calcolo slot liberi totali
          const totalFreeSlots = slotTypes
            .filter((t) => t.active)
            .reduce(
              (sum, t) => sum + calculateFreeSlots(cell.key, t, events, bookings).length,
              0
            );

          const itemsToShow = [
            ...dayEvents.map((e) => ({
              kind: 'event' as const,
              id: e.id,
              title: e.title,
              start: e.start,
              allDay: e.allDay,
              raw: e
            })),
            ...dayBookings.map((b) => ({
              kind: 'booking' as const,
              id: b.id,
              title: b.name,
              start: b.start,
              allDay: false,
              status: b.status,
              raw: b
            }))
          ].sort((a, b) => {
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            return a.start - b.start;
          });

          const shown = itemsToShow.slice(0, 3);
          const remainingCount = itemsToShow.length - 3;

          return (
            <div
              key={cell.key}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                onNewEventOnDate(cell.key);
              }}
              className={`m-cell ${cell.isOut ? 'out' : ''} ${cell.isWeekend ? 'we' : ''} ${
                cell.isToday ? 'today' : ''
              }`}
            >
              <div className="m-top">
                <button
                  type="button"
                  onClick={() => onSelectDate(cell.key)}
                  className="m-num"
                  title={`Apri ${formatLongDate(cell.key)}`}
                >
                  {cell.date.getDate()}
                </button>
                {cell.holiday && (
                  <span className="m-hol" title={cell.holiday}>
                    {cell.holiday}
                  </span>
                )}
              </div>

              {/* Elenco Impegni nel riquadro */}
              <div className="m-items flex flex-col gap-1 my-1">
                {shown.map((it) => {
                  if (it.kind === 'event') {
                    const e = it.raw as CalendarEvent;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onSelectEvent(e)}
                        className={`chip ${e.allDay ? 'own' : 'own-l'}`}
                        title={e.title}
                      >
                        {!e.allDay && (
                          <span className="tm">{formatMinutesToClock(e.start)}</span>
                        )}
                        <span>{e.title}</span>
                      </button>
                    );
                  } else {
                    const b = it.raw as Booking;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onSelectBooking(b)}
                        className={`chip ${b.status === 'pending' ? 'bk-l' : 'booked'}`}
                        title={`Prenotazione: ${b.name}`}
                      >
                        <span className="tm">{formatMinutesToClock(b.start)}</span>
                        <span>{b.name}</span>
                      </button>
                    );
                  }
                })}
              </div>

              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectDate(cell.key)}
                  className="m-more text-xs text-[#b3202a] font-bold"
                >
                  +{remainingCount} altri
                </button>
              )}

              {totalFreeSlots > 0 && (
                <span className="m-free mt-auto">
                  {totalFreeSlots} {totalFreeSlots === 1 ? 'slot libero' : 'slot liberi'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
