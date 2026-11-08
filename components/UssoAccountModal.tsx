import React, { useState } from 'react';
import { UssoUser } from '../types';
import { getDisplayName, getUserSubtitle, getInitials, logout, login } from '../services/ussoAuth';
import { ShieldCheck, LogOut, X, ExternalLink, Copy, Check, KeyRound, StickyNote } from 'lucide-react';

interface Props {
  user: UssoUser | null;
  onClose: () => void;
}

export const UssoAccountModal: React.FC<Props> = ({ user, onClose }) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyUnhubId = () => {
    if (!user?.unhubId) return;
    navigator.clipboard.writeText(user.unhubId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-labelledby="dlg-usso-title">
        {/* Intestazione Profilo Conforme a Direttiva USSO 6.6 */}
        <div className="dlg-head">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[var(--ink)] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {getInitials(user)}
            </span>
            <div>
              <h2 id="dlg-usso-title" className="text-xl font-bold text-[var(--ink)]">
                {user ? getDisplayName(user) : 'Account USSO'}
              </h2>
              <p className="text-xs text-[var(--muted)] m-0 font-medium">
                {getUserSubtitle(user)}
              </p>
            </div>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="my-4 flex flex-col gap-4">
          {user ? (
            /* Utente Connesso con USSO */
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl border border-[var(--edge)] bg-[var(--paper)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-[var(--accent)]" /> Identità Sovrana Attiva
                  </span>
                  <span className="text-[11px] font-semibold bg-[var(--accent)] text-white px-2.5 py-0.5 rounded-full">
                    Passkey FIDO2
                  </span>
                </div>

                <div className="text-xs text-[var(--muted)] space-y-1.5 pt-1">
                  {user.name && (
                    <div className="flex justify-between items-center">
                      <span>Nome:</span>
                      <b className="text-[var(--ink)]">{user.name}</b>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex justify-between items-center">
                      <span>E-mail:</span>
                      <b className="text-[var(--ink)]">{user.email}</b>
                    </div>
                  )}
                  {user.nickname && (
                    <div className="flex justify-between items-center">
                      <span>Handle:</span>
                      <b className="text-[var(--ink)] font-mono">@{user.nickname}</b>
                    </div>
                  )}
                </div>

                {user.unhubId && (
                  <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                        Identificativo Sovrano (unhubId)
                      </span>
                      <code className="text-[11px] font-mono font-bold text-[var(--ink)]">
                        {user.unhubId.length > 24
                          ? `${user.unhubId.slice(0, 12)}...${user.unhubId.slice(-8)}`
                          : user.unhubId}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUnhubId}
                      className="btn line text-xs h-7 px-2 flex items-center gap-1"
                      title="Copia identificativo"
                    >
                      {copiedId ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      {copiedId ? 'Copiato' : 'Copia'}
                    </button>
                  </div>
                )}
              </div>

              {/* Link Gestione USSO */}
              <div className="flex items-center justify-between text-xs px-1 text-[var(--muted)]">
                <a
                  href="https://usso.ch/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--accent)] hover:underline font-medium"
                >
                  Gestisci il tuo profilo su usso.ch <ExternalLink size={12} />
                </a>
                <a
                  href="https://usso.ch/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--muted)] hover:underline"
                >
                  Permessi concessi <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ) : (
            /* Utente Ospite / Non Connesso */
            <div className="p-5 rounded-xl border border-[var(--edge)] bg-[var(--paper)] text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--cream)] border border-[var(--edge)] flex items-center justify-center text-[var(--ink)]">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)] mb-1">
                  Accesso Sovrano Senza Password
                </h3>
                <p className="text-xs text-[var(--muted)] max-w-sm m-0">
                  Accedi con la tua Passkey biometrica FIDO2 (Touch ID, Face ID o chiave hardware) per gestire il tuo calendario e condividere i tuoi slot.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  login();
                  onClose();
                }}
                className="btn dark text-xs h-9 px-4 flex items-center gap-2 mt-1"
              >
                <ShieldCheck size={15} /> Accedi con USSO (Passkey FIDO2)
              </button>
            </div>
          )}

          {/* Collegamento Taccuino rapido */}
          <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-xl flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="flex items-center gap-2">
              <StickyNote size={15} className="text-[var(--ink)]" />
              Verbale o appunti d'incontro?
            </span>
            <a
              href="https://taccuino.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] font-bold hover:underline"
            >
              Apri taccuino.ch →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="dlg-foot">
          {user && (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="btn line text-[var(--accent)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)] text-xs h-9"
            >
              <LogOut size={15} /> Esci da USSO
            </button>
          )}
          <span className="spacer" />
          <button className="btn line text-xs h-9 px-4" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
