import React from 'react';
import { Booking, SlotType } from '../types';
import { formatMinutesToClock, formatLongDate } from '../services/swissHolidays';
import { openMeetingNoteInTaccuino } from '../services/taccuinoBridge';
import { generateIcs, downloadFile } from '../services/vaultService';
import { formatChf } from '../services/ucoinService';
import { X, Check, XCircle, FileText, Download, User, Mail, Clock, Calendar, MapPin, CreditCard } from 'lucide-react';

interface Props {
  booking: Booking;
  slotType?: SlotType;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onRestore: (id: string) => void;
  onClose: () => void;
}

export const BookingModal: React.FC<Props> = ({
  booking,
  slotType,
  onConfirm,
  onCancel,
  onRestore,
  onClose
}) => {
  const timeStr = `${formatMinutesToClock(booking.start)}–${formatMinutesToClock(booking.end)}`;

  const handleDownloadIcs = () => {
    const icsContent = generateIcs({
      id: booking.id,
      title: `${slotType?.name || 'Appuntamento'} con ${booking.name}`,
      description: `Prenotazione calendario.ch\nCliente: ${booking.name} (${booking.email})\nNote: ${booking.note || 'Nessuna'}`,
      location: slotType?.place === 'sede' ? 'In Sede' : slotType?.place === 'video' ? 'Videochiamata Protetta' : 'Telefono',
      date: booking.date,
      startMinutes: booking.start,
      endMinutes: booking.end
    });
    downloadFile(`appuntamento-${booking.date}-${booking.name.replace(/\s+/g, '_')}.ics`, icsContent);
  };

  const handleOpenTaccuino = () => {
    openMeetingNoteInTaccuino({
      id: booking.id,
      title: `${slotType?.name || 'Incontro'} · ${booking.name}`,
      date: booking.date,
      startMinutes: booking.start,
      endMinutes: booking.end,
      clientName: booking.name,
      clientEmail: booking.email,
      location: slotType?.place === 'sede' ? 'In Sede' : 'Videochiamata',
      note: booking.note
    });
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-labelledby="dlg-bk-title">
        <div className="dlg-head">
          <div className="flex items-center gap-2">
            <span
              className={`tag ${
                booking.status === 'confirmed'
                  ? 'red'
                  : booking.status === 'pending'
                  ? 'outr'
                  : 'grey'
              }`}
            >
              {booking.status === 'confirmed'
                ? 'Confermato'
                : booking.status === 'pending'
                ? 'Da confermare'
                : 'Annullato'}
            </span>
            <h2 id="dlg-bk-title" className="text-xl font-bold text-[#163a2a]">
              Prenotazione Cliente
            </h2>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Card Info Appuntamento */}
          <div className="p-4 rounded-xl bg-[#f4efe4] border border-[#163a2a] flex flex-col gap-2.5">
            <div className="text-xs uppercase font-bold tracking-wider text-[#4f5a52]">
              {slotType?.name || 'Servizio Programmato'}
            </div>
            <div className="text-lg font-bold text-[#163a2a] flex items-center gap-2">
              <Calendar size={18} className="text-[#b3202a]" />
              <span>{formatLongDate(booking.date)}</span>
            </div>
            <div className="text-sm font-semibold text-[#163a2a] flex items-center gap-2">
              <Clock size={16} className="text-[#4f5a52]" />
              <span>{timeStr} ({slotType?.duration || (booking.end - booking.start)} minuti)</span>
            </div>
            {slotType?.place && (
              <div className="text-xs text-[#4f5a52] flex items-center gap-2">
                <MapPin size={15} />
                <span>
                  {slotType.place === 'sede'
                    ? 'In Sede'
                    : slotType.place === 'video'
                    ? 'Videoconferenza protetta'
                    : 'Telefono'}
                </span>
              </div>
            )}
            {booking.priceChf ? (
              <div className="text-xs text-[#163a2a] flex items-center gap-2 font-semibold pt-1 border-t border-[#e4dccb]">
                <CreditCard size={15} className="text-[#b08a3e]" />
                <span>Tariffa: {formatChf(booking.priceChf)}</span>
                <span className="text-[11px] text-[#4f5a52]">
                  {booking.isPaid ? '• Pagato con TWINT / UCOIN' : '• Da saldare'}
                </span>
              </div>
            ) : null}
          </div>

          {/* Dettagli Contatto */}
          <div className="p-3.5 rounded-xl border border-[#e4dccb] bg-[#fbf8f1] flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-[#163a2a]">
              <User size={16} />
              <span>{booking.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[#4f5a52]">
              <Mail size={14} />
              <a href={`mailto:${booking.email}`} className="text-[#163a2a] underline font-medium">
                {booking.email}
              </a>
            </div>
            {booking.note && (
              <div className="mt-1 pt-2 border-t border-[#e4dccb]">
                <span className="font-semibold text-[#163a2a] block mb-0.5">Nota cliente:</span>
                <p className="m-0 italic text-[#4f5a52] bg-[#f4efe4] p-2 rounded border border-[#e4dccb]">
                  «{booking.note}»
                </p>
              </div>
            )}
          </div>

          {/* Integrazione taccuino.ch */}
          <div className="p-3 bg-[#f4efe4] border border-[#163a2a] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#163a2a]" />
              <span className="text-[#4f5a52]">
                Verbale e appunti d'incontro su <b>taccuino.ch</b>
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenTaccuino}
              className="btn line h-8 px-2.5 text-xs font-bold whitespace-nowrap hover:bg-[#163a2a] hover:text-white"
            >
              Apri su taccuino.ch ↗
            </button>
          </div>
        </div>

        <div className="dlg-foot">
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="btn line text-xs"
            title="Scarica file standard iCalendar"
          >
            <Download size={14} /> Esporta .ics
          </button>
          <span className="spacer" />

          {booking.status === 'pending' && (
            <button
              type="button"
              onClick={() => {
                onConfirm(booking.id);
                onClose();
              }}
              className="btn red"
            >
              <Check size={16} /> Conferma Appuntamento
            </button>
          )}

          {booking.status !== 'cancelled' ? (
            <button
              type="button"
              onClick={() => {
                onCancel(booking.id);
                onClose();
              }}
              className="btn ghost text-[#b3202a]"
            >
              <XCircle size={15} /> Annulla Prenotazione
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onRestore(booking.id);
                onClose();
              }}
              className="btn line"
            >
              Ripristina
            </button>
          )}

          <button type="button" onClick={onClose} className="btn line">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
