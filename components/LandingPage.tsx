import React, { useState } from 'react';
import { Bell, Check, EyeOff, Palette, ShieldCheck, Users, Vote, CalendarCheck } from 'lucide-react';
import '../styles/landing.css';

interface LandingPageProps {
  onLogin: () => void;
  onPreviewBooking: () => void;
  onOpenLegal: (tab: 'privacy' | 'impressum' | 'terms') => void;
}

type Pubblico = 'privati' | 'aziende';

const ICON = { size: 20, strokeWidth: 1.6 } as const;

const TESTI = {
  privati: {
    pill: 'Per te, la famiglia e gli amici',
    h1: 'Trovare un momento insieme, senza cinquanta messaggi.',
    lead: 'Tieni i tuoi impegni in un calendario solo tuo e condividi quando sei libero. Gli altri scelgono un orario, tu ricevi la conferma e nessuno si sovrappone.',
    cta: 'Crea il tuo calendario',
    cta2: 'Guarda come funziona',
    note: 'Chi sceglie un orario non deve creare un account.',
    toastTitle: 'Marco ha scelto',
    toastText: 'Sabato 14, 10:00 · Ci vediamo',
    stepsTitle: 'Segna, condividi, fatto.',
    steps: [
      { t: 'Segna quando sei libero', d: 'Una sera, un sabato mattina, una settimana intera. I tuoi impegni restano privati.' },
      { t: 'Manda il link nel gruppo', d: 'Famiglia, amici, squadra: tutti vedono gli stessi orari liberi, nient’altro.' },
      { t: 'Ognuno sceglie il suo', d: 'Il primo che prenota occupa lo slot, gli altri vedono subito cosa resta.' }
    ],
    featTitle: 'Il calendario di casa, finalmente condiviso bene.',
    featLead: 'Per la vita di tutti i giorni: cene, visite, turni, allenamenti, babysitter.',
    feats: [
      { icon: <Users {...ICON} />, t: 'Calendari di famiglia', d: 'Un calendario comune per la casa, uno personale per te. Si vedono insieme.' },
      { icon: <Vote {...ICON} />, t: 'Trova una data comune', d: 'Proponi qualche giorno, ognuno segna quando può, la data migliore emerge da sola.' },
      { icon: <Bell {...ICON} />, t: 'Promemoria', d: 'Un avviso il giorno prima, a te e a chi ha scelto l’orario.' },
      { icon: <EyeOff {...ICON} />, t: 'Solo libero o occupato', d: 'Chi guarda il link non vede mai cosa fai, solo quando sei disponibile.' }
    ],
    audTitle: 'Per tutto quello che si organizza insieme',
    aud: ['Famiglia', 'Amici', 'Sport e hobby', 'Turni e babysitter', 'Vicini e condominio'],
    privTitle: 'La tua agenda privata resta privata.',
    priv: [
      { t: 'Dati in Svizzera', d: 'Calendari e scelte ospitati su server svizzeri, secondo la nLPD.' },
      { t: 'Nessun tracciamento', d: 'Niente cookie pubblicitari e nessuna profilazione delle tue abitudini.' },
      { t: 'Tu decidi cosa si vede', d: 'Ogni link mostra solo gli orari che hai scelto di condividere.' }
    ],
    endTitle: 'Il prossimo “quando ci vediamo?” si risolve con un link.',
    endLead: 'Crea il calendario, segna quando ci sei e mandalo a chi vuoi.'
  },
  aziende: {
    pill: 'Per studi, negozi e team',
    h1: 'I tuoi clienti prenotano da soli. Tu lavori.',
    lead: 'Servizi con le loro regole, più persone e sale, una pagina con il tuo marchio. Il calendario del team resta uno solo, con i dati in Svizzera.',
    cta: 'Apri uno spazio aziendale',
    cta2: 'Prova una pagina di prenotazione',
    note: 'I clienti prenotano senza account. Tu decidi conferme, pause e preavvisi.',
    toastTitle: 'Nuova prenotazione',
    toastText: 'Laura R. · Consulenza con Silvia, lun 9 10:30',
    stepsTitle: 'Dai servizi alla prenotazione, senza telefonate.',
    steps: [
      { t: 'Definisci servizi e regole', d: 'Durata, pause, preavviso, massimo al giorno, conferma automatica o manuale.' },
      { t: 'Pubblica la tua pagina', d: 'Logo, indirizzo e servizi su un indirizzo tuo. Da mettere sul sito, sui social, in firma.' },
      { t: 'Il team riceve le prenotazioni', d: 'Ogni richiesta va a chi è libero, rispettando gli impegni di ciascuno.' }
    ],
    featTitle: 'Un calendario per tutto il team, non solo un modulo.',
    featLead: 'Gli slot convivono con gli impegni di ognuno: quando qualcuno è occupato, nessuno può prenotarlo.',
    feats: [
      { icon: <Users {...ICON} />, t: 'Team e risorse', d: 'Persone, sale, postazioni: ognuno con la sua disponibilità, tutto in un calendario.' },
      { icon: <Check {...ICON} />, t: 'Conferma come preferisci', d: 'Automatica, oppure ricevi la richiesta e decidi tu. Puoi proporre un altro orario.' },
      { icon: <Palette {...ICON} />, t: 'Pagina con il tuo marchio', d: 'Il tuo logo e i tuoi colori, con l’indirizzo e i servizi che offri.' },
      { icon: <ShieldCheck {...ICON} />, t: 'Pronto per la nLPD', d: 'Dati in Svizzera, accordo sul trattamento dei dati ed esportazioni quando servono.' }
    ],
    audTitle: 'Pensato per chi riceve su appuntamento',
    aud: ['Studi medici e terapisti', 'Consulenti', 'Parrucchieri ed estetisti', 'Officine e servizi', 'Uffici e sportelli'],
    privTitle: 'I dati dei tuoi clienti sono una responsabilità. La prendiamo sul serio.',
    priv: [
      { t: 'Dati in Svizzera', d: 'Calendari e prenotazioni ospitati su server svizzeri, secondo la nLPD.' },
      { t: 'Nessun tracciamento', d: 'Niente cookie pubblicitari sulla tua pagina né su quella dei tuoi clienti.' },
      { t: 'Il minimo indispensabile', d: 'A chi prenota chiediamo solo nome ed e-mail, a meno che tu non serva altro.' }
    ],
    endTitle: 'Porta le prenotazioni del tuo team in un solo calendario.',
    endLead: 'Apri lo spazio aziendale, aggiungi i servizi e pubblica la pagina.'
  }
} as const;

const MOMENTI = [
  { g: 'Giovedì 12', h: '19:30', chi: 'libero', preso: false },
  { g: 'Venerdì 13', h: '20:00', chi: 'scelto da Anna', preso: true },
  { g: 'Sabato 14', h: '10:00', chi: 'scelto da Marco', preso: true },
  { g: 'Sabato 14', h: '15:00', chi: 'libero', preso: false },
  { g: 'Domenica 15', h: '11:00', chi: 'libero', preso: false },
  { g: 'Domenica 15', h: '17:00', chi: 'libero', preso: false }
];

const SERVIZI = [
  { n: 'Consulenza', m: '30 min · in sede o video', f: '6 liberi', on: true },
  { n: 'Colloquio', m: '60 min · conferma manuale', f: '2 liberi', on: false },
  { n: 'Revisione documenti', m: '45 min · in sede', f: '4 liberi', on: false }
];

const ORARI = [
  { h: '09:00 · Silvia', sel: false },
  { h: '10:00 · Luca', sel: false },
  { h: '10:30 · Silvia', sel: true },
  { h: '14:00 · Luca', sel: false }
];

function pubblicoIniziale(): Pubblico {
  if (typeof window === 'undefined') return 'privati';
  const per = new URLSearchParams(window.location.search).get('per');
  return per === 'lavoro' || per === 'aziende' ? 'aziende' : 'privati';
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onPreviewBooking, onOpenLegal }) => {
  const [pubblico, setPubblico] = useState<Pubblico>(pubblicoIniziale);
  const c = TESTI[pubblico];
  const privati = pubblico === 'privati';

  const scegli = (p: Pubblico) => {
    setPubblico(p);
    try {
      const url = new URL(window.location.href);
      if (p === 'aziende') url.searchParams.set('per', 'lavoro');
      else url.searchParams.delete('per');
      window.history.replaceState(null, '', url.toString());
    } catch {
      /* ambienti senza history: nessun problema */
    }
  };

  const vaiA = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const secondaria = privati ? vaiA('come-funziona') : (e: React.MouseEvent) => { e.preventDefault(); onPreviewBooking(); };

  return (
    <div className="ld">
      <header className="ld-wrap ld-top">
        <a href="#" className="ld-logo" aria-label="calendario.ch, torna all'inizio">
          calendario<span className="tld">.ch</span>
        </a>
        <div className="ld-switch" role="group" aria-label="Scegli per chi">
          <button type="button" aria-pressed={privati} onClick={() => scegli('privati')}>Per me</button>
          <button type="button" aria-pressed={!privati} onClick={() => scegli('aziende')}>Per il lavoro</button>
        </div>
        <div className="ld-actions">
          <button type="button" className="ld-btn light" onClick={onLogin}>Accedi</button>
          <button type="button" className="ld-btn dark" onClick={onLogin}>Crea un account</button>
        </div>
      </header>

      <main>
        <section className="ld-wrap ld-hero">
          <div className="ld-hero-text">
            <span className="ld-pill">{c.pill}</span>
            <h1 className="ld-h1">{c.h1}</h1>
            <p className="ld-lead">{c.lead}</p>
            <div className="ld-row">
              <button type="button" className="ld-btn lg accent" onClick={onLogin}>{c.cta}</button>
              <a href="#come-funziona" className="ld-btn lg light" onClick={secondaria}>{c.cta2}</a>
            </div>
            <span className="ld-note">{c.note} Accesso sicuro con USSO.ch.</span>
          </div>

          <div
            className="ld-preview"
            role="img"
            aria-label={privati ? 'Anteprima di una pagina personale con i momenti liberi' : 'Anteprima di una pagina aziendale con servizi e orari del team'}
          >
            {privati ? (
              <div className="ld-card ld-preview-card" aria-hidden="true">
                <div className="ld-who">
                  <span className="av">GM</span>
                  <span className="t"><small>Giulia</small><b>Ci vediamo questa settimana?</b></span>
                </div>
                <div className="ld-moments">
                  {MOMENTI.map((m, i) => (
                    <span key={i} className={`ld-moment${m.preso ? ' taken' : ''}`}>
                      <small>{m.g}</small>
                      <b>{m.h}</b>
                      <small>{m.chi}</small>
                    </span>
                  ))}
                </div>
                <div className="ld-legend">
                  <span><i className="ld-sw free" />libero</span>
                  <span><i className="ld-sw taken" />già scelto da qualcuno</span>
                </div>
              </div>
            ) : (
              <div className="ld-card ld-preview-card" aria-hidden="true">
                <div className="ld-col">
                  <div className="ld-who">
                    <span className="av brand">SR</span>
                    <span className="t"><small>Studio Rossi · Mendrisio</small><b>Scegli un servizio</b></span>
                  </div>
                  {SERVIZI.map((s) => (
                    <span key={s.n} className={`ld-service${s.on ? ' on' : ''}`}>
                      <span className="n"><b>{s.n}</b><small>{s.m}</small></span>
                      <span className="f">{s.f}</span>
                    </span>
                  ))}
                </div>
                <div className="ld-col narrow">
                  <span className="ld-day"><span className="big">9</span><span className="d">Lunedì<small>con chiunque del team</small></span></span>
                  {ORARI.map((o) => (
                    <span key={o.h} className={`ld-time${o.sel ? ' sel' : ''}`}>{o.h}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="ld-toast" aria-hidden="true">
              <span className="ic"><Check size={16} strokeWidth={1.8} /></span>
              <span className="t"><b>{c.toastTitle}</b><small>{c.toastText}</small></span>
            </div>
          </div>
        </section>

        <section id="come-funziona" className="ld-wrap ld-sec" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
            <span className="ld-eyebrow">Come funziona</span>
            <h2 className="ld-h2">{c.stepsTitle}</h2>
          </div>
          <div className="ld-steps">
            {c.steps.map((s, i) => (
              <div key={s.t} className="ld-card ld-step">
                <span className="num">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="funzioni" className="ld-wrap ld-sec ld-split">
          <div className="intro">
            <span className="ld-eyebrow">Funzioni</span>
            <h2 className="ld-h2">{c.featTitle}</h2>
            <p className="ld-muted" style={{ margin: 0 }}>{c.featLead}</p>
          </div>
          <div className="ld-feats">
            {c.feats.map((f) => (
              <div key={f.t} className="ld-card ld-feat">
                <span className="ic" aria-hidden="true">{f.icon}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ld-wrap ld-sec" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 className="ld-h2 sm">{c.audTitle}</h2>
          <div className="ld-chips">
            {c.aud.map((a) => <span key={a}>{a}</span>)}
          </div>
        </section>

        <section className="ld-wrap ld-sec" style={{ paddingTop: 0 }}>
          <div className="ld-card ld-spaces">
            <div className="intro">
              <span className="ld-eyebrow">Un solo account</span>
              <h2 className="ld-h2 sm">Personale e lavoro, nello stesso calendario. Separati dove conta.</h2>
              <p className="ld-muted" style={{ margin: 0 }}>
                Apri uno spazio aziendale quando ti serve e passa dall’uno all’altro con un tocco. I colleghi vedono solo quando sei occupato, mai il perché.
              </p>
            </div>
            <div className="demo" aria-hidden="true">
              <div className="ld-spacepick">
                <span className={privati ? 'on' : ''}><i style={{ background: 'var(--muted)' }} />Personale</span>
                <span className={privati ? '' : 'on'}><i style={{ background: 'var(--accent)' }} />Studio Rossi</span>
              </div>
              <div className="ld-agenda">
                <div className="own"><span className="h">08:30</span><b>Palestra</b><small>i colleghi vedono: occupato</small></div>
                <div className="bk"><span className="h">10:00</span><b>Colloquio · Pedrazzini</b></div>
                <div className="fr"><span className="h">15:00</span><b>Slot libero</b></div>
              </div>
            </div>
          </div>
        </section>

        <section id="privacy" className="ld-wrap ld-sec" style={{ paddingTop: 0 }}>
          <div className="ld-dark">
            <div className="intro">
              <span className="ld-eyebrow">Privacy</span>
              <h2 className="ld-h2">{c.privTitle}</h2>
            </div>
            <div className="pts">
              {c.priv.map((p) => (
                <div key={p.t}><b>{p.t}</b><span>{p.d}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="ld-wrap" style={{ paddingBottom: 64 }}>
          <div className="ld-end">
            <div className="intro">
              <h2>{c.endTitle}</h2>
              <p>{c.endLead}</p>
            </div>
            <div className="ld-row">
              <button type="button" className="ld-btn lg on-accent" onClick={onLogin}>{c.cta}</button>
              <button type="button" className="ld-btn lg ghost-on-accent" onClick={onLogin}>Accedi</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="ld-wrap ld-foot">
        <span className="ld-logo">calendario<span className="tld">.ch</span></span>
        <button type="button" className="ld-link" onClick={() => onOpenLegal('privacy')}>Privacy</button>
        <button type="button" className="ld-link" onClick={() => onOpenLegal('terms')}>Condizioni d’uso</button>
        <button type="button" className="ld-link" onClick={() => onOpenLegal('impressum')}>Impressum e contatti</button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CalendarCheck size={16} strokeWidth={1.6} aria-hidden="true" />Fatto in Ticino
        </span>
      </footer>
    </div>
  );
};

export default LandingPage;
