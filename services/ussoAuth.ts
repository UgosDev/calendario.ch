/**
 * services/ussoAuth.ts — Client OIDC (PKCE), Passkey FIDO2 & USSO 5.0 Universal Standard
 * Ecosistema Sovrano UnHub • Datacenter Ginevra dc4-a
 *
 * Specifiche & Direttive implementate:
 *  - USSO 5.0 Master Integration Spec (Gold Standard)
 *  - FIDO2 / WebAuthn passwordless hardware-bound (Secure Enclave / TPM)
 *  - Identificativo primario invariante: `unhubId` (sub)
 *  - One Tap SDK automatizzato (<150ms) con soppressione in iframe (!isEmbedded())
 *  - Token Endpoint prioritario su `https://usso-api.ch` con fallback su `https://usso.ch`
 *  - Live Session Sync multipannello via BroadcastChannel nativo (USSO_SESSION_V5)
 *  - Regola UX 6.6: il sottotitolo utente mostra l'email o il profilo semantico, mai l'hash raw!
 */

import { UssoUser } from '../types';

declare global {
  interface Window {
    USSO?: {
      version?: string;
      init: (config: any) => () => void;
      login: (options?: any) => Promise<void>;
      loginWithPopup: (options?: any) => Promise<void>;
      showOneTap: (customOptions?: any) => void;
      dismissOneTap: (permanently?: boolean) => void;
      logout: () => void;
      getUser: () => any;
      isAuthenticated: () => boolean;
      getProfiles: () => any[];
      managePermissions?: () => void;
    };
    BC_Manager?: {
      showSettings: () => void;
      getConsent?: () => any;
    };
  }
}

// ─── Endpoints Canonici Sovrani (Ginevra dc4-a) ─────────────────────────────
export const USSO_PORTAL = 'https://usso.ch';
export const USSO_OIDC = 'https://usso.ch';
export const USSO_API = 'https://usso-api.ch';
export const USSO_CLIENT_ID = 'calendario-ch';

export const REDIRECT_URI =
  typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : 'https://calendario.ch/';

export const SCOPES =
  'openid profile email archivio.continuity ucoin.wallet calendario:schedule';

// ─── Storage Keys (Prefisso Isolato & Namespace Universale) ──────────────────
const STORAGE_PREFIX = 'usso_v2_calendario_';
export const KEY_ACCESS_TOKEN = `${STORAGE_PREFIX}access_token`;
export const KEY_ID_TOKEN = `${STORAGE_PREFIX}id_token`;
export const KEY_USER = `${STORAGE_PREFIX}user`;
export const KEY_STATE = `${STORAGE_PREFIX}state`;
export const KEY_VERIFIER = `${STORAGE_PREFIX}pkce_verifier`;

// ─── Helpers UX Profilo (Conformi a Sezione 6.6 Direttive USSO) ─────────────
export function getDisplayName(user: UssoUser | null): string {
  if (!user) return 'Ospite';
  if (user.nickname) return user.nickname;
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  return 'Utente Sovrano';
}

/**
 * Direttiva Vincolante 6.6: Sottotitolo utente.
 * MUST mostrare l'email se disponibile, o il nickname o "Profilo verificato".
 * MUST NOT mostrare mai la stringa grezza dell'hash unhubId!
 */
export function getUserSubtitle(user: UssoUser | null): string {
  if (!user) return 'Sessione Locale Anonima';
  if (user.email) return user.email;
  if (user.nickname) return `@${user.nickname}`;
  return 'Profilo Sovrano Verificato';
}

export function getInitials(user: UssoUser | null): string {
  if (!user) return '·';
  if (user.nickname) return user.nickname.trim().slice(0, 2).toUpperCase();
  if (user.name) {
    return user.name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (user.email) return user.email[0].toUpperCase();
  return user.unhubId ? user.unhubId.slice(0, 2).toUpperCase() : '🇨🇭';
}

/**
 * Verifica se l'applicazione è in esecuzione dentro un iframe (modulo incorporato su siti terzi o pagine.ch)
 */
export function isEmbedded(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

// ─── PKCE Cryptographic Helpers (WebCrypto RFC 7636) ────────────────────────
function base64urlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeVerifier(): Promise<string> {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64urlEncode(arr.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const enc = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return base64urlEncode(digest);
}

function generateState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return base64urlEncode(arr.buffer);
}

// ─── Normalizzazione Dati Utente (Claim OIDC + unhubId primario) ────────────
export function normalizeUser(claims: Partial<UssoUser> | Record<string, unknown>): UssoUser | null {
  const sub =
    typeof (claims as any).sub === 'string'
      ? (claims as any).sub
      : typeof (claims as any).unhubId === 'string'
      ? (claims as any).unhubId
      : typeof (claims as any).uid === 'string'
      ? (claims as any).uid
      : typeof (claims as any).id === 'string'
      ? (claims as any).id
      : null;

  if (!sub) return null;

  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;
  const bool = (v: unknown): boolean | undefined =>
    typeof v === 'boolean' ? v : undefined;
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  const arr = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as string[]) : undefined;

  return {
    unhubId: sub,
    sub,
    nickname: str((claims as any).nickname),
    name: str((claims as any).name ?? (claims as any).displayName),
    picture: str((claims as any).picture ?? (claims as any).photoURL),
    email: str((claims as any).email),
    email_verified: bool((claims as any).email_verified ?? (claims as any).emailVerified),
    phone_number: str((claims as any).phone_number),
    consentVersion: num((claims as any).consentVersion ?? (claims as any).consent_version),
    grantedClaims: arr((claims as any).grantedClaims),
    batsPassport: str((claims as any).batsPassport ?? (claims as any).bats_passport)
  };
}

// ─── Lettura & Gestione Token / Sessione ────────────────────────────────────
export function getUser(): UssoUser | null {
  try {
    const raw =
      localStorage.getItem(KEY_USER) ||
      localStorage.getItem('usso_user') ||
      sessionStorage.getItem(KEY_USER);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return (
    localStorage.getItem(KEY_ACCESS_TOKEN) ||
    localStorage.getItem('usso_access_token') ||
    sessionStorage.getItem(KEY_ACCESS_TOKEN)
  );
}

export function getIdToken(): string | null {
  return (
    localStorage.getItem(KEY_ID_TOKEN) ||
    localStorage.getItem('usso_id_token') ||
    sessionStorage.getItem(KEY_ID_TOKEN)
  );
}

export function getUssoHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = getAccessToken();
  const idToken = getIdToken();
  const user = getUser();

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (idToken) headers['x-usso-id-token'] = idToken;
  if (user?.unhubId) headers['x-usso-user'] = user.unhubId;
  if (user?.batsPassport) headers['x-usso-bats-passport'] = user.batsPassport;

  return headers;
}

export function clearLocalSession(): void {
  try {
    [
      KEY_ACCESS_TOKEN,
      KEY_ID_TOKEN,
      KEY_USER,
      KEY_STATE,
      KEY_VERIFIER,
      'usso_user',
      'usso_access_token',
      'usso_id_token'
    ].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch (e) {
    console.warn('[USSO] Errore pulizia sessione locale:', e);
  }
}

// ─── Inizializzazione USSO 5.0 (SDK Universale + One Tap) ───────────────────
export function initUsso(
  onAuthCallback: (user: UssoUser) => void,
  onLogoutCallback?: () => void
): () => void {
  let cleanedUp = false;
  let sdkCleanup: (() => void) | null = null;

  // 1. Carica subito l'eventuale utente presente in cache
  const cached = getUser();
  if (cached) {
    onAuthCallback(cached);
  }

  // 2. Verifica se siamo al ritorno da redirect OIDC (?code=...)
  if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
    handleCallback().then((u) => {
      if (u && !cleanedUp) onAuthCallback(u);
    });
  }

  const handleAuthenticatedUser = (rawUser: any) => {
    if (cleanedUp) return;
    const normalized = normalizeUser(rawUser);
    if (!normalized) return;

    localStorage.setItem(KEY_USER, JSON.stringify(normalized));
    localStorage.setItem('usso_user', JSON.stringify(normalized));

    if (rawUser.accessToken || rawUser.access_token) {
      const tok = rawUser.accessToken || rawUser.access_token;
      localStorage.setItem(KEY_ACCESS_TOKEN, tok);
      localStorage.setItem('usso_access_token', tok);
    }
    if (rawUser.idToken || rawUser.id_token) {
      const idt = rawUser.idToken || rawUser.id_token;
      localStorage.setItem(KEY_ID_TOKEN, idt);
      localStorage.setItem('usso_id_token', idt);
    }

    onAuthCallback(normalized);
  };

  const handleLoggedOut = () => {
    if (cleanedUp) return;
    clearLocalSession();
    if (onLogoutCallback) onLogoutCallback();
  };

  const setupSdk = () => {
    if (typeof window === 'undefined' || !window.USSO) return;
    try {
      sdkCleanup = window.USSO.init({
        clientId: USSO_CLIENT_ID,
        redirectUri: REDIRECT_URI,
        scope: SCOPES,
        autoPrompt: !isEmbedded(), // Soppresso nell'iframe di incorporamento
        promptPosition: 'top-right',
        onAuth: (sdkUser: any) => {
          handleAuthenticatedUser(sdkUser);
        },
        onLogout: () => {
          handleLoggedOut();
        },
        onPermissionsChange: (user: any, diff: any) => {
          console.info('[USSO 5.0] Permessi modificati dall\'utente:', diff);
          handleAuthenticatedUser(user);
        }
      });
    } catch (e) {
      console.warn('[USSO 5.0] Inizializzazione SDK:', e);
    }
  };

  if (typeof window !== 'undefined') {
    if (window.USSO) {
      setupSdk();
    } else {
      const onReady = () => {
        if (window.USSO && !sdkCleanup && !cleanedUp) {
          setupSdk();
        }
      };
      window.addEventListener('DOMContentLoaded', onReady);
      window.addEventListener('load', onReady);
      const timer = setTimeout(onReady, 200);

      return () => {
        cleanedUp = true;
        clearTimeout(timer);
        window.removeEventListener('DOMContentLoaded', onReady);
        window.removeEventListener('load', onReady);
        if (sdkCleanup) sdkCleanup();
      };
    }
  }

  return () => {
    cleanedUp = true;
    if (sdkCleanup) sdkCleanup();
  };
}

export function showOneTap(): void {
  if (typeof window !== 'undefined' && window.USSO?.showOneTap) {
    window.USSO.showOneTap();
  }
}

export function dismissOneTap(): void {
  if (typeof window !== 'undefined' && window.USSO?.dismissOneTap) {
    window.USSO.dismissOneTap();
  }
}

// ─── Flusso Login (Popup in Iframe, Redirect su App Schermo Intero) ─────────
export async function login(loginHint?: string): Promise<void> {
  // Nel modulo incorporato (iframe) usiamo solo finestra popup per non rompere la pagina ospite
  if (isEmbedded()) {
    if (typeof window !== 'undefined' && window.USSO?.loginWithPopup) {
      try {
        await window.USSO.loginWithPopup(loginHint ? { loginHint } : undefined);
        return;
      } catch (e) {
        console.warn('[USSO] Popup non riuscito:', e);
      }
    }
    throw new Error('USSO_POPUP_REQUIRED');
  }

  // Sull'app a schermo intero prioritario l'SDK redirect
  if (typeof window !== 'undefined' && window.USSO?.login) {
    try {
      await window.USSO.login(loginHint ? { loginHint } : undefined);
      return;
    } catch (e) {
      console.warn('[USSO] SDK login fallback PKCE manuale:', e);
    }
  }

  // Fallback manuale PKCE S256 (RFC 7636)
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();

  localStorage.setItem(KEY_VERIFIER, verifier);
  localStorage.setItem(KEY_STATE, state);
  sessionStorage.setItem(KEY_VERIFIER, verifier);
  sessionStorage.setItem(KEY_STATE, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: USSO_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  });

  const authUrl = `${USSO_OIDC}/authorize?${params.toString()}`;
  window.location.href = authUrl;
}

// ─── Callback OIDC (?code=...) ──────────────────────────────────────────────
let callbackPromise: Promise<UssoUser | null> | null = null;

export async function handleCallback(): Promise<UssoUser | null> {
  if (callbackPromise) return callbackPromise;

  callbackPromise = (async () => {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');

    if (!code) return null;

    const savedState = localStorage.getItem(KEY_STATE) || sessionStorage.getItem(KEY_STATE);
    const verifier = localStorage.getItem(KEY_VERIFIER) || sessionStorage.getItem(KEY_VERIFIER);

    // Pulisce la barra dell'indirizzo dal code usa-e-getta
    window.history.replaceState({}, document.title, window.location.pathname);

    if (savedState && returnedState && savedState !== returnedState) {
      console.error('[USSO] State mismatch — possibile attacco CSRF.');
      return null;
    }

    if (!verifier) {
      const existing = getUser();
      if (existing) return existing;
      console.warn('[USSO] Verifier PKCE non trovato.');
      return null;
    }

    localStorage.removeItem(KEY_STATE);
    localStorage.removeItem(KEY_VERIFIER);
    sessionStorage.removeItem(KEY_STATE);
    sessionStorage.removeItem(KEY_VERIFIER);

    try {
      // Scambio codice con token prioritario su USSO_API, fallback su USSO_PORTAL
      let tokenRes = await fetch(`${USSO_API}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: USSO_CLIENT_ID,
          code_verifier: verifier
        })
      });

      if (!tokenRes.ok) {
        tokenRes = await fetch(`${USSO_PORTAL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            client_id: USSO_CLIENT_ID,
            code_verifier: verifier
          })
        });
      }

      if (!tokenRes.ok) {
        console.error('[USSO] Token exchange fallito:', await tokenRes.text());
        return getUser();
      }

      const tokens = await tokenRes.json();
      const { access_token, id_token } = tokens;

      if (!access_token) return getUser();

      localStorage.setItem(KEY_ACCESS_TOKEN, access_token);
      localStorage.setItem('usso_access_token', access_token);

      if (id_token) {
        localStorage.setItem(KEY_ID_TOKEN, id_token);
        localStorage.setItem('usso_id_token', id_token);
      }

      const user = parseIdToken(id_token) ?? (await fetchUserInfo(access_token));
      if (user) {
        localStorage.setItem(KEY_USER, JSON.stringify(user));
        localStorage.setItem('usso_user', JSON.stringify(user));
      }

      return user;
    } catch (e) {
      console.error('[USSO] Errore durante lo scambio OIDC:', e);
      return getUser();
    }
  })();

  return callbackPromise;
}

// ─── Logout Locale & Federato ───────────────────────────────────────────────
export function logout(): void {
  const idToken = getIdToken();
  clearLocalSession();

  if (typeof window !== 'undefined' && window.USSO?.logout) {
    try {
      window.USSO.logout();
      return;
    } catch (e) {
      console.warn('[USSO] Errore USSO.logout SDK:', e);
    }
  }

  const params = new URLSearchParams({ post_logout_redirect_uri: REDIRECT_URI });
  if (idToken) params.set('id_token_hint', idToken);
  window.location.href = `${USSO_OIDC}/logout?${params.toString()}`;
}

// ─── Helpers Privati Token Decoding ─────────────────────────────────────────
function parseIdToken(idToken?: string): UssoUser | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const claims = JSON.parse(decoded) as Record<string, unknown>;
    return normalizeUser(claims);
  } catch {
    return null;
  }
}

async function fetchUserInfo(accessToken: string): Promise<UssoUser | null> {
  try {
    let res = await fetch(`${USSO_API}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      res = await fetch(`${USSO_PORTAL}/userinfo`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }
    if (!res.ok) return null;
    const claims = (await res.json()) as Record<string, unknown>;
    return normalizeUser(claims);
  } catch {
    return null;
  }
}

// ─── USSO 5.0 Swiss Vault Live Session Sync (BroadcastChannel Nativo) ───────
if (typeof window !== 'undefined') {
  try {
    if ('BroadcastChannel' in window) {
      const handleBroadcast = (event: MessageEvent) => {
        const data = event.data;
        if (data?.type === 'USSO_VAULT_SESSION_REVOKED' || data?.type === 'LOGOUT') {
          const user = getUser();
          if (
            user &&
            (!data.uid || data.uid === 'all' || user.unhubId === data.uid || user.sub === data.uid)
          ) {
            console.warn('[USSO 5.0 calendario.ch] Sessione revocata da remoto (BroadcastChannel).');
            logout();
          }
        }
      };

      const bc5 = new BroadcastChannel('USSO_SESSION_V5');
      bc5.onmessage = handleBroadcast;

      const bcLegacy5 = new BroadcastChannel('USSO_VAULT_BROADCAST_V5');
      bcLegacy5.onmessage = handleBroadcast;

      const bcLegacy4 = new BroadcastChannel('USSO_VAULT_BROADCAST_V4');
      bcLegacy4.onmessage = handleBroadcast;
    }
  } catch (_) {}
}
