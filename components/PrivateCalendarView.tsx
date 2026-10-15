import React, { useState, useMemo } from 'react';
import {
  CalendarEvent,
  CalendarViewType,
  EventCategory,
  ProfessionalProfile,
  BookingRequest,
} from '../types';
import { CALENDAR_CATEGORIES } from '../mockData';
import { downloadIcsFile } from '../icsGenerator';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  Trash2,
  Video,
  MapPin,
  User,
  Mail,
  Phone,
  Share2,
  Download,
  Upload,
  Check,
  X,
  ExternalLink,
  Briefcase,
  Sparkles,
  CalendarDays,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface PrivateCalendarViewProps {
  profile: ProfessionalProfile;
  events: CalendarEvent[];
  bookings: BookingRequest[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenPublicBooking: () => void;
  onOpenEmbedModal: () => void;
}

export const PrivateCalendarView: React.FC<PrivateCalendarViewProps> = ({
  profile,
  events,
  bookings,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onOpenPublicBooking,
  onOpenEmbedModal,
}) => {
  // Calendar navigation state (defaults to October 2026 to align with mock records)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed (9 = Ottobre)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-19');
  const [viewType, setViewType] = useState<CalendarViewType>('week');

  // Filter categories state
  const [activeCategories, setActiveCategories] = useState<Record<EventCategory, boolean>>({
    client: true,
    work: true,
    personal: true,
    focus: true,
    travel: true,
  });

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form state for new / edit event
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-10-19');
  const [formStartTime, setFormStartTime] = useState<string>('10:00');
  const [formEndTime, setFormEndTime] = useState<string>('11:00');
  const [formCategory, setFormCategory] = useState<EventCategory>('work');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formMeetUrl, setFormMeetUrl] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIsPrivate, setFormIsPrivate] = useState<boolean>(false);
  const [formBlocksBooking, setFormBlocksBooking] = useState<boolean>(true);

  // Copy pill notification
  const [copiedLink, setCopiedLink] = useState(false);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const weekdayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const weekdayShort = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Hours displayed in day and week views
  const HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ];

  // Filtered events based on active category checkboxes
  const filteredEvents = useMemo(() => {
    return events.filter((e) => activeCategories[e.category]);
  }, [events, activeCategories]);

  // Navigate dates
  const handlePrev = () => {
    if (viewType === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - (viewType === 'week' ? 7 : 1));
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  };

  const handleNext = () => {
    if (viewType === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + (viewType === 'week' ? 7 : 1));
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  };

  const handleToday = () => {
    // Defaults back to 2026-10-19 for mock demo coherence
    setSelectedDate('2026-10-19');
    setCurrentMonth(9);
    setCurrentYear(2026);
  };

  // Calculate days of current week (Monday to Sunday) based on selectedDate
  const currentWeekDays = useMemo(() => {
    const cur = new Date(selectedDate);
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 1 is Monday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(cur);
    monday.setDate(cur.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        shortName: weekdayShort[i],
        fullName: weekdayNames[i],
        isToday: dateStr === '2026-10-19', // simulated today
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [selectedDate]);

  // Calculate days for current month grid
  const monthCalendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const list = [];
    for (let i = 0; i < startOffset; i++) {
      list.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const formattedD = String(d).padStart(2, '0');
      const formattedM = String(currentMonth + 1).padStart(2, '0');
      const dateStr = `${currentYear}-${formattedM}-${formattedD}`;
      list.push({
        dayNum: d,
        dateStr,
        isToday: dateStr === '2026-10-19',
        isSelected: dateStr === selectedDate,
      });
    }
    return list;
  }, [currentYear, currentMonth, selectedDate]);

  // Open modal to create event
  const openCreateModal = (dateStr?: string, timeStr?: string) => {
    setFormId(null);
    setFormTitle('');
    setFormDate(dateStr || selectedDate);
    setFormStartTime(timeStr || '10:00');
    // Calculate default end time (+1 hour)
    const [h, m] = (timeStr || '10:00').split(':').map(Number);
    const endH = String(Math.min(23, h + 1)).padStart(2, '0');
    setFormEndTime(`${endH}:${String(m).padStart(2, '0')}`);
    setFormCategory('work');
    setFormLocation('Sede MT Financial Bioggio');
    setFormMeetUrl('');
    setFormDescription('');
    setFormIsPrivate(false);
    setFormBlocksBooking(true);
    setShowCreateModal(true);
  };

  // Open modal to edit existing event
  const openEditModal = (evt: CalendarEvent) => {
    setFormId(evt.id);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormStartTime(evt.startTime);
    setFormEndTime(evt.endTime);
    setFormCategory(evt.category);
    setFormLocation(evt.location || '');
    setFormMeetUrl(evt.meetUrl || '');
    setFormDescription(evt.description || '');
    setFormIsPrivate(evt.isPrivate);
    setFormBlocksBooking(evt.blocksBooking);
    setShowDetailModal(false);
    setShowCreateModal(true);
  };

  // Open detail view for an event
  const openDetailModal = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setShowDetailModal(true);
  };

  // Save event (Create or Update)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (formId) {
      // Update
      const updated: CalendarEvent = {
        id: formId,
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        location: formLocation,
        meetUrl: formMeetUrl,
        description: formDescription,
        isPrivate: formIsPrivate,
        blocksBooking: formBlocksBooking,
      };
      onUpdateEvent(updated);
    } else {
      // Create
      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        location: formLocation,
        meetUrl: formMeetUrl,
        description: formDescription,
        isPrivate: formIsPrivate,
        blocksBooking: formBlocksBooking,
        createdAt: new Date().toISOString(),
      };
      onAddEvent(newEvent);
    }

    setShowCreateModal(false);
  };

  // Copy public link
  const handleCopyLink = () => {
    const url = `https://calendario.ch/${profile.handle}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export full calendar as ICS
  const handleExportFullCalendar = () => {
    if (events.length === 0) return;
    // Export selected event or first
    const evt = selectedEvent || events[0];
    downloadIcsFile({
      title: `${profile.name} · Calendario Completo`,
      description: `Esportazione impegni e consulenze di ${profile.name}`,
      startDateStr: evt.date,
      startTimeStr: evt.startTime,
      durationMinutes: 60,
      location: evt.location || 'Lugano / Svizzera',
      attendeeName: profile.name,
      organizerName: 'calendario.ch Svizzera',
      organizerEmail: 'noreply@calendario.ch',
    });
  };

  // Helper to get category info
  const getCatInfo = (cat: EventCategory) => {
    return CALENDAR_CATEGORIES.find((c) => c.id === cat) || CALENDAR_CATEGORIES[0];
  };

  // Count active weekly hours
  const weeklyStats = useMemo(() => {
    const weekDateStrings = currentWeekDays.map((d) => d.dateStr);
    const weekEvents = events.filter((e) => weekDateStrings.includes(e.date));
    const clientCount = weekEvents.filter((e) => e.category === 'client').length;
    const personalCount = weekEvents.filter((e) => e.category === 'personal').length;
    return {
      total: weekEvents.length,
      clientCount,
      personalCount,
    };
  }, [events, currentWeekDays]);

  return (
    <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner Reassurance */}
      <div className="mb-6 p-4 rounded-2xl border border-neutral-900 bg-neutral-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Agenda Privata & Calendario Personale
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <ShieldCheck size={11} />
                <span>nLPD Svizzera · Crittografia Locale</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              I tuoi appuntamenti personali, le riunioni e le consulenze clienti in un unico posto. Gli impegni contrassegnati come <strong>Privati</strong> bloccano automaticamente gli slot sul tuo link pubblico senza mostrare dettagli.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSyncModal(true)}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Share2 size={13} />
            <span>Feed Webcal / iCal</span>
          </button>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus size={15} />
            <span>Nuovo Impegno</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Calendar Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Mini Month Picker */}
          <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-900">
              <span className="text-xs font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-neutral-500 mb-2">
              {weekdayShort.map((w) => (
                <span key={w}>{w[0]}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCalendarDays.map((item, idx) => {
                if (!item) return <div key={`mini-empty-${idx}`} className="h-6"></div>;
                const isSelected = selectedDate === item.dateStr;
                const hasEvents = events.some((e) => e.date === item.dateStr);

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => {
                      setSelectedDate(item.dateStr);
                    }}
                    className={`h-6 rounded-md text-[11px] font-medium transition-all relative flex items-center justify-center ${
                      isSelected
                        ? 'bg-white text-black font-bold'
                        : item.isToday
                        ? 'text-white border border-neutral-700 bg-neutral-900'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    <span>{item.dayNum}</span>
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-neutral-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendars & Category Filters */}
          <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                I Miei Calendari
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {filteredEvents.length} impegni
              </span>
            </div>

            <div className="space-y-1.5">
              {CALENDAR_CATEGORIES.map((cat) => {
                const isActive = activeCategories[cat.id];
                const count = events.filter((e) => e.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setActiveCategories((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-neutral-900/60 text-white border border-neutral-800'
                        : 'text-neutral-500 hover:bg-neutral-900/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-950">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Privacy Feature Explanation */}
            <div className="pt-3 border-t border-neutral-900/80 text-[11px] text-neutral-400 flex items-start gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Sincronizzazione Intelligente:</strong> Qualsiasi evento con blocco attivo rende l'orario non selezionabile sul link pubblico.
              </span>
            </div>
          </div>

          {/* Public Booking Link Card */}
          <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Link Pubblico Prenotazioni</span>
              <button
                onClick={onOpenPublicBooking}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <span>Vedi</span>
                <ExternalLink size={11} />
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-neutral-300 truncate">
                calendario.ch/{profile.handle}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-medium transition-colors shrink-0"
              >
                {copiedLink ? 'Copiato!' : 'Copia'}
              </button>
            </div>
            <button
              onClick={onOpenEmbedModal}
              className="w-full py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900 text-neutral-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Share2 size={13} />
              <span>Incorpora su pagine.ch</span>
            </button>
          </div>

          {/* Weekly Summary Metrics */}
          <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a]">
            <div className="text-xs font-bold text-white mb-2">Questa Settimana</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-900">
                <div className="text-lg font-extrabold text-white">{weeklyStats.total}</div>
                <div className="text-[10px] text-neutral-500">Impegni</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-900">
                <div className="text-lg font-extrabold text-blue-400">{weeklyStats.clientCount}</div>
                <div className="text-[10px] text-neutral-500">Clienti</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-900">
                <div className="text-lg font-extrabold text-amber-400">{weeklyStats.personalCount}</div>
                <div className="text-[10px] text-neutral-500">Privati</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Calendar Viewport */}
        <section className="lg:col-span-9 rounded-3xl border border-neutral-800 bg-[#0a0a0a] shadow-2xl overflow-hidden flex flex-col">
          {/* Calendar Header Bar */}
          <div className="p-4 sm:p-5 border-b border-neutral-900 bg-neutral-950/70 flex flex-wrap items-center justify-between gap-4">
            {/* Left Nav */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-xs font-medium text-white transition-all hover:bg-neutral-800"
              >
                Oggi
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="text-sm sm:text-base font-bold text-white tracking-tight ml-1">
                {viewType === 'week' ? (
                  <span>
                    {currentWeekDays[0].dayNum} {monthNames[currentWeekDays[0].month]} – {currentWeekDays[6].dayNum} {monthNames[currentWeekDays[6].month]} {currentYear}
                  </span>
                ) : viewType === 'day' ? (
                  <span>
                    {new Date(selectedDate).getDate()} {monthNames[new Date(selectedDate).getMonth()]} {currentYear}
                  </span>
                ) : (
                  <span>
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                )}
              </div>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs">
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'month'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mese
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'week'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Settimana
              </button>
              <button
                onClick={() => setViewType('day')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'day'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Giorno
              </button>
              <button
                onClick={() => setViewType('agenda')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'agenda'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>

          {/* VIEW: SETTIMANA (WEEK VIEW) */}
          {viewType === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Week Header Row */}
                <div className="grid grid-cols-8 border-b border-neutral-900 bg-neutral-950/40 text-center sticky top-0 z-20">
                  <div className="p-3 text-[11px] font-mono text-neutral-500 border-r border-neutral-900">
                    Ora
                  </div>
                  {currentWeekDays.map((d) => (
                    <div
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`p-3 border-r border-neutral-900 last:border-r-0 cursor-pointer transition-colors ${
                        d.isSelected
                          ? 'bg-neutral-900/60'
                          : 'hover:bg-neutral-900/30'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase text-neutral-500">
                        {d.shortName}
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                          d.isToday
                            ? 'bg-white text-black'
                            : d.isSelected
                            ? 'text-white'
                            : 'text-neutral-300'
                        }`}
                      >
                        {d.dayNum}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots Table */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-8 border-b border-neutral-900/60 min-h-[64px]"
                    >
                      {/* Hour Label */}
                      <div className="p-2 text-[11px] font-mono text-neutral-500 border-r border-neutral-900/80 text-right pr-3 select-none">
                        {hour}
                      </div>

                      {/* Day Columns */}
                      {currentWeekDays.map((d) => {
                        // Find events in this hour
                        const dayEvents = filteredEvents.filter((e) => {
                          if (e.date !== d.dateStr) return false;
                          const startH = parseInt(e.startTime.split(':')[0], 10);
                          const curH = parseInt(hour.split(':')[0], 10);
                          return startH === curH;
                        });

                        return (
                          <div
                            key={`${d.dateStr}-${hour}`}
                            onClick={() => openCreateModal(d.dateStr, hour)}
                            className="p-1 border-r border-neutral-900/60 last:border-r-0 relative group hover:bg-neutral-900/30 transition-colors cursor-pointer"
                          >
                            {/* Empty slot hover plus */}
                            {dayEvents.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={14} className="text-neutral-600" />
                              </div>
                            )}

                            {/* Render Event Cards in cell */}
                            {dayEvents.map((evt) => {
                              const cat = getCatInfo(evt.category);
                              return (
                                <div
                                  key={evt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetailModal(evt);
                                  }}
                                  className={`mb-1 p-2 rounded-xl text-left border text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer ${
                                    cat.badgeBg
                                  } border-l-4 ${cat.badgeBorder}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[10px] font-bold opacity-80">
                                      {evt.startTime} - {evt.endTime}
                                    </span>
                                    {evt.isPrivate && (
                                      <Lock size={11} className="text-amber-400" title="Evento Riservato" />
                                    )}
                                  </div>
                                  <div className="font-semibold text-neutral-100 truncate mt-0.5">
                                    {evt.isPrivate ? '🔒 Impegno Riservato' : evt.title}
                                  </div>
                                  {evt.location && (
                                    <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} />
                                      <span>{evt.location}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MESE (MONTH VIEW) */}
          {viewType === 'month' && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-7 gap-px bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-900">
                {/* Header Days */}
                {weekdayNames.map((w) => (
                  <div key={w} className="p-2.5 bg-neutral-950 text-center text-xs font-mono uppercase text-neutral-400 font-semibold">
                    {w.slice(0, 3)}
                  </div>
                ))}

                {/* Day Blocks */}
                {monthCalendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`month-empty-${idx}`} className="bg-[#0a0a0a] min-h-[105px]"></div>;
                  }

                  const dayEvts = filteredEvents.filter((e) => e.date === item.dateStr);

                  return (
                    <div
                      key={item.dateStr}
                      onClick={() => {
                        setSelectedDate(item.dateStr);
                        openCreateModal(item.dateStr);
                      }}
                      className={`bg-[#0a0a0a] p-2 min-h-[105px] border-t border-neutral-900/60 hover:bg-neutral-900/40 transition-colors cursor-pointer flex flex-col justify-between group`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            item.isToday
                              ? 'bg-white text-black'
                              : item.isSelected
                              ? 'text-white border border-neutral-700'
                              : 'text-neutral-400'
                          }`}
                        >
                          {item.dayNum}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(item.dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-opacity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="space-y-1 mt-1 max-h-[75px] overflow-y-auto custom-scrollbar">
                        {dayEvts.slice(0, 2).map((evt) => {
                          const cat = getCatInfo(evt.category);
                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(evt);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] truncate border-l-2 font-medium ${cat.badgeBg} ${cat.badgeBorder}`}
                              title={evt.title}
                            >
                              <span>{evt.startTime} </span>
                              <span>{evt.isPrivate ? '🔒 Riservato' : evt.title}</span>
                            </div>
                          );
                        })}
                        {dayEvts.length > 2 && (
                          <div className="text-[9px] font-mono text-neutral-500 pl-1">
                            +{dayEvts.length - 2} altri
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: GIORNO (DAY VIEW) */}
          {viewType === 'day' && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {new Date(selectedDate).toLocaleDateString('it-CH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {filteredEvents.filter((e) => e.date === selectedDate).length} impegni in programma per oggi
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal(selectedDate)}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Aggiungi Slot</span>
                </button>
              </div>

              <div className="space-y-3">
                {HOURS.map((hour) => {
                  const hourEvents = filteredEvents.filter((e) => {
                    if (e.date !== selectedDate) return false;
                    return parseInt(e.startTime.split(':')[0], 10) === parseInt(hour.split(':')[0], 10);
                  });

                  return (
                    <div
                      key={hour}
                      onClick={() => openCreateModal(selectedDate, hour)}
                      className="flex items-start gap-4 p-3 rounded-2xl border border-neutral-900 hover:border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900/30 transition-all cursor-pointer group"
                    >
                      <div className="w-16 font-mono text-xs text-neutral-500 pt-1 shrink-0">
                        {hour}
                      </div>

                      <div className="flex-1 space-y-2">
                        {hourEvents.length === 0 ? (
                          <div className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors py-1 flex items-center gap-1">
                            <Plus size={12} className="opacity-0 group-hover:opacity-100" />
                            <span>Orario libero · Clicca per pianificare</span>
                          </div>
                        ) : (
                          hourEvents.map((evt) => {
                            const cat = getCatInfo(evt.category);
                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailModal(evt);
                                }}
                                className={`p-4 rounded-2xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cat.badgeBg} border-l-4 ${cat.badgeBorder}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold">
                                      {evt.startTime} – {evt.endTime}
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900/80 text-neutral-300">
                                      {cat.label}
                                    </span>
                                    {evt.isPrivate && (
                                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                        <Lock size={11} />
                                        <span>Riservato</span>
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white">
                                    {evt.isPrivate ? '🔒 Impegno Riservato' : evt.title}
                                  </h4>
                                  {evt.description && !evt.isPrivate && (
                                    <p className="text-xs text-neutral-400 max-w-xl">
                                      {evt.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                                    {evt.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        <span>{evt.location}</span>
                                      </span>
                                    )}
                                    {evt.meetUrl && (
                                      <a
                                        href={evt.meetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-white hover:underline flex items-center gap-1 font-medium"
                                      >
                                        <Video size={12} />
                                        <span>Apri Videochiamata</span>
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetailModal(evt);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium border border-neutral-700 self-start sm:self-center"
                                >
                                  Dettagli
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: AGENDA (CHRONOLOGICAL LIST) */}
          {viewType === 'agenda' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="pb-3 border-b border-neutral-900 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Elenco Cronologico Impegni</h3>
                  <p className="text-xs text-neutral-400">
                    Tutti gli appuntamenti, le riunioni e i blocchi focus ordinati nel tempo
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Nuovo Impegno</span>
                </button>
              </div>

              <div className="space-y-4">
                {filteredEvents
                  .slice()
                  .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                  .map((evt) => {
                    const cat = getCatInfo(evt.category);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => openDetailModal(evt)}
                        className={`p-4 rounded-2xl border bg-neutral-950/70 hover:bg-neutral-900/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${cat.badgeBorder}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center shrink-0 min-w-[70px]">
                            <div className="text-[10px] font-mono uppercase text-neutral-400">
                              {new Date(evt.date).toLocaleDateString('it-CH', { month: 'short' })}
                            </div>
                            <div className="text-xl font-black text-white">
                              {new Date(evt.date).getDate()}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              {new Date(evt.date).toLocaleDateString('it-CH', { weekday: 'short' })}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-neutral-300">
                                {evt.startTime} – {evt.endTime}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                                {cat.label}
                              </span>
                              {evt.isPrivate && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                                  <Lock size={11} />
                                  <span>Riservato</span>
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white">
                              {evt.isPrivate ? '🔒 Impegno Riservato' : evt.title}
                            </h4>
                            {evt.description && !evt.isPrivate && (
                              <p className="text-xs text-neutral-400 line-clamp-1 max-w-xl">
                                {evt.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-0.5">
                              {evt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} />
                                  <span>{evt.location}</span>
                                </span>
                              )}
                              {evt.clientName && (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <User size={11} />
                                  <span>Cliente: {evt.clientName}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(evt);
                            }}
                            className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                            title="Modifica"
                          >
                            <CalendarDays size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent(evt.id);
                            }}
                            className="p-2 rounded-xl border border-neutral-800 hover:border-red-900 bg-neutral-900 text-neutral-400 hover:text-red-400 transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 border-t border-neutral-900 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>calendario.ch · Server Zurigo (Svizzera) · Standard RFC 5545</span>
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportFullCalendar}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Download size={12} />
                <span>Esporta Tutto (.ics)</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: CREA / MODIFICA EVENTO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Calendar size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {formId ? 'Modifica Impegno' : 'Nuovo Impegno in Agenda'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Titolo dell'Impegno *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="es. Riunione Direzione, Visita Medica, Analisi Polizza..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none transition-colors"
                />
              </div>

              {/* Date, Start, End Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Ora Inizio</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Ora Fine</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Categoria</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CALENDAR_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormCategory(c.id)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        formCategory === c.id
                          ? 'border-white bg-neutral-900 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location or Video Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Luogo / Sede</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="es. Sede Bioggio, Domicilio Lugano..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Link Videoconferenza (opz.)</label>
                  <input
                    type="text"
                    value={formMeetUrl}
                    onChange={(e) => setFormMeetUrl(e.target.value)}
                    placeholder="https://meet.calendario.ch/..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Privacy and Availability Toggles */}
              <div className="p-3.5 rounded-2xl border border-neutral-900 bg-neutral-950/90 space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="chk-private"
                    checked={formIsPrivate}
                    onChange={(e) => setFormIsPrivate(e.target.checked)}
                    className="mt-0.5 rounded accent-white"
                  />
                  <div>
                    <label htmlFor="chk-private" className="font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <Lock size={12} className="text-amber-400" />
                      <span>Impegno Riservato (Privato)</span>
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      I dettagli, note e titolo non saranno visibili a collaboratori o nell'esportazione pubblica.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-neutral-900">
                  <input
                    type="checkbox"
                    id="chk-blocks"
                    checked={formBlocksBooking}
                    onChange={(e) => setFormBlocksBooking(e.target.checked)}
                    className="mt-0.5 rounded accent-white"
                  />
                  <div>
                    <label htmlFor="chk-blocks" className="font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>Blocca disponibilità sul calendario pubblico</span>
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      Rende questo slot orario NON prenotabile sul tuo link <code className="text-neutral-300">calendario.ch/{profile.handle}</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Note & Descrizione (Riservate)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Dettagli aggiuntivi, promemoria pratiche..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none custom-scrollbar"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                {formId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEvent(formId);
                      setShowCreateModal(false);
                    }}
                    className="px-3 py-2 rounded-xl border border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Elimina</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    Salva Impegno
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETTAGLI EVENTO */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCatInfo(selectedEvent.category).color }}
                ></span>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  {getCatInfo(selectedEvent.category).label}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white leading-tight">
                {selectedEvent.isPrivate ? '🔒 Impegno Riservato' : selectedEvent.title}
              </h3>

              <div className="space-y-2 text-xs text-neutral-300 pt-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-neutral-500" />
                  <span>
                    {selectedEvent.date} · <strong>{selectedEvent.startTime} – {selectedEvent.endTime}</strong>
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-neutral-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.meetUrl && (
                  <div className="flex items-center gap-2">
                    <Video size={14} className="text-neutral-500" />
                    <a
                      href={selectedEvent.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white hover:underline font-semibold"
                    >
                      Partecipa alla Videochiamata
                    </a>
                  </div>
                )}

                {selectedEvent.clientName && (
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 space-y-1 mt-2">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Dati Cliente (Prenotazione Web)</div>
                    <div className="font-bold text-white">{selectedEvent.clientName}</div>
                    {selectedEvent.clientEmail && <div className="text-neutral-400">{selectedEvent.clientEmail}</div>}
                    {selectedEvent.clientPhone && <div className="text-neutral-400">{selectedEvent.clientPhone}</div>}
                  </div>
                )}

                {selectedEvent.description && !selectedEvent.isPrivate && (
                  <p className="text-xs text-neutral-400 pt-1">
                    {selectedEvent.description}
                  </p>
                )}

                <div className="pt-2 flex items-center gap-2">
                  {selectedEvent.isPrivate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Lock size={10} />
                      <span>Dettagli Protetti</span>
                    </span>
                  )}
                  {selectedEvent.blocksBooking && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 border border-neutral-800 text-neutral-300">
                      Blocca slot pubblico
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onDeleteEvent(selectedEvent.id);
                  setShowDetailModal(false);
                }}
                className="px-3 py-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-950/20 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Elimina</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadIcsFile({
                      title: selectedEvent.title,
                      description: selectedEvent.description || '',
                      startDateStr: selectedEvent.date,
                      startTimeStr: selectedEvent.startTime,
                      durationMinutes: 60,
                      location: selectedEvent.location || '',
                      attendeeName: selectedEvent.clientName || profile.name,
                    });
                  }}
                  className="px-3 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="Scarica .ics"
                >
                  <Download size={13} />
                  <span>.ics</span>
                </button>
                <button
                  onClick={() => openEditModal(selectedEvent)}
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md"
                >
                  Modifica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WEBCAL / SINCRONIZZAZIONE ESTERNA */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Share2 size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  Sincronizzazione Calendario Svizzero
                </h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Abbonamento Webcal (Apple, Google, Outlook, Proton)</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Copia questo link e incollalo nel tuo client preferito (iPhone Calendar, Mac Calendar, Outlook 365, Google Calendar) per sincronizzare automaticamente tutti i tuoi impegni in sola lettura:
                </p>
                <div className="p-2 rounded-xl bg-black border border-neutral-800 flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-neutral-300 truncate">
                    webcal://calendario.ch/feed/{profile.handle}.ics
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`webcal://calendario.ch/feed/${profile.handle}.ics`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-medium shrink-0"
                  >
                    {copiedLink ? 'Copiato!' : 'Copia'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Download size={13} />
                  <span>Esportazione File Standard .ics (RFC 5545)</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Scarica subito l'intero archivio degli appuntamenti in un file compatibile con qualsiasi software di calendario.
                </p>
                <button
                  onClick={handleExportFullCalendar}
                  className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Scarica Archivio Completo .ics</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Conformità nLPD & Sovranità dei Dati</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  A differenza di Google Calendar o Microsoft 365 con server esteri, i dati di <strong>calendario.ch</strong> risiedono su infrastruttura elvetica protetta a Zurigo con cifratura a riposo e in transito.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
