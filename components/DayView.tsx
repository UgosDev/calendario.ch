import React from 'react';
import { CalendarEvent, Booking, SlotType } from '../types';
import {
  formatLongDate,
  formatMinutesToClock,
  getHoliday
} from '../services/swissHolidays';
import { getEventsOn, getBookingsOn, calculateFreeSlots } from '../services/calendarEngine';
import { Plus, Clock, MapPin, Calendar } from 'lucide-react';

interface Props {
  cursorDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  bookings: Booking[];
  slotTypes: SlotType[];
  startHour?: number;
  endHour?: number;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectBooking: (b: Booking) => void;
  onNewEventAt: (date: string, startMinutes: number) => void;
}

const HH = 56;

export const DayView: React.FC<Props> = ({
  cursorDate,
  events,
  bookings,
  slotTypes,
  startHour = 7,
  endHour = 21,
  onSelectEvent,
  onSelectBooking,
  onNewEventAt
}) => {
  const dayEvents = getEventsOn(events, cursorDate);
  const dayBookings = getBookingsOn(bookings, cursorDate);
  const holiday = getHoliday(cursorDate);

  const totalHeight = (endHour - startHour) * HH;
  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) {
    hours.push(h);
  }

  // Tutti gli impegni uniti e ordinati
  const items = [
    ...dayEvents.map((e) => ({
      kind: 'event' as const,
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      place: e.place,
      busy: e.busy,
      repeat: e.repeat,
      raw: e
    })),
    ...dayBookings.map((b) => ({
      kind: 'booking' as const,
      id: b.id,
      title: `${b.name} (${slotTypes.find((t) => t.id === b.typeId)?.name || 'Incontro'})`,
      start: b.start,
      end: b.end,
      allDay: false,
      place: 'Incontro Cliente',
      busy: true,
      status: b.status,
      raw: b
    }))
  ].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return a.start - b.start;
  });

  return (
    <div className="day-wrap">
      {/* Colonna Griglia Oraria Singola */}
      <div className="card">
        <div className="p-4 border-b border-[#163a2a] bg-[#fbf8f1] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#163a2a] m-0">
              {formatLongDate(cursorDate)}
            </h2>
            {holiday && (
              <span className="text-xs font-semibold text-[#b3202a]">
                🇨🇭 {holiday}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNewEventAt(cursorDate, 540)}
            className="btn line text-xs"
          >
            <Plus size={14} /> Nuovo Impegno
          </button>
        </div>

        <div className="gscroll" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div
            className="g-body"
            style={{ gridTemplateColumns: '52px minmax(0, 1fr)' }}
          >
            {/* Colonna Ore */}
            <div className="g-hours" style={{ height: `${totalHeight}px` }}>
              {hours.map((h) => (
                <span key={h} style={{ top: `${(h - startHour) * HH}px` }}>
                  {h > startHour ? `${String(h).padStart(2, '0')}:00` : ''}
                </span>
              ))}
            </div>

            {/* Colonna Giorno */}
            <div
              className="g-col"
              style={{ height: `${totalHeight}px` }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.ev')) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const clickMinutes =
                  startHour * 60 + Math.floor((clickY / HH) * 60 / 15) * 15;
                onNewEventAt(cursorDate, clickMinutes);
              }}
            >
              {hours.map((h) => (
                <React.Fragment key={h}>
                  <div
                    className="g-line"
                    style={{ top: `${(h - startHour) * HH}px` }}
                  />
                  <div
                    className="g-line half"
                    style={{ top: `${(h - startHour) * HH + HH / 2}px` }}
                  />
                </React.Fragment>
              ))}

              {/* Elementi Giorno */}
              {items
                .filter((it) => !it.allDay)
                .map((it) => {
                  const s = Math.max(it.start, startHour * 60);
                  const e = Math.min(it.end, endHour * 60);
                  if (e <= s) return null;
                  const top = ((s - startHour * 60) / 60) * HH + 1;
                  const height = Math.max(((e - s) / 60) * HH - 2, 22);

                  const isBooking = it.kind === 'booking';
                  const cls = isBooking
                    ? it.status === 'pending'
                      ? 'pending'
                      : 'booked'
                    : 'own';

                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() =>
                        isBooking
                          ? onSelectBooking(it.raw as Booking)
                          : onSelectEvent(it.raw as CalendarEvent)
                      }
                      className={`ev ${cls}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '8px',
                        width: 'calc(100% - 16px)'
                      }}
                    >
                      <span className="t">{it.title}</span>
                      <span className="m">
                        {formatMinutesToClock(it.start)}–{formatMinutesToClock(it.end)}
                        {it.place ? ` · ${it.place}` : ''}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Pannello Laterale In Programma & Slot */}
      <div className="flex flex-col gap-4">
        <section className="panel" aria-label="Riepilogo in programma">
          <h2 className="lbl text-[#163a2a]">In Programma</h2>
          <div className="flex flex-col gap-1 -mx-2">
            {items.length > 0 ? (
              items.map((it) => {
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
              })
            ) : (
              <p className="empty text-xs py-3 px-2">
                Nessun impegno in programma per questa giornata.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNewEventAt(cursorDate, 540)}
            className="btn line mt-2"
          >
            <Plus size={15} /> Aggiungi Impegno
          </button>
        </section>

        {/* Slot Prenotabili Attivi */}
        <section className="panel" aria-label="Slot prenotabili">
          <h2 className="lbl text-[#163a2a]">Slot Prenotabili</h2>
          <div className="flex flex-col gap-3">
            {slotTypes.filter((t) => t.active).map((t) => {
              const frees = calculateFreeSlots(cursorDate, t, events, bookings);
              return (
                <div key={t.id} className="flex flex-col gap-1.5 pb-2 border-b border-[#e4dccb] last:border-b-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#163a2a]">{t.name}</span>
                    <span className="text-[#4f5a52]">
                      {frees.length > 0
                        ? `${frees.length} ${frees.length === 1 ? 'libero' : 'liberi'}`
                        : 'nessuno libero'}
                    </span>
                  </div>
                  {frees.length > 0 && (
                    <div className="times">
                      {frees.slice(0, 6).map((fs, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onNewEventAt(cursorDate, fs.start)}
                          className="time-btn text-xs"
                          title={`Prenota alle ${formatMinutesToClock(fs.start)}`}
                        >
                          {formatMinutesToClock(fs.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
