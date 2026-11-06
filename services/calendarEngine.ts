/**
 * services/calendarEngine.ts — Motore di calcolo ricorrenze, disponibilità e slot
 * Ecosistema UnHub • Standard temporali conformi ISO 8601
 */

import { CalendarEvent, Booking, SlotType, EventRepeat } from '../types';
import { parseKey, diffDays, parseClockToMinutes, addDaysToKey, keyFromDate } from './swissHolidays';

export const REPEAT_LABELS: Record<EventRepeat, string> = {
  none: 'Non si ripete',
  daily: 'Ogni giorno',
  weekdays: 'Dal lunedì al venerdì',
  weekly: 'Ogni settimana',
  biweekly: 'Ogni due settimane',
  monthly: 'Ogni mese',
  yearly: 'Ogni anno'
};

/**
 * Determina se un impegno ha luogo nella data specificata k (YYYY-MM-DD)
 */
export function eventOccursOn(e: CalendarEvent, k: string): boolean {
  if (k < e.date) return false;
  if (e.exdates && e.exdates.includes(k)) return false;

  const r = e.repeat || 'none';
  if (r === 'none') {
    return e.allDay && e.endDate ? k <= e.endDate : k === e.date;
  }

  if (e.until && k > e.until) return false;

  const d = parseKey(k);
  const s = parseKey(e.date);

  switch (r) {
    case 'daily':
      return true;
    case 'weekdays':
      return d.getDay() >= 1 && d.getDay() <= 5;
    case 'weekly':
      return d.getDay() === s.getDay();
    case 'biweekly':
      return d.getDay() === s.getDay() && Math.abs(diffDays(e.date, k)) % 14 === 0;
    case 'monthly':
      return d.getDate() === s.getDate();
    case 'yearly':
      return d.getDate() === s.getDate() && d.getMonth() === s.getMonth();
    default:
      return false;
  }
}

/**
 * Restituisce tutti gli impegni che cadono nella data k
 */
export function getEventsOn(events: CalendarEvent[], k: string): CalendarEvent[] {
  return events.filter((e) => eventOccursOn(e, k));
}

/**
 * Restituisce tutte le prenotazioni attive che cadono nella data k
 */
export function getBookingsOn(bookings: Booking[], k: string): Booking[] {
  return bookings.filter((b) => b.date === k && b.status !== 'cancelled');
}

/**
 * Calcola gli slot liberi e prenotabili per un determinato tipo t nella data k
 */
export function calculateFreeSlots(
  k: string,
  t: SlotType,
  events: CalendarEvent[],
  bookings: Booking[]
): { start: number; end: number }[] {
  const d = parseKey(k);
  const dayNum = d.getDay(); // 0 = Dom, 1 = Lun, ...

  // 1. Verifica che il giorno della settimana sia attivo
  if (!t.days.includes(dayNum)) return [];

  // 2. Controllo orizzonte temporale
  const today = keyFromDate(new Date());
  const df = diffDays(today, k);
  if (df < 0 || df > t.horizon) return [];

  // 3. Controllo preavviso minimo
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startFrom = parseClockToMinutes(t.from);
  const endTo = parseClockToMinutes(t.to);
  const step = t.duration + (t.buffer || 0);

  // Impegni e prenotazioni che bloccano lo slot
  const dayEvs = getEventsOn(events, k);
  const dayBks = getBookingsOn(bookings, k);

  const isBlocked = (start: number, end: number): boolean => {
    // Controllo eventi personali/lavorativi
    for (const e of dayEvs) {
      if (e.allDay) {
        if (e.busy) return true;
      } else {
        // Sovrapposizione oraria
        if (start < e.end && end > e.start) return true;
      }
    }
    // Controllo altre prenotazioni
    for (const b of dayBks) {
      if (start < b.end && end > b.start) return true;
    }
    return false;
  };

  const slots: { start: number; end: number }[] = [];
  for (let s = startFrom; s + t.duration <= endTo; s += step) {
    // Se è oggi, verifica preavviso
    if (k === today) {
      const minNoticeMinutes = currentMinutes + t.notice * 60;
      if (s < minNoticeMinutes) continue;
    }

    if (!isBlocked(s, s + t.duration)) {
      slots.push({ start: s, end: s + t.duration });
    }
  }

  return slots;
}

/**
 * Trova il primo slot libero disponibile a partire da oggi
 */
export function findNextFreeSlot(
  t: SlotType,
  events: CalendarEvent[],
  bookings: Booking[]
): { date: string; start: number } | null {
  const today = keyFromDate(new Date());
  for (let i = 0; i <= t.horizon; i++) {
    const k = addDaysToKey(today, i);
    const frees = calculateFreeSlots(k, t, events, bookings);
    if (frees.length > 0) {
      return { date: k, start: frees[0].start };
    }
  }
  return null;
}
