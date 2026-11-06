import React, { useRef } from 'react';
import { useSwipe } from './gestures';
import { CalendarEvent, Booking, SlotType } from '../types';
import {
  parseKey,
  keyFromDate,
  addDays,
  startOfWeek,
  getHoliday,
  formatLongDate
} from '../services/swissHolidays';
import { getEventsOn, getBookingsOn, calculateFreeSlots } from '../services/calendarEngine';
import { clock } from './WeekView';

interface Props {
  cursorDate: string; // YYYY-MM-DD
  events: CalendarEvent[];
  bookings: Booking[];
  slotTypes: SlotType[];
  onSelectDate: (k: string) => void;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectBooking: (b: Booking) => void;
  onNewEventOnDate: (k: string) => void;
  onSwipe?: (dir: number) => void;
}

const MAX_PILLS = 3;

/** Vista mese della proposta "Mix B": celle a tessere arrotondate, impegni a pillola. */
export const MonthView: React.FC<Props> = ({
  cursorDate,
  events,
  bookings,
  slotTypes,
  onSelectDate,
  onSelectEvent,
  onSelectBooking,
  onNewEventOnDate,
  onSwipe
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  useSwipe(boxRef, onSwipe);
  const c = parseKey(cursorDate);
  const first = new Date(c.getFullYear(), c.getMonth(), 1);
  const start = startOfWeek(first);
  const todayKey = keyFromDate(new Date());
  const weeks = addDays(start, 35).getMonth() === first.getMonth() ? 6 : 5;

  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = addDays(start, i);
    const k = keyFromDate(d);
    return { k, d, out: d.getMonth() !== first.getMonth(), we: i % 7 >= 5, today: k === todayKey, hol: getHoliday(k) };
  });

  return (
    <div className="b-month" ref={boxRef}>
      <div className="b-mgrid">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((w) => (
          <span key={w} className="b-mhead">{w}</span>
        ))}
        {cells.map((cell) => {
          type Pill = { key: string; cls: string; label: string; onClick?: () => void };
          const pills: Pill[] = [];
          let free = 0;
          if (!cell.out) {
            const evs = getEventsOn(events, cell.k).sort((a, b) => (a.allDay ? -1 : a.start) - (b.allDay ? -1 : b.start));
            const bks = getBookingsOn(bookings, cell.k);
            const timed = [
              ...evs.map((e) => ({ s: e.allDay ? -1 : e.start, p: { key: e.id, cls: 'k-own', label: e.allDay ? e.title : `${clock(e.start)} ${e.title}`, onClick: () => onSelectEvent(e) } })),
              ...bks.map((b) => ({ s: b.start, p: { key: b.id, cls: b.status === 'pending' ? 'k-pending' : 'k-booked', label: `${clock(b.start)} ${b.name.split(' ').slice(-1)[0]}`, onClick: () => onSelectBooking(b) } }))
            ].sort((a, b) => a.s - b.s);
            timed.forEach((x) => pills.push(x.p));
            free = slotTypes.filter((t) => t.active).reduce((s, t) => s + calculateFreeSlots(cell.k, t, events, bookings).length, 0);
          }
          const room = free ? MAX_PILLS - 1 : MAX_PILLS;
          const shown = pills.slice(0, pills.length > room ? room - 1 : room);
          const hidden = pills.length - shown.length;
          return (
            <div
              key={cell.k}
              className={`b-mcell${cell.out ? ' out' : ''}${cell.we ? ' we' : ''}${cell.today ? ' today' : ''}`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                if (!cell.out) onNewEventOnDate(cell.k);
              }}
            >
              <div className="b-mtop">
                <button type="button" className="b-mnum" onClick={() => onSelectDate(cell.k)} aria-label={`Apri ${formatLongDate(cell.k)}`}>
                  {cell.d.getDate()}
                </button>
                {cell.hol && !cell.out && <span className="b-mhol">{cell.hol}</span>}
              </div>
              {shown.map((p) => (
                <button key={p.key} type="button" className={`b-pill ${p.cls}`} onClick={p.onClick} title={p.label}>
                  {p.label}
                </button>
              ))}
              {hidden > 0 && (
                <button type="button" className="b-more-n" onClick={() => onSelectDate(cell.k)}>
                  +{hidden} {hidden === 1 ? 'altro' : 'altri'}
                </button>
              )}
              {free > 0 && (
                <span className="b-pill k-free">{free} {free === 1 ? 'slot libero' : 'slot liberi'}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
