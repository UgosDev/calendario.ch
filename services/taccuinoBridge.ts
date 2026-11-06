/**
 * services/taccuinoBridge.ts — Ponte Sovrano Cross-Satellite con taccuino.ch
 * Ecosistema UnHub Svizzera
 */

import { Booking, CalendarEvent } from '../types';
import { formatMinutesToClock, formatLongDate } from './swissHolidays';

export const TACCUINO_ORIGIN =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.local'))
    ? 'http://localhost:4000'
    : 'https://taccuino.ch';

/**
 * Genera il contenuto in formato Markdown sovrano per il verbale o appunto su taccuino.ch
 */
export function buildMeetingNoteMarkdown(opts: {
  title: string;
  date: string;
  timeStr: string;
  location?: string;
  attendees?: string;
  notes?: string;
  referenceId: string;
}): string {
  return [
    `# 📋 Verbale d'Incontro: ${opts.title}`,
    '',
    `> **Data**: ${formatLongDate(opts.date)}`,
    `> **Orario**: ${opts.timeStr}`,
    opts.location ? `> **Luogo**: ${opts.location}` : null,
    opts.attendees ? `> **Partecipanti**: ${opts.attendees}` : null,
    `> **Riferimento Calendario**: [calendario.ch] (ID: ${opts.referenceId})`,
    '',
    '## 🎯 Ordine del Giorno',
    opts.notes ? `- **Dettagli iniziali**: ${opts.notes}` : '- [ ] Obiettivi dell\'incontro',
    '- [ ] Discussione punti chiave',
    '- [ ] Decisioni concordate',
    '',
    '## ✍️ Note & Discussione',
    '_Inserisci qui le note prese durante l\'incontro..._',
    '',
    '## 🚀 Prossimi Passi (Action Items)',
    '- [ ] Definire scadenze e responsabili',
    ''
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Apre direttamente taccuino.ch precompilando una nuova nota d'incontro
 */
export function openMeetingNoteInTaccuino(item: {
  id: string;
  title: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  location?: string;
  clientName?: string;
  clientEmail?: string;
  note?: string;
}): void {
  const timeStr = `${formatMinutesToClock(item.startMinutes)}–${formatMinutesToClock(item.endMinutes)}`;
  const attendees = item.clientName
    ? `${item.clientName}${item.clientEmail ? ` (${item.clientEmail})` : ''}`
    : undefined;

  const content = buildMeetingNoteMarkdown({
    title: item.title,
    date: item.date,
    timeStr,
    location: item.location,
    attendees,
    notes: item.note,
    referenceId: item.id
  });

  const params = new URLSearchParams({
    action: 'new_note',
    ref: 'calendario.ch',
    refId: item.id,
    title: `Incontro: ${item.title}`,
    labels: 'riunione,calendario,verbale',
    content
  });

  const targetUrl = `${TACCUINO_ORIGIN}/?${params.toString()}`;
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Listener per messaggi broadcast cross-satellite (PostMessage)
 */
export function initCrossSatelliteBridge(onNoteLinked?: (refId: string, noteId: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event: MessageEvent) => {
    // Validazione origine UnHub
    if (
      event.origin !== TACCUINO_ORIGIN &&
      !event.origin.includes('unhub') &&
      !event.origin.includes('localhost')
    ) {
      return;
    }

    const data = event.data;
    if (data && data.type === 'TCH_NOTE_CREATED' && data.refId && onNoteLinked) {
      onNoteLinked(data.refId, data.noteId);
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}
