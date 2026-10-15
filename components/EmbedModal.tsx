import React, { useState } from 'react';
import { X, Copy, Check, Code, Layers, ExternalLink } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  isOpen,
  onClose,
  handle,
}) => {
  const [copiedType, setCopiedType] = useState<'iframe' | 'pagine' | null>(null);

  if (!isOpen) return null;

  const embedUrl = `https://calendario.ch/embed/${handle}`;
  
  const iframeSnippet = `<iframe
  src="${embedUrl}"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 24px; border: 1px solid #262626; background: #000000;"
  allow="payment"
></iframe>`;

  const pagineSnippet = `// Nel builder di pagine.ch:
// Inserisci il blocco "calendario-embed" con l'handle:
"${handle}"`;

  const handleCopy = (text: string, type: 'iframe' | 'pagine') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-[#0a0a0a] shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
              <Code size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Codice Embed per pagine.ch
              </h3>
              <p className="text-xs text-neutral-400">
                Incorpora il widget di prenotazione nel tuo sito web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Option 1: Native pagine.ch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Layers size={13} className="text-neutral-400" />
              <span>Integrazione Nativa pagine.ch</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-400">Consigliato</span>
          </div>
          <p className="text-xs text-neutral-400">
            Nel builder di <strong className="text-white">pagine.ch</strong>, clicca su <em>Aggiungi Blocco</em>, seleziona <em>"Calendario Appuntamenti"</em> e inserisci il tuo handle:
          </p>
          <div className="p-3 rounded-xl border border-neutral-800 bg-black font-mono text-xs text-white flex items-center justify-between">
            <span>{handle}</span>
            <button
              onClick={() => handleCopy(handle, 'pagine')}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] flex items-center gap-1 transition-colors"
            >
              {copiedType === 'pagine' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedType === 'pagine' ? 'Copiato' : 'Copia'}</span>
            </button>
          </div>
        </div>

        {/* Option 2: Universal iFrame */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Code size={13} className="text-neutral-400" />
              <span>Snippet HTML iFrame (Universale)</span>
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Per qualsiasi sito web HTML, WordPress o applicazione web:
          </p>
          <div className="relative">
            <pre className="p-3.5 rounded-xl border border-neutral-800 bg-black font-mono text-[11px] text-neutral-300 overflow-x-auto custom-scrollbar leading-relaxed">
              {iframeSnippet}
            </pre>
            <button
              onClick={() => handleCopy(iframeSnippet, 'iframe')}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] flex items-center gap-1 transition-colors shadow-sm"
            >
              {copiedType === 'iframe' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedType === 'iframe' ? 'Copiato' : 'Copia Snippet'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-all shadow-md"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
