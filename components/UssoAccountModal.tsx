import React, { useState, useEffect } from 'react';
import { UssoUser, VaultSyncStatus } from '../types';
import { getDisplayName, getUserSubtitle, getInitials, logout, login } from '../services/ussoAuth';
import { fetchVaultQuota } from '../services/vaultService';
import { fetchUcoinWallet, UcoinWalletInfo, formatChf } from '../services/ucoinService';
import { ShieldCheck, Database, Wallet, LogOut, X, ExternalLink, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  user: UssoUser | null;
  syncStatus: VaultSyncStatus;
  onClose: () => void;
  onForceSync: () => void;
}

export const UssoAccountModal: React.FC<Props> = ({ user, syncStatus, onClose, onForceSync }) => {
  const [wallet, setWallet] = useState<UcoinWalletInfo | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [quota, setQuota] = useState<{ usedBytes: number; totalBytes: number }>({
    usedBytes: syncStatus.quotaUsedBytes || 154200,
    totalBytes: syncStatus.quotaTotalBytes || 1073741824
  });

  useEffect(() => {
    fetchUcoinWallet(user).then(setWallet);
    fetchVaultQuota().then(setQuota);
  }, [user]);

  const usedKb = (quota.usedBytes / 1024).toFixed(1);
  const totalMb = (quota.totalBytes / (1024 * 1024)).toFixed(0);
  const percent = Math.min(100, Math.max(1, Math.round((quota.usedBytes / quota.totalBytes) * 100)));

  const handleCopyUnhubId = () => {
    if (!user?.unhubId) return;
    navigator.clipboard.writeText(user.unhubId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog wide" role="dialog" aria-labelledby="dlg-usso-title">
        {/* Intestazione Profilo Conforme a Direttiva USSO 6.6 */}
        <div className="dlg-head">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[#163a2a] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {getInitials(user)}
            </span>
            <div>
              <h2 id="dlg-usso-title" className="text-xl font-bold text-[#163a2a]">
                {user ? getDisplayName(user) : 'Account Sovrano UnHub'}
              </h2>
              {/* Direttiva 6.6: mostra email o nickname semantico come sottotitolo, MAI l'hash grezzo */}
              <p className="text-xs text-[#4f5a52] m-0 font-medium">
                {getUserSubtitle(user)}
              </p>
            </div>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          {/* Box Archivio.ch Vault (Bunker Ginevra) */}
          <div className="p-4 rounded-xl border border-[#163a2a] bg-[#f4efe4] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f5a52] flex items-center gap-1.5">
                <Database size={15} className="text-[#163a2a]" /> Archivio.ch Vault
              </span>
              <span className="text-[11px] font-semibold bg-[#163a2a] text-white px-2 py-0.5 rounded-full">
                Bunker Ginevra dc4-a
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#4f5a52] mb-1 font-medium">
                <span>Spazio utilizzato: {usedKb} KB</span>
                <span>Quota: {totalMb} MB (1 GB Free)</span>
              </div>
              <div className="w-full bg-[#e4dccb] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#163a2a] h-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-[#4f5a52] space-y-1">
              <p className="m-0 flex items-center justify-between">
                <span>Crittografia:</span>
                <b className="text-[#163a2a]">Client-side AES-256 (UNV1)</b>
              </p>
              <p className="m-0 flex items-center justify-between">
                <span>Conformità legale:</span>
                <b className="text-[#163a2a]">CO art. 958f / nLPD</b>
              </p>
              {syncStatus.sha256Hash && (
                <p className="m-0 flex items-center justify-between">
                  <span>Hash probatorio:</span>
                  <code className="text-[10px] text-[#163a2a] font-mono">
                    {syncStatus.sha256Hash.slice(0, 16)}...
                  </code>
                </p>
              )}
            </div>

            <button
              onClick={onForceSync}
              className="btn line mt-auto h-9 text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} className={syncStatus.state === 'syncing' ? 'animate-spin' : ''} />
              Sincronizza ora con Archivio.ch
            </button>
          </div>

          {/* Box Borsellino UCOIN & Identità (Direttiva 6.6) */}
          <div className="p-4 rounded-xl border border-[#163a2a] bg-[#f4efe4] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4f5a52] flex items-center gap-1.5">
                <Wallet size={15} className="text-[#b08a3e]" /> Borsellino UCOIN
              </span>
              <span className="text-[11px] font-semibold bg-[#b08a3e] text-white px-2 py-0.5 rounded-full">
                Circuito Chiuso FINMA
              </span>
            </div>

            {/* Saldo formattato come: X UCOIN ≈ CHF Y.YY (Direttiva 6.6) */}
            <div className="bg-[#fbf8f1] p-3 rounded-lg border border-[#e4dccb]">
              <span className="text-xs text-[#4f5a52] block font-medium">Saldo disponibile:</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-[#163a2a]">
                  {wallet?.balance ?? 150} UCOIN
                </span>
                <span className="text-sm font-semibold text-[#b08a3e]">
                  ≈ {formatChf(wallet?.balanceChf ?? 15.0)}
                </span>
              </div>
              <p className="text-[11px] text-[#4f5a52] m-0 mt-1">
                Tasso ufficiale garantito: 10 UCOIN = CHF 1.00. Zero commissioni interne.
              </p>
            </div>

            {/* Identificativo unhubId in sezione dedicata con font monospace (Direttiva 6.6) */}
            {user?.unhubId && (
              <div className="p-2.5 bg-[#fbf8f1] border border-[#e4dccb] rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#4f5a52] block">
                    Borsellino Sovrano (unhubId)
                  </span>
                  <code className="text-[11px] font-mono font-bold text-[#163a2a]">
                    {user.unhubId.slice(0, 10)}...{user.unhubId.slice(-6)}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUnhubId}
                  className="icon-btn h-7 w-7 text-xs border border-[#163a2a]"
                  title="Copia UnHub ID completo"
                >
                  {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            )}

            {/* Link di Ritorno IdP & Ricarica UCOIN (Direttiva 6.6) */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <a
                href="https://usso.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#163a2a] font-bold hover:underline inline-flex items-center gap-1"
              >
                Gestisci l'account USSO <ExternalLink size={12} />
              </a>
              <a
                href="https://ucoin.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b08a3e] font-bold hover:underline inline-flex items-center gap-1"
              >
                Ricarica UCOIN <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Collegamento cross-satellite taccuino.ch */}
        <div className="p-3 bg-[#fbf8f1] border border-[#e4dccb] rounded-xl text-xs text-[#4f5a52] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🛰️</span>
            <span>
              Tutti gli appuntamenti possono generare automaticamente note e verbali su{' '}
              <b className="text-[#163a2a]">taccuino.ch</b>.
            </span>
          </div>
          <a
            href="https://taccuino.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b3202a] font-bold hover:underline whitespace-nowrap ml-2"
          >
            Apri taccuino.ch →
          </a>
        </div>

        {/* Footer con azione di Logout o Login */}
        <div className="dlg-foot">
          {user ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="btn line text-[#b3202a] hover:bg-[#fbeeee] hover:border-[#b3202a]"
            >
              <LogOut size={15} /> Esci da USSO
            </button>
          ) : (
            <button
              onClick={() => {
                login();
                onClose();
              }}
              className="btn dark"
            >
              <ShieldCheck size={15} /> Accedi con USSO (Passkey FIDO2)
            </button>
          )}
          <span className="spacer" />
          <button className="btn line" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
