import React, { useState } from 'react';
import { SlotType, SlotPlace } from '../types';
import { chfToUcoin, formatUcoin } from '../services/ucoinService';
import { X, Check } from 'lucide-react';

interface Props {
  slotType: SlotType | null;
  onSave: (slot: SlotType) => void;
  onClose: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'slot';

const GIORNI_SETT = [
  { day: 1, label: 'Lun' },
  { day: 2, label: 'Mar' },
  { day: 3, label: 'Mer' },
  { day: 4, label: 'Gio' },
  { day: 5, label: 'Ven' },
  { day: 6, label: 'Sab' },
  { day: 0, label: 'Dom' }
];

export const SlotTypeModal: React.FC<Props> = ({ slotType, onSave, onClose }) => {
  const isNew = !slotType;
  const [name, setName] = useState(slotType?.name || '');
  const [slug, setSlug] = useState(slotType?.slug || '');
  const [duration, setDuration] = useState(slotType?.duration || 30);
  const [days, setDays] = useState<number[]>(slotType?.days || [1, 2, 3, 4, 5]);
  const [from, setFrom] = useState(slotType?.from || '09:00');
  const [to, setTo] = useState(slotType?.to || '17:30');
  const [buffer, setBuffer] = useState(slotType?.buffer ?? 10);
  const [horizon, setHorizon] = useState(slotType?.horizon || 30);
  const [notice, setNotice] = useState(slotType?.notice || 24);
  const [confirm, setConfirm] = useState<'auto' | 'manual'>(slotType?.confirm || 'auto');
  const [place, setPlace] = useState<SlotPlace>(slotType?.place || 'video');
  const [desc, setDesc] = useState(slotType?.desc || '');
  const [priceChf, setPriceChf] = useState<number>(slotType?.priceChf || 0);
  const [error, setError] = useState('');

  const toggleDay = (d: number) => {
    if (days.includes(d)) {
      if (days.length > 1) setDays(days.filter((x) => x !== d));
    } else {
      setDays([...days, d]);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (isNew) setSlug(slugify(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Inserisci un nome per il tipo di incontro.');
      return;
    }

    const calculatedUcoin = chfToUcoin(priceChf);

    const updated: SlotType = {
      id: slotType?.id || uid(),
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      duration: Number(duration),
      days,
      from,
      to,
      buffer: Number(buffer),
      horizon: Number(horizon),
      notice: Number(notice),
      confirm,
      place,
      desc: desc.trim(),
      priceChf: Number(priceChf),
      priceUcoin: calculatedUcoin,
      active: slotType ? slotType.active : true,
      showInCal: slotType ? slotType.showInCal : true
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog wide" role="dialog" aria-labelledby="dlg-type-title">
        <div className="dlg-head">
          <h2 id="dlg-type-title" className="text-xl font-bold text-[#163a2a]">
            {isNew ? 'Nuovo Tipo di Slot Condiviso' : 'Modifica Tipo di Slot'}
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
          <div className="grid2">
            <label className="field">
              <span>Nome Servizio / Incontro</span>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="es. Consulenza Strategica"
                autoFocus
                maxLength={80}
              />
            </label>
            <label className="field">
              <span>Identificativo Web (slug)</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="consulenza"
              />
            </label>
          </div>

          <label className="field">
            <span>Descrizione per il cliente</span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Spiega brevemente di cosa si tratta e cosa preparare."
              maxLength={400}
            />
          </label>

          <div className="grid3">
            <label className="field">
              <span>Durata</span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={15}>15 minuti</option>
                <option value={30}>30 minuti</option>
                <option value={45}>45 minuti</option>
                <option value={60}>60 minuti (1 ora)</option>
                <option value={90}>90 minuti</option>
                <option value={120}>120 minuti (2 ore)</option>
              </select>
            </label>

            <label className="field">
              <span>Modalità</span>
              <select
                value={place}
                onChange={(e) => setPlace(e.target.value as SlotPlace)}
              >
                <option value="video">Videoconferenza protetta</option>
                <option value="sede">In sede (presenza)</option>
                <option value="telefono">Telefono</option>
              </select>
            </label>

            <label className="field">
              <span>Conferma</span>
              <select
                value={confirm}
                onChange={(e) => setConfirm(e.target.value as 'auto' | 'manual')}
              >
                <option value="auto">Automatica</option>
                <option value="manual">Manuale (la approvi tu)</option>
              </select>
            </label>
          </div>

          {/* Giorni e orari */}
          <div className="field">
            <span>Giorni Prenotabili</span>
            <div className="days-pick">
              {GIORNI_SETT.map((g) => {
                const active = days.includes(g.day);
                return (
                  <label key={g.day} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleDay(g.day)}
                    />
                    <span
                      className={`${
                        active ? 'bg-[#163a2a] text-white' : 'bg-[#f4efe4] text-[#4f5a52]'
                      } transition-colors`}
                    >
                      {g.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid2">
            <label className="field">
              <span>Fascia Oraria Da</span>
              <input
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                step={1800}
              />
            </label>
            <label className="field">
              <span>Fascia Oraria A</span>
              <input
                type="time"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                step={1800}
              />
            </label>
          </div>

          <div className="grid3">
            <label className="field">
              <span>Pausa / Buffer tra incontri</span>
              <select
                value={buffer}
                onChange={(e) => setBuffer(Number(e.target.value))}
              >
                <option value={0}>Nessuna pausa</option>
                <option value={5}>5 minuti</option>
                <option value={10}>10 minuti</option>
                <option value={15}>15 minuti</option>
                <option value={30}>30 minuti</option>
              </select>
            </label>

            <label className="field">
              <span>Preavviso Minimo</span>
              <select
                value={notice}
                onChange={(e) => setNotice(Number(e.target.value))}
              >
                <option value={0}>Nessun preavviso</option>
                <option value={2}>2 ore prima</option>
                <option value={4}>4 ore prima</option>
                <option value={12}>12 ore prima</option>
                <option value={24}>24 ore (1 giorno)</option>
                <option value={48}>48 ore (2 giorni)</option>
              </select>
            </label>

            <label className="field">
              <span>Orizzonte Massimo</span>
              <select
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
              >
                <option value={7}>7 giorni in avanti</option>
                <option value={14}>14 giorni in avanti</option>
                <option value={30}>30 giorni (1 mese)</option>
                <option value={60}>60 giorni (2 mesi)</option>
                <option value={90}>90 giorni (3 mesi)</option>
              </select>
            </label>
          </div>

          {/* Tariffazione UCOIN / TWINT */}
          <div className="p-3 bg-[#f4efe4] border border-[#163a2a] rounded-xl flex items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#163a2a] block">
                Tariffa Incontro (Opzionale)
              </span>
              <span className="text-xs text-[#4f5a52]">
                Se impostata, il cliente può saldare con TWINT o con il borsellino UCOIN.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#fbf8f1] border border-[#163a2a] rounded-lg px-2.5 py-1">
                <span className="text-xs font-bold text-[#163a2a]">CHF</span>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={priceChf}
                  onChange={(e) => setPriceChf(Math.max(0, Number(e.target.value)))}
                  className="w-16 border-0 bg-transparent font-bold text-sm text-right focus:outline-none"
                />
              </div>
              <span className="text-xs font-semibold text-[#b08a3e]">
                ({formatUcoin(chfToUcoin(priceChf))})
              </span>
            </div>
          </div>

          <div className="dlg-foot">
            <button type="button" onClick={onClose} className="btn line">
              Annulla
            </button>
            <button type="submit" className="btn dark">
              <Check size={16} /> {isNew ? 'Crea Tipo di Slot' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
