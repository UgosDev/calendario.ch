/**
 * widget.js — Loader del post-it di taccuino.ch (stile Carta)
 *
 * Uso nei portali UnHub (es. laspesa.ch):
 *   <script src="https://taccuino.ch/widget.js"
 *           data-origin="laspesa.ch" data-tag="spesa"
 *           data-side="left" data-min-bottom="88" data-top-limit="80" defer></script>
 *
 *   data-side        lato iniziale del pulsante: "right" (predefinito) o "left"
 *   data-min-bottom  distanza minima dal fondo in px (es. sopra una barra di navigazione)
 *   data-top-limit   distanza minima dall'alto in px (es. sotto l'intestazione del sito)
 *
 * Il pulsante si trascina come quello di Ugo su laspesa.ch:
 *   - rilasciato, si attacca al lato più vicino;
 *   - rilasciato vicino al bordo, si aggancia: metà nascosto e più trasparente;
 *   - da agganciato, il primo tocco lo fa riemergere; poi un tocco apre il post-it.
 *   - da tastiera: frecce sinistra/destra cambiano lato, su/giù lo spostano.
 * La posizione resta salvata su questo sito (localStorage del sito ospite).
 *
 * Isolamento: pulsante e riquadro vivono in uno Shadow DOM chiuso, quindi i fogli di stile
 * del sito ospite non li toccano. Tutta la logica delle note sta nell'app dentro l'iframe:
 * questo file resta un "portiere" stabile e non va aggiornato quando cambia l'app.
 *
 * Account: se il sito ospite usa USSO, il widget comunica al post-it con quale account
 * l'utente è entrato (solo l'identificatore), e nel post-it si potrà usare solo quello.
 *
 * Protocollo con l'app (versione 1), via postMessage verso https://taccuino.ch:
 *   iframe → pagina: { type: 'TCH_READY', v: 1 }         l'app è pronta
 *   pagina → iframe: { type: 'TCH_HOST', v: 1, account }  account USSO del sito ospite o null
 *   iframe → pagina: { type: 'TCH_CLOSE' | 'TCH_MINIMIZE', v: 1 }
 *
 * API facoltativa: window.TaccuinoWidget.open() / .close() / .toggle() / .isOpen()
 */
(function () {
  if (window.__TCH_WIDGET_INITIALIZED__) return;
  window.__TCH_WIDGET_INITIALIZED__ = true;

  // ── Parametri dallo script tag ───────────────────────────────────────────
  var scriptEl = document.currentScript || document.querySelector('script[src*="widget.js"]');
  function attr(name, fallback) {
    var v = scriptEl && scriptEl.getAttribute(name);
    return v == null || v === '' ? fallback : v;
  }
  function attrNum(name, fallback) {
    var n = parseInt(attr(name, ''), 10);
    return isNaN(n) ? fallback : Math.max(0, n);
  }
  var originName = attr('data-origin', window.location.hostname || 'laspesa.ch');
  var defaultTag = attr('data-tag', 'spesa');
  var defaultSide = attr('data-side', 'right') === 'left' ? 'left' : 'right';
  var MIN_BOTTOM = attrNum('data-min-bottom', 24);
  var TOP_LIMIT = attrNum('data-top-limit', 16);

  var tchBaseUrl = 'https://taccuino.ch';
  if (scriptEl && scriptEl.src) {
    try {
      var scriptOrigin = new URL(scriptEl.src, window.location.href).origin;
      if (scriptOrigin.indexOf('taccuino') !== -1 || scriptOrigin.indexOf(':4000') !== -1) {
        tchBaseUrl = scriptOrigin;
      }
    } catch (e) { /* resta il default */ }
  }

  // ── Misure ───────────────────────────────────────────────────────────────
  var SIZE = 56;            // diametro del pulsante
  var MARGIN = 16;          // distanza dal bordo quando non agganciato
  var PEEK = 28;            // parte visibile quando agganciato
  var DOCK_ZONE = 40;       // rilascio entro questa distanza dal bordo = aggancio
  var DRAG_THRESHOLD = 6;   // px prima che un tocco diventi trascinamento
  var GAP = 12;             // spazio tra pulsante e post-it
  var PANEL_W = 360, PANEL_H = 500;
  var KEY_STEP = 48;        // spostamento con le frecce
  var STORAGE_KEY = 'tchWidgetPos.v1';
  var PROTOCOL = 1;

  // ── Stili (prefisso tch- per non toccare il sito ospite) ─────────────────
  var style = document.createElement('style');
  style.id = 'tch-widget-styles';
  style.textContent = [
    ':host{ all:initial; }',
    ':host{',
    '  --tch-carta:#FFF4CF; --tch-foglio:#FFFDF8; --tch-inchiostro:#23211C; --tch-stilo:#2F4A7A;',
    '  --tch-ombra:0 14px 30px rgba(40,32,18,.22),0 2px 4px rgba(40,32,18,.12);',
    '  --tch-ombra-su:0 20px 40px rgba(40,32,18,.28),0 4px 8px rgba(40,32,18,.14);',
    '}',
    '@media (prefers-color-scheme: dark){',
    '  :host{ --tch-carta:#38321E; --tch-foglio:#24221E; --tch-inchiostro:#EDE9E1; --tch-stilo:#9DB4DE;',
    '    --tch-ombra:0 14px 30px rgba(0,0,0,.5),0 2px 4px rgba(0,0,0,.3);',
    '    --tch-ombra-su:0 20px 40px rgba(0,0,0,.6),0 4px 8px rgba(0,0,0,.35); }',
    '}',
    '#tch-widget-bubble{',
    '  position:fixed; z-index:2147483001; box-sizing:border-box;',
    '  width:' + SIZE + 'px; height:' + SIZE + 'px; margin:0; padding:0;',
    '  border-radius:9999px; border:1px solid rgba(35,33,28,.14);',
    '  background:var(--tch-carta); color:var(--tch-inchiostro); box-shadow:var(--tch-ombra);',
    '  display:flex; align-items:center; justify-content:center;',
    '  cursor:grab; touch-action:none; user-select:none; -webkit-user-select:none;',
    '  -webkit-tap-highlight-color:transparent;',
    '  transition:left .3s ease-out, top .3s ease-out, opacity .3s ease-out, transform .18s ease,',
    '             border-radius .3s ease-out, background-color .18s ease, box-shadow .18s ease;',
    '}',
    '#tch-widget-bubble:focus-visible{ outline:2px solid var(--tch-stilo); outline-offset:3px; }',
    '#tch-widget-bubble[aria-expanded="true"]{ background:var(--tch-inchiostro); color:var(--tch-foglio); border-color:transparent; }',
    '#tch-widget-bubble.tch-drag{ cursor:grabbing; transform:scale(1.08); box-shadow:var(--tch-ombra-su);',
    '  transition:transform .18s ease, box-shadow .18s ease; }',
    '#tch-widget-bubble.tch-docked{ opacity:.7; }',
    '#tch-widget-bubble.tch-docked:hover, #tch-widget-bubble.tch-docked:focus-visible{ opacity:1; }',
    '#tch-widget-bubble.tch-docked.tch-right{ border-radius:9999px 0 0 9999px; justify-content:flex-start; padding-left:2px; }',
    '#tch-widget-bubble.tch-docked.tch-left{ border-radius:0 9999px 9999px 0; justify-content:flex-end; padding-right:2px; }',
    '#tch-widget-bubble svg{ display:block; pointer-events:none; }',
    '#tch-widget-frame-wrapper{',
    '  position:fixed; z-index:2147483000; display:none; box-sizing:border-box;',
    '  border-radius:4px 4px 18px 4px; overflow:hidden;',
    '  background:var(--tch-carta); box-shadow:var(--tch-ombra);',
    '  opacity:0; transform:translateY(8px);',
    '  transition:opacity .2s ease, transform .22s cubic-bezier(.16,1,.3,1);',
    '}',
    '#tch-widget-frame-wrapper.tch-left{ border-radius:4px 4px 4px 18px; }',
    '#tch-widget-frame-wrapper.tch-open{ opacity:1; transform:translateY(0); }',
    '#tch-widget-iframe{ display:block; width:100%; height:100%; border:0; background:transparent; }',
    '@media (prefers-reduced-motion: reduce){',
    '  #tch-widget-bubble, #tch-widget-bubble.tch-drag, #tch-widget-frame-wrapper{ transition:none; }',
    '}'
  ].join('\n');

  // ── Icone ────────────────────────────────────────────────────────────────
  var ICON_NOTA =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/></svg>';
  var ICON_CHIUDI =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';

  // ── Posizione salvata ────────────────────────────────────────────────────
  function loadPos() {
    try {
      var p = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (p && (p.side === 'left' || p.side === 'right') && typeof p.bottom === 'number') {
        return { side: p.side, docked: !!p.docked, bottom: p.bottom };
      }
    } catch (e) { /* storage non disponibile: posizione predefinita */ }
    return { side: defaultSide, docked: false, bottom: MIN_BOTTOM };
  }
  function savePos(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) { /* ignora */ }
  }

  var pos = loadPos();
  var drag = null;        // { x, y } durante il trascinamento
  var gesture = null;     // { offX, offY, sx, sy, moved }
  var suppressClick = false;
  var isOpen = false;
  var hideTimer = null;

  function vw() { return document.documentElement.clientWidth || window.innerWidth; }
  function vh() { return window.innerHeight; }
  function clampBottom(b) {
    var max = vh() - TOP_LIMIT - SIZE;
    return Math.max(MIN_BOTTOM, Math.min(Math.max(MIN_BOTTOM, max), b));
  }
  function restLeft() {
    if (pos.side === 'right') return pos.docked ? vw() - PEEK : vw() - SIZE - MARGIN;
    return pos.docked ? PEEK - SIZE : MARGIN;
  }
  function restTop() { return vh() - clampBottom(pos.bottom) - SIZE; }

  // ── DOM ──────────────────────────────────────────────────────────────────
  var frameWrapper = document.createElement('div');
  frameWrapper.id = 'tch-widget-frame-wrapper';
  frameWrapper.className = 'tch-w';

  var iframe = null; // caricato solo alla prima apertura
  function ensureIframe() {
    if (iframe) return;
    iframe = document.createElement('iframe');
    iframe.id = 'tch-widget-iframe';
    iframe.title = 'Post-it di taccuino.ch';
    iframe.src = tchBaseUrl + '/?widget=true&v=1.0.4&origin=' + encodeURIComponent(originName) + '&tag=' + encodeURIComponent(defaultTag);
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('referrerpolicy', 'strict-origin');
    frameWrapper.appendChild(iframe);
  }

  var bubble = document.createElement('button');
  bubble.id = 'tch-widget-bubble';
  bubble.className = 'tch-w';
  bubble.type = 'button';
  bubble.setAttribute('aria-controls', 'tch-widget-frame-wrapper');
  bubble.setAttribute('aria-expanded', 'false');
  bubble.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp ArrowDown');
  bubble.innerHTML = ICON_NOTA;

  // ── Disegno ──────────────────────────────────────────────────────────────
  function placePanel(bLeft, bTop) {
    var W = vw(), H = vh();
    var narrow = W <= 480;
    var w = narrow ? W - 2 * MARGIN : Math.min(PANEL_W, W - 2 * MARGIN);
    var h = Math.min(PANEL_H, H - 2 * MARGIN - SIZE - GAP);
    if (narrow) h = Math.min(Math.round(H * 0.72), H - 2 * MARGIN - SIZE - GAP);
    h = Math.max(240, h);

    // Lato: quello del pulsante (o, durante il trascinamento, la metà in cui si trova)
    var side = drag ? (bLeft + SIZE / 2 < W / 2 ? 'left' : 'right') : pos.side;
    var left = side === 'right' ? W - MARGIN - w : MARGIN;
    var top;

    // Il post-it non copre mai il pulsante: sopra, sotto, di fianco, o accorciato
    var above = bTop - GAP - MARGIN;
    var below = H - (bTop + SIZE + GAP) - MARGIN;
    var besideFits = W >= w + SIZE + GAP + 2 * MARGIN;
    if (h <= above) {
      top = bTop - GAP - h;
    } else if (h <= below) {
      top = bTop + SIZE + GAP;
    } else if (besideFits) {
      left = side === 'right' ? bLeft - GAP - w : bLeft + SIZE + GAP;
      left = Math.max(MARGIN, Math.min(W - MARGIN - w, left));
      top = Math.max(MARGIN, Math.min(H - MARGIN - h, bTop + SIZE / 2 - h / 2));
    } else if (above >= below) {
      h = Math.max(200, above);
      top = bTop - GAP - h;
    } else {
      h = Math.max(200, below);
      top = bTop + SIZE + GAP;
    }
    top = Math.max(MARGIN, Math.min(H - MARGIN - h, top));

    frameWrapper.style.width = w + 'px';
    frameWrapper.style.height = h + 'px';
    frameWrapper.style.left = left + 'px';
    frameWrapper.style.top = top + 'px';
    frameWrapper.style.transformOrigin = (side === 'right' ? 'right ' : 'left ') + (top > bTop ? 'top' : 'bottom');
    frameWrapper.classList.toggle('tch-left', side === 'left');
  }

  function render() {
    var left = drag ? drag.x : restLeft();
    var top = drag ? drag.y : restTop();
    var docked = pos.docked && !drag;
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
    bubble.classList.toggle('tch-drag', !!drag);
    bubble.classList.toggle('tch-docked', docked);
    bubble.classList.toggle('tch-left', pos.side === 'left');
    bubble.classList.toggle('tch-right', pos.side === 'right');
    bubble.innerHTML = isOpen ? ICON_CHIUDI : ICON_NOTA;
    bubble.setAttribute('aria-label',
      isOpen ? 'Chiudi il post-it di taccuino.ch'
      : docked ? 'Post-it di taccuino.ch agganciato al bordo: premi per farlo uscire'
      : 'Apri il post-it di taccuino.ch. Trascina o usa le frecce per spostarlo');
    bubble.title = docked ? 'Premi per farlo uscire' : (isOpen ? 'Chiudi' : 'Post-it di taccuino.ch (trascina per spostarlo)');
    if (isOpen) placePanel(left, top);
  }

  // ── Apertura e chiusura ──────────────────────────────────────────────────
  function setOpen(next) {
    if (next === isOpen) return;
    isOpen = next;
    bubble.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      if (pos.docked) { pos.docked = false; savePos(pos); } // esce dal bordo per aprirsi
      ensureIframe();
      clearTimeout(hideTimer);
      frameWrapper.style.display = 'block';
      render();
      void frameWrapper.offsetWidth; // forza il repaint prima dell'animazione
      frameWrapper.classList.add('tch-open');
    } else {
      frameWrapper.classList.remove('tch-open');
      hideTimer = setTimeout(function () { if (!isOpen) frameWrapper.style.display = 'none'; }, 230);
      render();
      bubble.focus({ preventScroll: true });
    }
  }

  // ── Trascinamento (stessa logica di Ugo su laspesa.ch) ───────────────────
  bubble.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var r = bubble.getBoundingClientRect();
    gesture = { offX: e.clientX - r.left, offY: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
    try { bubble.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
  });

  bubble.addEventListener('pointermove', function (e) {
    var g = gesture;
    if (!g) return;
    if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < DRAG_THRESHOLD) return;
    g.moved = true;
    var x = Math.max(0, Math.min(vw() - SIZE, e.clientX - g.offX));
    var y = Math.max(TOP_LIMIT, Math.min(vh() - MIN_BOTTOM - SIZE, e.clientY - g.offY));
    drag = { x: x, y: y };
    render();
  });

  function endGesture(e, cancelled) {
    var g = gesture;
    gesture = null;
    try { bubble.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    if (cancelled || !g || !g.moved || !drag) { drag = null; render(); return; }
    suppressClick = true; // il click dopo il rilascio non deve aprire né chiudere
    var W = vw();
    pos = {
      side: drag.x + SIZE / 2 < W / 2 ? 'left' : 'right',
      // con il post-it aperto non si aggancia: resterebbe un pannello senza pulsante visibile
      docked: !isOpen && (drag.x < DOCK_ZONE || drag.x + SIZE > W - DOCK_ZONE),
      bottom: clampBottom(vh() - drag.y - SIZE)
    };
    savePos(pos);
    drag = null;
    render();
  }
  bubble.addEventListener('pointerup', function (e) { endGesture(e, false); });
  bubble.addEventListener('pointercancel', function (e) { endGesture(e, true); });

  bubble.addEventListener('click', function () {
    if (suppressClick) { suppressClick = false; return; }
    if (pos.docked && !isOpen) {
      pos.docked = false;
      savePos(pos);
      render();
      return;
    }
    setOpen(!isOpen);
  });

  // Da tastiera: frecce per spostare, Esc per chiudere
  bubble.addEventListener('keydown', function (e) {
    var handled = true;
    if (e.key === 'ArrowLeft') pos = { side: 'left', docked: false, bottom: pos.bottom };
    else if (e.key === 'ArrowRight') pos = { side: 'right', docked: false, bottom: pos.bottom };
    else if (e.key === 'ArrowUp') pos = { side: pos.side, docked: pos.docked, bottom: clampBottom(pos.bottom + KEY_STEP) };
    else if (e.key === 'ArrowDown') pos = { side: pos.side, docked: pos.docked, bottom: clampBottom(pos.bottom - KEY_STEP) };
    else handled = false;
    if (handled) { e.preventDefault(); savePos(pos); render(); }
  });
  document.addEventListener('keydown', function (e) {
    if (isOpen && e.key === 'Escape') setOpen(false);
  });

  // Riposiziona quando cambia la finestra (rotazione, ridimensionamento, tastiera su mobile)
  var resizeRaf = 0;
  window.addEventListener('resize', function () {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(render);
  });

  // Messaggi dall'iframe: accettati solo da taccuino.ch e solo da questo iframe
  window.addEventListener('message', function (event) {
    if (!iframe || event.source !== iframe.contentWindow) return;
    if (event.origin !== tchBaseUrl) return;
    var data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'TCH_READY') sendHost(true);
    else if (data.type === 'TCH_CLOSE' || data.type === 'TCH_MINIMIZE') setOpen(false);
  });

  // ── Account USSO del sito ospite e stato consensi ────────────────────────
  function hostUssoInfo() {
    try {
      var hasUsso = !!(window.USSO && typeof window.USSO.getUser === 'function');
      var u = hasUsso ? window.USSO.getUser() : null;
      var id = u && (u.unhubId || u.uid);
      var claims = u && Array.isArray(u.grantedClaims) ? u.grantedClaims : null;
      var revoked = u && Array.isArray(u.revokedClaims) ? u.revokedClaims : [];
      // Il post-it è attivo di default a meno che l'utente non l'abbia esplicitamente revocato o negato
      var consent = revoked.indexOf('taccuinoPostit') === -1;
      if (claims && (claims.indexOf('deny:taccuinoPostit') !== -1 || claims.indexOf('no:taccuinoPostit') !== -1)) {
        consent = false;
      }
      return {
        hasUsso: hasUsso,
        account: id ? String(id) : null,
        consent: consent
      };
    } catch (e) {
      return { hasUsso: false, account: null, consent: true };
    }
  }

  var lastAccount, lastConsent;
  function sendHost(force) {
    if (!iframe || !iframe.contentWindow) return;
    var info = hostUssoInfo();

    // Se l'utente ha negato/revocato il post-it nelle preferenze USSO per questo sito, nascondiamo la bolla solo se non è aperta
    if (bubble) {
      if (info.hasUsso && info.account && !info.consent) {
        if (!isOpen) {
          bubble.style.display = 'none';
        }
      } else {
        bubble.style.display = 'flex';
      }
    }

    if (!force && info.account === lastAccount && info.consent === lastConsent) return;
    lastAccount = info.account;
    lastConsent = info.consent;
    iframe.contentWindow.postMessage({
      type: 'TCH_HOST',
      v: PROTOCOL,
      account: info.account,
      hasUsso: info.hasUsso,
      postitConsent: info.consent
    }, tchBaseUrl);
  }
  // Se sul sito ospite si cambia account o si esce, il post-it lo sa entro pochi secondi
  setInterval(function () { if (!document.hidden) sendHost(false); }, 3000);
  window.addEventListener('focus', function () { sendHost(false); });

  // ── Montaggio isolato in Shadow DOM ──────────────────────────────────────
  function mount() {
    var host = document.createElement('div');
    host.id = 'tch-widget-root';
    // Un transform o un filtro sul contenitore romperebbe il posizionamento fisso
    ['transform', 'filter', 'perspective', 'contain'].forEach(function (p) { host.style.setProperty(p, 'none', 'important'); });
    var root = host.attachShadow ? host.attachShadow({ mode: 'closed' }) : host;
    if (root === host) document.head.appendChild(style); // browser molto vecchi: senza isolamento
    else root.appendChild(style);
    root.appendChild(frameWrapper);
    root.appendChild(bubble);
    document.body.appendChild(host);
    render();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  window.TaccuinoWidget = {
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    toggle: function () { setOpen(!isOpen); },
    isOpen: function () { return isOpen; }
  };
})();
