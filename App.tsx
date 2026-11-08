import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ViewMode,
  SovereignCalendarState,
  CalendarEvent,
  Booking,
  SlotType,
  UssoUser,
  VaultSyncStatus
} from './types';
import { getInitialSovereignState } from './services/calendarSeed';
import { initUsso, getUser } from './services/ussoAuth';
import {
  fetchPublicSchedule,
  submitBookingRequest,
  syncOwnerSchedulesAndBookings,
  PublicScheduleData
} from './services/bookingClient';
import { initCrossSatelliteBridge } from './services/taccuinoBridge';
import {
  keyFromDate,
  parseKey,
  addDaysToKey,
  formatLongDate,
  formatShortDate,
  formatMinutesToClock
} from './services/swissHolidays';

// Componenti
import { Navbar } from './components/Navbar';
import { TEMA } from './config';
import { Sidebar } from './components/Sidebar';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { MonthView } from './components/MonthView';
import { AgendaView } from './components/AgendaView';
import { SlotsView } from './components/SlotsView';
import { EmbedView } from './components/EmbedView';
import { PublicBookingView } from './components/PublicBookingView';
import { EventModal } from './components/EventModal';
import { BookingModal } from './components/BookingModal';
import { SlotTypeModal } from './components/SlotTypeModal';
import { UssoAccountModal } from './components/UssoAccountModal';

// Icone
import {
  Calendar as CalIcon,
  Clock,
  Plus,
  Grid,
  CheckCircle,
  CalendarDays,
  List,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'calendario.ch.sovereign.v3';

export default function App() {
  // ── 1. Inizializzazione Stato Sovrano da localStorage o Stato Pulito ──
  const [calendarState, setCalendarState] = useState<SovereignCalendarState>(() => {
    try {
      if (typeof window !== 'undefined') {
        // Pulizia vecchie chiavi con dati finti o seed di test
        localStorage.removeItem('calendario.ch.sovereign.v2');
        localStorage.removeItem('calendario.ch.sovereign.v1');
        localStorage.removeItem('calendario_state');

        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.v) {
            // Se sono rimasti residui del profilo finto di test, purificali
            if (parsed.settings?.owner === 'Eric Botta' || parsed.settings?.handle === 'eric') {
              parsed.settings.owner = '';
              parsed.settings.handle = '';
              parsed.events = [];
              parsed.bookings = [];
              parsed.types = [];
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[Calendario] Inizializzazione stato pulito:', e);
    }
    return getInitialSovereignState();
  });

  // ── 2. Stato Autenticazione USSO ──
  const [user, setUser] = useState<UssoUser | null>(() => getUser());

  // ── 3. Stato Caveau Archivio.ch ──
  const [syncStatus, setSyncStatus] = useState<VaultSyncStatus>({
    state: 'idle',
    quotaUsedBytes: 154200,
    quotaTotalBytes: 1073741824
  });

  // ── 4. Stato Navigazione & Cursore Temporale ──
  const [cursorDate, setCursorDate] = useState<string>(() => keyFromDate(new Date()));
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const pathSegments = window.location.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
      const hasPathRoute = pathSegments.length > 0 && !pathSegments[0].includes('.') && pathSegments[0] !== 'index.html';

      if (p.get('view') === 'pub' || p.get('embed') === '1' || p.get('embed') === 'true' || hasPathRoute) return 'pub';
      if (p.get('view') === 'slots') return 'slots';
      if (p.get('view') === 'embed') return 'embed';
    }
    return 'week';
  });

  const [searchQuery, setSearchQuery] = useState('');

  // ── 5. Stato Modali ──
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();
  const [modalInitialStart, setModalInitialStart] = useState<number | undefined>();

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editingSlotType, setEditingSlotType] = useState<SlotType | null>(null);
  const [isSlotTypeModalOpen, setIsSlotTypeModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [embedSlotId, setEmbedSlotId] = useState<string | undefined>();
  const [publicSlotId, setPublicSlotId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('slot')) return p.get('slot')!;
      const path = p.get('path');
      if (path && path.includes('/')) return path.split('/')[1];
      const pathSegments = window.location.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
      if (pathSegments.length > 1 && !pathSegments[1].includes('.')) return pathSegments[1];
    }
    return undefined;
  });

  const [publicSchedule, setPublicSchedule] = useState<PublicScheduleData | null>(null);

  // ── 6. Notifiche Toast con Undo ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string, undo?: () => void) => {
    setToastMessage(msg);
    setUndoAction(undo ? () => undo : null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      setUndoAction(null);
    }, undo ? 7000 : 3500);
  };

  // ── 7. Salvataggio in LocalStorage & Sincronizzazione con Server di Prenotazione ──
  const saveState = (newState: SovereignCalendarState, actionLabel?: string) => {
    const prevStateSnapshot = JSON.stringify(calendarState);
    setCalendarState(newState);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('[LocalStorage] Errore salvataggio:', e);
    }

    // Se il proprietario ha configurato un handle, sincronizza gli slot con il server di disponibilità
    if (newState.settings.handle) {
      syncOwnerSchedulesAndBookings(
        newState.settings.handle,
        newState.types,
        newState.events,
        newState.bookings
      ).then((res) => {
        if (res.success && res.remoteBookings.length > 0) {
          const existingIds = new Set(newState.bookings.map((b) => b.id));
          const brandNew = res.remoteBookings.filter((b) => !existingIds.has(b.id));
          if (brandNew.length > 0) {
            setCalendarState((curr) => ({
              ...curr,
              bookings: [...brandNew, ...curr.bookings]
            }));
            showToast(`${brandNew.length} nuova/e prenotazione/i ricevuta/e`);
          }
        }
      });
    }

    if (actionLabel) {
      showToast(actionLabel, () => {
        const restored = JSON.parse(prevStateSnapshot);
        setCalendarState(restored);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(restored));
        showToast('Azione annullata con successo');
      });
    }
  };

  // Caricamento disponibilità pubblica se in vista 'pub'
  useEffect(() => {
    if (currentView === 'pub') {
      const p = new URLSearchParams(window.location.search);
      const pathSegments = window.location.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
      const pathHandle = pathSegments.length > 0 && !pathSegments[0].includes('.') && pathSegments[0] !== 'index.html' ? pathSegments[0] : null;
      const h = p.get('handle') || pathHandle || calendarState.settings.handle;
      if (h) {
        fetchPublicSchedule(h).then((res) => {
          if (res) {
            setPublicSchedule(res);
          }
        });
      }
    }
  }, [currentView, calendarState.settings.handle]);

  // ── 8. Lifecycle USSO & Cross-Satellite taccuino.ch ──
  useEffect(() => {
    // Sincronizza parametri URL se presenti (es. embed da pagine.ch o accesso diretto)
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const pathSegments = window.location.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
      const pathHandle = pathSegments.length > 0 && !pathSegments[0].includes('.') && pathSegments[0] !== 'index.html' ? pathSegments[0] : null;
      const pathSlot = pathSegments.length > 1 ? pathSegments[1] : null;

      const handleParam = p.get('handle') || pathHandle;
      const slotParam = p.get('slot') || pathSlot || (p.get('path')?.includes('/') ? p.get('path')!.split('/')[1] : p.get('path'));
      const ownerParam = p.get('owner');
      const temaParam = p.get('tema');

      if (temaParam) {
        document.documentElement.dataset.theme = temaParam;
      }

      if (slotParam) {
        setPublicSlotId(slotParam);
      }

      if (handleParam || ownerParam) {
        setCalendarState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            handle: handleParam || prev.settings.handle,
            owner: ownerParam || (handleParam ? handleParam.charAt(0).toUpperCase() + handleParam.slice(1) : prev.settings.owner)
          }
        }));
      }
    }

    const cleanupUsso = initUsso(
      (authUsr) => {
        setUser(authUsr);
        if (authUsr && authUsr.name) {
          setCalendarState((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              owner: authUsr.name || prev.settings.owner,
              handle: authUsr.nickname?.toLowerCase() || prev.settings.handle
            }
          }));
        }
      },
      () => {
        setUser(null);
      }
    );

    const cleanupBridge = initCrossSatelliteBridge((refId, noteId) => {
      showToast('Nota d\'incontro collegata da taccuino.ch');
    });

    return () => {
      cleanupUsso();
      cleanupBridge();
    };
  }, []);

  // ── 9. Gestione Eventi e Modali ──
  const handleSaveEvent = (saved: CalendarEvent) => {
    const exists = calendarState.events.some((e) => e.id === saved.id);
    const updatedEvents = exists
      ? calendarState.events.map((e) => (e.id === saved.id ? saved : e))
      : [saved, ...calendarState.events];

    saveState(
      { ...calendarState, events: updatedEvents },
      exists ? 'Impegno aggiornato' : 'Nuovo impegno creato'
    );
  };

  const handleDeleteEvent = (id: string, deleteSeries = false, exceptionDate?: string) => {
    let updatedEvents = [...calendarState.events];
    if (exceptionDate) {
      updatedEvents = updatedEvents.map((e) =>
        e.id === id ? { ...e, exdates: [...(e.exdates || []), exceptionDate] } : e
      );
    } else {
      updatedEvents = updatedEvents.filter((e) => e.id !== id);
    }

    saveState(
      { ...calendarState, events: updatedEvents },
      deleteSeries ? 'Serie eliminata' : 'Impegno rimosso'
    );
  };

  const handleUpdateEventTime = (
    eventId: string,
    newStart: number,
    newEnd: number,
    newDate?: string
  ) => {
    const updatedEvents = calendarState.events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            start: newStart,
            end: newEnd,
            date: newDate || e.date
          }
        : e
    );
    saveState({ ...calendarState, events: updatedEvents }, 'Orario aggiornato');
  };

  // ── 10. Gestione Prenotazioni ──
  const handleConfirmBooking = (id: string) => {
    const updatedBookings = calendarState.bookings.map((b) =>
      b.id === id ? { ...b, status: 'confirmed' as const } : b
    );
    saveState({ ...calendarState, bookings: updatedBookings }, 'Prenotazione confermata');
  };

  const handleCancelBooking = (id: string) => {
    const updatedBookings = calendarState.bookings.map((b) =>
      b.id === id ? { ...b, status: 'cancelled' as const } : b
    );
    saveState(
      { ...calendarState, bookings: updatedBookings },
      'Prenotazione annullata. Lo slot è di nuovo libero'
    );
  };

  const handleRestoreBooking = (id: string) => {
    const updatedBookings = calendarState.bookings.map((b) =>
      b.id === id ? { ...b, status: 'confirmed' as const } : b
    );
    saveState({ ...calendarState, bookings: updatedBookings }, 'Prenotazione ripristinata');
  };

  const handleBookingCreatedByClient = (newBooking: Booking) => {
    const updatedBookings = [newBooking, ...calendarState.bookings];
    saveState(
      { ...calendarState, bookings: updatedBookings },
      'Nuova prenotazione registrata nell\'agenda'
    );
  };

  // ── 11. Gestione Tipi di Slot ──
  const handleSaveSlotType = (saved: SlotType) => {
    const exists = calendarState.types.some((t) => t.id === saved.id);
    const updatedTypes = exists
      ? calendarState.types.map((t) => (t.id === saved.id ? saved : t))
      : [...calendarState.types, saved];

    saveState(
      { ...calendarState, types: updatedTypes },
      exists ? 'Tipo di slot aggiornato' : 'Nuovo tipo di slot creato'
    );
  };

  const handleToggleSlotActive = (id: string) => {
    const updatedTypes = calendarState.types.map((t) =>
      t.id === id ? { ...t, active: !t.active } : t
    );
    const target = updatedTypes.find((t) => t.id === id);
    saveState(
      { ...calendarState, types: updatedTypes },
      target?.active ? `${target.name} è ora prenotabile` : `${target?.name} messo in pausa`
    );
  };

  // ── 12. Navigazione Cursore ──
  const handleNavigatePeriod = (direction: number) => {
    if (currentView === 'month') {
      setCursorDate((prev) => {
        const d = parseKey(prev);
        return keyFromDate(new Date(d.getFullYear(), d.getMonth() + direction, 1));
      });
      return;
    }
    const stepDays = currentView === 'week' ? 7 : 1;
    setCursorDate((prev) => addDaysToKey(prev, stepDays * direction));
  };

  const handleGoToToday = () => {
    setCursorDate(keyFromDate(new Date()));
  };

  // ── Scorciatoie da tastiera: frecce = periodo, T = oggi, M/W/D = vista, N = nuovo impegno ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return;
      if (document.querySelector('[role="dialog"], .overlay') || document.body.classList.contains('b-dragging')) return;
      if (!['week', 'day', 'month', 'agenda'].includes(currentView)) return;
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleNavigatePeriod(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleNavigatePeriod(1); }
      else if (k === 't') handleGoToToday();
      else if (k === 'm') setCurrentView('month');
      else if (k === 'w') setCurrentView('week');
      else if (k === 'd') setCurrentView('day');
      else if (k === 'n') {
        e.preventDefault();
        setEditingEvent(null);
        setModalInitialDate(cursorDate);
        setModalInitialStart(540);
        setIsEventModalOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── 13. Ricerca Globale Filtrata ──
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedEvents = calendarState.events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.place && e.place.toLowerCase().includes(q)) ||
        (e.note && e.note.toLowerCase().includes(q))
    );

    const matchedBookings = calendarState.bookings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        (b.note && b.note.toLowerCase().includes(q))
    );

    return { matchedEvents, matchedBookings };
  }, [searchQuery, calendarState]);

  // Se la vista è 'pub' (pagina pubblica di prenotazione)
  if (currentView === 'pub') {
    const isEmbed = typeof window !== 'undefined' && (
      new URLSearchParams(window.location.search).get('embed') === '1' ||
      new URLSearchParams(window.location.search).get('embed') === 'true'
    );

    const ownerName = publicSchedule?.owner.name || calendarState.settings.owner;
    const availableTypes = publicSchedule?.slotTypes && publicSchedule.slotTypes.length > 0
      ? publicSchedule.slotTypes
      : calendarState.types;

    const targetSlot =
      availableTypes.find((t) => t.id === publicSlotId || t.slug === publicSlotId) ||
      availableTypes.find((t) => t.active) ||
      availableTypes[0];

    // Se abbiamo gli intervalli anonimizzati dal server, usiamo quelli per il calcolo degli slot liberi
    const activeEvents: CalendarEvent[] = publicSchedule?.busyIntervals
      ? publicSchedule.busyIntervals.map((b, idx) => ({
          id: `busy-srv-${idx}`,
          title: 'Occupato',
          date: b.date,
          start: b.start,
          end: b.end,
          allDay: false,
          repeat: 'none' as const,
          busy: true
        }))
      : calendarState.events;

    const activeBookings = publicSchedule ? [] : calendarState.bookings;

    return (
      <div className={isEmbed ? 'p-1 sm:p-2 bg-transparent flex flex-col justify-center' : 'min-h-screen bg-[var(--cream)] p-4 flex flex-col justify-center'}>
        <PublicBookingView
          slotType={targetSlot}
          ownerName={ownerName}
          events={activeEvents}
          bookings={activeBookings}
          onAsyncBooking={async (payload) => {
            const h = publicSchedule?.owner.handle || calendarState.settings.handle;
            return await submitBookingRequest(h, payload);
          }}
          onBookingCreated={(newBk) => {
            handleBookingCreatedByClient(newBk);
            try {
              if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
                // nLPD: non trasmettere PII (nome, email, telefono, note) a targetOrigin generico '*'
                // Inviamo solo i metadati tecnici della prenotazione
                window.parent.postMessage({
                  type: 'calendario:booking-created',
                  bookingId: newBk.id,
                  typeId: newBk.typeId,
                  date: newBk.date,
                  start: newBk.start,
                  end: newBk.end,
                  status: newBk.status
                }, '*');
              }
            } catch (err) {
              console.warn('[calendario.ch] postMessage dispatch error:', err);
            }
          }}
          onClose={isEmbed ? undefined : () => setCurrentView('slots')}
          isEmbed={isEmbed}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${calendarState.settings.snow ? '' : 'no-snow'}`}>
      {/* Neve Stagionale */}
      {TEMA === 'natale' && calendarState.settings.snow && (
        <div className="neve" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="fiocco"
              style={{
                left: `${(i * 4.2) % 100}%`,
                animation: `cadere${i % 3} ${7 + (i % 6)}s linear infinite`,
                animationDelay: `${(i * 0.45) % 5}s`
              }}
            >
              <i style={{ width: `${4 + (i % 5)}px`, height: `${4 + (i % 5)}px` }} />
            </div>
          ))}
        </div>
      )}

      {/* Barra di Navigazione Sovrana */}
      <Navbar
        currentView={currentView}
        onSelectView={(v) => {
          setSearchQuery('');
          setCurrentView(v);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewEvent={() => {
          setEditingEvent(null);
          setModalInitialDate(cursorDate);
          setModalInitialStart(540);
          setIsEventModalOpen(true);
        }}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        user={user}
        syncStatus={syncStatus}
        snowEnabled={calendarState.settings.snow}
        onToggleSnow={() =>
          setCalendarState((prev) => ({
            ...prev,
            settings: { ...prev.settings, snow: !prev.settings.snow }
          }))
        }
      />

      {/* Corpo Principale dell'Applicazione */}
      <div className="b-body flex-1">
        {/* Sidebar Navigazione & Statistiche */}
        {currentView !== 'embed' && (
          <Sidebar
            currentView={currentView}
            onOpenSlots={() => setCurrentView('slots')}
            onSelectBooking={setEditingBooking}
            cursorDate={cursorDate}
            onSelectDate={(k) => {
              setCursorDate(k);
              if (currentView === 'slots') setCurrentView('day');
            }}
            onNavigatePeriod={handleNavigatePeriod}
            onGoToToday={handleGoToToday}
            events={calendarState.events}
            bookings={calendarState.bookings}
            slotTypes={calendarState.types}
          />
        )}

        {/* Area Principale */}
        <main className="b-main">
          {/* Banner per Utente non autenticato (Zero Dati Finti) */}
          {!user && (
            <div className="mb-4 p-3.5 bg-[var(--paper)] border border-[var(--edge)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-[var(--accent)] flex-shrink-0" />
                <div>
                  <b className="text-[var(--ink)] block">Benvenuto su calendario.ch</b>
                  <span className="text-[var(--muted)]">
                    Nessun dato fittizio precaricato. Accedi con USSO (Passkey FIDO2) per gestire la tua agenda o crea subito i tuoi impegni e slot.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="btn dark text-xs h-8 px-3 whitespace-nowrap self-start sm:self-auto"
              >
                Accedi con USSO
              </button>
            </div>
          )}

          {/* Visualizzazione Risultati Ricerca Globale */}
          {searchResults ? (
            <div className="list-card">
              <div className="section-h my-2">
                <h2>Risultati per «{searchQuery}»</h2>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn line text-xs"
                >
                  Chiudi Ricerca
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {searchResults.matchedEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setEditingEvent(e);
                      setIsEventModalOpen(true);
                    }}
                    className="row-btn"
                  >
                    <span className="tm">{formatShortDate(e.date)}</span>
                    <i className="sw bg-[var(--own-bg)] w-2.5" />
                    <span className="ttl">
                      {e.title}
                      {e.place && <small>{e.place}</small>}
                    </span>
                    <span className="tag ink">Impegno</span>
                  </button>
                ))}

                {searchResults.matchedBookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setEditingBooking(b)}
                    className="row-btn"
                  >
                    <span className="tm">{formatShortDate(b.date)}</span>
                    <i className="sw bg-[var(--accent)] w-2.5" />
                    <span className="ttl">{b.name}</span>
                    <span className="tag red">Prenotato</span>
                  </button>
                ))}

                {searchResults.matchedEvents.length === 0 &&
                  searchResults.matchedBookings.length === 0 && (
                    <p className="empty text-center py-8">
                      Nessun impegno o prenotazione corrispondente trovato.
                    </p>
                  )}
              </div>
            </div>
          ) : (
            <>
              {currentView === 'week' && (
                <WeekView
                  cursorDate={cursorDate}
                  events={calendarState.events}
                  bookings={calendarState.bookings}
                  slotTypes={calendarState.types}
                  startHour={calendarState.settings.startHour}
                  endHour={calendarState.settings.endHour}
                  onSelectEvent={(e) => {
                    setEditingEvent(e);
                    setIsEventModalOpen(true);
                  }}
                  onSelectBooking={setEditingBooking}
                  onNewEventAt={(date, minutes) => {
                    setEditingEvent(null);
                    setModalInitialDate(date);
                    setModalInitialStart(minutes);
                    setIsEventModalOpen(true);
                  }}
                  onUpdateEventTime={handleUpdateEventTime}
                  onSwipe={handleNavigatePeriod}
                  onNotify={showToast}
                />
              )}

              {currentView === 'day' && (
                <DayView
                  onUpdateEventTime={handleUpdateEventTime}
                  onSwipe={handleNavigatePeriod}
                  onNotify={showToast}
                  cursorDate={cursorDate}
                  events={calendarState.events}
                  bookings={calendarState.bookings}
                  slotTypes={calendarState.types}
                  startHour={calendarState.settings.startHour}
                  endHour={calendarState.settings.endHour}
                  onSelectEvent={(e) => {
                    setEditingEvent(e);
                    setIsEventModalOpen(true);
                  }}
                  onSelectBooking={setEditingBooking}
                  onNewEventAt={(date, minutes) => {
                    setEditingEvent(null);
                    setModalInitialDate(date);
                    setModalInitialStart(minutes);
                    setIsEventModalOpen(true);
                  }}
                />
              )}

              {currentView === 'month' && (
                <MonthView
                  onSwipe={handleNavigatePeriod}
                  cursorDate={cursorDate}
                  events={calendarState.events}
                  bookings={calendarState.bookings}
                  slotTypes={calendarState.types}
                  onSelectDate={(k) => {
                    setCursorDate(k);
                    setCurrentView('day');
                  }}
                  onSelectEvent={(e) => {
                    setEditingEvent(e);
                    setIsEventModalOpen(true);
                  }}
                  onSelectBooking={setEditingBooking}
                  onNewEventOnDate={(k) => {
                    setEditingEvent(null);
                    setModalInitialDate(k);
                    setModalInitialStart(540);
                    setIsEventModalOpen(true);
                  }}
                />
              )}

              {currentView === 'agenda' && (
                <AgendaView
                  cursorDate={cursorDate}
                  events={calendarState.events}
                  bookings={calendarState.bookings}
                  slotTypes={calendarState.types}
                  onSelectEvent={(e) => {
                    setEditingEvent(e);
                    setIsEventModalOpen(true);
                  }}
                  onSelectBooking={setEditingBooking}
                />
              )}

              {currentView === 'slots' && (
                <SlotsView
                  slotTypes={calendarState.types}
                  bookings={calendarState.bookings}
                  events={calendarState.events}
                  user={user}
                  handle={calendarState.settings.handle}
                  onNewSlotType={() => {
                    setEditingSlotType(null);
                    setIsSlotTypeModalOpen(true);
                  }}
                  onEditSlotType={(t) => {
                    setEditingSlotType(t);
                    setIsSlotTypeModalOpen(true);
                  }}
                  onToggleSlotActive={handleToggleSlotActive}
                  onOpenEmbed={(id) => {
                    setEmbedSlotId(id);
                    setCurrentView('embed');
                  }}
                  onOpenPublicPage={(id) => {
                    setPublicSlotId(id);
                    setCurrentView('pub');
                  }}
                  onSelectBooking={setEditingBooking}
                  onConfirmBooking={handleConfirmBooking}
                  onToast={showToast}
                />
              )}

              {currentView === 'embed' && (
                <EmbedView
                  slotTypes={calendarState.types}
                  initialSlotId={embedSlotId}
                  handle={calendarState.settings.handle}
                  ownerName={calendarState.settings.owner}
                  onBackToSlots={() => setCurrentView('slots')}
                  onToast={showToast}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modale Creazione / Modifica Impegno */}
      {isEventModalOpen && (
        <EventModal
          event={editingEvent}
          initialDate={modalInitialDate}
          initialStartMinutes={modalInitialStart}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          onToast={showToast}
        />
      )}

      {/* Modale Dettagli Prenotazione */}
      {editingBooking && (
        <BookingModal
          booking={editingBooking}
          slotType={calendarState.types.find((t) => t.id === editingBooking.typeId)}
          onConfirm={handleConfirmBooking}
          onCancel={handleCancelBooking}
          onRestore={handleRestoreBooking}
          onClose={() => setEditingBooking(null)}
          onToast={showToast}
        />
      )}

      {/* Modale Gestione Tipo di Slot */}
      {isSlotTypeModalOpen && (
        <SlotTypeModal
          slotType={editingSlotType}
          onSave={handleSaveSlotType}
          onClose={() => {
            setIsSlotTypeModalOpen(false);
            setEditingSlotType(null);
          }}
        />
      )}

      {/* Modale Account USSO */}
      {isAccountModalOpen && (
        <UssoAccountModal
          user={user}
          onClose={() => setIsAccountModalOpen(false)}
        />
      )}

      {/* Notifiche Toast con Undo */}
      {toastMessage && (
        <div id="toast">
          <div className="toast">
            <span>{toastMessage}</span>
            {undoAction && (
              <button
                type="button"
                onClick={() => {
                  undoAction();
                  setToastMessage(null);
                  setUndoAction(null);
                }}
              >
                Annulla
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
