/**
 * services/swissHolidays.ts — Calendario festività ufficiali Canton Ticino & Svizzera
 * Algoritmo astronomico di Gauss / Meeus per le festività pasquali mobili.
 */

const holCache: Record<number, Record<string, string>> = {};

const pad = (n: number) => String(n).padStart(2, '0');

export const keyFromDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (k: string): Date => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const addDaysToKey = (k: string, n: number): string =>
  keyFromDate(addDays(parseKey(k), n));

export const diffDays = (a: string, b: string): number =>
  Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 864e5);

export const formatMinutesToClock = (m: number): string =>
  `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export const parseClockToMinutes = (s: string): number => {
  const [h, m] = String(s).split(':').map(Number);
  return h * 60 + (m || 0);
};

export const startOfWeek = (d: Date): Date => {
  const day = d.getDay();
  // Lunedì = primo giorno (day 1), Domenica (day 0) => -6
  const diff = (day + 6) % 7;
  return addDays(d, -diff);
};

export const MESI_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

export const GIORNI_IT = [
  'domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'
];

export const GIORNI_BREVI_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const capitalize = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export const formatLongDate = (k: string): string => {
  const d = parseKey(k);
  return `${GIORNI_IT[d.getDay()]} ${d.getDate()} ${MESI_IT[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatShortDate = (k: string): string => {
  const d = parseKey(k);
  return `${GIORNI_BREVI_IT[d.getDay()].toLowerCase()} ${d.getDate()} ${MESI_IT[d.getMonth()].slice(0, 3)}.`;
};

/**
 * Calcola la mappa delle festività cantonali del Ticino per un determinato anno solare.
 */
export function getTicinoHolidays(year: number): Record<string, string> {
  if (holCache[year]) return holCache[year];

  // Algoritmo di Gauss/Meeus per Pasqua
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easter = new Date(year, month - 1, day);
  const res: Record<string, string> = {};

  const setFixed = (mm: number, dd: number, name: string) => {
    res[`${year}-${pad(mm)}-${pad(dd)}`] = name;
  };

  // Fisse federali e cantonali Ticino
  setFixed(1, 1, 'Capodanno');
  setFixed(1, 6, 'Epifania');
  setFixed(3, 19, 'San Giuseppe');
  setFixed(5, 1, 'Festa del lavoro');
  setFixed(6, 29, 'Santi Pietro e Paolo');
  setFixed(8, 1, 'Festa nazionale svizzera 🇨🇭');
  setFixed(8, 15, 'Assunzione');
  setFixed(11, 1, 'Ognissanti');
  setFixed(12, 8, 'Immacolata Concezione');
  setFixed(12, 25, 'Natale');
  setFixed(12, 26, 'Santo Stefano');

  // Mobili pasquali
  res[keyFromDate(addDays(easter, 1))] = "Lunedì di Pasqua (Pasquetta)";
  res[keyFromDate(addDays(easter, 39))] = "Ascensione";
  res[keyFromDate(addDays(easter, 50))] = "Lunedì di Pentecoste";
  res[keyFromDate(addDays(easter, 60))] = "Corpus Domini";

  holCache[year] = res;
  return res;
}

export const getHoliday = (k: string): string | undefined => {
  const year = parseInt(k.slice(0, 4), 10);
  return getTicinoHolidays(year)[k];
};
