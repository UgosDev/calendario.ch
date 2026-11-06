import React from 'react';
import { CalendarEvent, Booking, SlotType } from '../types';
import {
  parseKey,
  keyFromDate,
  addDaysToKey,
  GIORNI_BREVI_IT,
  MESI_IT,
  formatMinutesToClock,
  getHoliday
} from '../services/swissHolidays';
import { getEventsOn, getBookingsOn } from '../services/calendarEngine';

interface Props {
  cursorDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  bookings: Booking[];
  slotTypes: SlotType[];
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectBooking: (b: Booking) => void;
}

export const AgendaView: React.FC<Props> = ({
  cursorDate,
  events,
  bookings,
  slotTypes,
  onSelectEvent,
  onSelectBooking
}) => {
  const todayKey = keyFromDate(new Date());

  // Prossimi 30 giorni a partire dalla data cursore
  const daysList: {
    key: string;
    date: Date;
    holiday?: string;
    isToday: boolean;
    items: {
      kind: 'event' | 'booking';
      id: string;
      title: string;
      start: number;
      end: number;
      allDay: boolean;
      place?: string;
      status?: string;
      raw: CalendarEvent | Booking;
    }[];
  }[] = [];

  for (let i = 0; i < 30; i++) {
    const k = addDaysToKey(cursorDate, i);
    const d = parseKey(k);
    const dayEvs = getEventsOn(events, k);
    const dayBks = getBookingsOn(bookings, k);

    const items = [
      ...dayEvs.map((e) => ({
        kind: 'event' as const,
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        place: e.place,
        raw: e
      })),
      ...dayBks.map((b) => ({
        kind: 'booking' as const,
        id: b.id,
        title: `${b.name} (${slotTypes.find((t) => t.id === b.typeId)?.name || 'Incontro'})`,
        start: b.start,
        end: b.end,
        allDay: false,
        place: 'Prenotazione',
        status: b.status,
        raw: b
      }))
    ].sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return a.start - b.start;
    });

    if (items.length > 0) {
      daysList.push({
        key: k,
        date: d,
        holiday: getHoliday(k),
        isToday: k === todayKey,
        items
      });
    }
  }

  if (daysList.length === 0) {
    return (
      <div className="list-card">
        <p className="empty text-center py-10 text-sm">
          Nessun impegno o prenotazione in programma nei prossimi 30 giorni.
        </p>
      </div>
    );
  }

  return (
    <div className="list-card">
      {daysList.map((day) => (
        <div key={day.key} className="ag-day">
          {/* Data Sinistra */}
          <div className={`ag-date ${day.isToday ? 'today' : ''}`}>
            <b>{day.date.getDate()}</b>
            <small>
              {GIORNI_BREVI_IT[day.date.getDay()]} · {MESI_IT[day.date.getMonth()].slice(0, 3)}.
              {day.holiday && (
                <span className="block text-[#b3202a] font-bold mt-0.5">
                  {day.holiday}
                </span>
              )}
            </small>
          </div>

          {/* Elenco Impegni Destra */}
          <div className="ag-items">
            {day.items.map((it) => {
              const timeStr = it.allDay
                ? 'Tutto il giorno'
                : `${formatMinutesToClock(it.start)}–${formatMinutesToClock(it.end)}`;

              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() =>
                    it.kind === 'booking'
                      ? onSelectBooking(it.raw as Booking)
                      : onSelectEvent(it.raw as CalendarEvent)
                  }
                  className="row-btn"
                >
                  <span className="tm">{timeStr}</span>
                  <i
                    className="sw"
                    style={{
                      background: it.kind === 'booking' ? '#b3202a' : '#163a2a',
                      width: '10px'
                    }}
                  />
                  <span className="ttl">
                    {it.title}
                    {it.place ? <small>{it.place}</small> : null}
                  </span>
                  {it.kind === 'booking' ? (
                    <span
                      className={`tag ${it.status === 'pending' ? 'outr' : 'red'}`}
                    >
                      {it.status === 'pending' ? 'Da approvare' : 'Prenotato'}
                    </span>
                  ) : (
                    <span className="tag line">Impegno</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
