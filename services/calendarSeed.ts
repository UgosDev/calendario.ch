/**
 * services/calendarSeed.ts — Generatore di dati sovrani iniziali per calendario.ch
 * Ispirato alla tradizione editoriale svizzera e allineato all'ecosistema UnHub
 */

import { SovereignCalendarState, SlotType, CalendarEvent, Booking } from '../types';
import { startOfWeek, addDays, keyFromDate, parseClockToMinutes } from './swissHolidays';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function getInitialSovereignState(): SovereignCalendarState {
  const mon = startOfWeek(new Date());
  const D = (n: number) => keyFromDate(addDays(mon, n));

  const t1: SlotType = {
    id: uid(),
    name: 'Consulenza Strategica',
    slug: 'consulenza',
    duration: 30,
    days: [1, 2, 3, 4, 5],
    from: '14:00',
    to: '17:30',
    buffer: 0,
    horizon: 30,
    notice: 2,
    confirm: 'auto',
    place: 'video',
    desc: 'Una prima chiacchierata video protetta per comprendere le tue esigenze e definire le priorità.',
    priceChf: 0,
    priceUcoin: 0,
    active: true,
    showInCal: true
  };

  const t2: SlotType = {
    id: uid(),
    name: 'Colloquio Approfondito',
    slug: 'colloquio',
    duration: 60,
    days: [2, 4],
    from: '09:00',
    to: '12:30',
    buffer: 15,
    horizon: 45,
    notice: 24,
    confirm: 'manual',
    place: 'sede',
    desc: 'Incontro riservato in sede per l\'analisi completa del dossier. La richiesta viene confermata a mano.',
    priceChf: 120,
    priceUcoin: 1200,
    active: true,
    showInCal: true
  };

  const ev = (
    title: string,
    date: string,
    start: string,
    end: string,
    extra: Partial<CalendarEvent> = {}
  ): CalendarEvent => ({
    id: uid(),
    title,
    date,
    start: start ? parseClockToMinutes(start) : 0,
    end: end ? parseClockToMinutes(end) : 0,
    allDay: !start,
    repeat: 'none',
    until: '',
    exdates: [],
    place: '',
    note: '',
    busy: false,
    endDate: '',
    ...extra
  });

  const bk = (
    name: string,
    email: string,
    t: SlotType,
    date: string,
    start: string,
    status: 'confirmed' | 'pending' | 'cancelled',
    note = ''
  ): Booking => {
    const s = parseClockToMinutes(start);
    return {
      id: uid(),
      typeId: t.id,
      date,
      start: s,
      end: s + t.duration,
      name,
      email,
      note,
      status,
      priceChf: t.priceChf || 0,
      isPaid: Boolean(t.priceChf && status === 'confirmed'),
      created: new Date().toISOString()
    };
  };

  const events: CalendarEvent[] = [
    ev('Stand-up settimanale UnHub', D(0), '08:45', '09:15', { repeat: 'weekdays' }),
    ev('Pianificazione agenda & priorità', D(0), '09:30', '10:30', { repeat: 'weekly', place: 'Ufficio Lugano' }),
    ev('Revisione design & architettura UnHub', D(0), '14:00', '15:30', { note: 'Schermate di prenotazione e integrazione Archivio.ch.' }),
    ev('Pranzo con fiduciario', D(1), '12:30', '13:30', { place: 'Mendrisio' }),
    ev('Palestra & Benessere', D(2), '07:15', '08:15', { repeat: 'weekly' }),
    ev('Audit sicurezza & conformità nLPD', D(2), '11:00', '12:00', { place: 'Videoconferenza protetta' }),
    ev('Lavoro concentrato su codice', D(3), '09:30', '12:00'),
    ev('Visita medica di controllo', D(4), '13:30', '14:30', { place: 'Bellinzona' }),
    ev('Mercato cittadino', D(5), '10:00', '12:00'),
    ev('Cena in famiglia', D(6), '19:30', '21:30'),
    ev('Chiusura contabile mensile', D(9), '17:30', '18:30', { repeat: 'monthly' }),
    ev('Corso di aggiornamento Fiduciari', D(11), '', '', { busy: true, place: 'Lugano Centro' }),
    ev('Trasferta Ginevra (Bunker dc4-a)', D(15), '', '', { endDate: D(16), busy: true }),
    ev('Festa cantonale & mercatini', D(19), '', '', {})
  ];

  const bookings: Booking[] = [
    bk('Luca Ferrari', 'luca.ferrari@esempio.ch', t2, D(1), '09:00', 'confirmed', 'Porto i documenti per la revisione della polizza.'),
    bk('Giulia Bernasconi', 'giulia.bernasconi@esempio.ch', t1, D(1), '14:30', 'confirmed'),
    bk('Laura Rezzonico', 'laura.rezzonico@esempio.ch', t1, D(3), '15:00', 'confirmed'),
    bk('Sara Moretti', 'sara.moretti@esempio.ch', t1, D(7), '16:00', 'cancelled'),
    bk('Marco Pedrazzini', 'marco.pedrazzini@esempio.ch', t2, D(8), '10:15', 'pending', 'Vorrei concordare il rinnovo del mandato.'),
    bk('Paolo Cattaneo', 'paolo.cattaneo@esempio.ch', t1, D(9), '14:00', 'confirmed'),
    bk('Elena Fumagalli', 'elena.fumagalli@esempio.ch', t2, D(10), '09:00', 'pending'),
    bk('Andrea Galli', 'andrea.galli@esempio.ch', t1, D(10), '16:30', 'confirmed')
  ];

  return {
    v: 1,
    settings: {
      owner: 'Eric Botta',
      handle: 'eric',
      startHour: 7,
      endHour: 21,
      snow: true,
      theme: 'swiss-editorial',
      canton: 'TI'
    },
    types: [t1, t2],
    events,
    bookings
  };
}
