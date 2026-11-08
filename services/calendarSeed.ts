/**
 * services/calendarSeed.ts — Inizializzatore di stato pulito per calendario.ch
 * Ecosistema Sovrano UnHub Svizzera • Zero dati fittizi
 */

import { SovereignCalendarState } from '../types';

export function getInitialSovereignState(): SovereignCalendarState {
  return {
    v: 1,
    settings: {
      owner: '',
      handle: '',
      startHour: 7,
      endHour: 20,
      snow: false,
      theme: 'swiss-editorial',
      canton: 'TI'
    },
    types: [],
    events: [],
    bookings: []
  };
}
