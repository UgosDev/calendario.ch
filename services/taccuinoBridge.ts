/**
 * services/taccuinoBridge.ts — Ponte Sovrano Cross-Satellite con taccuino.ch
 * Ecosistema UnHub Svizzera
 */

import { formatMinutesToClock, formatLongDate } from './swissHolidays';

declare global {
  interface Window {
    TaccuinoWidget?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
      isOpen: () => boolean;
    };
    __TCH_WIDGET_INITIALIZED__?: boolean;
  }
}

export const TACCUINO_ORIGIN =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.local'))
    ? 'http://localhost:4000'
    : 'https://taccuino.ch';

export interface MeetingNotePayload {
  id: string;
  title: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  location?: string;
  clientName?: string;
  clientEmail?: string;
  note?: string;
}

/**
 * Verifica se la bolla fluttuante di taccuino.ch è disponibile nel DOM
 */
export function isTaccuinoBubbleAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.TaccuinoWidget?.open === 'function';
}

/**
 * Apre la bolla fluttuante (post-it) di taccuino.ch
 */
export function openTaccuinoBubble(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.TaccuinoWidget) {
    window.TaccuinoWidget.open();
    return true;
  }
  // Se lo script è in caricamento, effettua tentativi a breve distanza
  let tries = 0;
  const interval = setInterval(() => {
    tries++;
    if (window.TaccuinoWidget) {
      window.TaccuinoWidget.open();
      clearInterval(interval);
    } else if (tries > 12) {
      clearInterval(interval);
    }
  }, 120);
  return false;
}

/**
 * Chiude la bolla fluttuante
 */
export function closeTaccuinoBubble(): void {
  if (typeof window !== 'undefined' && window.TaccuinoWidget) {
    window.TaccuinoWidget.close();
  }
}

/**
 * Alterna l'apertura/chiusura della bolla fluttuante
 */
export function toggleTaccuinoBubble(): void {
  if (typeof window !== 'undefined') {
    if (window.TaccuinoWidget) {
      window.TaccuinoWidget.toggle();
    } else {
      openTaccuinoBubble();
    }
  }
}

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
 * Copia negli appunti il template del verbale formattato in Markdown
 */
export async function copyMeetingNoteMarkdown(item: MeetingNotePayload): Promise<string> {
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

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content);
    } catch (e) {
      console.warn('[taccuinoBridge] Impossibile copiare negli appunti:', e);
    }
  }

  return content;
}

/**
 * Apre taccuino.ch precompilando una nuova nota d'incontro.
 * - 'bubble': apre la bolla fluttuante (post-it) e copia il template negli appunti
 * - 'tab': apre la scheda completa su taccuino.ch
 * - 'both': copia negli appunti, apre la bolla e la scheda
 */
export function openMeetingNoteInTaccuino(
  item: MeetingNotePayload,
  opts?: { mode?: 'bubble' | 'tab' | 'both'; onCopied?: () => void }
): void {
  const mode = opts?.mode || 'tab';
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

  if (mode === 'bubble' || mode === 'both') {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content).catch(() => {});
      if (opts?.onCopied) opts.onCopied();
    }
    openTaccuinoBubble();
    if (mode === 'bubble') return;
  }

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
