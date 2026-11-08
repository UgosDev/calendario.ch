import React, { useState } from 'react';
import { SlotType, Booking, UssoUser } from '../types';
import {
  formatMinutesToClock,
  formatShortDate,
  GIORNI_BREVI_IT
} from '../services/swissHolidays';
import { findNextFreeSlot } from '../services/calendarEngine';
import { formatChf, formatUcoin } from '../services/ucoinService';
import { openMeetingNoteInTaccuino } from '../services/taccuinoBridge';
import {
  Plus,
  Copy,
  Edit2,
  Code2,
  ExternalLink,
  Check,
  FileText,
  StickyNote,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';

interface Props {
  slotTypes: SlotType[];
  bookings: Booking[];
  events: any[];
  user: UssoUser | null;
  handle: string;
  onNewSlotType: () => void;
  onEditSlotType: (slot: SlotType) => void;
  onToggleSlotActive: (id: string) => void;
  onOpenEmbed: (slotId: string) => void;
  onOpenPublicPage: (slotId: string) => void;
  onSelectBooking: (b: Booking) => void;
  onConfirmBooking: (id: string) => void;
  onToast: (msg: string) => void;
}

export const SlotsView: React.FC<Props> = ({
  slotTypes,
  bookings,
  events,
  user,
  handle,
  onNewSlotType,
  onEditSlotType,
  onToggleSlotActive,
  onOpenEmbed,
  onOpenPublicPage,
  onSelectBooking,
  onConfirmBooking,
  onToast
}) => {
  const [filter, setFilter] = useState<'upcoming' | 'pending' | 'past' | 'cancelled'>('upcoming');
  const todayKey = new Date().toISOString().split('T')[0];

  const pendingCount = bookings.filter(
    (b) => b.status === 'pending' && b.date >= todayKey
  ).length;

  const filteredBookings = bookings
    .filter((b) => {
      if (filter === 'upcoming') return b.status !== 'cancelled' && b.date >= todayKey;
      if (filter === 'pending') return b.status === 'pending' && b.date >= todayKey;
      if (filter === 'past') return b.status !== 'cancelled' && b.date < todayKey;
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
    })
    .sort((a, b) => {
      const order = (a.date + String(a.start).padStart(4, '0')).localeCompare(
        b.date + String(b.start).padStart(4, '0')
      );
      return filter === 'past' ? -order : order;
    });

  const getDaysLabel = (ds: number[]) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    const s = order.filter((d) => ds.includes(d));
    if (s.join() === '1,2,3,4,5') return 'Lun–Ven';
    if (s.length === 7) return 'Tutti i giorni';
    return s.map((d) => GIORNI_BREVI_IT[d]).join(', ') || 'Nessuno';
  };

  const copyPublicLink = (slug: string) => {
    const url = handle ? `https://calendario.ch/${handle}/${slug}` : `https://calendario.ch/?slot=${slug}`;
    navigator.clipboard.writeText(url);
    onToast('Link di prenotazione copiato negli appunti');
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Sezione 1: Tipi di Slot Condivisi */}
      <div>
        <div className="section-h mt-0">
          <h2>Tipi di Slot Condivisibili</h2>
          <button type="button" onClick={onNewSlotType} className="btn dark">
            <Plus size={16} /> Nuovo Tipo di Slot
          </button>
        </div>

        <div className="types">
          {slotTypes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--edge)] rounded-2xl bg-[var(--paper)] w-full col-span-full">
              <p className="text-sm font-semibold text-[var(--ink)] mb-1">Nessun tipo di slot configurato</p>
              <p className="text-xs text-[var(--muted)] mb-4">
                Configura i tuoi tipi di appuntamento (es. Consulenza, Visita, Colloquio) per condividere la tua disponibilità pubblica.
              </p>
              <button type="button" onClick={onNewSlotType} className="btn dark text-xs">
                <Plus size={14} /> Crea il tuo primo tipo di slot
              </button>
            </div>
          ) : (
            slotTypes.map((t) => {
              const next = findNextFreeSlot(t, events, bookings);
              const pubUrl = handle ? `calendario.ch/${handle}/${t.slug}` : `calendario.ch/?slot=${t.slug}`;

            return (
              <article key={t.id} className={`type-card ${t.active ? '' : 'off'}`}>
                <div className="head">
                  <div>
                    <span className="lbl text-[var(--muted)]">{t.duration} minuti</span>
                    <h3>{t.name}</h3>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={t.active}
                    onClick={() => onToggleSlotActive(t.id)}
                    className="switch"
                    title={t.active ? 'Slot attivo (clicca per mettere in pausa)' : 'In pausa'}
                  />
                </div>

                {t.desc && <p className="text-xs text-[var(--muted)] m-0">{t.desc}</p>}

                <dl className="facts">
                  <dt>Giorni</dt>
                  <dd>
                    {getDaysLabel(t.days)}, {t.from}–{t.to}
                  </dd>
                  <dt>Luogo</dt>
                  <dd>
                    {t.place === 'sede'
                      ? 'In Sede'
                      : t.place === 'video'
                      ? 'Videoconferenza'
                      : 'Telefono'}
                  </dd>
                  <dt>Conferma</dt>
                  <dd>
                    {t.confirm === 'manual' ? 'Manuale (approvi tu)' : 'Automatica'}
                  </dd>
                  <dt>Preavviso</dt>
                  <dd>{t.notice} ore minime</dd>
                  {t.priceChf ? (
                    <>
                      <dt>Tariffa</dt>
                      <dd className="font-bold text-[var(--ink)]">
                        {formatChf(t.priceChf)}{' '}
                        <span className="font-normal text-[var(--gold)]">
                          ({formatUcoin(t.priceUcoin || 0)})
                        </span>
                      </dd>
                    </>
                  ) : null}
                  <dt>Prossimo</dt>
                  <dd className="text-[var(--accent)] font-semibold">
                    {t.active
                      ? next
                        ? `${formatShortDate(next.date)} alle ${formatMinutesToClock(next.start)}`
                        : 'Nessuno nel periodo'
                      : 'In pausa'}
                  </dd>
                </dl>

                {/* Scatola Link */}
                <div className="linkbox">
                  <code title={pubUrl}>{pubUrl}</code>
                  <button
                    type="button"
                    onClick={() => copyPublicLink(t.slug)}
                    className="icon-btn text-white bg-[var(--ink)] hover:bg-[var(--ink-hover)] border-0"
                    title="Copia link"
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap pt-2">
                  <button
                    type="button"
                    onClick={() => onEditSlotType(t)}
                    className="btn line text-xs h-9"
                  >
                    <Edit2 size={13} /> Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenEmbed(t.id)}
                    className="btn line text-xs h-9"
                  >
                    <Code2 size={13} /> Incorpora
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPublicPage(t.id)}
                    disabled={!t.active}
                    className="btn dark text-xs h-9 ml-auto"
                  >
                    <ExternalLink size={13} /> Pagina Prenotazione
                  </button>
                </div>
              </article>
            );
          }))}
        </div>
      </div>

      {/* Sezione 2: Gestione Prenotazioni Clienti */}
      <div>
        <div className="section-h">
          <h2>Prenotazioni Ricevute</h2>
          <div className="seg" role="group" aria-label="Filtra prenotazioni">
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              aria-pressed={filter === 'upcoming'}
            >
              In arrivo
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              aria-pressed={filter === 'pending'}
            >
              Da confermare {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
              type="button"
              onClick={() => setFilter('past')}
              aria-pressed={filter === 'past'}
            >
              Passate
            </button>
            <button
              type="button"
              onClick={() => setFilter('cancelled')}
              aria-pressed={filter === 'cancelled'}
            >
              Annullate
            </button>
          </div>
        </div>

        <div className="border border-[var(--edge)] rounded-xl overflow-hidden bg-[var(--cream)]">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((b, idx) => {
              const slot = slotTypes.find((t) => t.id === b.typeId);
              const initials = b.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div key={b.id} className="bk-row px-4">
                  <span className="text-xs font-bold text-[var(--muted)]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="avatar">{initials}</span>

                  <button
                    type="button"
                    onClick={() => onSelectBooking(b)}
                    className="who text-left bg-transparent border-0 p-0 cursor-pointer"
                  >
                    <b>{b.name}</b>
                    <span>
                      {formatShortDate(b.date)}, {formatMinutesToClock(b.start)}–
                      {formatMinutesToClock(b.end)} · {slot?.name || 'Servizio'}
                    </span>
                  </button>

                  <span
                    className={`tag ${
                      b.status === 'confirmed'
                        ? 'red'
                        : b.status === 'pending'
                        ? 'outr'
                        : 'grey'
                    }`}
                  >
                    {b.status === 'confirmed'
                      ? 'Confermato'
                      : b.status === 'pending'
                      ? 'Da approvare'
                      : 'Annullato'}
                  </span>

                  <div className="acts flex items-center gap-2">
                    {/* Tasto Note taccuino.ch con bolla fluttuante */}
                    <button
                      type="button"
                      onClick={() =>
                        openMeetingNoteInTaccuino(
                          {
                            id: b.id,
                            title: `${slot?.name || 'Incontro'} · ${b.name}`,
                            date: b.date,
                            startMinutes: b.start,
                            endMinutes: b.end,
                            clientName: b.name,
                            clientEmail: b.email,
                            note: b.note
                          },
                          {
                            mode: 'bubble',
                            onCopied: () => onToast?.(`Verbale per ${b.name} pronto: incollalo nella bolla fluttuante!`)
                          }
                        )
                      }
                      className="btn line text-xs h-8 px-2.5 rounded-full"
                      title="Apri il verbale nella bolla fluttuante di taccuino.ch"
                    >
                      <StickyNote size={13} /> Note
                    </button>

                    {b.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onConfirmBooking(b.id)}
                        className="btn red text-xs h-8 px-2.5"
                      >
                        <Check size={13} /> Conferma
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="empty text-center py-10 text-sm">
              Nessuna prenotazione presente in questa categoria.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
