import React, { useState } from 'react';
import { SlotType, EmbedConfig } from '../types';
import {
  parseKey,
  keyFromDate,
  addDaysToKey,
  GIORNI_BREVI_IT,
  MESI_IT,
  formatMinutesToClock
} from '../services/swissHolidays';
import { calculateFreeSlots } from '../services/calendarEngine';
import { Copy, Check, Smartphone, Monitor, ArrowLeft, ExternalLink } from 'lucide-react';

interface Props {
  slotTypes: SlotType[];
  initialSlotId?: string;
  handle: string;
  ownerName: string;
  onBackToSlots: () => void;
  onToast: (msg: string) => void;
}

const FORMATS: { key: EmbedConfig['format']; title: string; desc: string }[] = [
  { key: 'link', title: 'Link Diretto', desc: 'Ideale per firme e-mail, messaggi WhatsApp o post social.' },
  { key: 'popup', title: 'Pulsante Popup', desc: 'Un elegante bottone sul tuo sito che apre una finestra modale protetta.' },
  { key: 'inline', title: 'Modulo Incorporato', desc: 'L\'intero calendario di prenotazione inserito direttamente nel corpo della pagina.' },
  { key: 'pagine', title: 'Blocco pagine.ch 🇨🇭', desc: 'Integrazione nativa istantanea nel builder sovrano di pagine.ch.' }
];

export const EmbedView: React.FC<Props> = ({
  slotTypes,
  initialSlotId,
  handle,
  ownerName,
  onBackToSlots,
  onToast
}) => {
  if (slotTypes.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[var(--cream)] border border-[var(--edge)] rounded-2xl text-center shadow-lg">
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Nessun tipo di slot disponibile</h2>
        <p className="text-xs text-[var(--muted)] mb-6">
          Per poter generare i codici di incorporamento o i link di prenotazione per il tuo sito o pagine.ch, devi prima configurare almeno un tipo di slot.
        </p>
        <button type="button" onClick={onBackToSlots} className="btn dark text-xs">
          Configura il tuo primo slot
        </button>
      </div>
    );
  }

  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    initialSlotId || slotTypes[0]?.id || ''
  );
  const [format, setFormat] = useState<EmbedConfig['format']>('pagine');
  const [tema, setTema] = useState<'standard' | 'neutro'>('standard');
  const [variante, setVariante] = useState<'compatta' | 'completa'>('compatta');
  const [buttonLabel, setButtonLabel] = useState('Prenota un appuntamento');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const selectedSlot = slotTypes.find((t) => t.id === selectedSlotId) || slotTypes[0];
  const path = `${handle}/${selectedSlot?.slug || 'consulenza'}`;
  const directUrl = `https://calendario.ch/${path}`;

  // Generatore Codice Snippet
  let embedCode = '';
  if (format === 'link') {
    embedCode = `<a href="${directUrl}" target="_blank" rel="noopener">${buttonLabel}</a>`;
  } else if (format === 'popup') {
    embedCode = `<script src="https://calendario.ch/incorpora.js" async></script>\n<button type="button" data-calendario="${path}" data-modo="finestra" data-tema="${tema}" data-variante="${variante}">${buttonLabel}</button>`;
  } else if (format === 'inline') {
    embedCode = `<div data-calendario="${path}" data-modo="pagina" data-tema="${tema}" data-variante="${variante}"></div>\n<script src="https://calendario.ch/incorpora.js" async></script>`;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    onToast('Codice di incorporamento copiato negli appunti');
  };

  // Mock slot dates per il widget in anteprima
  const todayKey = keyFromDate(new Date());
  const previewDays = [0, 1, 2, 3, 4].map((i) => addDaysToKey(todayKey, i));
  const [activePreviewDay, setActivePreviewDay] = useState(previewDays[0]);

  return (
    <div className="emb">
      {/* Colonna Configurazione Sinistra */}
      <section className="panel emb-cfg" aria-label="Impostazioni incorporamento">
        <button
          type="button"
          onClick={onBackToSlots}
          className="btn ghost self-start h-8 p-0 text-[var(--ink)] flex items-center gap-1 font-bold"
        >
          <ArrowLeft size={16} /> Torna a Slot Condivisi
        </button>

        <div>
          <span className="lbl text-[var(--muted)]">Integrazione Sovrana</span>
          <h1 className="h1 text-[var(--ink)] text-xl">Incorpora su altri siti</h1>
        </div>

        {/* Selezione Slot */}
        <label className="field">
          <span>Tipo di Slot</span>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
          >
            {slotTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.duration} min)
              </option>
            ))}
          </select>
        </label>

        {/* Selezione Formato */}
        <fieldset className="emb-fmt">
          <legend className="lbl text-[var(--ink)]">Formato d'integrazione</legend>
          {FORMATS.map((fmt, idx) => (
            <button
              key={fmt.key}
              type="button"
              className="fmt"
              onClick={() => {
                setFormat(fmt.key);
                setIsPopupOpen(false);
              }}
              aria-pressed={format === fmt.key}
            >
              <span className="n">{String(idx + 1).padStart(2, '0')}</span>
              <span>
                <b>{fmt.title}</b>
                <small>{fmt.desc}</small>
              </span>
            </button>
          ))}
        </fieldset>

        {/* Personalizzazione Stile */}
        {format !== 'link' && (
          <>
            <div className="field">
              <span>Tema Visivo</span>
              <div className="seg">
                <button
                  type="button"
                  onClick={() => setTema('standard')}
                  aria-pressed={tema === 'standard'}
                >
                  calendario.ch
                </button>
                <button
                  type="button"
                  onClick={() => setTema('neutro')}
                  aria-pressed={tema === 'neutro'}
                >
                  Neutro
                </button>
              </div>
            </div>

            <div className="field">
              <span>Variante</span>
              <div className="seg">
                <button
                  type="button"
                  onClick={() => setVariante('compatta')}
                  aria-pressed={variante === 'compatta'}
                >
                  Compatta
                </button>
                <button
                  type="button"
                  onClick={() => setVariante('completa')}
                  aria-pressed={variante === 'completa'}
                >
                  Completa
                </button>
              </div>
            </div>
          </>
        )}

        {(format === 'link' || format === 'popup') && (
          <label className="field">
            <span>Testo del {format === 'link' ? 'Link' : 'Pulsante'}</span>
            <input
              type="text"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              maxLength={40}
            />
          </label>
        )}

        {/* Toggle Dispositivo */}
        <div className="field">
          <span>Anteprima Dispositivo</span>
          <div className="seg">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              aria-pressed={device === 'desktop'}
              className="flex items-center gap-1 justify-center"
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              aria-pressed={device === 'mobile'}
              className="flex items-center gap-1 justify-center"
            >
              <Smartphone size={14} /> Telefono
            </button>
          </div>
        </div>
      </section>

      {/* Colonna Anteprima Destra */}
      <div className="emb-right">
        <div className={`emb-prev ${device === 'mobile' ? 'mob' : ''}`}>
          <div className="emb-cap">
            Anteprima · {format === 'pagine' ? 'Builder di pagine.ch' : 'Sito Web Ospite'}
          </div>

          {/* Builder di pagine.ch Mockup su Desktop */}
          {format === 'pagine' && device === 'desktop' ? (
            <div className="bld">
              <div className="bld-top">
                <b>pagine.ch</b>
                <span className="bld-page">Studio Legale & Fiduciario / Home</span>
                <span className="bld-sp" />
                <span className="bld-b">Anteprima</span>
                <span className="bld-b dark">Pubblica</span>
              </div>
              <div className="bld-body">
                {/* Colonna Blocchi pagine.ch */}
                <aside className="bld-blocks">
                  <span className="lbl text-[var(--muted)]">Blocchi</span>
                  <div className="bld-item">Titolo</div>
                  <div className="bld-item">Paragrafo</div>
                  <div className="bld-item">Immagine</div>
                  <div className="bld-item on font-bold">
                    <span>📅</span> Prenotazioni
                  </div>
                  <div className="bld-item">Modulo</div>
                  <div className="bld-item">Mappa</div>
                </aside>

                {/* Canvas di pagine.ch */}
                <div className="bld-canvas">
                  <div className="site">
                    <div className="host-nav">
                      <b>Studio Riva & Partner</b>
                      <span>Servizi</span>
                      <span>Chi siamo</span>
                      <span>Contatti</span>
                    </div>
                    <div className="host-main host-split">
                      <div className="host-text">
                        <small>Consulenze a Lugano e Online</small>
                        <h3>Parliamo del tuo progetto</h3>
                        <p>
                          Ogni collaborazione parte da un dialogo chiaro. Scegli
                          l'orario più comodo per incontrarci.
                        </p>
                      </div>

                      {/* Blocco Prenotazioni Sovrano Selezionato */}
                      <div className="bld-sel">
                        <span className="bld-tag">
                          Prenotazioni · calendario.ch 🇨🇭
                        </span>
                        {/* Widget live */}
                        <div className={`wg ${tema}`}>
                          <div className="wg-head">
                            <span className="avatar w-8 h-8 text-xs">EB</span>
                            <div>
                              <b className="text-xs">{selectedSlot.name}</b>
                              <small className="block text-[11px] text-[var(--muted)]">
                                {ownerName} · {selectedSlot.duration} min
                              </small>
                            </div>
                          </div>
                          <div className="wg-days">
                            {previewDays.map((k) => {
                              const d = parseKey(k);
                              return (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => setActivePreviewDay(k)}
                                  aria-pressed={activePreviewDay === k}
                                >
                                  <span className="text-[10px]">
                                    {GIORNI_BREVI_IT[d.getDay()]}
                                  </span>
                                  <b className="text-xs">{d.getDate()}</b>
                                </button>
                              );
                            })}
                          </div>
                          <div className="wg-times">
                            {['09:00', '10:30', '14:00', '15:30'].map((time) => (
                              <button key={time} type="button">
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inspector Ispettore Blocco pagine.ch */}
                <aside className="bld-insp">
                  <div>
                    <span className="lbl text-[var(--muted)]">Blocco selezionato</span>
                    <div className="font-bold text-base text-[var(--ink)]">Prenotazioni</div>
                  </div>
                  <div className="bld-acc">
                    <span className="avatar w-8 h-8 text-xs">EB</span>
                    <div>
                      <b className="text-xs">calendario.ch/{handle}</b>
                      <small className="block text-[11px] text-[var(--muted)]">
                        Account Sovrano Collegato
                      </small>
                    </div>
                  </div>
                  <label className="field">
                    <span>Slot associato</span>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                    >
                      {slotTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-[11px] text-[var(--muted)] m-0">
                    Gli orari arrivano istantaneamente da <b>calendario.ch</b> e le
                    richieste sono sincronizzate nel Caveau di <b>Archivio.ch</b>.
                  </p>
                </aside>
              </div>
            </div>
          ) : (
            /* Sito Web Ospite Esterno */
            <div className="site">
              <div className="host-nav">
                <b>Studio Riva</b>
                <span>Servizi</span>
                <span>Contatti</span>
              </div>
              <div
                className={`host-main ${
                  format === 'inline' || format === 'pagine' ? 'host-split' : ''
                }`}
              >
                <div className="host-text">
                  <small>Consulenze a Mendrisio e Online</small>
                  <h3>Parliamo del tuo progetto</h3>
                  <p>
                    Raccontaci cosa hai in mente. In mezz'ora capiamo insieme se e come
                    possiamo aiutarti.
                  </p>

                  {format === 'link' && (
                    <p className="mt-2">
                      Preferisci scegliere tu l'orario?{' '}
                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="host-a underline font-bold"
                      >
                        {buttonLabel} →
                      </a>
                    </p>
                  )}

                  {format === 'popup' && (
                    <button
                      type="button"
                      onClick={() => setIsPopupOpen(true)}
                      className={`host-btn ${tema}`}
                    >
                      {buttonLabel}
                    </button>
                  )}
                </div>

                {(format === 'inline' || format === 'pagine') && (
                  <div className={`wg ${tema}`}>
                    <div className="wg-head">
                      <span className="avatar w-8 h-8 text-xs">EB</span>
                      <div>
                        <b className="text-xs">{selectedSlot.name}</b>
                        <small className="block text-[11px] text-[var(--muted)]">
                          {ownerName} · {selectedSlot.duration} min
                        </small>
                      </div>
                    </div>
                    <div className="wg-days">
                      {previewDays.map((k) => {
                        const d = parseKey(k);
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setActivePreviewDay(k)}
                            aria-pressed={activePreviewDay === k}
                          >
                            <span className="text-[10px]">
                              {GIORNI_BREVI_IT[d.getDay()]}
                            </span>
                            <b className="text-xs">{d.getDate()}</b>
                          </button>
                        );
                      })}
                    </div>
                    <div className="wg-times">
                      {['09:00', '10:30', '14:00', '15:30'].map((time) => (
                        <button key={time} type="button">
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Popup Simulato */}
              {format === 'popup' && isPopupOpen && (
                <div
                  className="host-ov absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-10"
                  onClick={() => setIsPopupOpen(false)}
                >
                  <div
                    className="relative w-full max-w-md bg-[var(--cream)] rounded-2xl p-4 shadow-2xl border border-[var(--edge)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setIsPopupOpen(false)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full border border-[var(--edge)] flex items-center justify-center text-xs font-bold"
                    >
                      ✕
                    </button>
                    <div className={`wg ${tema} mt-2`}>
                      <div className="wg-head">
                        <span className="avatar w-8 h-8 text-xs">EB</span>
                        <div>
                          <b className="text-xs">{selectedSlot.name}</b>
                          <small className="block text-[11px] text-[var(--muted)]">
                            {ownerName} · {selectedSlot.duration} min
                          </small>
                        </div>
                      </div>
                      <div className="wg-days">
                        {previewDays.map((k) => {
                          const d = parseKey(k);
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setActivePreviewDay(k)}
                              aria-pressed={activePreviewDay === k}
                            >
                              <span className="text-[10px]">
                                {GIORNI_BREVI_IT[d.getDay()]}
                              </span>
                              <b className="text-xs">{d.getDate()}</b>
                            </button>
                          );
                        })}
                      </div>
                      <div className="wg-times">
                        {['09:00', '10:30', '14:00', '15:30'].map((time) => (
                          <button key={time} type="button">
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Box Istruzioni o Codice da Copiare */}
        <section className="panel" aria-label="Codice o istruzioni d'incorporamento">
          {format === 'pagine' ? (
            <div className="flex flex-col gap-2">
              <h2 className="lbl text-[var(--ink)]">Come aggiungerlo su pagine.ch</h2>
              <ol className="m-0 pl-5 text-xs text-[var(--muted)] space-y-1.5 list-decimal font-medium">
                <li>Nel builder di <b>pagine.ch</b> scegli <b>Aggiungi blocco</b>.</li>
                <li>Seleziona il blocco <b>Prenotazioni (calendario.ch) 🇨🇭</b>.</li>
                <li>
                  Collega il tuo account USSO e seleziona il servizio <b>{selectedSlot.name}</b>.
                </li>
                <li>Pubblica il sito: nessun codice manuale da incollare!</li>
              </ol>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="lbl text-[var(--ink)]">Codice HTML / JS da incollare</h2>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="btn dark text-xs h-8 px-3"
                >
                  <Copy size={13} /> Copia Codice
                </button>
              </div>
              <pre className="code">
                <code>{embedCode}</code>
              </pre>
              <p className="text-xs text-[var(--muted)] m-0">
                Incollalo nel punto desiderato della tua pagina web. Funziona con qualsiasi
                piattaforma senza richiedere cookie né cessione di dati a terzi.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
