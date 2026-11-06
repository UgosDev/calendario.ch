# calendario.ch 🇨🇭

> **La piattaforma di scheduling e gestione del tempo sovrana della galassia UnHub.**  
> Connessa a **USSO.ch** (FIDO2 Passkeys), **Archivio.ch** (User-Owned Storage nel bunker di Ginevra dc4-a), **taccuino.ch** (verbali e appunti d'incontro) e **pagine.ch** (hosting Caddy e blocco visuale nativo).

---

## ⚡ Caratteristiche e Integrazioni Sovrane

- 🔑 **Autenticazione Sovrana con USSO.ch**:
  - Accesso passwordless universale con Passkey biometrica FIDO2 / WebAuthn.
  - Riconoscimento dell'`unhubId` univoco e stabile.
  - Zero password su server, protezione totale da phishing e furto d'identità.
- 🗄️ **User-Owned Storage con Archivio.ch (Ginevra dc4-a)**:
  - Nessun database proprietario opaco: i tuoi appuntamenti, le disponibilità e i clienti risiedono nel tuo caveau cifrato.
  - Conforme al Codice delle Obbligazioni (CO art. 958f), GeBüV e Nuova Legge Federale sulla Protezione dei Dati (nLPD).
  - Hash probatorio SHA-256 generato client-side e sincronizzazione bidirezionale offline-first.
- 📋 **Ponte Diretto con taccuino.ch**:
  - Su ogni evento o prenotazione: pulsante per aprire o generare direttamente un appunto/verbale formattato in Markdown con partecipanti, data, orari e ordine del giorno.
  - Supporto per deeplinking e sincronizzazione cross-satellite via PostMessage.
- 🌐 **Integrazione con pagine.ch & Script Incorpora**:
  - Configurazione `pch.json` per deploy immediato tramite `pch deploy` sul cluster Caddy Edge (`83.228.228.33`).
  - Script sovrano `public/incorpora.js` privo di traccianti o cookie per incorporare l'agenda su qualsiasi sito web esterno (link, popup modale, o modulo inline).
  - Simulatore interattivo del builder di `pagine.ch` per testare la resa visiva in tempo reale.
- 💰 **Pagamenti Sovrani TWINT & UCOIN.ch**:
  - Tasso fisso di cambio a circuito chiuso: `10 UCOIN = CHF 1.00`.
  - Pagamento consulenze e acconti tramite QR Code TWINT svizzero nativo o saldo UCOIN a zero commissioni.
- 📅 **Motore Calendario Editoriale Svizzero**:
  - 5 Viste complete: **Settimana** (con drag & drop orario a 15 min), **Giorno** (con split panel agenda e slot rapidi), **Mese** (con matrice e badge festività cantonali), **Agenda** (prossimi 30 giorni) e **Slot Condivisi**.
  - Calcolo astronomico delle festività del **Canton Ticino** e della Confederazione (algoritmo di Gauss/Meeus per Pasqua, Lunedì dell'Angelo, Ascensione, Pentecoste, Corpus Domini, San Giuseppe, Santi Pietro e Paolo, ecc.).
  - Esportazione standard conforme **RFC 5545 iCalendar (`.ics`)**.
  - Animazione opzionale "Neve e Oro" stagionale con pieno rispetto delle preferenze `prefers-reduced-motion`.

---

## 🛠 Stack Tecnologico

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Styling**: Tailwind CSS v4 con CSS Variables editoriali svizzere
- **Iconografia**: Lucide React
- **Crittografia & Privacy**: WebCrypto API nativa (SHA-256, AES-256 client-side)

---

## 🚀 Avvio Rapido & Comandi

```bash
# Installa le dipendenze
npm install

# Avvia l'ambiente di sviluppo locale
npm run dev

# Compila la build di produzione per dist/
npm run build

# Deploy sul cluster sovrano di pagine.ch
npm run deploy
```

---

## 🇨🇭 Galassia UnHub Svizzera
- **USSO.ch**: Universal Sovereign Single Sign-On
- **Archivio.ch**: Bunker dati cifrato e User-Owned Storage
- **taccuino.ch**: Note personali, promemoria e verbali
- **pagine.ch**: Edge hosting e builder per siti web
- **UCOIN.ch**: Borsellino sovrano prepagato in franchi
- **LaMappa.ch**: Mappe e trasporto pubblico svizzero
- **calendario.ch**: Scheduling, appuntamenti e disponibilità
