/**
 * services/bookingClient.ts — Client di Prenotazione Sovrano per calendario.ch
 * Connesso all'infrastruttura Infomaniak dc4-a (Ginevra) & Ecosistema UnHub
 * Conforme a nLPD (RS 235.1) e CO art. 958f
 */

import { SlotType, Booking, CalendarEvent } from '../types';
import { getUssoHeaders } from './ussoAuth';

export interface BusyInterval {
  date: string; // YYYY-MM-DD
  start: number; // minuti da mezzanotte
  end: number;
}

export interface PublicScheduleData {
  owner: {
    name: string;
    handle: string;
    canton?: string;
  };
  slotTypes: SlotType[];
  busyIntervals: BusyInterval[];
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const env = (import.meta as any).env?.VITE_CALENDARIO_API_URL;
    if (env) return env.replace(/\/+$/, '');
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local')
    ) {
      return 'http://localhost:8081';
    }
  }
  return 'https://api.calendario.ch';
}

/**
 * Recupera disponibilità e tipi di slot attivi del proprietario
 * senza esporre dati privati o titoli degli impegni (Privacy-by-Design nLPD)
 */
export async function fetchPublicSchedule(handle: string): Promise<PublicScheduleData | null> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/public/${encodeURIComponent(handle)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn(`[calendario.ch] Impossibile contattare il server prenotazioni (${base}):`, err.message);
  }

  return null;
}

/**
 * Invia una richiesta di prenotazione al server con controllo atomico dei conflitti (anti-double-booking)
 * e trigger di notifica email tramite Infomaniak Mail
 */
export async function submitBookingRequest(
  handle: string,
  payload: {
    typeId: string;
    date: string;
    start: number;
    name: string;
    email: string;
    phone?: string;
    note?: string;
  }
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/public/${encodeURIComponent(handle)}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.booking) {
      return { success: true, booking: data.booking };
    }

    if (res.status === 409) {
      return {
        success: false,
        error: 'Questo orario è stato appena prenotato da un altro cliente. Seleziona un altro intervallo.'
      };
    }

    return {
      success: false,
      error: data.error || `Errore del server (${res.status}). Riprova tra poco.`
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Impossibile completare la prenotazione: server non raggiungibile.'
    };
  }
}

/**
 * Sincronizzazione lato proprietario autenticato (USSO):
 * Carica gli impegni privati convertiti in intervalli anonimi sul server
 * e scarica le nuove prenotazioni registrate dai clienti
 */
export async function syncOwnerSchedulesAndBookings(
  handle: string,
  slotTypes: SlotType[],
  events: CalendarEvent[],
  existingBookings: Booking[]
): Promise<{ success: boolean; remoteBookings: Booking[]; error?: string }> {
  const base = getApiBaseUrl();
  try {
    // Esportiamo solo intervalli busy anonimizzati (data, start, end)
    const busyIntervals: BusyInterval[] = events
      .filter((e) => e.busy)
      .map((e) => ({
        date: e.date,
        start: e.start,
        end: e.end
      }));

    const res = await fetch(`${base}/api/owner/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getUssoHeaders()
      },
      body: JSON.stringify({
        handle,
        slotTypes: slotTypes.filter((s) => s.active),
        busyIntervals,
        knownBookingIds: existingBookings.map((b) => b.id)
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        remoteBookings: data.bookings || []
      };
    }

    return {
      success: false,
      remoteBookings: [],
      error: `HTTP ${res.status}`
    };
  } catch (err: any) {
    return {
      success: false,
      remoteBookings: [],
      error: err.message
    };
  }
}
