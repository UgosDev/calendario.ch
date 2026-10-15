import React, { useState } from 'react';
import { ViewMode, BookingRequest } from './types';
import { PIETRO_PIROLA_PROFILE, INITIAL_BOOKINGS } from './mockData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BookingWidget } from './components/BookingWidget';
import { BentoFeatures } from './components/BentoFeatures';
import { DashboardView } from './components/DashboardView';
import { EmbedModal } from './components/EmbedModal';
import { Footer } from './components/Footer';
import { ArrowLeft, Share2, ShieldCheck, Sparkles, Building, Phone } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Check URL parameters or pathname for embed mode and views
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    if (path.includes('/embed') || params.get('embed') === 'true') return 'embed';
    if (path.includes('/dashboard') || params.get('view') === 'dashboard') return 'dashboard';
    if (path.length > 1 && !path.endsWith('index.html') || params.get('view') === 'booking') return 'booking';
    return 'landing';
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(INITIAL_BOOKINGS);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const handleBookingCreated = (newBooking: BookingRequest) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  // Embed Mode (pure widget for iframe in pagine.ch)
  if (viewMode === 'embed') {
    return (
      <div className="min-h-screen bg-black text-white p-2 sm:p-4 flex items-center justify-center">
        <BookingWidget
          profile={PIETRO_PIROLA_PROFILE}
          isEmbed={true}
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
                    Ecco la pagina di prenotazione attiva per Pietro Pirola (Capo Struttura presso MT Financial Consulting Sagl).
                  </p>
                </div>

                {/* The Widget */}
                <BookingWidget
                  profile={PIETRO_PIROLA_PROFILE}
                  onBookingCreated={handleBookingCreated}
                />
              </div>
            </section>

            {/* Bento Grid Features */}
            <BentoFeatures />
          </>
        )}

        {/* Dedicated Booking Page (pietro-pirola) */}
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

              <button
                onClick={() => setShowEmbedModal(true)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Share2 size={13} />
                <span>Incorpora questo calendario</span>
              </button>
            </div>

            <BookingWidget
              profile={PIETRO_PIROLA_PROFILE}
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
