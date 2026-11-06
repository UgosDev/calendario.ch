import React, { useState } from 'react';
import { CalendarEvent, EventRepeat } from '../types';
import { REPEAT_LABELS } from '../services/calendarEngine';
import { formatMinutesToClock, parseClockToMinutes, formatShortDate } from '../services/swissHolidays';
import { openMeetingNoteInTaccuino } from '../services/taccuinoBridge';
import { X, Trash2, FileText, Check, Calendar } from 'lucide-react';

interface Props {
  event: CalendarEvent | null;
  initialDate?: string;
  initialStartMinutes?: number;
  initialEndMinutes?: number;
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string, deleteSeries?: boolean, exceptionDate?: string) => void;
  onClose: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const EventModal: React.FC<Props> = ({
  event,
  initialDate,
  initialStartMinutes = 540,
  initialEndMinutes = 600,
  onSave,
  onDelete,
  onClose
}) => {
  const isNew = !event;
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || initialDate || new Date().toISOString().split('T')[0]);
  const [allDay, setAllDay] = useState(event ? event.allDay : false);
  const [startClock, setStartClock] = useState(
    formatMinutesToClock(event ? event.start : initialStartMinutes)
  );
  const [endClock, setEndClock] = useState(
    formatMinutesToClock(event ? event.end : initialEndMinutes)
  );
  const [endDate, setEndDate] = useState(event?.endDate || event?.date || date);
  const [repeat, setRepeat] = useState<EventRepeat>(event?.repeat || 'none');
  const [until, setUntil] = useState(event?.until || '');
  const [place, setPlace] = useState(event?.place || '');
  const [note, setNote] = useState(event?.note || '');
  const [busy, setBusy] = useState(event?.busy ?? true);
  const [error, setError] = useState('');

  const isRecurrent = !isNew && event?.repeat && event.repeat !== 'none';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Inserisci un titolo per l\'impegno.');
      return;
    }
    if (!date) {
      setError('Scegli una data valida.');
      return;
    }

    const startMinutes = allDay ? 0 : parseClockToMinutes(startClock);
    const endMinutes = allDay ? 0 : parseClockToMinutes(endClock);

    if (!allDay && endMinutes <= startMinutes) {
      setError('L\'orario di fine deve essere successivo all\'inizio.');
      return;
    }

    const updatedEvent: CalendarEvent = {
      id: event?.id || uid(),
      title: title.trim(),
      date,
      allDay,
      start: startMinutes,
      end: endMinutes,
      repeat,
      until: repeat !== 'none' ? until : '',
      exdates: event?.exdates || [],
      place: place.trim(),
      note: note.trim(),
      busy: allDay ? busy : true,
      endDate: allDay && repeat === 'none' && endDate > date ? endDate : '',
      taccuinoNoteId: event?.taccuinoNoteId
    };

    onSave(updatedEvent);
    onClose();
  };

  const handleOpenTaccuino = () => {
    openMeetingNoteInTaccuino({
      id: event?.id || uid(),
      title: title || 'Nuovo Incontro',
      date,
      startMinutes: allDay ? 540 : parseClockToMinutes(startClock),
      endMinutes: allDay ? 600 : parseClockToMinutes(endClock),
      location: place,
      note
    });
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-labelledby="dlg-ev-title">
        <div className="dlg-head">
          <h2 id="dlg-ev-title" className="text-xl font-bold text-[#163a2a]">
            {isNew ? 'Nuovo Impegno' : 'Dettagli Impegno'}
          </h2>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-[#fbeeee] border border-[#b3202a] text-[#b3202a] text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="field">
            <span>Titolo</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Di cosa si tratta?"
              autoFocus
              maxLength={120}
            />
          </label>

          <div className="grid2">
            <label className="field">
              <span>{isRecurrent ? 'Inizio della serie' : 'Data'}</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="check self-end pb-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              <span>Tutto il giorno</span>
            </label>
          </div>

          {!allDay ? (
            <div className="grid2">
              <label className="field">
                <span>Dalle</span>
                <input
                  type="time"
                  value={startClock}
                  onChange={(e) => setStartClock(e.target.value)}
                  step={300}
                />
              </label>
              <label className="field">
                <span>Alle</span>
                <input
                  type="time"
                  value={endClock}
                  onChange={(e) => setEndClock(e.target.value)}
                  step={300}
                />
              </label>
            </div>
          ) : (
            <div className="grid2">
              <label className="field">
                <span>Fino al (incluso)</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={date}
                />
              </label>
              <label className="check self-end pb-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={busy}
                  onChange={(e) => setBusy(e.target.checked)}
                />
                <span>Blocca gli slot liberi</span>
              </label>
            </div>
          )}

          <div className="grid2">
            <label className="field">
              <span>Ripetizione</span>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as EventRepeat)}
              >
                {Object.entries(REPEAT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {repeat !== 'none' && (
              <label className="field">
                <span>Ripeti fino al</span>
                <input
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  min={date}
                />
              </label>
            )}
          </div>

          <label className="field">
            <span>Luogo</span>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Ufficio Lugano, Mendrisio o link video"
              maxLength={120}
            />
          </label>

          <label className="field">
            <span>Note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Note personali o punti all'ordine del giorno"
              maxLength={1000}
            />
          </label>

          {/* Integrazione Diretta taccuino.ch */}
          <div className="p-3 bg-[#f4efe4] border border-[#163a2a] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#163a2a]" />
              <span className="text-[#4f5a52]">
                Prendi note o redigi il verbale d'incontro su <b>taccuino.ch</b>
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

          <div className="dlg-foot">
            {!isNew && (
              <>
                {isRecurrent ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onDelete(event.id, false, date)}
                      className="btn ghost text-xs"
                    >
                      Elimina solo il {formatShortDate(date)}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(event.id, true)}
                      className="btn ghost text-xs text-[#b3202a]"
                    >
                      Elimina la serie
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDelete(event.id)}
                    className="btn ghost text-[#b3202a]"
                  >
                    <Trash2 size={14} /> Elimina
                  </button>
                )}
              </>
            )}
            <span className="spacer" />
            <button type="button" onClick={onClose} className="btn line">
              Annulla
            </button>
            <button type="submit" className="btn dark">
              {isNew ? 'Crea Impegno' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
