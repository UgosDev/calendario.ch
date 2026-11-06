import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarEvent, Booking } from '../types';
import { getEventsOn, getBookingsOn } from '../services/calendarEngine';

/* ==========================================================================
   Gesti del calendario
   - trascinare un impegno per spostarlo (mouse: subito; tocco: pressione lunga)
   - trascinare il bordo inferiore per cambiarne la durata
   - anteprima tratteggiata con ombra nella nuova posizione: blu se libera,
     rossa se si sovrappone a un altro impegno o a una prenotazione
   - Esc annulla il trascinamento
   - scorrimento laterale (dito o trackpad) per passare al periodo vicino
   ========================================================================== */

export const SNAP = 15; // minuti
const LONG_PRESS = 320; // ms prima che il dito "prenda" l'impegno

export interface DragState {
  id: string;
  title: string;
  mode: 'move' | 'resize';
  origDay: number;
  origStart: number;
  origEnd: number;
  day: number;
  start: number;
  end: number;
  conflict: boolean;
}

/** Vero se nell'intervallo c'è già un impegno (diverso da quello trascinato) o una prenotazione. */
export function isBusy(dayKey: string, start: number, end: number, ignoreId: string, events: CalendarEvent[], bookings: Booking[]) {
  const evs = getEventsOn(events, dayKey).filter((e) => e.id !== ignoreId);
  if (evs.some((e) => e.allDay && e.busy)) return true;
  if (evs.some((e) => !e.allDay && e.start < end && e.end > start)) return true;
  return getBookingsOn(bookings, dayKey).some((b) => b.start < end && b.end > start);
}

interface DragOptions {
  dayKeys: string[];
  colRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  scrollRef: React.RefObject<HTMLDivElement>;
  events: CalendarEvent[];
  bookings: Booking[];
  startHour: number;
  endHour: number;
  hh: number; // pixel per ora
  onCommit: (id: string, start: number, end: number, newDate?: string) => void;
  onNotify?: (msg: string) => void;
}

export function useEventDrag(o: DragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const live = useRef<DragState | null>(null);
  const suppress = useRef(false);
  const opts = useRef(o);
  opts.current = o;

  const wasDragging = useCallback(() => suppress.current, []);

  const begin = useCallback((e: React.PointerEvent, ev: CalendarEvent, mode: 'move' | 'resize', dayIdx: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const touch = e.pointerType !== 'mouse';
    const x0 = e.clientX;
    const y0 = e.clientY;
    const scroll0 = opts.current.scrollRef.current?.scrollTop || 0;
    const recurring = !!ev.repeat && ev.repeat !== 'none';
    let started = false;
    let lastY = y0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let raf = 0;

    const startNow = () => {
      started = true;
      const st: DragState = {
        id: ev.id, title: ev.title, mode, origDay: dayIdx, origStart: ev.start, origEnd: ev.end,
        day: dayIdx, start: ev.start, end: ev.end, conflict: false
      };
      live.current = st;
      setDrag(st);
      document.body.classList.add('b-dragging');
      if (touch && navigator.vibrate) navigator.vibrate(12);
    };

    const compute = (cx: number, cy: number) => {
      const { colRefs, scrollRef, startHour, endHour, hh, dayKeys, events, bookings } = opts.current;
      const st = live.current;
      if (!st) return;
      const scrolled = (scrollRef.current?.scrollTop || 0) - scroll0;
      const dm = Math.round((((cy - y0 + scrolled) / hh) * 60) / SNAP) * SNAP;
      let day = st.origDay;
      if (mode === 'move' && !recurring) {
        colRefs.current.forEach((col, i) => {
          if (!col) return;
          const r = col.getBoundingClientRect();
          if (cx >= r.left && cx < r.right) day = i;
        });
      }
      const dur = st.origEnd - st.origStart;
      let start: number;
      let end: number;
      if (mode === 'move') {
        start = Math.min(Math.max(st.origStart + dm, startHour * 60), endHour * 60 - dur);
        end = start + dur;
      } else {
        start = st.origStart;
        end = Math.min(Math.max(st.origEnd + dm, st.origStart + SNAP), endHour * 60);
      }
      const conflict = isBusy(dayKeys[day], start, end, st.id, events, bookings);
      if (day !== st.day || start !== st.start || end !== st.end || conflict !== st.conflict) {
        const next = { ...st, day, start, end, conflict };
        live.current = next;
        setDrag(next);
      }
    };

    // scorrimento automatico vicino ai bordi della griglia
    const autoScroll = () => {
      const sc = opts.current.scrollRef.current;
      if (!started || !sc) return;
      const r = sc.getBoundingClientRect();
      const edge = 48;
      let v = 0;
      if (lastY < r.top + edge + 40) v = -10;
      else if (lastY > r.bottom - edge) v = 10;
      if (v) {
        sc.scrollTop += v;
        compute(lastX, lastY);
      }
      raf = requestAnimationFrame(autoScroll);
    };
    let lastX = x0;

    const move = (pe: PointerEvent) => {
      lastX = pe.clientX;
      lastY = pe.clientY;
      if (!started) {
        const dist = Math.hypot(pe.clientX - x0, pe.clientY - y0);
        if (!touch && dist > 4) {
          startNow();
          raf = requestAnimationFrame(autoScroll);
        } else if (touch && dist > 10) {
          cleanup(); // il dito sta scorrendo la pagina
          return;
        }
        if (!started) return;
      }
      compute(pe.clientX, pe.clientY);
    };

    const blockTouch = (te: TouchEvent) => {
      if (started) te.preventDefault();
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', blockTouch);
      window.removeEventListener('keydown', key);
      document.body.classList.remove('b-dragging');
    };

    const finish = (commit: boolean) => {
      const st = live.current;
      cleanup();
      live.current = null;
      setDrag(null);
      if (!started || !st) return;
      suppress.current = true;
      setTimeout(() => { suppress.current = false; }, 0);
      if (!commit) return;
      const changed = st.day !== st.origDay || st.start !== st.origStart || st.end !== st.origEnd;
      if (!changed) return;
      if (st.conflict) {
        opts.current.onNotify?.('Quell’orario è occupato: l’impegno resta dov’era');
        return;
      }
      const { dayKeys, onCommit } = opts.current;
      onCommit(st.id, st.start, st.end, st.day !== st.origDay ? dayKeys[st.day] : undefined);
    };
    const up = () => finish(true);
    const cancel = () => finish(false);
    const key = (ke: KeyboardEvent) => {
      if (ke.key === 'Escape') finish(false);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', blockTouch, { passive: false });
    window.addEventListener('keydown', key);
    if (touch) timer = setTimeout(() => {
      startNow();
      raf = requestAnimationFrame(autoScroll);
    }, LONG_PRESS);
  }, []);

  return { drag, begin, wasDragging };
}

/**
 * Scorrimento laterale per cambiare periodo: dito (swipe) o trackpad (scroll orizzontale).
 * Si disattiva da solo se il contenitore scorre già in orizzontale (settimana su telefono).
 */
export function useSwipe(ref: React.RefObject<HTMLElement>, onSwipe?: (dir: number) => void) {
  const cb = useRef(onSwipe);
  cb.current = onSwipe;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scrollsSideways = () => el.scrollWidth > el.clientWidth + 2;
    let x0 = 0, y0 = 0, t0 = 0, active = false;
    const ts = (e: TouchEvent) => {
      if (e.touches.length !== 1) { active = false; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); active = true;
    };
    const te = (e: TouchEvent) => {
      if (!active || !cb.current || document.body.classList.contains('b-dragging') || scrollsSideways()) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy) && Date.now() - t0 < 700) cb.current(dx < 0 ? 1 : -1);
    };
    let acc = 0, cool = 0;
    const wh = (e: WheelEvent) => {
      if (!cb.current || scrollsSideways() || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (Date.now() < cool) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 140) {
        cb.current(acc > 0 ? 1 : -1);
        acc = 0;
        cool = Date.now() + 700;
      }
    };
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchend', te, { passive: true });
    el.addEventListener('wheel', wh, { passive: false });
    return () => {
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchend', te);
      el.removeEventListener('wheel', wh);
    };
  }, [ref]);
}
