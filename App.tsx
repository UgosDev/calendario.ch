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
import { syncStateToVault, fetchVaultQuota } from './services/vaultService';
import { initCrossSatelliteBridge } from './services/taccuinoBridge';
import {
  keyFromDate,
  addDaysToKey,
  formatLongDate,
  formatShortDate,
  formatMinutesToClock
} from './services/swissHolidays';

// Componenti
import { Navbar } from './components/Navbar';
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
  Sparkles
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'calendario.ch.sovereign.v2';

export default function App() {
  // ── 1. Inizializzazione Stato Sovrano da localStorage o Seed ──
  const [calendarState, setCalendarState] = useState<SovereignCalendarState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.v) return parsed;
      }
    } catch (e) {
      console.warn('[Calendario] Fallback seed data:', e);
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
      if (p.get('view') === 'pub' || p.get('embed') === '1') return 'pub';
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
  const [publicSlotId, setPublicSlotId] = useState<string | undefined>();

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

  // ── 7. Salvataggio in LocalStorage & Sincronizzazione con Archivio.ch ──
  const saveState = (newState: SovereignCalendarState, actionLabel?: string) => {
    const prevStateSnapshot = JSON.stringify(calendarState);
    setCalendarState(newState);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('[LocalStorage] Errore salvataggio:', e);
    }

    // Sincronizza nel caveau di Archivio.ch
    setSyncStatus((prev) => ({ ...prev, state: 'syncing' }));
    syncStateToVault(newState, user).then((res) => {
      setSyncStatus((prev) => ({
        ...prev,
        state: res.success ? 'synced' : 'error',
        lastSyncedAt: res.syncedAt,
        sha256Hash: res.hash
      }));
    });

    if (actionLabel) {
      showToast(actionLabel, () => {
        const restored = JSON.parse(prevStateSnapshot);
        setCalendarState(restored);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(restored));
        syncStateToVault(restored, user);
        showToast('Azione annullata con successo');
      });
    }
  };

  // ── 8. Lifecycle USSO & Cross-Satellite taccuino.ch ──
  useEffect(() => {
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

    fetchVaultQuota().then((q) => {
      setSyncStatus((prev) => ({
        ...prev,
        quotaUsedBytes: q.usedBytes,
        quotaTotalBytes: q.totalBytes
      }));
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
    const stepDays = currentView === 'week' ? 7 : currentView === 'month' ? 30 : 1;
    setCursorDate((prev) => addDaysToKey(prev, stepDays * direction));
  };

  const handleGoToToday = () => {
    setCursorDate(keyFromDate(new Date()));
  };

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
    const targetSlot =
      calendarState.types.find((t) => t.id === publicSlotId) ||
      calendarState.types.find((t) => t.active) ||
      calendarState.types[0];

    return (
      <div className="min-h-screen bg-[#fbf8f1] p-4 flex flex-col justify-center">
        <PublicBookingView
          slotType={targetSlot}
          ownerName={calendarState.settings.owner}
          events={calendarState.events}
          bookings={calendarState.bookings}
          onBookingCreated={handleBookingCreatedByClient}
          onClose={() => setCurrentView('slots')}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${calendarState.settings.snow ? '' : 'no-snow'}`}>
      {/* Neve Stagionale */}
      {calendarState.settings.snow && (
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
      <div className="body flex-1">
        {/* Sidebar Navigazione & Statistiche */}
        {currentView !== 'embed' && (
          <Sidebar
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
        <main className="main">
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
                    <i className="sw bg-[#163a2a] w-2.5" />
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
                    <i className="sw bg-[#b3202a] w-2.5" />
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
                />
              )}

              {currentView === 'day' && (
                <DayView
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

      {/* Modale Account USSO & Archivio.ch */}
      {isAccountModalOpen && (
        <UssoAccountModal
          user={user}
          syncStatus={syncStatus}
          onClose={() => setIsAccountModalOpen(false)}
          onForceSync={() => saveState(calendarState, 'Sincronizzazione forzata completata')}
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
