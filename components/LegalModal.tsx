import React, { useState } from 'react';
import { ShieldCheck, FileText, Building2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'impressum' | 'terms';
}

export const LegalModal: React.FC<Props> = ({ isOpen, onClose, defaultTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'impressum' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog wide" role="dialog" aria-labelledby="dlg-legal-title">
        <div className="dlg-head">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--ink)] text-white flex items-center justify-center">
              <ShieldCheck size={18} />
            </span>
            <h2 id="dlg-legal-title" className="text-lg font-bold text-[var(--ink)]">
              Informazioni Legali & Conformità Svizzera
            </h2>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 border-b border-[var(--line)] pb-2 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:bg-[var(--paper)]'
            }`}
          >
            Protezione Dati (nLPD)
          </button>
          <button
            onClick={() => setActiveTab('impressum')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              activeTab === 'impressum'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:bg-[var(--paper)]'
            }`}
          >
            Impressum
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              activeTab === 'terms'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:bg-[var(--paper)]'
            }`}
          >
            Condizioni d'Uso
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs text-[var(--muted)] leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--ink)]">
                Informativa sulla Protezione dei Dati (Legge Federale nLPD, RS 235.1)
              </h3>
              <p>
                <b>1. Principio di Sovranità & Privacy-by-Design:</b> calendario.ch opera secondo il principio
                della sovranità digitale. I dati inseriti dall'utente e dai clienti non vengono ceduti, venduti,
                né profilati da circuiti pubblicitari. Tutti i font e le risorse sono self-hosted su infrastrutture
                svizzere, senza alcun contatto con Google Fonts o reti pubblicitarie Big Tech.
              </p>
              <p>
                <b>2. Dati di Prenotazione:</b> Quando prenoti un appuntamento tramite una pagina pubblica,
                i dati comunicati (nome, cognome, e-mail, telefono e nota facoltativa) sono trattati esclusivamente
                per finalità di fissazione, conferma e gestione dell'incontro con il titolare dell'agenda.
              </p>
              <p>
                <b>3. Luogo del Trattamento & Hosting:</b> L'infrastruttura applicativa è ospitata in Svizzera
                (cluster Caddy/pagine.ch e cloud sovrano Infomaniak, con datacenters a Ginevra e Winterthur). I dati
                archiviati risiedono in Svizzera in conformità all'art. 958f del Codice delle Obbligazioni (CO).
              </p>
              <p>
                <b>4. Diritti dell'Interessato:</b> Ai sensi degli artt. 25-29 nLPD, hai diritto di ottenere in
                qualsiasi momento la conferma dell'esistenza dei tuoi dati, l'accesso, la rettifica e la cancellazione.
              </p>
            </div>
          )}

          {activeTab === 'impressum' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--ink)]">Impressum</h3>
              <p>
                <b>calendario.ch</b> — Piattaforma elvetica di scheduling e calendario sovrano.
              </p>
              <p>
                <b>Ecosistema:</b> UnHub Svizzera<br />
                <b>Infrastruttura:</b> pagine.ch (Caddy Edge Svizzera) & Infomaniak Network SA (Ginevra)<br />
                <b>Identità & Autenticazione:</b> USSO.ch (Universal Sovereign SSO, Passkeys FIDO2)<br />
                <b>Custodia Documentale:</b> Archivio.ch (Bunker Ginevra dc4-a)
              </p>
              <p>
                <b>Contatto supporto & DPO:</b> privacy@calendario.ch / info@unhub.ch
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--ink)]">Condizioni Generali di Servizio</h3>
              <p>
                <b>1. Uso del Servizio:</b> calendario.ch fornisce strumenti di pianificazione del tempo,
                gestione disponibilità ed esportazione standard iCalendar (RFC 5545).
              </p>
              <p>
                <b>2. Responsabilità del Contenuto:</b> Il proprietario dell'agenda è responsabile della
                definizione degli orari, delle tariffe applicate e della veridicità delle disponibilità indicate.
              </p>
              <p>
                <b>3. Foro Competente:</b> Per ogni controversia è applicabile esclusivamente il diritto materiale
                svizzero. Foro competente: Lugano (Ticino).
              </p>
            </div>
          )}
        </div>

        <div className="dlg-actions justify-end mt-4 pt-3 border-t border-[var(--line)]">
          <button onClick={onClose} className="btn dark text-xs h-8 px-4">
            Ho compreso
          </button>
        </div>
      </div>
    </div>
  );
};
