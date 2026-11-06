/**
 * types.ts — Tipi e modelli dati sovrani per calendario.ch
 * Conforme alle specifiche Ecosistema UnHub & nLPD (RS 235.1)
 */

export type ViewMode = 'week' | 'day' | 'month' | 'agenda' | 'slots' | 'embed' | 'pub';

export type EventRepeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled';

export type SlotPlace = 'sede' | 'video' | 'telefono';

/**
 * Profilo Utente Sovrano USSO (OIDC / Passkey FIDO2)
 */
export interface UssoUser {
  unhubId: string;
  sub: string;
  nickname?: string;
  name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  consentVersion?: number;
  grantedClaims?: string[];
  batsPassport?: string;
}

/**
 * Tipo di Slot Condivisibile (es. Consulenza, Colloquio)
 */
export interface SlotType {
  id: string;
  name: string;
  slug: string;
  duration: number; // minuti (es. 30, 45, 60)
  days: number[]; // [1, 2, 3, 4, 5] (1 = Lunedì ... 7 = Domenica, 0 = Domenica)
  from: string; // "09:00"
  to: string; // "17:30"
  buffer: number; // minuti di pausa tra appuntamenti (es. 15)
  horizon: number; // orizzonte max giorni prenotabili (es. 30)
  notice: number; // ore di preavviso minimo (es. 24)
  confirm: 'auto' | 'manual';
  place: SlotPlace;
  desc?: string;
  priceChf?: number; // Prezzo in franchi svizzeri (opzionale)
  priceUcoin?: number; // Prezzo in UCOIN (1 CHF = 10 UCOIN)
  active: boolean;
  showInCal: boolean;
}

/**
 * Singola Prenotazione di un cliente esterno
 */
export interface Booking {
  id: string;
  typeId: string;
  date: string; // YYYY-MM-DD
  start: number; // minuti dalle 00:00 (es. 540 = 09:00)
  end: number; // minuti dalle 00:00
  name: string;
  email: string;
  phone?: string;
  note?: string;
  status: BookingStatus;
  meetingLocation?: string;
  meetUrl?: string;
  priceChf?: number;
  isPaid?: boolean;
  created: string; // ISO String
  syncedVaultAt?: string;
  taccuinoNoteId?: string; // ID nota collegata su taccuino.ch
}

/**
 * Impegno Personale o Lavorativo del Calendario
 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: number; // minuti da mezzanotte (0 se allDay)
  end: number; // minuti da mezzanotte (0 se allDay)
  allDay: boolean;
  repeat: EventRepeat;
  until?: string; // YYYY-MM-DD
  exdates?: string[]; // Date di eccezione per serie ricorrenti
  place?: string;
  note?: string;
  busy: boolean; // Se true, blocca gli slot condivisibili
  endDate?: string; // Data di fine per eventi di più giorni
  bookingId?: string; // Riferimento a eventuale booking
  taccuinoNoteId?: string; // Riferimento a nota su taccuino.ch
  syncedVaultAt?: string;
}

/**
 * Impostazioni dell'Agenda
 */
export interface CalendarSettings {
  owner: string;
  handle: string; // es. "eric" o "pietro-pirola"
  startHour: number; // es. 7 (07:00)
  endHour: number; // es. 21 (21:00)
  snow: boolean; // effetto stagionale neve
  theme: 'swiss-editorial' | 'mono-dark';
  canton: string; // es. "TI" (Ticino)
}

/**
 * Stato della sincronizzazione con Archivio.ch
 */
export interface VaultSyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  lastSyncedAt?: string;
  sha256Hash?: string;
  objectPath?: string;
  quotaUsedBytes: number;
  quotaTotalBytes: number;
  error?: string;
}

/**
 * Configurazione Incorporamento per pagine.ch e siti terzi
 */
export interface EmbedConfig {
  typeId: string;
  format: 'link' | 'popup' | 'inline' | 'pagine';
  tema: 'natale' | 'neutro';
  variante: 'compatta' | 'completa';
  label: string;
  device: 'desktop' | 'mobile';
  pop?: boolean;
}

/**
 * Struttura master persistita nel Vault di Archivio.ch e localStorage
 */
export interface SovereignCalendarState {
  v: number;
  settings: CalendarSettings;
  types: SlotType[];
  events: CalendarEvent[];
  bookings: Booking[];
}
