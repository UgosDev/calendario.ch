/**
 * USSO 5.0 Universal Sovereign Client SDK (Zero-Iframe, Local Vault Air-Gap)
 * https://usso.ch/v1/usso.js
 * 
 * Consente l'integrazione di USSO.ch con sole 4-5 righe di codice preconfigurate:
 *  - Zero Iframe & Zero Third-Party Cookie: piena conformita nLPD e compatibilita totale con Safari ITP / Chrome Partitioning
 *  - Local Vault Air-Gap (<1ms): profili sul dispositivo residenti in-memory / localStorage locale
 *  - OIDC 1.0 Authorization Code + PKCE S256 trasparente (Popup in-page o Redirect pulito)
 *  - Sincronizzazione remota e multi-scheda via BroadcastChannel nativo (USSO_SESSION_V5)
 *  - Passkey Biometriche FIDO2 / WebAuthn native
 * 
 * Copyright (c) 2026 UnHub Swiss Sovereign Identity Ecosystem.
 */
(function (global) {
  'use strict';

  const ISSUER = 'https://usso.ch';
  const STORAGE_PROFILES_KEY = 'usso_device_profiles_v5';
  const BROADCAST_SESSION_KEY = 'USSO_SESSION_V5';
  const STORAGE_USER_KEY = 'usso_active_user_v5';
  const STORAGE_VERIFIER_KEY = 'usso_pkce_verifier_v5';
  const STORAGE_STATE_KEY = 'usso_auth_state_v5';
  const STORAGE_DISMISSED_KEY = 'usso_onetap_dismissed_v5';
  const ONETAP_CONTAINER_ID = 'usso-onetap-root';
  const ONETAP_STYLES_ID = 'usso-onetap-styles';
  const WIDGET_STYLES_ID = 'usso-auth-widget-styles';

  let config = {
    clientId: '',
    redirectUri: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '',
    scope: 'openid profile email archivio.continuity ucoin.wallet',
    onAuth: null,
    onLogout: null,
    onPermissionsChange: null,
    autoPrompt: true, // Mostra automaticamente il One Tap se ci sono profili sul dispositivo
    theme: 'auto',    // 'auto' | 'light' | 'dark'
    buttonId: 'usso-button',
    containerId: 'usso-auth',
    dropdownAlign: 'right', // 'right' | 'left'
    promptPosition: 'top-right', // 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
    onPromptDismiss: null
  };

  let currentUser = null;
  let cachedProfiles = [];
  let isVaultReady = true;
  let isAuthInProgress = false;
  let isManuallyInitialized = false;

  function emitAuthEvents(user) {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('usso:auth', { detail: { user } }));
        window.dispatchEvent(new CustomEvent('usso:login', { detail: { user } }));
      } catch (_) {}
    }
  }

  function emitLogoutEvents() {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('usso:logout', { detail: {} }));
      } catch (_) {}
    }
  }

  // --- HELPER CRITTOGRAFICI PKCE ---
  function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }

  async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return false;
    try {
      const parsed = new URL(trimmed, window.location.href);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function getAvatarColor(name) {
    const colors = ['#207db1', '#0284c7', '#2563eb', '#0d9488', '#d97706', '#475569'];
    let hash = 0;
    const str = name || 'USSO';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function getInitials(name) {
    if (!name) return 'CH';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  function isDarkMode() {
    if (config.theme === 'dark') return true;
    if (config.theme === 'light') return false;
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // --- GESTIONE LOCAL VAULT SOVRANO (Air-Gap & Zero-Iframe) ---
  function getLocalProfiles() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    // Fallback trasparente per profili esistenti precedenti
    try {
      const legacy = localStorage.getItem('USSO_DEVICE_PROFILES_V1') || localStorage.getItem('USSO_LOCAL_PROFILES_V1');
      if (legacy) return JSON.parse(legacy);
    } catch (_) {}
    return [];
  }

  function saveLocalProfile(profile, clientId) {
    if (typeof localStorage === 'undefined' || !profile) return;
    const uid = profile.unhubId || profile.uid;
    if (!uid) return;
    try {
      const profiles = getLocalProfiles();
      const target = {
        uid: uid,
        unhubId: uid,
        displayName: profile.displayName || profile.name || profile.email?.split('@')[0] || 'Utente USSO',
        name: profile.name || profile.displayName || 'Utente USSO',
        email: profile.email || '',
        photoURL: profile.photoURL || profile.picture || '',
        picture: profile.picture || profile.photoURL || '',
        lastUsedAt: Date.now(),
        initialisedClients: clientId ? [clientId] : []
      };
      const idx = profiles.findIndex(p => (p.unhubId || p.uid) === uid);
      if (idx >= 0) {
        profiles[idx] = { ...profiles[idx], ...target };
      } else {
        profiles.unshift(target);
      }
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles.slice(0, 10)));
      cachedProfiles = profiles;
    } catch (_) {}
  }

  function removeLocalProfile(uid) {
    if (typeof localStorage === 'undefined') return;
    try {
      const profiles = getLocalProfiles().filter(p => (p.unhubId || p.uid) !== uid);
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
      cachedProfiles = profiles;
    } catch (_) {}
  }

  function broadcastSessionRevocation(uid) {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(BROADCAST_SESSION_KEY);
        bc.postMessage({ type: 'LOGOUT', uid: uid || 'all' });
        bc.close();
      }
    } catch (_) {}
  }

  // --- SCAMBIO TOKEN ATOMICO CONDIVISO (Redirect & Popup) ---
  async function exchangeCodeForTokens(code, codeVerifier) {
    const tokenResponse = await fetch(`${ISSUER}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        code: code,
        redirect_uri: config.redirectUri,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Scambio token fallito: HTTP ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();
    const idClaims = parseJwt(tokens.id_token) || {};

    currentUser = {
      uid: idClaims.sub,
      unhubId: idClaims.sub,
      displayName: idClaims.name || idClaims.nickname || idClaims.email?.split('@')[0] || 'Utente USSO',
      name: idClaims.name || idClaims.nickname || 'Utente USSO',
      email: idClaims.email || '',
      nickname: idClaims.nickname || '',
      photoURL: idClaims.picture || '',
      picture: idClaims.picture || '',
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      grantedClaims: idClaims.granted_claims || (tokens.scope ? tokens.scope.split(' ') : []),
      ucoinWallet: idClaims.ucoin_wallet || null
    };

    // Pulisce le credenziali effimere PKCE
    sessionStorage.removeItem(STORAGE_STATE_KEY);
    sessionStorage.removeItem(STORAGE_VERIFIER_KEY);
    sessionStorage.removeItem('usso_oauth_state');
    sessionStorage.removeItem('usso_code_verifier');
    sessionStorage.removeItem('usso_state');
    sessionStorage.removeItem('usso_verifier');
    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
    try {
      localStorage.setItem('usso_user', JSON.stringify(currentUser));
      localStorage.setItem('usso_access_token', tokens.access_token);
      if (tokens.id_token) localStorage.setItem('usso_id_token', tokens.id_token);
      localStorage.setItem('usso_v2_calendario_user', JSON.stringify(currentUser));
      localStorage.setItem('usso_v2_calendario_access_token', tokens.access_token);
      if (tokens.id_token) localStorage.setItem('usso_v2_calendario_id_token', tokens.id_token);
    } catch (_) {}

    // Salva nel Vault Locale Sovrano per aggiornare la presenza del profilo sul dispositivo (Air-Gap)
    saveLocalProfile(currentUser, config.clientId);

    // Chiude il One Tap se visibile
    dismissOneTapPrompt(false);

    if (typeof config.onAuth === 'function') {
      config.onAuth(currentUser);
    }
    emitAuthEvents(currentUser);
    renderAuthWidget();

    return currentUser;
  }

  // --- GESTIONE DINAMICA CONSENSI & ADEGUAMENTO FORZATO APP TERZE ("Facciamo noi per loro") ---
  function handlePermissionsUpdated(data) {
    if (!data) return;
    const grantedClaims = Array.isArray(data.grantedClaims) ? data.grantedClaims : [];
    const revokedClaims = Array.isArray(data.revokedClaims) ? data.revokedClaims : [];
    const missingRequired = Array.isArray(data.missingRequiredClaims) ? data.missingRequiredClaims : [];

    console.info('[USSO 4.2] Ricevuto aggiornamento consensi:', { grantedClaims, revokedClaims, missingRequired });

    // 1. Caso critico: revoca di claim obbligatori per l'applicazione
    if (missingRequired.length > 0) {
      console.warn('[USSO 4.2] Permessi obbligatori revocati (' + missingRequired.join(', ') + '): revoca sessione immediata.');
      currentUser = null;
      try {
        sessionStorage.removeItem(STORAGE_USER_KEY);
      } catch (_) {}
      if (typeof config.onLogout === 'function') {
        config.onLogout();
      }
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return;
    }

    // 2. Sanificazione immediata di currentUser in memoria e nello storage locale
    if (currentUser) {
      const claimFieldMap = {
        email: ['email', 'email_verified'],
        phone: ['phone', 'phoneNumber', 'phone_number'],
        name: ['name', 'displayName'],
        picture: ['picture', 'photoURL'],
        dateOfBirth: ['dateOfBirth', 'birthdate'],
        postalCanton: ['postalCanton', 'postal_canton'],
        address: ['address'],
        consanaInsurance: ['consanaInsurance'],
        ucoinWallet: ['ucoinWallet', 'ucoin_wallet'],
      };

      revokedClaims.forEach((claim) => {
        const fields = claimFieldMap[claim] || [claim];
        fields.forEach((f) => {
          delete currentUser[f];
        });
      });

      currentUser.grantedClaims = grantedClaims;
      if (typeof data.explicitStorageConsent === 'boolean') {
        currentUser.explicitStorageConsent = data.explicitStorageConsent;
      }
      if (Array.isArray(data.sharedArchivioItems)) {
        currentUser.sharedArchivioItems = data.sharedArchivioItems;
      }

      try {
        sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(currentUser));
      } catch (_) {}

      // 3. Notifica evento DOM conforme allo standard nLPD
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usso:permissions-updated', {
          detail: {
            user: currentUser,
            grantedClaims,
            revokedClaims,
            explicitStorageConsent: data.explicitStorageConsent,
            sharedArchivioItems: data.sharedArchivioItems,
          }
        }));
      }

      if (typeof config.onPermissionsChange === 'function') {
        config.onPermissionsChange(currentUser, { grantedClaims, revokedClaims });
      }
      if (typeof config.onAuth === 'function') {
        config.onAuth(currentUser);
      }

      // 4. "Facciamo noi per loro": se sono stati revocati dati o la conservazione locale,
      // ricarica la pagina per garantire che l'app non mostri dati fantasma non conformi
      if (revokedClaims.length > 0 || data.explicitStorageConsent === false) {
        console.info('[USSO 4.2] Dati o retention revocati: applicazione forzata con auto-reload.');
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.reload();
          }, 300);
        }
      }
    }
  }

  // --- LISTENER EVENTI: VAULT + POPUP OIDC (VALIDAZIONE RIGOROSA DELLE ORIGINI) ---
  function setupVaultListener() {
    window.addEventListener('message', async (event) => {
      const data = event.data || {};

      // 1. Messaggio da USSO.ch (/authorize o /consent-settings in modalità popup)
      // Validazione stretta: accetta messaggi ESCLUSIVAMENTE dall'emittente autorizzato
      const allowedIssuerOrigins = [ISSUER, 'https://usso-api.ch'];
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          allowedIssuerOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', window.location.origin);
        }
      }

      if (allowedIssuerOrigins.includes(event.origin)) {
        if (data.type === 'USSO_AUTH_SUCCESS' && typeof data.code === 'string' && typeof data.state === 'string') {
          const storedState = sessionStorage.getItem(STORAGE_STATE_KEY);
          const codeVerifier = sessionStorage.getItem(STORAGE_VERIFIER_KEY);

          if (storedState && data.state === storedState && codeVerifier) {
            try {
              await exchangeCodeForTokens(data.code, codeVerifier);
            } catch (err) {
              console.error('[USSO 4.2] Errore scambio token da popup:', err);
            }
          }
          return;
        }

        if (data.type === 'USSO_PERMISSIONS_UPDATED') {
          if (!data.clientId || data.clientId === config.clientId) {
            handlePermissionsUpdated(data);
          }
          return;
        }
      }
    });

    // ESCAMOTAGE TRIGGER 2: BroadcastChannel multi-scheda e cross-finestra
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('USSO_CONSENT_SYNC');
        bc.onmessage = (event) => {
          const d = event.data || {};
          if (d.type === 'USSO_PERMISSIONS_UPDATED') {
            if (!d.clientId || d.clientId === config.clientId) {
              handlePermissionsUpdated(d);
            }
          }
        };

        // Ascolto multi-channel sovrano per revoca globale sessioni v5/v4
        [BROADCAST_SESSION_KEY, 'USSO_VAULT_BROADCAST_V5', 'USSO_VAULT_BROADCAST_V4'].forEach((ch) => {
          const vbc = new BroadcastChannel(ch);
          vbc.onmessage = (event) => {
            const d = event.data || {};
            if (d.type === 'USSO_VAULT_SESSION_REVOKED' || d.type === 'LOGOUT') {
              const revokedUid = d.uid;
              if (!revokedUid || revokedUid === 'all' || !currentUser || currentUser.uid === revokedUid || currentUser.unhubId === revokedUid) {
                console.warn('[USSO 5.0] Disconnessione sincronizzata via ' + ch);
                currentUser = null;
                try {
                  sessionStorage.removeItem(STORAGE_USER_KEY);
                  sessionStorage.removeItem(STORAGE_DISMISSED_KEY);
                  localStorage.removeItem('usso_user');
                  localStorage.removeItem('usso_access_token');
                  localStorage.removeItem('usso_id_token');
                } catch (_) {}
                if (typeof config.onLogout === 'function') {
                  config.onLogout();
                }
                emitLogoutEvents();
                renderAuthWidget();
              }
            }
          };
        });
      }
    } catch (_) {}

    // ESCAMOTAGE TRIGGER 3: Al ritorno del focus sull'app (visibilitychange / window focus)
    if (typeof document !== 'undefined') {
      let lastKnownRev = '';
      try {
        lastKnownRev = localStorage.getItem(`usso_perm_rev_${config.clientId}`) || '';
      } catch (_) {}

      const checkFocusReset = () => {
        try {
          const currentRev = localStorage.getItem(`usso_perm_rev_${config.clientId}`);
          if (currentRev && currentRev !== lastKnownRev) {
            lastKnownRev = currentRev;
            const parsed = JSON.parse(currentRev);
            console.info('[USSO 4.2] Ritorno del focus con permessi modificati nel Vault: reset forzato della pagina.');
            handlePermissionsUpdated({
              clientId: config.clientId,
              revokedClaims: parsed.revokedClaims || [],
              missingRequiredClaims: parsed.missingRequired ? ['required'] : [],
            });
          }
        } catch (_) {}
      };

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkFocusReset();
        }
      });
      window.addEventListener('focus', checkFocusReset);
    }
  }

  // --- GESTIONE AUTOMATICA DEL CALLBACK OIDC (Flusso Redirect standard) ---
  async function handleOidcCallbackIfPresent() {
    if (typeof window === 'undefined') return false;

    const url = new URL(window.location.href);
    if (url.searchParams.has('usso_permissions_updated')) {
      url.searchParams.delete('usso_permissions_updated');
      window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    }
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) return false;

    const storedState = sessionStorage.getItem(STORAGE_STATE_KEY) 
      || sessionStorage.getItem('usso_oauth_state') 
      || sessionStorage.getItem('usso_state') 
      || sessionStorage.getItem('usso_v2_calendario_state')
      || localStorage.getItem('usso_v2_calendario_state');
    const codeVerifier = sessionStorage.getItem(STORAGE_VERIFIER_KEY) 
      || sessionStorage.getItem('usso_code_verifier') 
      || sessionStorage.getItem('usso_verifier') 
      || sessionStorage.getItem('usso_v2_calendario_pkce_verifier')
      || localStorage.getItem('usso_v2_calendario_pkce_verifier');

    // Se lo state non corrisponde o non c'è il verifier PKCE, ignora (evita CSRF)
    if (!storedState || (state && storedState !== state) || !codeVerifier) {
      return false;
    }

    try {
      await exchangeCodeForTokens(code, codeVerifier);

      // Pulisce i parametri one-time dall'URL visibile per estetica e sicurezza
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      url.searchParams.delete('session_state');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);

      return true;
    } catch (err) {
      console.error('[USSO 4.2] Errore elaborazione callback OIDC redirect:', err);
      return false;
    }
  }

  // --- AVVIO LOGIN (Popup o Redirect) ---
  async function startAuthFlow(options = {}) {
    const opts = { ...config, ...options };
    if (!opts.clientId) {
      console.error('[USSO 4.2] Client ID mancante per avviare il login.');
      return;
    }

    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    sessionStorage.setItem(STORAGE_STATE_KEY, state);
    sessionStorage.setItem(STORAGE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem('usso_oauth_state', state);
    sessionStorage.setItem('usso_code_verifier', codeVerifier);
    sessionStorage.setItem('usso_state', state);
    sessionStorage.setItem('usso_verifier', codeVerifier);
    sessionStorage.setItem('usso_v2_calendario_state', state);
    sessionStorage.setItem('usso_v2_calendario_pkce_verifier', codeVerifier);
    if (opts.redirectUri) {
      sessionStorage.setItem('usso_redirect_uri', opts.redirectUri);
    }
    try {
      localStorage.setItem('usso_v2_calendario_state', state);
      localStorage.setItem('usso_v2_calendario_pkce_verifier', codeVerifier);
    } catch (_) {}

    const authUrl = new URL(`${ISSUER}/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', opts.clientId);
    authUrl.searchParams.set('redirect_uri', opts.redirectUri);
    authUrl.searchParams.set('scope', opts.scope || 'openid profile email archivio.continuity ucoin.wallet');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    if (opts.loginHint) {
      authUrl.searchParams.set('login_hint', opts.loginHint);
    }

    // Modalità Popup: apertura in-page senza reload della pagina chiamante
    if (opts.mode === 'popup') {
      authUrl.searchParams.set('display', 'popup');
      const width = 480;
      const height = 620;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

      const popup = window.open(
        authUrl.toString(),
        'usso_auth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=1,resizable=1`
      );

      // Fallback a redirect qualora il popup blocker bloccasse la finestra
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        console.warn('[USSO 4.2] Popup bloccato dal browser: esecuzione fallback su redirect.');
        window.location.href = authUrl.toString();
      }
      return;
    }

    // Modalità Standard Redirect
    window.location.href = authUrl.toString();
  }

  // --- STILI CSS DEL WIDGET USSO ONE TAP (ESTETICA ISTITUZIONALE FEDERALE .CH) ---
  function injectOneTapStyles() {
    if (typeof document === 'undefined' || document.getElementById(ONETAP_STYLES_ID)) return;

    const style = document.createElement('style');
    style.id = ONETAP_STYLES_ID;
    style.textContent = `
      #${ONETAP_CONTAINER_ID} {
        position: fixed;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        box-sizing: border-box;
      }
      #${ONETAP_CONTAINER_ID} * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      #${ONETAP_CONTAINER_ID}.pos-top-right {
        top: 16px;
        right: 16px;
      }
      #${ONETAP_CONTAINER_ID}.pos-bottom-right {
        bottom: 16px;
        right: 16px;
      }
      #${ONETAP_CONTAINER_ID}.pos-top-left {
        top: 16px;
        left: 16px;
      }
      #${ONETAP_CONTAINER_ID}.pos-bottom-left {
        bottom: 16px;
        left: 16px;
      }
      @media (max-width: 480px) {
        #${ONETAP_CONTAINER_ID} {
          top: auto !important;
          bottom: 12px !important;
          left: 12px !important;
          right: 12px !important;
          width: auto !important;
        }
      }
      .usso-onetap-card {
        width: 380px;
        max-width: calc(100vw - 24px);
        border-radius: 12px;
        overflow: hidden;
        animation: usso-onetap-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      @keyframes usso-onetap-enter {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .usso-onetap-theme-light {
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 10px 25px -3px rgba(0, 0, 0, 0.12);
      }
      .usso-onetap-theme-dark {
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      }
      .usso-onetap-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 10px 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        background: rgba(248, 250, 252, 0.6);
      }
      .usso-onetap-theme-dark .usso-onetap-header {
        border-bottom-color: rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.6);
      }
      .usso-onetap-title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        flex: 1;
      }
      .usso-onetap-badge {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      .usso-onetap-title {
        font-size: 13.5px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .usso-onetap-title strong {
        font-weight: 700;
      }
      .usso-onetap-close-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: #64748b;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, color 0.15s ease;
        flex-shrink: 0;
        margin-left: 6px;
      }
      .usso-onetap-close-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #0f172a;
      }
      .usso-onetap-theme-dark .usso-onetap-close-btn {
        color: #94a3b8;
      }
      .usso-onetap-theme-dark .usso-onetap-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      .usso-onetap-list {
        max-height: 240px;
        overflow-y: auto;
        padding: 4px 0;
      }
      .usso-onetap-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        cursor: pointer;
        transition: background 0.15s ease;
        position: relative;
      }
      .usso-onetap-item:hover {
        background: #f8fafc;
      }
      .usso-onetap-theme-dark .usso-onetap-item:hover {
        background: #1e293b;
      }
      .usso-onetap-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .usso-onetap-initial-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        color: #ffffff;
        font-weight: 700;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        letter-spacing: -0.02em;
      }
      .usso-onetap-info {
        min-width: 0;
        flex: 1;
      }
      .usso-onetap-name {
        font-size: 13.5px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .usso-onetap-sub {
        font-size: 12px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 1px;
      }
      .usso-onetap-theme-dark .usso-onetap-sub {
        color: #94a3b8;
      }
      .usso-onetap-footer-action {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 14px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .usso-onetap-theme-dark .usso-onetap-footer-action {
        border-top-color: rgba(255, 255, 255, 0.08);
        color: #f8fafc;
      }
      .usso-onetap-footer-action:hover {
        background: #f8fafc;
        color: #207db1;
      }
      .usso-onetap-theme-dark .usso-onetap-footer-action:hover {
        background: #1e293b;
        color: #36a9e1;
      }
      .usso-onetap-trust-bar {
        padding: 7px 14px 9px 14px;
        text-align: center;
        font-size: 11px;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        background: rgba(248, 250, 252, 0.5);
        border-top: 1px solid rgba(0, 0, 0, 0.04);
      }
      .usso-onetap-theme-dark .usso-onetap-trust-bar {
        color: #94a3b8;
        background: rgba(15, 23, 42, 0.5);
        border-top-color: rgba(255, 255, 255, 0.04);
      }
      .usso-onetap-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(54, 169, 225, 0.2);
        border-top-color: #207db1;
        border-radius: 50%;
        animation: usso-onetap-spin 0.6s linear infinite;
        flex-shrink: 0;
      }
      @keyframes usso-onetap-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // --- RENDERING DEL WIDGET USSO ONE TAP ---
  function renderOneTapPrompt(profiles = []) {
    if (typeof document === 'undefined') return;
    if (currentUser) return; // Già autenticato

    injectOneTapStyles();

    // Rimuove eventuale prompt pre-esistente
    const existing = document.getElementById(ONETAP_CONTAINER_ID);
    if (existing) {
      existing.remove();
    }

    const host = window.location.hostname;
    const dark = isDarkMode();
    const themeClass = dark ? 'usso-onetap-theme-dark' : 'usso-onetap-theme-light';
    const posClass = `pos-${config.promptPosition || 'top-right'}`;

    const container = document.createElement('div');
    container.id = ONETAP_CONTAINER_ID;
    container.className = posClass;

    const listHtml = profiles.length > 0
      ? profiles.map((p, idx) => {
          const name = escapeHtml(p.displayName || p.name || 'Utente USSO');
          const sub = escapeHtml(p.email || (p.unhubId ? '#' + p.unhubId : 'Profilo verificato'));
          const safePhoto = isValidImageUrl(p.photoURL) ? escapeHtml(p.photoURL) : null;
          const avatarHtml = safePhoto
            ? `<img src="${safePhoto}" alt="${name}" class="usso-onetap-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
               <div class="usso-onetap-initial-avatar" style="display:none; background:${getAvatarColor(p.displayName)};">${getInitials(p.displayName)}</div>`
            : `<div class="usso-onetap-initial-avatar" style="background:${getAvatarColor(p.displayName)};">${getInitials(p.displayName)}</div>`;

          return `
            <div class="usso-onetap-item" data-uid="${escapeHtml(p.uid)}" data-idx="${idx}" role="button" tabindex="0" aria-label="Accedi come ${name}">
              ${avatarHtml}
              <div class="usso-onetap-info">
                <div class="usso-onetap-name">${name}</div>
                <div class="usso-onetap-sub">${sub}</div>
              </div>
              <div class="usso-onetap-action-slot"></div>
            </div>
          `;
        }).join('')
      : `
        <div style="padding: 16px 14px; text-align: center;">
          <p style="font-size: 13px; color: ${dark ? '#94a3b8' : '#64748b'}; margin-bottom: 12px;">Accedi con la tua Identità Sovrana Svizzera</p>
          <button type="button" class="usso-onetap-cta-btn" style="
            background: #207db1;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 9px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background 0.15s ease;
          ">Continua con USSO.ch</button>
        </div>
      `;

    container.innerHTML = `
      <div class="usso-onetap-card ${themeClass}" role="dialog" aria-labelledby="usso-onetap-title" aria-modal="false">
        <div class="usso-onetap-header">
          <div class="usso-onetap-title-wrap">
            <svg class="usso-onetap-badge" viewBox="6643.55 940.33 592.25 592.26" aria-hidden="true" style="border-radius: 4px; overflow: hidden; flex-shrink: 0;">
              <path fill="#36a9e1" d="M7235.8,967.13v538.66c0,14.8-12,26.8-26.8,26.8h-538.66c-14.8,0-26.79-12-26.79-26.8v-538.66c0-14.8,11.99-26.8,26.79-26.8h538.66c14.8,0,26.8,12,26.8,26.8Z"/>
              <path fill="#ffffff" d="M7163.62,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z"/>
              <path fill="#ffffff" d="M6981.83,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z"/>
            </svg>
            <div id="usso-onetap-title" class="usso-onetap-title">
              Accedi a <strong>${escapeHtml(host)}</strong> con <strong style="color: #207db1;">usso.ch</strong>
            </div>
          </div>
          <button type="button" class="usso-onetap-close-btn" aria-label="Chiudi prompt di accesso" title="Chiudi">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="usso-onetap-list">
          ${listHtml}
        </div>

        <div class="usso-onetap-footer-action" role="button" tabindex="0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          <span>Usa un altro account USSO</span>
        </div>

        <div class="usso-onetap-trust-bar">
          <svg width="11" height="11" viewBox="6643.55 940.33 592.25 592.26" aria-hidden="true" style="border-radius: 2px; overflow: hidden; flex-shrink: 0;">
            <path fill="#36a9e1" d="M7235.8,967.13v538.66c0,14.8-12,26.8-26.8,26.8h-538.66c-14.8,0-26.79-12-26.79-26.8v-538.66c0-14.8,11.99-26.8,26.79-26.8h538.66c14.8,0,26.8,12,26.8,26.8Z"/>
            <path fill="#ffffff" d="M7163.62,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z"/>
            <path fill="#ffffff" d="M6981.83,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z"/>
          </svg>
          <span>Identità Sovrana Svizzera • USSO.ch</span>
        </div>
      </div>
    `;

    // Event listener per chiusura
    const closeBtn = container.querySelector('.usso-onetap-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissOneTapPrompt(true);
      });
    }

    // Event listener per click su un account specifico
    const items = container.querySelectorAll('.usso-onetap-item');
    items.forEach((item) => {
      const handleAccountClick = () => {
        if (isAuthInProgress) return;
        isAuthInProgress = true;

        const uid = item.getAttribute('data-uid');
        const slot = item.querySelector('.usso-onetap-action-slot');
        if (slot) {
          slot.innerHTML = `<div class="usso-onetap-spinner"></div>`;
        }

        startAuthFlow({ loginHint: uid, mode: 'popup' }).finally(() => {
          setTimeout(() => { isAuthInProgress = false; }, 2000);
        });
      };

      item.addEventListener('click', handleAccountClick);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAccountClick();
        }
      });
    });

    // Event listener per CTA singola (se 0 profili memorizzati)
    const ctaBtn = container.querySelector('.usso-onetap-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        startAuthFlow({ mode: 'popup' });
      });
    }

    // Event listener per "Usa un altro account"
    const footerAction = container.querySelector('.usso-onetap-footer-action');
    if (footerAction) {
      footerAction.addEventListener('click', () => {
        startAuthFlow({ mode: 'popup' });
      });
      footerAction.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startAuthFlow({ mode: 'popup' });
        }
      });
    }

    // Chiusura accessibile con tasto Escape
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        dismissOneTapPrompt(true);
        window.removeEventListener('keydown', handleKeydown);
      }
    };
    window.addEventListener('keydown', handleKeydown);

    document.body.appendChild(container);
  }

  function dismissOneTapPrompt(userInitiated = true) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(ONETAP_CONTAINER_ID);
    if (!container) return;

    const card = container.querySelector('.usso-onetap-card');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(-8px) scale(0.98)';
      setTimeout(() => {
        container.remove();
      }, 200);
    } else {
      container.remove();
    }

    if (userInitiated) {
      try {
        sessionStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
      } catch (_) {}

      if (typeof config.onPromptDismiss === 'function') {
        config.onPromptDismiss();
      }
    }
  }

  // --- STILI CSS DEL WIDGET AUTENTICAZIONE COMPLETO (BADGE + DROPDOWN UFFICIALE) ---
  function injectWidgetStyles() {
    if (typeof document === 'undefined' || document.getElementById(WIDGET_STYLES_ID)) return;

    const style = document.createElement('style');
    style.id = WIDGET_STYLES_ID;
    style.textContent = `
      .usso-user-widget-root {
        position: relative;
        display: inline-flex;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        box-sizing: border-box;
      }
      .usso-user-widget-root *, .usso-user-widget-root *::before, .usso-user-widget-root *::after {
        box-sizing: border-box;
      }
      .usso-user-badge-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 12px 5px 6px;
        border-radius: 9999px;
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        transition: all 0.15s ease;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 600;
        text-align: left;
      }
      .usso-user-badge-button:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
      .usso-widget-dark .usso-user-badge-button {
        background: #0f172a;
        color: #f8fafc;
        border-color: #334155;
      }
      .usso-widget-dark .usso-user-badge-button:hover {
        background: #1e293b;
        border-color: #475569;
      }
      .usso-user-badge-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .usso-user-badge-initials {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: #ffffff;
        font-weight: 700;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        letter-spacing: -0.02em;
      }
      .usso-user-badge-name {
        max-width: 140px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .usso-user-badge-chevron {
        transition: transform 0.18s ease;
        color: #64748b;
        flex-shrink: 0;
      }
      .usso-user-dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        min-width: 260px;
        max-width: 320px;
        background: #ffffff;
        color: #0f172a;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.15), 0 4px 10px -2px rgba(0, 0, 0, 0.08);
        padding: 8px;
        z-index: 999999;
        animation: usso-dropdown-fade 0.16s ease-out;
      }
      .usso-dropdown-align-right {
        right: 0;
        left: auto;
      }
      .usso-dropdown-align-left {
        left: 0;
        right: auto;
      }
      .usso-widget-dark .usso-user-dropdown-menu {
        background: #0f172a;
        color: #f8fafc;
        border-color: #334155;
        box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.4);
      }
      @keyframes usso-dropdown-fade {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .usso-dropdown-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 10px 12px 10px;
      }
      .usso-dropdown-avatar-wrap {
        flex-shrink: 0;
      }
      .usso-dropdown-large-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
      .usso-dropdown-large-initials {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        color: #ffffff;
        font-weight: 700;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .usso-dropdown-user-info {
        min-width: 0;
        flex: 1;
      }
      .usso-dropdown-name {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .usso-widget-dark .usso-dropdown-name {
        color: #ffffff;
      }
      .usso-dropdown-sub {
        font-size: 12px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 1px;
      }
      .usso-widget-dark .usso-dropdown-sub {
        color: #94a3b8;
      }
      .usso-dropdown-ucoin-card {
        margin: 2px 4px 8px 4px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .usso-widget-dark .usso-dropdown-ucoin-card {
        background: #1e293b;
      }
      .usso-ucoin-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }
      .usso-ucoin-label {
        font-size: 10px;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
      }
      .usso-widget-dark .usso-ucoin-label {
        color: #94a3b8;
      }
      .usso-ucoin-val {
        color: #0284c7;
        font-weight: 600;
      }
      .usso-ucoin-link {
        font-size: 11.5px;
        color: #0284c7;
        text-decoration: none;
        font-weight: 600;
        text-align: right;
        margin-top: 2px;
      }
      .usso-ucoin-link:hover {
        text-decoration: underline;
      }
      .usso-dropdown-divider {
        height: 1px;
        background: #e2e8f0;
        margin: 6px 0;
      }
      .usso-widget-dark .usso-dropdown-divider {
        background: #334155;
      }
      .usso-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        color: #334155;
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        background: transparent;
        border: none;
        width: 100%;
        text-align: left;
        font-family: inherit;
        transition: all 0.12s ease;
      }
      .usso-dropdown-item:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .usso-widget-dark .usso-dropdown-item {
        color: #cbd5e1;
      }
      .usso-widget-dark .usso-dropdown-item:hover {
        background: #1e293b;
        color: #ffffff;
      }
      .usso-arrow-corner {
        margin-left: auto;
        font-size: 11px;
        color: #94a3b8;
      }
      .usso-dropdown-logout-btn {
        color: #dc2626 !important;
      }
      .usso-dropdown-logout-btn:hover {
        background: #fef2f2 !important;
        color: #b91c1c !important;
      }
      .usso-widget-dark .usso-dropdown-logout-btn {
        color: #f87171 !important;
      }
      .usso-widget-dark .usso-dropdown-logout-btn:hover {
        background: rgba(239, 68, 68, 0.12) !important;
        color: #fca5a5 !important;
      }
      .usso-user-widget-root.usso-full-width {
        display: flex;
        width: 100%;
      }
      .usso-user-widget-root.usso-full-width .usso-user-badge-button {
        width: 100%;
        justify-content: space-between;
      }
      .usso-user-widget-root.usso-full-width .usso-user-badge-name {
        max-width: none;
        flex: 1;
      }
      .usso-user-badge-main {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        flex: 1;
      }
      .usso-brand-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 44px;
        padding: 10px 20px;
        border-radius: 9999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 700;
        background: #0f172a;
        color: #ffffff;
        border: 1px solid #334155;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        transition: all 0.18s ease;
        box-sizing: border-box;
      }
      .usso-brand-button:hover {
        background: #1e293b;
        border-color: #36a9e1;
        box-shadow: 0 2px 8px rgba(54, 169, 225, 0.25);
        transform: translateY(-1px);
      }
      .usso-brand-button.usso-full-width {
        width: 100%;
      }
      .usso-widget-dark .usso-brand-button {
        background: #0f172a;
        color: #f8fafc;
        border-color: #334155;
      }
    `;
    document.head.appendChild(style);
  }

  function getAllAuthContainers() {
    if (typeof document === 'undefined') return [];
    const selectors = ['[data-usso-auth]', '#usso-auth', '#usso-button', 'usso-auth'];
    if (config.containerId && !selectors.includes('#' + config.containerId)) {
      selectors.push('#' + config.containerId);
    }
    if (config.buttonId && !selectors.includes('#' + config.buttonId)) {
      selectors.push('#' + config.buttonId);
    }
    const found = document.querySelectorAll(selectors.join(', '));
    const result = [];
    const seen = new Set();
    found.forEach((el) => {
      if (!seen.has(el)) {
        seen.add(el);
        result.push(el);
      }
    });
    return result;
  }

  function getAuthContainer() {
    const list = getAllAuthContainers();
    return list.length > 0 ? list[0] : null;
  }

  // --- RENDERING SINGOLO WIDGET AUTONOMO USSO ---
  function renderSingleAuthWidget(container, force = false) {
    if (!container) return;

    const currentState = currentUser ? 'auth' : 'anon';
    if (!force && container.dataset.ussoRendered === currentState && container.children.length > 0) {
      return;
    }

    injectWidgetStyles();

    const dark = isDarkMode();
    if (dark) {
      container.classList.add('usso-widget-dark');
    } else {
      container.classList.remove('usso-widget-dark');
    }

    const isFullWidth = container.dataset.fullWidth === 'true' || container.classList.contains('w-full');
    if (isFullWidth) {
      container.style.display = 'block';
      container.style.width = '100%';
    }

    if (!currentUser) {
      // ── STATO ANONIMO: Renderizza pulsante ufficiale "Accedi con USSO.ch" ──
      container.innerHTML = `
        <button type="button" class="usso-brand-button ${isFullWidth ? 'usso-full-width' : ''}" style="${isFullWidth ? 'width: 100%;' : ''}">
          <svg width="18" height="18" viewBox="6643.55 940.33 592.25 592.26" style="border-radius: 3px; overflow: hidden; flex-shrink: 0;" aria-hidden="true">
            <path fill="#36a9e1" d="M7235.8,967.13v538.66c0,14.8-12,26.8-26.8,26.8h-538.66c-14.8,0-26.79-12-26.79-26.8v-538.66c0-14.8,11.99-26.8,26.79-26.8h538.66c14.8,0,26.8,12,26.8,26.8Z"/>
            <path fill="#ffffff" d="M7163.62,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z"/>
            <path fill="#ffffff" d="M6981.83,1244.97l-140.04,200.28c-2.78,3.97-7.32,6.34-12.17,6.34h-101.7c-12.01-.01-19.04-13.53-12.16-23.37l128.15-183.25c3.57-5.11,3.57-11.91,0-17.01l-128.15-183.28c-6.88-9.84.16-23.35,12.17-23.35h101.7c4.85,0,9.39,2.37,12.17,6.34l140.04,200.29c3.57,5.11,3.57,11.91,0,17.01Z"/>
          </svg>
          <span>Accedi con USSO.ch</span>
        </button>
      `;

      const btn = container.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => {
          global.USSO.loginWithPopup().catch(() => global.USSO.login());
        });
      }
    } else {
      // ── STATO AUTENTICATO: Renderizza Badge Utente e Dropdown Menu Ufficiale ──
      const name = escapeHtml(currentUser.displayName || currentUser.name || 'Utente USSO');
      const safePhoto = isValidImageUrl(currentUser.photoURL || currentUser.picture) ? escapeHtml(currentUser.photoURL || currentUser.picture) : null;
      const avatarHtml = safePhoto
        ? `<img src="${safePhoto}" alt="${name}" class="usso-user-badge-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div class="usso-user-badge-initials" style="display:none; background:${getAvatarColor(currentUser.displayName)};">${getInitials(currentUser.displayName)}</div>`
        : `<div class="usso-user-badge-initials" style="background:${getAvatarColor(currentUser.displayName)};">${getInitials(currentUser.displayName)}</div>`;

      const largeAvatarHtml = safePhoto
        ? `<img src="${safePhoto}" alt="${name}" class="usso-dropdown-large-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
           <div class="usso-dropdown-large-initials" style="display:none; background:${getAvatarColor(currentUser.displayName)};">${getInitials(currentUser.displayName)}</div>`
        : `<div class="usso-dropdown-large-initials" style="background:${getAvatarColor(currentUser.displayName)};">${getInitials(currentUser.displayName)}</div>`;

      const subtitle = currentUser.email
        ? escapeHtml(currentUser.email)
        : (currentUser.nickname
            ? '@' + escapeHtml(currentUser.nickname)
            : 'Profilo Verificato');

      const alignClass = config.dropdownAlign === 'left' ? 'usso-dropdown-align-left' : 'usso-dropdown-align-right';

      let ucoinCardHtml = '';
      const wallet = currentUser.ucoinWallet;
      const hasUcoin = (config.scope || '').includes('ucoin') || (currentUser.grantedClaims || []).includes('ucoin.wallet');
      if (wallet || hasUcoin) {
        const balance = typeof wallet?.balance === 'number' ? wallet.balance : (typeof currentUser.ucoin_balance === 'number' ? currentUser.ucoin_balance : 0);
        const chf = (balance / 10).toFixed(2);
        ucoinCardHtml = `
          <div class="usso-dropdown-ucoin-card">
            <div class="usso-ucoin-row">
              <span class="usso-ucoin-label">SALDO UCOIN</span>
              <span class="usso-ucoin-val"><strong>${balance}</strong> ≈ CHF ${chf}</span>
            </div>
            <a href="https://ucoin.ch" target="_blank" rel="noopener noreferrer" class="usso-ucoin-link">
              Ricarica UCOIN ↗
            </a>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="usso-user-widget-root ${isFullWidth ? 'usso-full-width' : ''}">
          <button type="button" class="usso-user-badge-button ${isFullWidth ? 'usso-full-width' : ''}" aria-haspopup="true" aria-expanded="false" title="Menu Account USSO.ch">
            <div class="usso-user-badge-main">
              ${avatarHtml}
              <span class="usso-user-badge-name">${name}</span>
            </div>
            <svg class="usso-user-badge-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div class="usso-user-dropdown-menu ${alignClass}" style="display: none;" role="menu">
            <div class="usso-dropdown-header">
              <div class="usso-dropdown-avatar-wrap">
                ${largeAvatarHtml}
              </div>
              <div class="usso-dropdown-user-info">
                <div class="usso-dropdown-name">${name}</div>
                <div class="usso-dropdown-sub">${subtitle}</div>
              </div>
            </div>

            ${ucoinCardHtml}

            <div class="usso-dropdown-divider"></div>

            <a href="https://usso.ch/account" target="_blank" rel="noopener noreferrer" class="usso-dropdown-item" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Gestisci account USSO</span>
              <span class="usso-arrow-corner">↗</span>
            </a>

            <button type="button" class="usso-dropdown-item usso-dropdown-perm-btn" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Permessi concessi</span>
            </button>

            <div class="usso-dropdown-divider"></div>

            <button type="button" class="usso-dropdown-item usso-dropdown-logout-btn" role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Esci dall'account</span>
            </button>
          </div>
        </div>
      `;

      const badgeBtn = container.querySelector('.usso-user-badge-button');
      const menu = container.querySelector('.usso-user-dropdown-menu');
      const chevron = container.querySelector('.usso-user-badge-chevron');

      if (badgeBtn && menu) {
        const toggleMenu = (open) => {
          const isCurrentlyOpen = menu.style.display !== 'none';
          const shouldOpen = open !== undefined ? open : !isCurrentlyOpen;
          if (shouldOpen) {
            const rect = container.getBoundingClientRect();
            const opensUpward = (rect.bottom + 280 > window.innerHeight) && (rect.top > 250);
            if (opensUpward) {
              menu.style.bottom = 'calc(100% + 8px)';
              menu.style.top = 'auto';
            } else {
              menu.style.top = 'calc(100% + 8px)';
              menu.style.bottom = 'auto';
            }

            const opensLeft = (rect.left + 280 > window.innerWidth);
            if (config.dropdownAlign === 'left' && !opensLeft) {
              menu.style.left = '0';
              menu.style.right = 'auto';
            } else {
              menu.style.right = '0';
              menu.style.left = 'auto';
            }
          }
          menu.style.display = shouldOpen ? 'block' : 'none';
          badgeBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
          if (chevron) {
            chevron.style.transform = shouldOpen ? 'rotate(180deg)' : 'rotate(0deg)';
          }
        };

        badgeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleMenu();
        });

        const onDocClick = (e) => {
          if (!container.contains(e.target)) {
            toggleMenu(false);
          }
        };
        document.addEventListener('click', onDocClick);

        const onKeyDown = (e) => {
          if (e.key === 'Escape') {
            toggleMenu(false);
          }
        };
        document.addEventListener('keydown', onKeyDown);

        const logoutBtn = menu.querySelector('.usso-dropdown-logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu(false);
            global.USSO.logout();
          });
        }

        const permBtn = menu.querySelector('.usso-dropdown-perm-btn');
        if (permBtn) {
          permBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu(false);
            global.USSO.managePermissions({ mode: 'popup' });
          });
        }
      }
    }

    container.dataset.ussoRendered = currentState;
  }

  // --- RENDERING WIDGET UFFICIALE USSO (AUTONOMO A DUE STATI) ---
  function renderAuthWidget(force = false) {
    if (typeof document === 'undefined') return;
    const containers = getAllAuthContainers();
    if (containers.length === 0) return;

    containers.forEach((container) => {
      renderSingleAuthWidget(container, force);
    });
  }

  // Alias retrocompatibile
  const renderUssoButton = renderAuthWidget;

  // --- AUTO-ENHANCE DEI MENU UTENTE ESISTENTI (Zero Codice per Hardreset.ch e altre App Terze) ---
  function autoEnhanceUserMenu() {
    if (typeof document === 'undefined') return;

    function scanAndAttach() {
      // 1. Cerca elementi che contengono link ad account USSO o la dicitura "Gestisci l'account USSO"
      const candidateLinks = Array.from(document.querySelectorAll('a, button, [role="button"]')).filter((el) => {
        if (el.dataset.ussoEnhanced) return false;
        const href = (el.getAttribute('href') || '').toLowerCase();
        const text = (el.textContent || '').trim().toLowerCase();
        return (
          href.includes('usso.ch/account') ||
          text.includes("gestisci l'account usso") ||
          text.includes('gestisci account usso') ||
          el.hasAttribute('data-usso-account')
        );
      });

      candidateLinks.forEach((el) => {
        el.dataset.ussoEnhanced = 'true';

        // A. Cliccando su "Gestisci l'account USSO", apri la gestione consensi in-app (senza uscire dall'app)
        el.addEventListener('click', (e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            USSO.managePermissions({ mode: 'popup' });
          }
        });

        // B. Se l'elemento è dentro un menu o lista, inietta la voce compagna "Permessi concessi a quest'app"
        try {
          const parentItem = el.closest('li') || (el.parentElement && el.parentElement.tagName.toLowerCase() === 'div' && el.parentElement.parentElement ? el : null);
          const parentContainer = parentItem ? parentItem.parentElement : null;

          if (parentItem && parentContainer && !parentContainer.querySelector('.usso-injected-permissions-item')) {
            const permItem = document.createElement(parentItem.tagName.toLowerCase() === 'li' ? 'li' : 'div');
            permItem.className = (parentItem.className || '') + ' usso-injected-permissions-item';

            const cloned = el.cloneNode(true);
            cloned.removeAttribute('href');
            cloned.style.cursor = 'pointer';
            cloned.dataset.ussoEnhanced = 'true';

            // Cerca il nodo di testo per sostituire l'etichetta
            const textNodes = Array.from(cloned.querySelectorAll('span, p, div')).filter(node => node.children.length === 0 && node.textContent.trim().length > 0);
            if (textNodes.length > 0) {
              textNodes[0].textContent = 'Permessi concessi a quest\'app';
            } else {
              cloned.textContent = 'Permessi concessi a quest\'app';
            }

            cloned.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              USSO.managePermissions({ mode: 'popup' });
            });

            permItem.appendChild(cloned);
            parentItem.insertAdjacentElement('afterend', permItem);
          }
        } catch (_) {}
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanAndAttach);
    } else {
      scanAndAttach();
    }

    if (typeof MutationObserver !== 'undefined' && document.body) {
      const observer = new MutationObserver(() => {
        scanAndAttach();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // --- API PUBBLICA USSO 5.0 (SOVEREIGN ALL-IN-ONE) ---
  const USSO = {
    version: '5.0.0',

    init: function (options) {
      if (!options || !options.clientId) {
        console.error('[USSO 5.0] Opzione "clientId" obbligatoria.');
        return;
      }

      isManuallyInitialized = true;
      config = { ...config, ...options };

      // 1. Tenta di recuperare sessione cached locale
      try {
        const cached =
          sessionStorage.getItem(STORAGE_USER_KEY) ||
          localStorage.getItem(STORAGE_USER_KEY) ||
          localStorage.getItem('usso_user') ||
          localStorage.getItem('usso_v2_calendario_user');
        if (cached) {
          currentUser = JSON.parse(cached);
          if (typeof config.onAuth === 'function') {
            config.onAuth(currentUser);
          }
          emitAuthEvents(currentUser);
        }
      } catch (_) {}

      // 2. Carica profili noti dal Vault Locale Air-Gap (<1ms, zero-iframe)
      setupVaultListener();
      cachedProfiles = getLocalProfiles();
      autoEnhanceUserMenu();

      // Se non connesso e autoPrompt attivo, valuta One Tap immediato
      if (!currentUser && config.autoPrompt) {
        const isDismissed = sessionStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
        if (!isDismissed && cachedProfiles.length > 0) {
          renderOneTapPrompt(cachedProfiles);
        }
      }

      // 3. Renderizza il widget auth immediatamente
      renderAuthWidget();

      // 4. Verifica se stiamo tornando da un redirect OIDC (/callback)
      handleOidcCallbackIfPresent().then((handled) => {
        renderAuthWidget();
      });

      return () => {
        // Cleanup function se usata in React useEffect
        dismissOneTapPrompt(false);
        config.onAuth = null;
        config.onLogout = null;
        config.onPermissionsChange = null;
      };
    },

    // Gestione permessi in-app (Popup o Redirect) con auto-adeguamento
    managePermissions: function (customOptions) {
      if (!config.clientId) {
        console.error('[USSO 4.2] Opzione "clientId" obbligatoria per gestire i permessi.');
        return;
      }
      const opts = customOptions || {};
      const mode = opts.mode || 'popup';
      const width = 560;
      const height = 720;
      const left = typeof window !== 'undefined' ? Math.max(0, Math.round((window.screen.width - width) / 2)) : 0;
      const top = typeof window !== 'undefined' ? Math.max(0, Math.round((window.screen.height - height) / 2)) : 0;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const targetUrl = `${ISSUER}/consent-settings?client_id=${encodeURIComponent(config.clientId)}&origin=${encodeURIComponent(origin)}&mode=${encodeURIComponent(mode)}`;

      if (mode === 'popup' && typeof window !== 'undefined') {
        const popup = window.open(
          targetUrl,
          'USSO_Manage_Permissions',
          `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no`
        );
        if (popup) {
          popup.focus();

          // ESCAMOTAGE TRIGGER 1: Polling chiusura popup.
          // Appena l'utente chiude il popup dei permessi, se c'è stata una modifica registrata scatta il reset!
          try {
            const initialRev = localStorage.getItem(`usso_perm_rev_${config.clientId}`);
            const checkClosedTimer = setInterval(() => {
              try {
                if (popup.closed) {
                  clearInterval(checkClosedTimer);
                  const currentRev = localStorage.getItem(`usso_perm_rev_${config.clientId}`);
                  if (currentRev && currentRev !== initialRev) {
                    console.info('[USSO 4.2] Popup chiuso con modifiche consensi registrate: forzatura reset pagina.');
                    window.location.reload();
                  }
                }
              } catch (_) {
                clearInterval(checkClosedTimer);
              }
            }, 500);
          } catch (_) {}

          return popup;
        }
      }

      if (typeof window !== 'undefined') {
        const returnTo = window.location.href;
        window.location.href = `${targetUrl}&return_to=${encodeURIComponent(returnTo)}`;
      }
    },

    // Login Standard (Redirect)
    login: async function (customOptions) {
      return startAuthFlow({ mode: 'redirect', ...customOptions });
    },

    // Login in-page con Popup elegante (senza ricaricare la pagina chiamante)
    loginWithPopup: async function (customOptions) {
      return startAuthFlow({ mode: 'popup', ...customOptions });
    },

    // Mostra manualmente il prompt USSO One Tap
    showOneTap: function (customOptions) {
      if (customOptions) {
        if (Array.isArray(customOptions)) {
          cachedProfiles = customOptions;
        } else if (customOptions.profiles && Array.isArray(customOptions.profiles)) {
          cachedProfiles = customOptions.profiles;
          config = { ...config, ...customOptions };
        } else {
          config = { ...config, ...customOptions };
        }
      }
      try {
        sessionStorage.removeItem(STORAGE_DISMISSED_KEY);
      } catch (_) {}

      if (cachedProfiles.length > 0) {
        renderOneTapPrompt(cachedProfiles);
      } else {
        cachedProfiles = getLocalProfiles();
        renderOneTapPrompt(cachedProfiles);
      }
    },

    // Chiude manualmente il prompt One Tap
    dismissOneTap: function () {
      dismissOneTapPrompt(true);
    },

    logout: function () {
      if (currentUser?.uid) {
        removeLocalProfile(currentUser.uid);
        broadcastSessionRevocation(currentUser.uid);
      }
      currentUser = null;
      try {
        sessionStorage.removeItem(STORAGE_USER_KEY);
        sessionStorage.removeItem(STORAGE_DISMISSED_KEY);
        localStorage.removeItem('usso_user');
        localStorage.removeItem('usso_access_token');
        localStorage.removeItem('usso_id_token');
      } catch (_) {}
      if (typeof config.onLogout === 'function') {
        config.onLogout();
      }
      emitLogoutEvents();
      renderAuthWidget();
    },

    getUser: function () {
      let u = currentUser;
      if (!u) {
        try {
          var saved = localStorage.getItem('usso_user') || localStorage.getItem('usso_v2_calendario_user');
          if (saved) u = JSON.parse(saved);
        } catch (_) {}
      }
      return u;
    },

    isAuthenticated: function () {
      return !!currentUser;
    },

    getProfiles: function () {
      return [...cachedProfiles];
    },

    // Ottiene il BATS Trust Passport attivo per l'utente corrente
    getTrustPassport: async function () {
      if (!currentUser || !currentUser.idToken) return null;
      try {
        const res = await fetch(`${ISSUER}/api/bats/gate`, {
          headers: {
            'Authorization': `Bearer ${currentUser.idToken}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.passport || null;
      } catch (_) {
        return null;
      }
    },

    // Valuta la conformità di un'azione sensibile (transazione ucoin, accesso dati, DNS, AI tool)
    // con valutazione BATS e gestione automatica dello step-up
    verifyAction: async function (options) {
      const opts = options || {};
      const actionType = opts.actionType || 'default';
      const amount = typeof opts.amount === 'number' ? opts.amount : undefined;
      const metadata = opts.metadata || {};

      if (!currentUser || !currentUser.idToken) {
        return { allowed: false, stepUpRequired: true, error: 'unauthenticated' };
      }
      try {
        const passport = opts.passport || (await this.getTrustPassport());
        if (!passport) {
          return { allowed: false, stepUpRequired: true, error: 'no_passport' };
        }
        const res = await fetch(`${ISSUER}/api/bats/verify-action`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentUser.idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            passport,
            action: actionType,
            metadata: {
              ...metadata,
              ...(amount !== undefined ? { amount } : {})
            }
          })
        });
        const evalResult = await res.json();
        return evalResult;
      } catch (err) {
        return { allowed: false, stepUpRequired: true, error: err.message || 'network_error' };
      }
    }
  };

  // --- AUTO-DISCOVERY & ZERO-JS INITIALIZATION (CON SUPPORTO MUTATION OBSERVER PER SPA/REACT/VUE) ---
  function autoDiscoverAndInit() {
    if (typeof document === 'undefined') return;

    function scanAndInit() {
      const targets = getAllAuthContainers();
      if (targets.length === 0) return;

      if (!isManuallyInitialized && !config.clientId) {
        for (const target of targets) {
          const dataset = target.dataset || {};
          const clientId = dataset.clientId || target.getAttribute('client-id') || (window.__USSO_CONFIG__ && window.__USSO_CONFIG__.clientId);
          if (clientId) {
            USSO.init({
              clientId: clientId,
              autoPrompt: dataset.autoPrompt === undefined ? true : dataset.autoPrompt !== 'false',
              theme: dataset.theme || target.getAttribute('theme') || 'auto',
              scope: dataset.scope || target.getAttribute('scope') || undefined,
              dropdownAlign: dataset.dropdownAlign || target.getAttribute('dropdown-align') || 'right',
              promptPosition: dataset.promptPosition || target.getAttribute('prompt-position') || undefined,
              containerId: target.id || undefined
            });
            return;
          }
        }
      }

      renderAuthWidget();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanAndInit);
    } else {
      scanAndInit();
    }

    // Dynamic SPA & Framework mounting observer (React, Vue, Svelte, Angular, Next.js)
    if (typeof MutationObserver !== 'undefined' && document.documentElement) {
      let debounceTimer = null;
      const observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scanAndInit, 30);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoDiscoverAndInit);
    } else {
      autoDiscoverAndInit();
    }
  }

  // Esporta globalmente come window.USSO
  global.USSO = Object.freeze(USSO);

})(typeof window !== 'undefined' ? window : this);
