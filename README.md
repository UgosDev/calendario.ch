# calendario.ch 🇨🇭

> **La piattaforma di scheduling e prenotazioni online per professionisti svizzeri.**  
> Progettata con un'estetica rigorosa **Black & White** in stile **Vercel / Resend**, pagamenti nativi **TWINT** in CHF, conformità federale **nLPD** e server a Zurigo.

---

## ⚡ Caratteristiche Chiave

- **Estetica Vercel & Resend**: Design strettamente monocromatico (`#000000`, `#0a0a0a`, accenti `#ffffff`), griglie con pattern a punti/linee, badge monospace e transizioni fluide.
- **Pagamenti Swiss TWINT**: Supporto nativo per generare QR Code TWINT in franchi svizzeri (CHF) per consulenze a tariffa fissa (es. CHF 150.-) e opzione di fattura QR svizzera.
- **Conformità Svizzera nLPD**: Architettura conforme alla Nuova Legge Federale sulla Protezione dei Dati con datacenter residenti a Zurigo.
- **Esportazione Standard iCalendar (`.ics`)**: Generazione automatica di file `.ics` per Apple Calendar, Google Calendar, Outlook e Microsoft 365, con sincronizzazione degli slot in tempo reale.
- **Tipologie di Incontro Multiple**:
  - In sede (es. *Sede MT Financial Consulting, Bioggio*)
  - Videoconferenza crittografata (link istantaneo)
  - A domicilio cliente (in tutto il Canton Ticino o Svizzera)
- **Dashboard Professionista**: Gestione appuntamenti in tempo reale, modifica servizi/tariffe, configurazione orari di disponibilità settimanale e sincronizzazione calendari esterni.
- **Integrazione Nativa con `pagine.ch`**: Widget embeddabile in iframe isolato con parametri `?embed=true` o `/embed/{handle}` per mostrare l'agenda all'interno di qualsiasi sito creato su `pagine.ch`.

---

## 🛠 Stack Tecnologico

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- **Iconografia**: [Lucide React](https://lucide.dev/)
- **Standard Calendari**: RFC 5545 iCalendar (`.ics`)

---

## 🚀 Avvio Rapido

```bash
# Entra nella cartella di progetto
cd c:\Users\fermo\Documents\GitHub\calendario.ch

# Installa le dipendenze (se non già fatto)
npm install

# Avvia l'ambiente di sviluppo locale
npm run dev

# Compila la build di produzione
npm run build
```

---

## 🔗 Integrazione con `pagine.ch`

### 1. Codice Iframe
```html
<iframe
  src="https://calendario.ch/embed/pietro-pirola"
  width="100%"
  height="700"
  frameborder="0"
  style="border-radius: 20px; border: 1px solid #262626;"
  allow="clipboard-write"
></iframe>
```

### 2. Blocco Nativo su `pagine.ch`
Nel catalogo blocchi di `pagine.ch` sotto la categoria **Interattività & Servizi**, seleziona:
> **Prenotazioni (calendario.ch) 🇨🇭**  
> Imposta l'handle `pietro-pirola` per sincronizzare automaticamente l'agenda.

---

## 🇨🇭 Ecosistema UnHub Svizzera
- **pagine.ch**: Generatore e hosting di siti web per professionisti e PMI
- **calendario.ch**: Scheduling, appuntamenti e pagamenti TWINT
- **USSO.ch**: Swiss Unified Single Sign-On
- **domande.ch**: Form, sondaggi e calcolatori
- **LaMappa.ch**: Mappe svizzere e orari di trasporto pubblico
- **AccessiRoot.ch**: Certificazione accessibilità digitale WCAG 2.2 AAA
