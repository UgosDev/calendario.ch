import React, { useState } from 'react';
import { StickyNote, ExternalLink, Check } from 'lucide-react';
import { openMeetingNoteInTaccuino, copyMeetingNoteMarkdown, MeetingNotePayload } from '../services/taccuinoBridge';

interface TaccuinoCardProps {
  item: MeetingNotePayload;
  onToast?: (msg: string) => void;
  className?: string;
}

export const TaccuinoCard: React.FC<TaccuinoCardProps> = ({
  item,
  onToast,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleOpenBubble = async () => {
    await copyMeetingNoteMarkdown(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);

    openMeetingNoteInTaccuino(item, {
      mode: 'bubble',
      onCopied: () => {
        onToast?.('Bolla fluttuante aperta: template del verbale copiato negli appunti!');
      }
    });
  };

  const handleOpenTab = () => {
    openMeetingNoteInTaccuino(item, { mode: 'tab' });
  };

  return (
    <div
      className={`p-3 sm:p-3.5 bg-[var(--paper)] border border-[var(--edge)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs ${className}`}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-[#fff4cf] dark:bg-[#38321e] text-[#92400e] dark:text-[#fde68a] flex items-center justify-center shrink-0 border border-[#edd9a3]/50 shadow-xs">
          <StickyNote size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[var(--ink)] tracking-tight">taccuino.ch</span>
            <span className="text-[10px] uppercase font-semibold text-[var(--muted)] px-1.5 py-0.2 rounded bg-[var(--cream)] border border-[var(--edge)]">
              Verbale & Note
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] m-0 mt-0.5 leading-snug">
            Prendi appunti nella bolla fluttuante o redigi il verbale d'incontro.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <button
          type="button"
          onClick={handleOpenBubble}
          className="btn line h-8 px-3 text-xs font-semibold gap-1.5 rounded-full hover:bg-[#fff4cf] hover:text-[#92400e] hover:border-[#edd9a3] transition-all"
          title="Apri la bolla fluttuante (post-it) sul calendario e copia il modello del verbale negli appunti"
        >
          {copied ? <Check size={13} className="text-emerald-600" /> : <StickyNote size={13} />}
          <span>{copied ? 'Copiato & Aperto' : 'Bolla fluttuante'}</span>
        </button>
        <button
          type="button"
          onClick={handleOpenTab}
          className="btn line h-8 px-2.5 text-xs font-semibold gap-1 rounded-full hover:bg-[var(--ink)] hover:text-white transition-all"
          title="Apri a schermo intero su taccuino.ch in una nuova scheda"
        >
          <span>Apri su taccuino.ch</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
};
