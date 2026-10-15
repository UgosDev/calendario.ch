import React, { useState, useMemo } from 'react';
import { ViewMode, BookingRequest, CalendarEvent } from './types';
import { PIETRO_PIROLA_PROFILE, INITIAL_BOOKINGS, INITIAL_EVENTS } from './mockData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BookingWidget } from './components/BookingWidget';
import { BentoFeatures } from './components/BentoFeatures';
import { DashboardView } from './components/DashboardView';
import { PrivateCalendarView } from './components/PrivateCalendarView';
import { EmbedModal } from './components/EmbedModal';
import { Footer } from './components/Footer';
import { ArrowLeft, Share2, ShieldCheck, Sparkles, Lock, Calendar as CalendarIcon } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Check URL parameters or pathname for embed mode and views
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    if (path.includes('/calendar') || params.get('view') === 'calendar') return 'calendar';
    if (path.includes('/embed') || params.get('embed') === 'true') return 'embed';
    if (path.includes('/dashboard') || params.get('view') === 'dashboard') return 'dashboard';
    if (path.length > 1 && !path.endsWith('index.html') || params.get('view') === 'booking') return 'booking';
    return 'landing';
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(INITIAL_BOOKINGS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  // Derive blocked slots from private & confirmed events that have blocksBooking = true
  const blockedSlots = useMemo(() => {
    return events
      .filter((e) => e.blocksBooking)
      .map((e) => ({ date: e.date, time: e.startTime }));
  }, [events]);

  const handleBookingCreated = (newBooking: BookingRequest) => {
    setBookings((prev) => [newBooking, ...prev]);

    // Automatically create a client event in the private calendar
    const [h, m] = newBooking.timeSlot.split(':').map(Number);
    const duration = newBooking.durationMinutes || 45;
    const endMinutes = h * 60 + m + duration;
    const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');

    const clientEvent: CalendarEvent = {
      id: `evt-${newBooking.id}`,
      title: `${newBooking.serviceName} · ${newBooking.clientName}`,
      description: newBooking.clientNotes || `Prenotazione online per ${newBooking.clientName}`,
      date: newBooking.date,
      startTime: newBooking.timeSlot,
      endTime: `${endH}:${endM}`,
      category: 'client',
      location:
        newBooking.meetingLocation === 'office'
          ? 'Sede MT Financial Bioggio (Via Lugano 1A)'
          : newBooking.meetingLocation === 'video'
          ? 'Videoconferenza protetta'
          : 'A Domicilio Cliente',
      meetUrl: newBooking.meetingLocation === 'video' ? `https://meet.calendario.ch/${newBooking.id}` : undefined,
      isPrivate: false,
      blocksBooking: true,
      bookingId: newBooking.id,
      clientName: newBooking.clientName,
      clientEmail: newBooking.clientEmail,
      clientPhone: newBooking.clientPhone,
      createdAt: newBooking.createdAt,
    };

    setEvents((prev) => [clientEvent, ...prev]);
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleUpdateEvent = (updated: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Embed Mode (pure widget for iframe in pagine.ch)
  if (viewMode === 'embed') {
    return (
      <div className="min-h-screen bg-black text-white p-2 sm:p-4 flex items-center justify-center">
        <BookingWidget
          profile={PIETRO_PIROLA_PROFILE}
          isEmbed={true}
          blockedSlots={blockedSlots}
          onBookingCreated={handleBookingCreated}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Header Navigation */}
      <Navbar
        viewMode={viewMode}
        onViewChange={setViewMode}
        onOpenEmbedModal={() => setShowEmbedModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Landing Page */}
        {viewMode === 'landing' && (
          <>
            <HeroSection
              onViewChange={setViewMode}
              onOpenEmbedModal={() => setShowEmbedModal(true)}
            />

            {/* Live Interactive Booking Showcase */}
            <section className="py-16 md:py-24 border-b border-neutral-900 bg-neutral-950/40 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-xl mx-auto mb-12">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-300 mb-3">
                    <Sparkles size={12} className="text-white" />
                    <span>ANTEPRIMA LIVE INTERATTIVA</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Come appare a un cliente reale
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Ecco la pagina di prenotazione attiva per Pietro Pirola. Gli slot occupati nella sua agenda privata appaiono automaticamente non disponibili.
                  </p>
                </div>

                {/* The Widget */}
                <BookingWidget
                  profile={PIETRO_PIROLA_PROFILE}
                  blockedSlots={blockedSlots}
                  onBookingCreated={handleBookingCreated}
                />
              </div>
            </section>

            {/* Bento Grid Features */}
            <BentoFeatures />
          </>
        )}

        {/* Private Calendar View (Full personal scheduling app) */}
        {viewMode === 'calendar' && (
          <PrivateCalendarView
            profile={PIETRO_PIROLA_PROFILE}
            events={events}
            bookings={bookings}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenPublicBooking={() => setViewMode('booking')}
            onOpenEmbedModal={() => setShowEmbedModal(true)}
          />
        )}

        {/* Dedicated Public Booking Page (pietro-pirola) */}
        {viewMode === 'booking' && (
          <div className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
              <button
                onClick={() => setViewMode('landing')}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
              >
                <ArrowLeft size={14} />
                <span>Torna alla panoramica</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('calendar')}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Lock size={12} className="text-amber-400" />
                  <span>Apri la tua Agenda Privata</span>
                </button>
                <button
                  onClick={() => setShowEmbedModal(true)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Share2 size={13} />
                  <span>Incorpora questo calendario</span>
                </button>
              </div>
            </div>

            <BookingWidget
              profile={PIETRO_PIROLA_PROFILE}
              blockedSlots={blockedSlots}
              onBookingCreated={handleBookingCreated}
            />

            <div className="max-w-4xl mx-auto mt-8 p-4 rounded-2xl border border-neutral-900 bg-neutral-950 text-xs text-neutral-500 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-white" />
                <span>Crittografia end-to-end · Dati residenti in Svizzera (nLPD)</span>
              </span>
              <span className="font-mono text-[11px]">calendario.ch/pietro-pirola</span>
            </div>
          </div>
        )}

        {/* Professional Dashboard View */}
        {viewMode === 'dashboard' && (
          <DashboardView
            profile={PIETRO_PIROLA_PROFILE}
            bookings={bookings}
            onOpenBooking={() => setViewMode('booking')}
            onOpenEmbedModal={() => setShowEmbedModal(true)}
            onOpenCalendar={() => setViewMode('calendar')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Embed Code Modal */}
      <EmbedModal
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        handle={PIETRO_PIROLA_PROFILE.handle}
      />
    </div>
  );
}
