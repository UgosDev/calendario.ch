import React, { useEffect, useRef } from 'react';
import { CalendarEvent, Booking, SlotType } from '../types';
import { parseKey, keyFromDate, GIORNI_BREVI_IT, getHoliday, formatLongDate } from '../services/swissHolidays';
import { getEventsOn, getBookingsOn, calculateFreeSlots } from '../services/calendarEngine';
import { HH, clock, dayItems, GridItem, DropPreview } from './WeekView';
import { useEventDrag, useSwipe } from './gestures';
import { Plus } from 'lucide-react';

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
  onUpdateEventTime?: (eventId: string, newStart: number, newEnd: number, newDate?: string) => void;
  onSwipe?: (dir: number) => void;
  onNotify?: (msg: string) => void;
}

/** Vista giorno nello stile della proposta B: una colonna della settimana, più il riepilogo a destra. */
export const DayView: React.FC<Props> = ({
  cursorDate,
  events,
  bookings,
  slotTypes,
  startHour = 7,
  endHour = 21,
  onSelectEvent,
  onSelectBooking,
  onNewEventAt,
  onUpdateEventTime,
  onSwipe,
  onNotify
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const d = parseKey(cursorDate);
  const isToday = cursorDate === keyFromDate(new Date());
  const holiday = getHoliday(cursorDate);
  const items = dayItems(cursorDate, events, bookings, slotTypes);
  const allDay = getEventsOn(events, cursorDate).filter((e) => e.allDay);
  const { drag, begin, wasDragging } = useEventDrag({
    dayKeys: [cursorDate], colRefs, scrollRef, events, bookings, startHour, endHour, hh: HH,
    onCommit: (id, s, e2, nd) => onUpdateEventTime?.(id, s, e2, nd), onNotify
  });
  useSwipe(scrollRef, onSwipe);

  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    const target = isToday && h >= 19 ? Math.min(endHour - 3, h - 1) : 8;
    scrollRef.current.scrollTop = Math.max(0, (target - startHour) * HH - 8);
  }, [cursorDate, startHour, endHour, isToday]);

  const totalHeight = (endHour - startHour) * HH;
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // riepilogo
  const list = [
    ...allDay.map((e) => ({ id: e.id, s: -1, when: 'Tutto il giorno', title: e.title, kind: 'own' as const, open: () => onSelectEvent(e) })),
    ...getEventsOn(events, cursorDate).filter((e) => !e.allDay).map((e) => ({ id: e.id, s: e.start, when: `${clock(e.start)}–${clock(e.end)}`, title: e.title, kind: 'own' as const, open: () => onSelectEvent(e) })),
    ...getBookingsOn(bookings, cursorDate).map((b) => ({ id: b.id, s: b.start, when: `${clock(b.start)}–${clock(b.end)}`, title: b.name, kind: (b.status === 'pending' ? 'pending' : 'booked') as 'pending' | 'booked', open: () => onSelectBooking(b) }))
  ].sort((a, b) => a.s - b.s);

  const onColClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wasDragging() || (e.target as HTMLElement).closest('.b-ev')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onNewEventAt(cursorDate, startHour * 60 + Math.floor(((e.clientY - rect.top) / HH) * 2) * 30);
  };

  return (
    <div className="b-day">
      <div className="b-cal" ref={scrollRef}>
        <div className="b-dayhead">
          <div className={`b-wday${isToday ? ' today' : ''}`}>
            <span className="n">{GIORNI_BREVI_IT[d.getDay()]}</span>
            <span className="d">{d.getDate()}</span>
            {holiday && <span className="h">{holiday}</span>}
          </div>
          {allDay.map((e) => (
            <button key={e.id} type="button" className="b-pill k-own" onClick={() => onSelectEvent(e)}>{e.title}</button>
          ))}
        </div>
        <div className="b-dbody">
          <div className="b-hours" style={{ height: totalHeight }} aria-hidden="true">
            {hours.map((h) => <span key={h} style={{ top: (h - startHour) * HH }}>{h}:00</span>)}
          </div>
          <div ref={(el) => { colRefs.current[0] = el; }} className={`b-col${isToday ? ' today' : ''}`} style={{ height: totalHeight }} onClick={onColClick} aria-label={formatLongDate(cursorDate)}>
            {holiday && <div className="hol" />}
            {hours.map((h) => <div key={h} className="ln" style={{ top: (h - startHour) * HH }} />)}
            {!items.length && !allDay.length && <span className="free-day">Giornata libera</span>}
            {items.map((it, i) => (
              <GridItem key={i} it={it} startHour={startHour} endHour={endHour} onSelectEvent={onSelectEvent} onSelectBooking={onSelectBooking}
                dnd={onUpdateEventTime ? { begin, wasDragging, day: 0, dragId: drag?.id } : undefined} />
            ))}
            {drag && <DropPreview drag={drag} startHour={startHour} />}
            {isToday && nowMin >= startHour * 60 && nowMin < endHour * 60 && (
              <div className="b-now" style={{ top: ((nowMin - startHour * 60) / 60) * HH }} />
            )}
          </div>
        </div>
      </div>

      <div className="b-dside">
        <section className="b-card b-sec">
          <h2>In programma</h2>
          {list.length ? (
            list.map((x) => (
              <button key={x.id} type="button" className="b-row" onClick={x.open}>
                <i className={`k-${x.kind}`} />
                <span className="who"><b>{x.title}</b><small>{x.when}{x.kind === 'pending' ? ' · da confermare' : x.kind === 'booked' ? ' · prenotato' : ''}</small></span>
              </button>
            ))
          ) : (
            <span className="b-empty">Nessun impegno. Giornata libera.</span>
          )}
          <button type="button" className="b-ghost" onClick={() => onNewEventAt(cursorDate, 540)}>
            <Plus size={16} /> Aggiungi impegno
          </button>
        </section>

        <section className="b-card b-sec">
          <h2>Slot prenotabili</h2>
          {slotTypes.filter((t) => t.active).map((t) => {
            const fs = calculateFreeSlots(cursorDate, t, events, bookings);
            return (
              <div key={t.id} className="b-slot" style={{ cursor: 'default' }}>
                <b>{t.name} · {t.duration} min</b>
                {fs.length ? (
                  <div className="b-times">{fs.map((s) => <span key={s.start}>{clock(s.start)}</span>)}</div>
                ) : (
                  <small>Nessun orario libero in questo giorno.</small>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
};
