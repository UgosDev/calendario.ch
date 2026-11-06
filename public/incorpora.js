/**
 * incorpora.js — Script sovrano di embedding per calendario.ch
 * Ecosistema UnHub • Nessun cookie o tracciante di terze parti
 */
(() => {
  'use strict';

  function initCalendarioEmbed() {
    const origin = window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://calendario.ch';

    // 1. Moduli Inline (data-modo="pagina")
    const inlines = document.querySelectorAll('[data-calendario][data-modo="pagina"]:not([data-cal-inited])');
    inlines.forEach((el) => {
      el.setAttribute('data-cal-inited', 'true');
      const path = el.getAttribute('data-calendario') || '';
      const tema = el.getAttribute('data-tema') || 'standard';
      const variante = el.getAttribute('data-variante') || 'compatta';

      const iframe = document.createElement('iframe');
      iframe.src = `${origin}/?view=pub&path=${encodeURIComponent(path)}&tema=${tema}&variante=${variante}&embed=1`;
      iframe.style.width = '100%';
      iframe.style.minHeight = variante === 'completa' ? '680px' : '520px';
      iframe.style.border = '0';
      iframe.style.borderRadius = '16px';
      iframe.style.boxShadow = '0 4px 20px rgba(22, 58, 42, 0.08)';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allow', 'clipboard-write');
      el.appendChild(iframe);
    });

    // 2. Pulsanti Popup (data-modo="finestra")
    const popups = document.querySelectorAll('[data-calendario][data-modo="finestra"]:not([data-cal-inited])');
    popups.forEach((btn) => {
      btn.setAttribute('data-cal-inited', 'true');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const path = btn.getAttribute('data-calendario') || '';
        const tema = btn.getAttribute('data-tema') || 'standard';
        const variante = btn.getAttribute('data-variante') || 'compatta';

        // Crea overlay modale
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(22, 58, 42, 0.45)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '16px';

        const dialog = document.createElement('div');
        dialog.style.position = 'relative';
        dialog.style.width = '100%';
        dialog.style.maxWidth = '560px';
        dialog.style.maxHeight = '90vh';
        dialog.style.background = '#fbf8f1';
        dialog.style.borderRadius = '20px';
        dialog.style.overflow = 'hidden';
        dialog.style.boxShadow = '0 20px 50px rgba(22, 58, 42, 0.25)';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '12px';
        closeBtn.style.width = '36px';
        closeBtn.style.height = '36px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.border = '1.5px solid #163a2a';
        closeBtn.style.background = '#fbf8f1';
        closeBtn.style.color = '#163a2a';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.zIndex = '2';

        const close = () => overlay.remove();
        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (ev) => {
          if (ev.target === overlay) close();
        });

        const iframe = document.createElement('iframe');
        iframe.src = `${origin}/?view=pub&path=${encodeURIComponent(path)}&tema=${tema}&variante=${variante}&embed=1`;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = '0';

        dialog.appendChild(closeBtn);
        dialog.appendChild(iframe);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendarioEmbed);
  } else {
    initCalendarioEmbed();
  }
})();
