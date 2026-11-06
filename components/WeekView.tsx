import React, { useRef, useEffect } from 'react';
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
  startHour?: number;
  endHour?: number;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectBooking: (b: Booking) => void;
  onNewEventAt: (date: string, startMinutes: number) => void;
  onUpdateEventTime: (eventId: string, newStart: number, newEnd: number, newDate?: string) => void;
}

const HH = 56; // pixel per ora

export const WeekView: React.FC<Props> = ({
  cursorDate,
  events,
  bookings,
  slotTypes,
  startHour = 7,
  endHour = 21,
  onSelectEvent,
  onSelectBooking,
  onNewEventAt,
  onUpdateEventTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorD = parseKey(cursorDate);
  const weekStart = startOfWeek(cursorD);
  const todayKey = keyFromDate(new Date());

  const days: { key: string; date: Date; holiday?: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const k = keyFromDate(d);
    days.push({
      key: k,
      date: d,
      holiday: getHoliday(k),
      isToday: k === todayKey
    });
  }

  // Scroll iniziale verso l'ora corrente o le 08:30
  useEffect(() => {
    if (containerRef.current) {
      const nowH = new Date().getHours();
      const targetH = Math.max(startHour, Math.min(endHour - 2, nowH - 1));
      containerRef.current.scrollTop = (targetH - startHour) * HH;
    }
  }, [startHour, endHour]);

  const totalHeight = (endHour - startHour) * HH;
  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) {
    hours.push(h);
  }

  // Calcolo linea dell'ora corrente
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const isCurrentTimeVisible =
    currentTotalMinutes >= startHour * 60 && currentTotalMinutes < endHour * 60;
  const nowTopPx = ((currentTotalMinutes - startHour * 60) / 60) * HH;

  const colsTemplate = `52px repeat(7, minmax(110px, 1fr))`;

  // Tutti gli allDay
  const allDayEvents = days.map((day) =>
    getEventsOn(events, day.key).filter((e) => e.allDay)
  );
  const hasAnyAllDay = allDayEvents.some((arr) => arr.length > 0);

  return (
    <div className="card">
      <div className="gscroll" ref={containerRef}>
        {/* Header Giorni della Settimana */}
        <div className="g-head" style={{ gridTemplateColumns: colsTemplate }}>
          <span />
          {days.map((day) => (
            <div
              key={day.key}
              className={`g-day ${day.isToday ? 'today' : ''}`}
              title={formatLongDate(day.key)}
            >
              <span className="lbl text-[#4f5a52]">
                {GIORNI_BREVI_IT[day.date.getDay()]}
              </span>
              <span className="num">{day.date.getDate()}</span>
              {day.holiday && <span className="hol">{day.holiday}</span>}
            </div>
          ))}
        </div>

        {/* Riga Eventi Tutto il Giorno */}
        {hasAnyAllDay && (
          <div className="g-all" style={{ gridTemplateColumns: colsTemplate }}>
            <span className="cap">Tutto il giorno</span>
            {days.map((day, idx) => (
              <div key={day.key} className="cell">
                {allDayEvents[idx].map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelectEvent(e)}
                    className="chip own"
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Corpo Griglia Oraria */}
        <div className="g-body" style={{ gridTemplateColumns: colsTemplate }}>
          {/* Colonna Ore */}
          <div className="g-hours" style={{ height: `${totalHeight}px` }}>
            {hours.map((h) => (
              <span key={h} style={{ top: `${(h - startHour) * HH}px` }}>
                {h > startHour ? `${String(h).padStart(2, '0')}:00` : ''}
              </span>
            ))}
          </div>

          {/* 7 Colonne dei Giorni */}
          {days.map((day) => {
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
            const dayEvents = getEventsOn(events, day.key).filter((e) => !e.allDay);
            const dayBookings = getBookingsOn(bookings, day.key);

            // Calcolo slot liberi sovrapposti
            const activeSlots = slotTypes
              .filter((t) => t.active && t.showInCal)
              .flatMap((t) =>
                calculateFreeSlots(day.key, t, events, bookings).map((s) => ({
                  ...s,
                  type: t
                }))
              );

            const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>) => {
              if ((e.target as HTMLElement).closest('.ev')) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickY = e.clientY - rect.top;
              const clickMinutes =
                startHour * 60 + Math.floor((clickY / HH) * 60 / 15) * 15;
              onNewEventAt(day.key, clickMinutes);
            };

            return (
              <div
                key={day.key}
                onClick={handleColumnClick}
                className={`g-col ${isWeekend ? 'we' : ''} ${day.holiday ? 'holcol' : ''}`}
                style={{ height: `${totalHeight}px` }}
              >
                {/* Linee Orizzontali per le ore */}
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

                {/* Linea Orario Attuale */}
                {day.isToday && isCurrentTimeVisible && (
                  <div className="now" style={{ top: `${nowTopPx}px` }} />
                )}

                {/* Slot Liberi Prenotabili */}
                {activeSlots.map((fs, idx) => {
                  const s = Math.max(fs.start, startHour * 60);
                  const e = Math.min(fs.end, endHour * 60);
                  if (e <= s) return null;
                  const top = ((s - startHour * 60) / 60) * HH + 1;
                  const height = Math.max(((e - s) / 60) * HH - 2, 18);

                  return (
                    <div
                      key={`fs-${idx}`}
                      className="ev free"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '4px',
                        width: 'calc(100% - 8px)',
                        pointerEvents: 'none'
                      }}
                    >
                      <span className="t font-medium text-[11px]">
                        Slot Libero: {fs.type.name}
                      </span>
                      <span className="m text-[10px]">
                        {formatMinutesToClock(fs.start)}–{formatMinutesToClock(fs.end)}
                      </span>
                    </div>
                  );
                })}

                {/* Impegni Personali */}
                {dayEvents.map((ev) => {
                  const s = Math.max(ev.start, startHour * 60);
                  const e = Math.min(ev.end, endHour * 60);
                  if (e <= s) return null;
                  const top = ((s - startHour * 60) / 60) * HH + 1;
                  const height = Math.max(((e - s) / 60) * HH - 2, 20);
                  const isShort = ev.end - ev.start < 40;

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className={`ev own ${isShort ? 'short' : ''}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '4px',
                        width: 'calc(100% - 8px)'
                      }}
                      title={`${ev.title} (${formatMinutesToClock(ev.start)}–${formatMinutesToClock(ev.end)})`}
                    >
                      <span className="t">
                        {isShort && (
                          <span className="font-normal opacity-85 mr-1">
                            {formatMinutesToClock(ev.start)}
                          </span>
                        )}
                        {ev.title}
                      </span>
                      {!isShort && (
                        <span className="m">
                          {formatMinutesToClock(ev.start)}–{formatMinutesToClock(ev.end)}
                          {ev.place ? ` · ${ev.place}` : ''}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Prenotazioni Clienti */}
                {dayBookings.map((b) => {
                  const s = Math.max(b.start, startHour * 60);
                  const e = Math.min(b.end, endHour * 60);
                  if (e <= s) return null;
                  const top = ((s - startHour * 60) / 60) * HH + 1;
                  const height = Math.max(((e - s) / 60) * HH - 2, 20);
                  const isShort = b.end - b.start < 40;
                  const cls = b.status === 'pending' ? 'pending' : 'booked';

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onSelectBooking(b)}
                      className={`ev ${cls} ${isShort ? 'short' : ''}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: '6px',
                        width: 'calc(100% - 12px)'
                      }}
                      title={`${b.name} (${formatMinutesToClock(b.start)}–${formatMinutesToClock(b.end)})`}
                    >
                      <span className="t">
                        {isShort && (
                          <span className="font-normal opacity-85 mr-1">
                            {formatMinutesToClock(b.start)}
                          </span>
                        )}
                        {b.name}
                      </span>
                      {!isShort && (
                        <span className="m">
                          {formatMinutesToClock(b.start)}–{formatMinutesToClock(b.end)}
                          {b.status === 'pending' ? ' · Da approvare' : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
