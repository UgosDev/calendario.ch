import React, { useRef, useEffect } from 'react';
import { CalendarEvent, Booking, SlotType } from '../types';
import {
  parseKey,
  keyFromDate,
  addDays,
  startOfWeek,
  GIORNI_BREVI_IT,
  getHoliday,
  formatLongDate
} from '../services/swissHolidays';
import { getEventsOn, getBookingsOn, calculateFreeSlots } from '../services/calendarEngine';
import { useEventDrag, useSwipe, DragState } from './gestures';

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
  onSwipe?: (dir: number) => void;
  onNotify?: (msg: string) => void;
}

/** Pixel per ora, come nella tavola "B · Settimana". */
export const HH = 60;

/** Orario nel formato della tavola: 9:00, 14:30. */
export const clock = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

type Item =
  | { kind: 'own'; start: number; end: number; ev: CalendarEvent; col?: number; cols?: number }
  | { kind: 'booked' | 'pending'; start: number; end: number; b: Booking; col?: number; cols?: number }
  | { kind: 'free'; start: number; end: number; t: SlotType; col?: number; cols?: number };

/** Colonne affiancate per impegni che si sovrappongono. */
export function layoutItems(items: Item[]) {
  items.sort((a, b) => a.start - b.start || b.end - a.end);
  const groups: Item[][] = [];
  let cur: Item[] = [];
  let curEnd = -1;
  for (const it of items) {
    if (cur.length && it.start >= curEnd) { groups.push(cur); cur = []; curEnd = -1; }
    cur.push(it); curEnd = Math.max(curEnd, it.end);
  }
  if (cur.length) groups.push(cur);
  for (const g of groups) {
    const ends: number[] = [];
    for (const it of g) {
      let c = ends.findIndex((e) => e <= it.start);
      if (c < 0) { c = ends.length; ends.push(it.end); } else ends[c] = it.end;
      it.col = c;
    }
    g.forEach((it) => { it.cols = ends.length; });
  }
  return items;
}

export function dayItems(k: string, events: CalendarEvent[], bookings: Booking[], slotTypes: SlotType[]): Item[] {
  const items: Item[] = [];
  getEventsOn(events, k).filter((e) => !e.allDay).forEach((ev) => items.push({ kind: 'own', start: ev.start, end: ev.end, ev }));
  getBookingsOn(bookings, k).forEach((b) => items.push({ kind: b.status === 'pending' ? 'pending' : 'booked', start: b.start, end: b.end, b }));
  slotTypes
    .filter((t) => t.active && t.showInCal)
    .forEach((t) => calculateFreeSlots(k, t, events, bookings).forEach((s) => items.push({ kind: 'free', start: s.start, end: s.end, t })));
  return layoutItems(items);
}

/** Un impegno nella griglia oraria, con le regole della tavola. */
export const GridItem: React.FC<{
  it: Item;
  startHour: number;
  endHour: number;
  onSelectEvent: (e: CalendarEvent) => void;
  onSelectBooking: (b: Booking) => void;
  /** trascinamento: inizio, controllo del clic dopo il rilascio, colonna dell'impegno */
  dnd?: { begin: (e: React.PointerEvent, ev: CalendarEvent, mode: 'move' | 'resize', day: number) => void; wasDragging: () => boolean; day: number; dragId?: string };
}> = ({ it, startHour, endHour, onSelectEvent, onSelectBooking, dnd }) => {
  const s = Math.max(it.start, startHour * 60);
  const e = Math.min(it.end, endHour * 60);
  if (e <= s) return null;
  const top = ((s - startHour * 60) / 60) * HH + 2;
  const height = Math.max(((e - s) / 60) * HH - 4, 22);
  const tall = it.end - it.start >= 60;
  const cols = it.cols || 1;
  const col = it.col || 0;
  const style: React.CSSProperties = {
    top,
    height,
    left: `calc(4px + (100% - 8px) * ${col} / ${cols})`,
    right: 'auto',
    width: `calc((100% - 8px) / ${cols} - ${cols > 1 ? 2 : 0}px)`
  };
  const time = `${clock(it.start)}–${clock(it.end)}`;
  const name = it.kind === 'own' ? it.ev.title : it.kind === 'free' ? it.t.name : it.b.name;
  const suffix = it.kind === 'free' ? ' · libero' : it.kind === 'booked' ? ' · prenotato' : it.kind === 'pending' ? ' · da confermare' : it.kind === 'own' && it.ev.place ? ` · ${it.ev.place}` : '';
  const content = (
    <>
      <span className="t">{tall ? name : `${clock(it.start)} ${name}`}</span>
      {tall && <span className="m">{time}{suffix}</span>}
    </>
  );
  const label = `${name}, ${time}${suffix}`;
  if (it.kind === 'free') {
    return <div className="b-ev k-free" style={style} aria-label={label}>{content}</div>;
  }
  const own = it.kind === 'own';
  const movable = own && !!dnd;
  const isSrc = own && dnd?.dragId === it.ev.id;
  return (
    <button
      type="button"
      className={`b-ev k-${it.kind}${movable ? ' movable' : ''}${isSrc ? ' src' : ''}`}
      style={style}
      aria-label={label}
      title={movable ? `${label}. Trascina per spostare, tira il bordo in basso per la durata` : label}
      onPointerDown={movable ? (e) => dnd!.begin(e, (it as any).ev, 'move', dnd!.day) : undefined}
      onClick={() => {
        if (dnd?.wasDragging()) return;
        if (it.kind === 'own') onSelectEvent(it.ev);
        else onSelectBooking(it.b);
      }}
    >
      {content}
      {movable && (
        <span
          className="b-resize"
          aria-hidden="true"
          onPointerDown={(e) => dnd!.begin(e, (it as any).ev, 'resize', dnd!.day)}
        />
      )}
    </button>
  );
};

/** Anteprima tratteggiata con ombra nella posizione in cui cadrà l'impegno. */
export const DropPreview: React.FC<{ drag: DragState; startHour: number }> = ({ drag, startHour }) => (
  <div
    className={`b-drop${drag.conflict ? ' bad' : ''}`}
    style={{ top: ((drag.start - startHour * 60) / 60) * HH + 2, height: Math.max(((drag.end - drag.start) / 60) * HH - 4, 22) }}
    role="status"
    aria-live="polite"
  >
    <span className="t">{drag.title}</span>
    <span className="m">{clock(drag.start)}–{clock(drag.end)}{drag.conflict ? ' · occupato' : ''}</span>
  </div>
);

/** Vista settimana della proposta B: colonne a tessere, ore a sinistra, impegni arrotondati. */
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
  onUpdateEventTime,
  onSwipe,
  onNotify
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const weekStart = startOfWeek(parseKey(cursorDate));
  const todayKey = keyFromDate(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const k = keyFromDate(d);
    return { key: k, date: d, holiday: getHoliday(k), isToday: k === todayKey, we: d.getDay() === 0 || d.getDay() === 6 };
  });

  // parte dalle 8, o da un'ora prima di adesso se è più tardi
  useEffect(() => {
    if (!scrollRef.current) return;
    const h = new Date().getHours();
    const target = h >= 19 ? Math.min(endHour - 3, h - 1) : 8;
    scrollRef.current.scrollTop = Math.max(0, (target - startHour) * HH - 8);
  }, [startHour, endHour]);

  const totalHeight = (endHour - startHour) * HH;
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowVisible = nowMin >= startHour * 60 && nowMin < endHour * 60;

  const allDay = days.map((d) => getEventsOn(events, d.key).filter((e) => e.allDay));

  const { drag, begin, wasDragging } = useEventDrag({
    dayKeys: days.map((d) => d.key), colRefs, scrollRef, events, bookings, startHour, endHour, hh: HH,
    onCommit: onUpdateEventTime, onNotify
  });
  useSwipe(scrollRef, onSwipe);
  const hasAllDay = allDay.some((a) => a.length);

  return (
    <div className="b-cal" ref={scrollRef}>
      <div className="b-week">
        <div className="b-whead">
          <span />
          {days.map((d) => (
            <div key={d.key} className={`b-wday${d.isToday ? ' today' : ''}`} title={formatLongDate(d.key)}>
              <span className="n">{GIORNI_BREVI_IT[d.date.getDay()]}</span>
              <span className="d">{d.date.getDate()}</span>
              {d.holiday && <span className="h">{d.holiday}</span>}
            </div>
          ))}
        </div>

        {hasAllDay && (
          <div className="b-wall">
            <span className="cap">Tutto il giorno</span>
            {days.map((d, i) => (
              <div key={d.key} className="cell">
                {allDay[i].map((e) => (
                  <button key={e.id} type="button" className="b-pill k-own" onClick={() => onSelectEvent(e)} title={e.title}>
                    {e.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="b-wbody">
          <div className="b-hours" style={{ height: totalHeight }} aria-hidden="true">
            {hours.map((h) => (
              <span key={h} style={{ top: (h - startHour) * HH }}>{h}:00</span>
            ))}
          </div>

          {days.map((d, di) => {
            const items = dayItems(d.key, events, bookings, slotTypes);
            const onColClick = (e: React.MouseEvent<HTMLDivElement>) => {
              if (wasDragging() || (e.target as HTMLElement).closest('.b-ev')) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const m = startHour * 60 + Math.floor(((e.clientY - rect.top) / HH) * 2) * 30;
              onNewEventAt(d.key, m);
            };
            return (
              <div
                key={d.key}
                ref={(el) => { colRefs.current[di] = el; }}
                className={`b-col${d.we ? ' we' : ''}${d.isToday ? ' today' : ''}${drag && drag.day === di ? ' target' : ''}`}
                style={{ height: totalHeight }}
                onClick={onColClick}
                aria-label={formatLongDate(d.key)}
              >
                {d.holiday && <div className="hol" />}
                {hours.map((h) => (
                  <div key={h} className="ln" style={{ top: (h - startHour) * HH }} />
                ))}
                {!items.length && !allDay[days.indexOf(d)].length && <span className="free-day">Giornata libera</span>}
                {items.map((it, i) => (
                  <GridItem key={i} it={it} startHour={startHour} endHour={endHour} onSelectEvent={onSelectEvent} onSelectBooking={onSelectBooking}
                    dnd={{ begin, wasDragging, day: di, dragId: drag?.id }} />
                ))}
                {drag && drag.day === di && <DropPreview drag={drag} startHour={startHour} />}
                {d.isToday && nowVisible && <div className="b-now" style={{ top: ((nowMin - startHour * 60) / 60) * HH }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
