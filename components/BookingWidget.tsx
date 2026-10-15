import React, { useState } from 'react';
import { ProfessionalProfile, BookingService, MeetingLocation, BookingRequest } from '../types';
import { downloadIcsFile } from '../icsGenerator';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Building, 
  Check, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Phone,
  Mail,
  User,
  Sparkles
} from 'lucide-react';

interface BookingWidgetProps {
  profile: ProfessionalProfile;
  isEmbed?: boolean;
  onBookingCreated?: (booking: BookingRequest) => void;
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  profile,
  isEmbed = false,
  onBookingCreated,
}) => {
  const [selectedService, setSelectedService] = useState<BookingService>(profile.services[0]);
  
  // Date State (Defaults to October 2026 or current year)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-19');
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  
  // Step State: 1 = Service, 2 = Date & Time, 3 = Details, 4 = TWINT (optional), 5 = Confirmed
  const [step, setStep] = useState<number>(1);
  
  // Form Details
  const [meetingLocation, setMeetingLocation] = useState<MeetingLocation>('office');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('+41 ');
  const [clientNotes, setClientNotes] = useState<string>('');
  
  // TWINT State
  const [isProcessingTwint, setIsProcessingTwint] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRequest | null>(null);

  // Time Slots for Demo
  const AVAILABLE_SLOTS = [
    '09:00', '09:45', '10:30', '11:15',
    '14:00', '14:45', '15:30', '16:15', '17:00'
  ];

  // Month navigation
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days for the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const startOffset = (firstDayIndex + 6) % 7; // Monday-first

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formattedD = String(d).padStart(2, '0');
    const formattedM = String(currentMonth + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedM}-${formattedD}`;
    calendarDays.push({ day: d, dateStr });
  }

  // Handle finalize booking
  const handleFinalizeBooking = (isTwint: boolean = false) => {
    const newBooking: BookingRequest = {
      id: `bk-${Date.now()}`,
      serviceId: selectedService.id,
      serviceName: selectedService.title,
      professionalHandle: profile.handle,
      professionalName: profile.name,
      date: selectedDate,
      timeSlot: selectedSlot,
      durationMinutes: selectedService.durationMinutes,
      priceChf: selectedService.priceChf,
      meetingLocation: meetingLocation,
      clientName: clientName || 'Visitatore Svizzero',
      clientEmail: clientEmail || 'cliente@ticino.ch',
      clientPhone: clientPhone || '+41 79 123 45 67',
      clientNotes: clientNotes,
      status: 'confirmed',
      isPaidWithTwint: isTwint,
      twintRef: isTwint ? `TW-${Math.floor(10000 + Math.random() * 90000)}-CH` : undefined,
      createdAt: new Date().toISOString(),
    };

    setConfirmedBooking(newBooking);
    if (onBookingCreated) {
      onBookingCreated(newBooking);
    }
    setStep(5); // Confirmed
  };

  return (
    <div className={`w-full max-w-4xl mx-auto rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-neutral-100 shadow-2xl overflow-hidden ${isEmbed ? 'border-0 bg-black' : ''}`}>
      {/* Top Header / Profile Info */}
      <div className="p-6 sm:p-8 border-b border-neutral-900 bg-neutral-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={profile.avatarUrl} 
              alt={profile.name} 
              className="w-14 h-14 rounded-2xl object-cover border border-neutral-700 shadow-md"
            />
            {profile.verifiedUsso && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm" title="Identità USSO.ch Verificata">
                ✓
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{profile.name}</h2>
              {profile.finmaNumber && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300">
                  FINMA {profile.finmaNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-medium">{profile.role} · {profile.company}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
              <MapPin size={11} className="text-neutral-400" />
              <span>{profile.address}</span>
            </p>
          </div>
        </div>

        {/* Status / Step Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Slot Disponibili Oggi</span>
          </div>
        </div>
      </div>

      {/* Main Body with Steps */}
      <div className="p-6 sm:p-8">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">Passo 1 di 3</span>
              <h3 className="text-xl font-bold text-white mt-1">Seleziona il tipo di consulenza</h3>
              <p className="text-xs text-neutral-400 mt-1">Scegli il servizio desiderato per verificare le disponibilità in agenda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.services.map((srv) => {
                const isSelected = selectedService.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-white bg-neutral-900 shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                        : 'border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-900/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-white leading-tight">{srv.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          srv.priceChf === 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-neutral-800 text-white border border-neutral-700'
                        }`}>
                          {srv.priceChf === 0 ? 'GRATUITO' : `CHF ${srv.priceChf}`}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed mb-4">{srv.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-3 border-t border-neutral-900">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={12} />
                        {srv.durationMinutes} minuti
                      </span>
                      {srv.isTwintAccepted && (
                        <span className="flex items-center gap-1 text-white font-medium">
                          <QrCode size={12} />
                          TWINT Disponibile
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                <span>Scegli Data & Orario</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time Picker */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">Passo 2 di 3</span>
                <h3 className="text-xl font-bold text-white mt-1">Seleziona data e orario</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Servizio: <strong className="text-white">{selectedService.title}</strong> ({selectedService.durationMinutes} min)
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 underline underline-offset-4"
              >
                Modifica servizio
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Calendar Column */}
              <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl border border-neutral-800 bg-neutral-950/80">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-900">
                  <span className="text-sm font-bold text-white">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-neutral-500 mb-2">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mer</span>
                  <span>Gio</span>
                  <span>Ven</span>
                  <span>Sab</span>
                  <span>Dom</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((item, idx) => {
                    if (!item) {
                      return <div key={`empty-${idx}`} className="h-9"></div>;
                    }
                    const isSelected = selectedDate === item.dateStr;
                    // Disable weekends for business realism
                    const dateObj = new Date(item.dateStr);
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                    return (
                      <button
                        key={item.dateStr}
                        disabled={isWeekend}
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`h-9 rounded-xl text-xs font-medium transition-all flex items-center justify-center relative ${
                          isWeekend
                            ? 'text-neutral-700 cursor-not-allowed'
                            : isSelected
                            ? 'bg-white text-black font-bold shadow-md'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {item.day}
                        {!isWeekend && !isSelected && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-neutral-600"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
                  <span>Fuso orario: Europe/Zurich (Svizzera)</span>
                  <span className="text-white font-medium">Slot di 30-60 min</span>
                </div>
              </div>

              {/* Time Slots Column */}
              <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl border border-neutral-800 bg-neutral-950/80 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                    <span>Orari Disponibili</span>
                    <span className="font-mono text-[11px] text-neutral-400 font-normal">{selectedDate}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                    {AVAILABLE_SLOTS.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                            isSelected
                              ? 'border-white bg-white text-black shadow-md'
                              : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-900 mt-4 flex items-center justify-between">
                  <div className="text-xs text-neutral-400">
                    <div>Data: <strong className="text-white">{selectedDate}</strong></div>
                    <div>Ora: <strong className="text-white">{selectedSlot}</strong></div>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Continua</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Client Details & Meeting Location */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl mx-auto">
            <div>
              <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">Passo 3 di 3</span>
              <h3 className="text-xl font-bold text-white mt-1">Dettagli di contatto e preferenze</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Appuntamento il <strong className="text-white">{selectedDate}</strong> alle <strong className="text-white">{selectedSlot}</strong> ({selectedService.durationMinutes} min).
              </p>
            </div>

            {/* Meeting Location Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Come preferisci svolgere il colloquio?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMeetingLocation('office')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    meetingLocation === 'office'
                      ? 'border-white bg-neutral-900 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Building size={16} className="mb-1 text-white" />
                  <div className="text-xs font-bold text-white">In Sede a Bioggio</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Via Lugano 1A</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingLocation('video')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    meetingLocation === 'video'
                      ? 'border-white bg-neutral-900 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Video size={16} className="mb-1 text-white" />
                  <div className="text-xs font-bold text-white">Videochiamata</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Google Meet / Zoom</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingLocation('client_address')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    meetingLocation === 'client_address'
                      ? 'border-white bg-neutral-900 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <MapPin size={16} className="mb-1 text-white" />
                  <div className="text-xs font-bold text-white">A Domicilio</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">In Canton Ticino</div>
                </button>
              </div>
            </div>

            {/* Contact Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nome e Cognome *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="es. Marco Bernasconi"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white placeholder-neutral-600 outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Email per conferma e invito *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="m.bernasconi@ticino.ch"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white placeholder-neutral-600 outline-none focus:border-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Cellulare (per promemoria SMS svizzero) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+41 79 123 45 67"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white font-mono placeholder-neutral-600 outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Note facoltative per il consulente
                </label>
                <textarea
                  rows={2}
                  placeholder="es. Vorrei confrontare la franchigia per i miei due figli e capire come funziona il 3° Pilastro..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white placeholder-neutral-600 outline-none focus:border-white transition-colors leading-relaxed"
                />
              </div>
            </div>

            {/* Privacy Swiss LPD Notice */}
            <div className="p-3 rounded-xl border border-neutral-900 bg-neutral-950 text-[11px] text-neutral-400 flex items-center gap-2">
              <ShieldCheck size={16} className="text-white shrink-0" />
              <span>
                I tuoi dati sono custoditi in Svizzera secondo la nuova Legge federale sulla protezione dei dati (LPD). Nessuna cessione a terzi.
              </span>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-neutral-900">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                ← Indietro
              </button>

              {selectedService.priceChf > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                  <span>Procedi con TWINT (CHF {selectedService.priceChf})</span>
                  <QrCode size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFinalizeBooking(false)}
                  className="px-6 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 active:scale-95"
                >
                  <Check size={14} />
                  <span>Conferma Appuntamento Gratuito</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Swiss TWINT Payment Simulation */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-md mx-auto text-center">
            <div>
              <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">Pagamento Sicuro Svizzero</span>
              <h3 className="text-xl font-bold text-white mt-1">Paga con TWINT</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Inquadra il codice QR con la tua app TWINT bancaria o inserisci il codice numerico.
              </p>
            </div>

            {/* Mock TWINT Card */}
            <div className="p-6 rounded-3xl border border-neutral-800 bg-neutral-950 space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-neutral-900 pb-3">
                <span className="text-neutral-400">Importo:</span>
                <span className="text-base font-bold text-white font-mono">CHF {selectedService.priceChf}.00</span>
              </div>

              {/* QR Code Container */}
              <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg relative">
                <QrCode size={150} className="text-black" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border-2 border-white shadow-md">
                    <span className="text-white text-xs font-black">TW</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-neutral-400 font-mono">Codice di pagamento:</div>
                <div className="text-lg font-mono font-bold tracking-widest text-white">998 245</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isProcessingTwint}
                onClick={() => {
                  setIsProcessingTwint(true);
                  setTimeout(() => {
                    setIsProcessingTwint(false);
                    handleFinalizeBooking(true);
                  }, 1200);
                }}
                className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                {isProcessingTwint ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifica autorizzazione TWINT...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Simula Pagamento Eseguito con TWINT</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-neutral-500 hover:text-neutral-300 py-1"
              >
                Annulla e torna ai dettagli
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation & Success Screen */}
        {step === 5 && confirmedBooking && (
          <div className="space-y-6 animate-in zoom-in-95 duration-200 max-w-lg mx-auto text-center py-4">
            <div className="w-16 h-16 rounded-full bg-white text-black mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.25)]">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                APPUNTAMENTO CONFERMATO CON SUCCESSO
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Ti aspettiamo!</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Abbiamo inviato i dettagli e il promemoria a <strong className="text-white">{confirmedBooking.clientEmail}</strong> e via SMS a <strong className="text-white">{confirmedBooking.clientPhone}</strong>.
              </p>
            </div>

            {/* Summary Ticket */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500">Servizio:</span>
                <span className="text-white font-sans font-bold">{confirmedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500">Consulente:</span>
                <span className="text-white font-sans font-medium">{confirmedBooking.professionalName}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500">Data & Ora:</span>
                <span className="text-white font-bold">{confirmedBooking.date} alle {confirmedBooking.timeSlot}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-900 pb-2">
                <span className="text-neutral-500">Modalità:</span>
                <span className="text-white font-sans">
                  {confirmedBooking.meetingLocation === 'office'
                    ? 'In Sede (Bioggio Lugano)'
                    : confirmedBooking.meetingLocation === 'video'
                    ? 'Videochiamata protetta'
                    : 'A domicilio in Ticino'}
                </span>
              </div>
              {confirmedBooking.isPaidWithTwint && (
                <div className="flex justify-between text-emerald-400">
                  <span>Ricevuta TWINT:</span>
                  <span>{confirmedBooking.twintRef} (CHF {confirmedBooking.priceChf})</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => downloadIcsFile(confirmedBooking)}
                className="w-full sm:w-1/2 py-3 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Download size={14} />
                <span>Salva nel Calendario (.ics)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setConfirmedBooking(null);
                }}
                className="w-full sm:w-1/2 py-3 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white font-semibold text-xs transition-all"
              >
                <span>Prenota un altro orario</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
